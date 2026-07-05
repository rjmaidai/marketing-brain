import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import {
  SELECTION_SYSTEM_PROMPT,
  buildSelectionUserMessage,
  buildDiscussionSystemPrompt,
  buildDiscussionUserMessage,
  buildFollowUpUserMessage,
} from "@/lib/brain-prompt";
import { getHead } from "@/lib/heads";
import type { HeadSelection } from "@/lib/types";

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
    if (heads.length < 9) return null;
    return {
      heads: heads.slice(0, 12),
      ritson_gate: parsed.ritson_gate,
      notes: parsed.notes,
    };
  } catch {
    return null;
  }
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
    idea?: string;
    followUp?: string;
    headIds?: unknown;
    previousFollowUps?: unknown;
    previousBuffers?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Ungültiger Request-Body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const idea = (body.idea ?? "").trim();
  const followUp = (body.followUp ?? "").trim();
  const isFollowUp = followUp.length > 0;

  if (idea.length < 8) {
    return new Response(
      JSON.stringify({
        error: "Idee zu kurz. Schreib 1–3 Sätze, damit die Köpfe etwas zum Anbeißen haben.",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }
  if (idea.length > 4000) {
    return new Response(
      JSON.stringify({ error: "Idee zu lang. Bitte auf 1–3 Sätze kürzen." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  let followUpHeadIds: string[] = [];
  let previousFollowUps: string[] = [];
  let previousBuffers: string[] = [];

  if (isFollowUp) {
    if (followUp.length < 3) {
      return new Response(
        JSON.stringify({ error: "Nachfrage zu kurz." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    if (followUp.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Nachfrage zu lang. Bitte kürzer fassen." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    followUpHeadIds = Array.isArray(body.headIds)
      ? (body.headIds as unknown[])
          .map((x) => String(x))
          .filter((id) => !!getHead(id))
      : [];
    if (followUpHeadIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Köpfe für Nachfrage fehlen. Bitte Seite neu laden und erneut starten.",
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    previousFollowUps = Array.isArray(body.previousFollowUps)
      ? (body.previousFollowUps as unknown[])
          .map((x) => (typeof x === "string" ? x : ""))
          .filter((s) => s.length > 0)
      : [];
    previousBuffers = Array.isArray(body.previousBuffers)
      ? (body.previousBuffers as unknown[])
          .map((x) => (typeof x === "string" ? x : ""))
          .filter((s) => s.length > 0)
      : [];
    if (previousBuffers.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Vorherige Diskussion fehlt. Bitte Seite neu laden.",
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
        let discussionHeadIds: string[];
        let discussionMessages: Array<{ role: "user" | "assistant"; content: string }>;

        if (isFollowUp) {
          discussionHeadIds = followUpHeadIds;
          const msgs: Array<{ role: "user" | "assistant"; content: string }> = [
            {
              role: "user",
              content: buildDiscussionUserMessage(idea, undefined),
            },
            { role: "assistant", content: previousBuffers[0] },
          ];
          for (let i = 0; i < previousFollowUps.length; i++) {
            msgs.push({
              role: "user",
              content: buildFollowUpUserMessage(previousFollowUps[i]),
            });
            const buf = previousBuffers[i + 1];
            if (buf) msgs.push({ role: "assistant", content: buf });
          }
          msgs.push({
            role: "user",
            content: buildFollowUpUserMessage(followUp),
          });
          discussionMessages = msgs;
        } else {
          send("status", { phase: "selecting" });

          let selection: HeadSelection | null = null;
          for (let attempt = 0; attempt < 3 && !selection; attempt++) {
            const selectionMsg = await client.messages.create({
              model: MODEL,
              max_tokens: 800,
              temperature: 0,
              system: SELECTION_SYSTEM_PROMPT,
              messages: [
                { role: "user", content: buildSelectionUserMessage(idea) },
              ],
            });

            const rawSelection = selectionMsg.content
              .map((b) => (b.type === "text" ? b.text : ""))
              .join("");

            selection = safeParseSelection(rawSelection);
          }
          if (!selection) {
            send("error", {
              message:
                "Der Selektor hat kein gültiges JSON geliefert. Versuch's nochmal mit einer etwas konkreteren Idee.",
            });
            controller.close();
            return;
          }

          const enrichedHeads = selection.heads
            .map((h) => {
              const head = getHead(h.id);
              return head
                ? {
                    id: head.id,
                    name: head.name,
                    segment: head.segment,
                    color: head.color,
                    reason: h.reason,
                  }
                : null;
            })
            .filter((h): h is NonNullable<typeof h> => !!h);

          send("selection", {
            heads: enrichedHeads,
            ritson_gate: selection.ritson_gate ?? { triggered: false },
            notes: selection.notes ?? "",
          });

          discussionHeadIds = enrichedHeads.map((h) => h.id);
          const gateNote =
            selection.ritson_gate?.triggered && selection.ritson_gate.note
              ? selection.ritson_gate.note
              : undefined;
          discussionMessages = [
            {
              role: "user",
              content: buildDiscussionUserMessage(idea, gateNote),
            },
          ];
        }

        send("status", { phase: "discussing" });

        const discussionSystem = buildDiscussionSystemPrompt(discussionHeadIds);

        const discussionStream = await client.messages.stream({
          model: MODEL,
          max_tokens: isFollowUp ? 3000 : 6000,
          temperature: 0.8,
          system: discussionSystem,
          messages: discussionMessages,
        });

        for await (const event of discussionStream) {
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
        const message =
          err instanceof Error ? err.message : "Unbekannter Fehler.";
        send("error", { message });
        controller.close();
      }
    },
    cancel() {
      // Client hat den Stream geschlossen – nichts weiter zu tun.
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
