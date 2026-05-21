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

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

function sse(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function extractJson(text: string): string {
    // 1. Try fenced code block
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) return fence[1].trim();
    // 2. Try to find outermost { ... }
  const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
          return text.slice(first, last + 1);
    }
    // 3. Return as-is and let JSON.parse fail
  return text.trim();
}

function safeParseSelection(raw: string): HeadSelection | null {
    try {
          const cleaned = extractJson(raw);
          const parsed = JSON.parse(cleaned);
          if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.heads)) {
                  return null;
          }
          const heads = parsed.heads
            .map((h: { id: string }) => ({ id: String(h.id), reason: String((h as { id: string; reason?: string }).reason ?? "") }))
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

type NonNullable<T> = T extends null | undefined ? never : T;

export async function POST(req: NextRequest) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
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

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
                const send = (event: string, data: unknown) => {
                          controller.enqueue(new TextEncoder().encode(sse(event, data)));
                };

          try {
                    // ── SELECTION PHASE ──────────────────────────────────────────
                  if (body.idea) {
                              const idea = String(body.idea).trim();

                      // Retry up to 3 times to get valid JSON
                      let selection: HeadSelection | null = null;
                              let lastRaw = "";
                              for (let attempt = 1; attempt <= 3; attempt++) {
                                            const selectionMsg = await client.messages.create({
                                                            model: MODEL,
                                                            max_tokens: 1024,
                                                            temperature: 0,
                                                            system: SELECTION_SYSTEM_PROMPT,
                                                            messages: [
                                                              { role: "user", content: buildSelectionUserMessage(idea) },
                                                                            ],
                                            });

                                lastRaw = selectionMsg.content
                                              .map((b) => (b.type === "text" ? b.text : ""))
                                              .join("");

                                selection = safeParseSelection(lastRaw);
                                            if (selection) break;

                                // On retry, add a nudge
                                if (attempt < 3) {
                                                const nudgeMsg = await client.messages.create({
                                                                  model: MODEL,
                                                                  max_tokens: 1024,
                                                                  temperature: 0,
                                                                  system: SELECTION_SYSTEM_PROMPT,
                                                                  messages: [
                                                                    { role: "user", content: buildSelectionUserMessage(idea) },
                                                                    { role: "assistant", content: lastRaw },
                                                                    {
                                                                                          role: "user",
                                                                                          content:
                                                                                                                  "Deine Antwort enthält keinen gültigen JSON-Block. Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text davor oder danach.",
                                                                    },
                                                                                    ],
                                                });
                                                lastRaw = nudgeMsg.content
                                                  .map((b) => (b.type === "text" ? b.text : ""))
                                                  .join("");
                                                selection = safeParseSelection(lastRaw);
                                                if (selection) break;
                                }
                              }

                      if (!selection) {
                                    send("error", {
                                                    message:
                                                                      "Der Selektor konnte keine gültige Auswahl treffen. Bitte etwas konkreter formulieren.",
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

                      // ── DISCUSSION PHASE ─────────────────────────────────────────
                      const discussionStream = client.messages.stream({
                                    model: MODEL,
                                    max_tokens: 8192,
                                    system: buildDiscussionSystemPrompt(enrichedHeads),
                                    messages: [
                                      { role: "user", content: buildDiscussionUserMessage(idea) },
                                                  ],
                      });

                      let buffer = "";
                              for await (const chunk of discussionStream) {
                                            if (
                                                            chunk.type === "content_block_delta" &&
                                                            chunk.delta.type === "text_delta"
                                                          ) {
                                                            buffer += chunk.delta.text;
                                                            send("delta", { text: chunk.delta.text });
                                            }
                              }

                      send("done", { buffer });
                              controller.close();
                              return;
                  }

                  // ── FOLLOW-UP PHASE ──────────────────────────────────────────
                  if (body.followUp) {
                              const followUp = String(body.followUp).trim();

                      const followUpHeadIds = Array.isArray(body.headIds)
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

                      const previousFollowUps = Array.isArray(body.previousFollowUps)
                                ? (body.previousFollowUps as unknown[])
                                        .map((x) => (typeof x === "string" ? x : ""))
                                        .filter((s) => s.length > 0)
                                    : [];

                      const previousBuffers = Array.isArray(body.previousBuffers)
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

                      const followUpHeads = followUpHeadIds
                                .map((id) => getHead(id))
                                .filter((h): h is NonNullable<typeof h> => !!h);

                      const followUpStream = client.messages.stream({
                                    model: MODEL,
                                    max_tokens: 8192,
                                    system: buildDiscussionSystemPrompt(followUpHeads),
                                    messages: buildFollowUpUserMessage(
                                                    previousFollowUps,
                                                    previousBuffers,
                                                    followUp,
                                                  ),
                      });

                      for await (const chunk of followUpStream) {
                                    if (
                                                    chunk.type === "content_block_delta" &&
                                                    chunk.delta.type === "text_delta"
                                                  ) {
                                                    send("delta", { text: chunk.delta.text });
                                    }
                      }

                      send("done", {});
                              controller.close();
                              return;
                  }

                  send("error", { message: "Ungültige Anfrage: idea oder followUp fehlt." });
                    controller.close();
          } catch (err) {
                    const message =
                                err instanceof Error ? err.message : "Unbekannter Fehler";
                    send("error", { message });
                    controller.close();
          }
        },
  });

  return new Response(stream, {
        headers: {
                "content-type": "text/event-stream",
                "cache-control": "no-cache",
                connection: "keep-alive",
        },
  });
}
