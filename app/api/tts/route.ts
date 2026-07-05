import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
const VOICE = process.env.OPENAI_TTS_VOICE ?? "alloy";
const DEFAULT_INSTRUCTIONS =
  process.env.OPENAI_TTS_INSTRUCTIONS ??
  "Sprich ruhig, souverän und präzise, wie ein erfahrener Marketing-Berater. Freundlich, aber nicht anbiedernd. Deutsches Hochdeutsch.";

/**
 * Text-to-Speech über OpenAI (gpt-4o-mini-tts) für den Video-Berater.
 *
 * Zwei Formate:
 *  - format="pcm": rohes PCM s16le, 24 kHz, mono — direkt für Anams BYO-Audio
 *    (createAgentAudioInputStream → sendAudioChunk).
 *  - format="mp3" (Default): für die Wiedergabe im Browser (Fallback ohne Anam).
 *
 * Der OPENAI_API_KEY bleibt server-seitig. Fehlt er oder scheitert der Call,
 * antwortet die Route mit JSON { available:false } — der Client fällt dann auf
 * die Browser-Stimme zurück.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      available: false,
      reason: "Kein OPENAI_API_KEY gesetzt — Browser-Stimme als Fallback.",
    });
  }

  let body: { text?: string; format?: string; instructions?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Kein Text." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "Text zu lang." }, { status: 400 });
  }

  const wantPcm = body.format === "pcm";
  const responseFormat = wantPcm ? "pcm" : "mp3";

  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        input: text,
        instructions: body.instructions?.trim() || DEFAULT_INSTRUCTIONS,
        response_format: responseFormat,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          available: false,
          reason: `OpenAI-TTS fehlgeschlagen (${res.status}). ${detail.slice(0, 200)}`,
        },
        { status: 200 },
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return new Response(buf, {
      status: 200,
      headers: {
        "content-type": wantPcm ? "application/octet-stream" : "audio/mpeg",
        "cache-control": "no-store",
        // Metadaten für den Client (Anam-Audio-Konfiguration).
        "x-audio-encoding": wantPcm ? "pcm_s16le" : "mp3",
        "x-audio-sample-rate": wantPcm ? "24000" : "",
        "x-audio-channels": wantPcm ? "1" : "",
      },
    });
  } catch (err) {
    return NextResponse.json({
      available: false,
      reason: err instanceof Error ? err.message : "Unbekannter TTS-Fehler.",
    });
  }
}
