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
import type { Head, HeadSelection } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

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
                      const parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>;
                      if (!parsed || !Array.isArray(parsed.heads)) return null;
                      const heads = (parsed.heads as Array<Record<string, unknown>>)
                        .map((h) => ({ id: String(h.id ?? ""), reason: String(h.reason ?? "") }))
                        .filter((h) => !!getHead(h.id));
                      if (heads.length < 9) return null;
                      return {
                                    heads: heads.slice(0, 12),
                                    ritson_gate: parsed.ritson_gate as HeadSelection["ritson_gate"],
                                    notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
                      };
          } catch {
                      return null;
          }
}

export async function POST(req: NextRequest) {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey) {
                      return new Response(
                                    JSON.stringify({ error: "ANTHROPIC_API_KEY fehlt." }),
                              { status: 500, headers: { "content-type": "application/json" } }
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
                      body = (await req.json()) as typeof body;
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
                                // SELECTION + DISCUSSION
                              if (body.idea) {
                                                const idea = String(body.idea).trim();
                                                let selection: HeadSelection | null = null;
                                                let lastRaw = "";

                                  for (let attempt = 1; attempt <= 3; attempt++) {
                                                      const msgs: Array<{ role: "user" | "assistant"; content: string }> =
                                                                            [{ role: "user", content: buildSelectionUserMessage(idea) }];
                                                      if (attempt > 1) {
                                                                            msgs.push({ role: "assistant", content: lastRaw });
                                                                            msgs.push({
                                                                                                    role: "user",
                                                                                                    content:
                                                                                                                              "Deine Antwort enthielt keinen gültigen JSON-Block. Antworte NUR mit dem JSON-Objekt, ohne Text davor oder danach.",
                                                                            });
                                                      }
                                                      const msg = await client.messages.create({
                                                                            model: MODEL,
                                                                            max_tokens: 1024,
                                                                            temperature: 0,
                                                                            system: SELECTION_SYSTEM_PROMPT,
                                                                            messages: msgs,
                                                      });
                                                      lastRaw = msg.content
                                                        .map((b) => (b.type === "text" ? b.text : ""))
                                                        .join("");
                                                      selection = safeParseSelection(lastRaw);
                                                      if (selection) break;
                                  }

                                  if (!selection) {
                                                      send("error", {
                                                                            message:
                                                                                                    "Der Selektor konnte keine gültige Auswahl treffen. Bitte etwas konkreter formulieren.",
                                                      });
                                                      controller.close();
                                  return;
                                  }

                                  // Build Head objects with reason attached
                                  const headObjs = selection.heads
                                                  .map((h) => {
                                                                        const head = getHead(h.id);
                                                                        if (!head) return null;
                                                                        return { head, reason: h.reason };
                                                  })
                                                  .filter((x): x is { head: Head; reason: string } => x !== null);

                                  send("selection", {
                                                      heads: headObjs.map(({ head, reason }) => ({
                                                                            id: head.id,
                                                                            name: head.name,
                                                                            segment: head.segment,
                                                                            color: head.color,
                                                                            reason,
                                                      })),
                                                      ritson_gate: selection.ritson_gate ?? { triggered: false },
                                                      notes: selection.notes ?? "",
                                  });

                                  const discussionStream = client.messages.stream({
                                                      model: MODEL,
                                                      max_tokens: 8192,
                                                      system: buildDiscussionSystemPrompt(headObjs.map((x) => x.head)),
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

                              // FOLLOW-UP
                              if (body.followUp) {
                                                const followUp = String(body.followUp).trim();

                                  const followUpHeads = (
                                                      Array.isArray(body.headIds) ? (body.headIds as unknown[]) : []
                                                    )
                                                  .map((x) => getHead(String(x)))
                                                  .filter((h): h is Head => h !== undefined);

                                  if (followUpHeads.length === 0) {
                                                      send("error", {
                                                                            message: "Köpfe für Nachfrage fehlen. Bitte Seite neu laden.",
                                                      });
                                                      controller.close();
                                                      return;
                                  }

                                  const prevFollowUps = (
                                                      Array.isArray(body.previousFollowUps)
                                                        ? (body.previousFollowUps as unknown[])
                                                        : []
                                                    )
                                                  .map((x) => (typeof x === "string" ? x : ""))
                                                  .filter((s) => s.length > 0);

                                  const prevBuffers = (
                                                      Array.isArray(body.previousBuffers)
                                                        ? (body.previousBuffers as unknown[])
                                                        : []
                                                    )
                                                  .map((x) => (typeof x === "string" ? x : ""))
                                                  .filter((s) => s.length > 0);

                                  if (prevBuffers.length === 0) {
                                                      send("error", {
                                                                            message: "Vorherige Diskussion fehlt. Bitte Seite neu laden.",
                                                      });
                                                      controller.close();
                                                      return;
                                  }

                                  const followUpStream = client.messages.stream({
                                                      model: MODEL,
                                                      max_tokens: 8192,
                                                      system: buildDiscussionSystemPrompt(followUpHeads),
                                                      messages: buildFollowUpUserMessage(prevFollowUps, prevBuffers, followUp),
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
                                send("error", {
                                                  message: err instanceof Error ? err.message : "Unbekannter Fehler",
                                });
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
