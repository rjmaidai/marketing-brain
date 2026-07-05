import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";

/**
 * Diagnose-Endpoint: zeigt, welche Keys im Deployment gesetzt sind, und macht
 * einen minimalen Anthropic-Testcall, um den EXAKTEN Fehler zu melden.
 * Gibt niemals Key-Werte aus — nur, ob sie vorhanden sind.
 *
 * Im Browser aufrufen: <deine-app>/api/health
 */
export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const anamKey = process.env.ANAM_API_KEY?.trim();

  const result: {
    anthropic: { keyPresent: boolean; model: string; ping: string };
    openai: { keyPresent: boolean };
    anam: { keyPresent: boolean; personaConfigured: boolean };
  } = {
    anthropic: {
      keyPresent: !!anthropicKey,
      model: MODEL,
      ping: anthropicKey ? "…" : "kein Key gesetzt",
    },
    openai: { keyPresent: !!openaiKey },
    anam: {
      keyPresent: !!anamKey,
      personaConfigured: !!(
        process.env.ANAM_PERSONA_ID?.trim() || process.env.ANAM_AVATAR_ID?.trim()
      ),
    },
  };

  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });
      await client.messages.create({
        model: MODEL,
        max_tokens: 4,
        messages: [{ role: "user", content: "ping" }],
      });
      result.anthropic.ping = "ok ✅";
    } catch (err) {
      const e = err as { name?: string; status?: number; message?: string };
      result.anthropic.ping = `${e?.name ?? "Fehler"}${
        e?.status ? ` (${e.status})` : ""
      }: ${e?.message ?? "unbekannt"}`;
    }
  }

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
