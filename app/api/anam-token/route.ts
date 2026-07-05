import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liefert ein kurzlebiges Anam-Session-Token an den Browser.
 *
 * Der ANAM_API_KEY bleibt server-seitig. Der Client baut mit dem Token die
 * Video-Verbindung auf (createClient) und streamt unsere OpenAI-Stimme über
 * BYO-Audio ins Gesicht.
 *
 * Persona: entweder eine im Anam-Dashboard gespeicherte Persona
 * (ANAM_PERSONA_ID) oder eine Ad-hoc-Persona aus Avatar-/Voice-ID
 * (ANAM_AVATAR_ID / ANAM_VOICE_ID). Fehlt beides, meldet die Route sauber
 * available:false — der Client nutzt dann den Fallback-Avatar.
 */
export async function POST() {
  const apiKey = process.env.ANAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      available: false,
      reason:
        "Kein ANAM_API_KEY gesetzt — Live-Gesicht deaktiviert, Fallback-Avatar aktiv.",
    });
  }

  const personaId = process.env.ANAM_PERSONA_ID;
  const avatarId = process.env.ANAM_AVATAR_ID;
  const voiceId = process.env.ANAM_VOICE_ID;

  if (!personaId && !avatarId) {
    return NextResponse.json({
      available: false,
      reason:
        "Anam-Persona fehlt: ANAM_PERSONA_ID oder ANAM_AVATAR_ID (+ANAM_VOICE_ID) in .env setzen.",
    });
  }

  // Persona-Body: gespeicherte Persona bevorzugt, sonst Ad-hoc-Config.
  const personaBody = personaId
    ? { personaId }
    : {
        personaConfig: {
          name: process.env.ANAM_PERSONA_NAME ?? "Marketing-Berater",
          avatarId,
          voiceId: voiceId ?? "",
          languageCode: process.env.ANAM_LANGUAGE ?? "de",
        },
      };

  try {
    const res = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(personaBody),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json({
        available: false,
        reason: `Anam-Token fehlgeschlagen (${res.status}). ${detail.slice(0, 200)}`,
      });
    }

    const data = (await res.json()) as {
      sessionToken?: string;
      session_token?: string;
    };
    const sessionToken = data.sessionToken ?? data.session_token;

    if (!sessionToken) {
      return NextResponse.json({
        available: false,
        reason: "Anam-Antwort ohne sessionToken.",
      });
    }

    return NextResponse.json({ available: true, sessionToken });
  } catch (err) {
    return NextResponse.json({
      available: false,
      reason: err instanceof Error ? err.message : "Unbekannter Anam-Fehler.",
    });
  }
}
