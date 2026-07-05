import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liefert ein kurzlebiges HeyGen-Session-Token an den Browser.
 *
 * Der eigentliche HEYGEN_API_KEY verlässt niemals den Server. Ist kein Key
 * gesetzt, antwortet die Route mit { available: false } — der Client fällt
 * dann auf den animierten Fallback-Avatar + Browser-Stimme zurück.
 */
export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      available: false,
      reason:
        "Kein HEYGEN_API_KEY gesetzt — Live-Gesicht deaktiviert, Fallback-Avatar aktiv.",
    });
  }

  try {
    const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "content-type": "application/json",
      },
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          available: false,
          reason: `HeyGen-Token fehlgeschlagen (${res.status}). ${detail.slice(0, 200)}`,
        },
        { status: 200 },
      );
    }

    const data = (await res.json()) as { data?: { token?: string } };
    const token = data?.data?.token;

    if (!token) {
      return NextResponse.json({
        available: false,
        reason: "HeyGen-Antwort ohne Token.",
      });
    }

    return NextResponse.json({
      available: true,
      token,
      avatarId: process.env.HEYGEN_AVATAR_ID ?? null,
      voiceId: process.env.HEYGEN_VOICE_ID ?? null,
    });
  } catch (err) {
    return NextResponse.json({
      available: false,
      reason:
        err instanceof Error ? err.message : "Unbekannter Fehler beim Token.",
    });
  }
}
