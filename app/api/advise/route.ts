import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import {
  SELECTION_SYSTEM_PROMPT,
  buildSelectionUserMessage,
} from "@/lib/brain-prompt";
import {
  buildAdvisorSystemPrompt,
  buildAdvisorUserMessage,
  buildAdvisorFollowUpMessage,
  MAX_COMPANY_PROFILE,
} from "@/lib/advisor-prompt";
import { getHead } from "@/lib/heads";
import type { HeadSelection } from "@/lib/types";
import {
  parseAttachments,
  attachmentsToBlocks,
  type AdvisorAttachment,
} from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return text.trim();
}

function safeParseSelection(raw: string): HeadSelection | null {
  try {
    const parsed = JSON.parse(extractJson(raw));
    if (!parsed || !Array.isArray(parsed.heads)) return null;
    const heads = parsed.heads
      .map((h: any) => ({
        id: String(h?.id ?? "").trim(),
        reason: String(h?.reason ?? "").trim(),
      }))
      .filter((h: { id: string }) => !!getHead(h.id));
    if (heads.length < 6) return null;
    return {
      heads: heads.slice(0, 12),
      ritson_gate: parsed.ritson_gate,
      notes: parsed.notes,
    };
  } catch {
    return null;
  }
}

interface PreviousTurn {
  user: string;
  advisor: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY fehlt. Lege .env.local an (siehe .env.local.example) und starte den Dev-Server neu.",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let body: {
    situation?: string;
    followUp?: string;
    headIds?: unknown;
    previousTurns?: unknown;
    companyProfile?: unknown;
    files?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Ungültiger Request-Body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const situation = (body.situation ?? "").trim();
  const followUp = (body.followUp ?? "").trim();
  const isFollowUp = followUp.length > 0;
  const companyProfile =
    typeof body.companyProfile === "string"
      ? body.companyProfile.trim().slice(0, MAX_COMPANY_PROFILE)
      : "";

  const { files, error: filesError } = parseAttachments(body.files);
  if (filesError) {
    return new Response(JSON.stringify({ error: filesError }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (situation.length < 8) {
    return new Response(
      JSON.stringify({
        error:
          "Anliegen zu kurz. Schildern Sie in ein paar Sätzen, worum es geht.",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }
  if (situation.length > 4000) {
    return new Response(
      JSON.stringify({ error: "Anliegen zu lang. Bitte kürzer fassen." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  let followUpHeadIds: string[] = [];
  let previousTurns: PreviousTurn[] = [];

  if (isFollowUp) {
    if (followUp.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Rückfrage zu lang. Bitte kürzer fassen." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    followUpHeadIds = Array.isArray(body.headIds)
      ? (body.headIds as unknown[])
          .map((x) => String(x))
          .filter((id) => !!getHead(id))
      : [];
    previousTurns = Array.isArray(body.previousTurns)
      ? (body.previousTurns as unknown[])
          .map((t) => {
            const turn = t as { user?: unknown; advisor?: unknown };
            return {
              user: typeof turn?.user === "string" ? turn.user : "",
              advisor: typeof turn?.advisor === "string" ? turn.advisor : "",
            };
          })
          .filter((t) => t.user.length > 0 && t.advisor.length > 0)
      : [];
    if (previousTurns.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Gesprächsverlauf fehlt. Bitte Seite neu laden.",
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
  }

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(sse(event, data)));

      try {
        let advisorHeadIds: string[];
        let gateNote: string | undefined;

        if (isFollowUp) {
          advisorHeadIds = followUpHeadIds;
        } else {
          send("status", { phase: "consulting" });

          const filesNote = files.length
            ? `\n\nHINWEIS: Die Firma hat ${files.length} Datei(en) angehängt (z.B. Studien/Meta-Analysen), die analysiert werden sollen — wähle auch Köpfe, die Datenlage/Evidenz einordnen.`
            : "";
          const selectionUserContent = `${buildSelectionUserMessage(situation)}${
            companyProfile
              ? `\n\nKONTEXT DER FIRMA (Positionierung/Ideologie, für die beraten wird):\n${companyProfile}`
              : ""
          }${filesNote}`;

          let selection: HeadSelection | null = null;
          for (let attempt = 0; attempt < 3 && !selection; attempt++) {
            const selectionMsg = await client.messages.create({
              model: MODEL,
              max_tokens: 800,
              temperature: 0,
              system: SELECTION_SYSTEM_PROMPT,
              messages: [{ role: "user", content: selectionUserContent }],
            });
            const rawSelection = selectionMsg.content
              .map((b) => (b.type === "text" ? b.text : ""))
              .join("");
            selection = safeParseSelection(rawSelection);
          }

          // Selektion ist ein interner Schärfungs-Schritt. Scheitert sie,
          // berät der Kopf trotzdem — dann eben aus dem vollen Gremium.
          advisorHeadIds = selection
            ? selection.heads.map((h) => h.id)
            : [];
          gateNote =
            selection?.ritson_gate?.triggered && selection.ritson_gate.note
              ? selection.ritson_gate.note
              : undefined;

          send("heads", { ids: advisorHeadIds });
        }

        send("status", { phase: "speaking" });

        const hasFiles = files.length > 0;
        const messages: Anthropic.MessageParam[] = [];

        if (isFollowUp) {
          for (let i = 0; i < previousTurns.length; i++) {
            const turn = previousTurns[i];
            messages.push({
              role: "user",
              content:
                i === 0
                  ? buildAdvisorUserMessage(turn.user, undefined)
                  : buildAdvisorFollowUpMessage(turn.user),
            });
            messages.push({ role: "assistant", content: turn.advisor });
          }
          messages.push({
            role: "user",
            content: buildAdvisorFollowUpMessage(followUp, hasFiles),
          });
        } else {
          messages.push({
            role: "user",
            content: buildAdvisorUserMessage(situation, gateNote, hasFiles),
          });
        }

        // Anhänge in die AKTUELLE (letzte) Nutzer-Nachricht einbetten:
        // Dokument-/Bild-/Text-Blöcke zuerst, dann der Anweisungstext.
        if (hasFiles) {
          const last = messages[messages.length - 1];
          const textPart =
            typeof last.content === "string" ? last.content : "";
          last.content = [
            ...attachmentsToBlocks(files as AdvisorAttachment[]),
            { type: "text", text: textPart },
          ];
        }

        const advisorStream = await client.messages.stream({
          model: MODEL,
          max_tokens: hasFiles ? 2400 : 1400,
          temperature: 0.7,
          system: buildAdvisorSystemPrompt(advisorHeadIds, companyProfile),
          messages,
        });

        for await (const event of advisorStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send("delta", { text: event.delta.text });
          }
        }

        send("status", { phase: "done" });
        send("done", {});
        controller.close();
      } catch (err: unknown) {
        const e = err as { name?: string; status?: number; message?: string };
        const message = e?.status
          ? `${e.name ?? "Fehler"} (${e.status}): ${e.message ?? ""}`.trim()
          : (e?.message ?? "Unbekannter Fehler.");
        send("error", { message });
        controller.close();
      }
    },
    cancel() {
      /* Client hat den Stream geschlossen. */
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
