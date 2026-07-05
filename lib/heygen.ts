/**
 * Dünner Wrapper um das HeyGen Streaming-Avatar-SDK.
 *
 * Das SDK (inkl. livekit-client) wird erst beim tatsächlichen Session-Start
 * dynamisch geladen, damit die Startseite schlank bleibt und ein fehlendes/
 * unvollständiges Paket den Rest der App nicht bricht.
 *
 * Nur im Browser verwenden.
 */

export interface HeygenSessionOptions {
  /** Kurzlebiges Session-Token vom Server (/api/heygen-token). */
  token: string;
  /** Avatar-ID aus dem HeyGen-Account. */
  avatarName?: string;
  /** Stimm-ID (mehrsprachig, für Deutsch). */
  voiceId?: string;
  /** Sprachcode, z.B. "de". */
  language?: string;
  /** Wird aufgerufen, sobald der Video-Stream bereit ist. */
  onStream: (stream: MediaStream) => void;
  /** Avatar hat zu sprechen begonnen / aufgehört. */
  onTalkingChange?: (talking: boolean) => void;
  /** Verbindung wurde getrennt. */
  onDisconnected?: () => void;
}

export interface HeygenSession {
  speak: (text: string) => Promise<void>;
  interrupt: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Startet eine HeyGen-Avatar-Session und gibt Steuerungs-Handles zurück.
 * Wirft, wenn das SDK nicht geladen werden kann oder die Session scheitert —
 * die aufrufende Komponente fällt dann auf den Fallback-Avatar zurück.
 */
export async function startHeygenSession(
  opts: HeygenSessionOptions,
): Promise<HeygenSession> {
  const mod = await import("@heygen/streaming-avatar");
  const StreamingAvatar = mod.default;
  const { StreamingEvents, TaskType, AvatarQuality } = mod;

  const avatar = new StreamingAvatar({ token: opts.token });

  avatar.on(StreamingEvents.STREAM_READY, (event: { detail?: MediaStream }) => {
    if (event?.detail) opts.onStream(event.detail);
  });
  avatar.on(StreamingEvents.AVATAR_START_TALKING, () =>
    opts.onTalkingChange?.(true),
  );
  avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () =>
    opts.onTalkingChange?.(false),
  );
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, () =>
    opts.onDisconnected?.(),
  );

  await avatar.createStartAvatar({
    quality: AvatarQuality.High,
    avatarName: opts.avatarName ?? "default",
    voice: opts.voiceId ? { voiceId: opts.voiceId, rate: 1 } : undefined,
    language: opts.language ?? "de",
  });

  return {
    speak: async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      await avatar.speak({ text: clean, taskType: TaskType.REPEAT });
    },
    interrupt: async () => {
      try {
        await avatar.interrupt();
      } catch {
        /* Avatar spricht evtl. gerade nicht – ignorieren. */
      }
    },
    stop: async () => {
      try {
        await avatar.stopAvatar();
      } catch {
        /* Session evtl. schon beendet. */
      }
    },
  };
}
