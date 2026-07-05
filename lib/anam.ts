/**
 * Dünner Wrapper um das Anam Streaming-SDK (@anam-ai/js-sdk).
 *
 * Anam liefert das Echtzeit-Gesicht. Die Stimme kommt NICHT von Anam, sondern
 * von OpenAI (gpt-4o-mini-tts): Wir streamen rohes PCM (s16le, 24 kHz, mono)
 * über Anams BYO-Audio-Kanal (createAgentAudioInputStream), und Cara erzeugt
 * daraus lippensynchron Mund, Kopf und Mimik.
 *
 * Das SDK wird erst beim Session-Start dynamisch geladen. Nur im Browser nutzen.
 */

export interface AnamSessionOptions {
  /** Kurzlebiges Session-Token vom Server (/api/anam-token). */
  sessionToken: string;
  /** ID des <video>-Elements, in das der Avatar gerendert wird. */
  videoElementId: string;
  /** ID des <audio>-Elements für den Avatar-Ton. */
  audioElementId: string;
  onDisconnected?: () => void;
}

export interface AnamSession {
  /** Rohes PCM (s16le, 24 kHz, mono) an den Avatar senden. */
  sendPcm: (audio: ArrayBuffer | Uint8Array) => void;
  /** Aktuelle Sprech-Sequenz (Turn) beenden. */
  endTurn: () => void;
  /** Laufende Ausgabe unterbrechen. */
  interrupt: () => void;
  stop: () => Promise<void>;
}

const PCM_CONFIG = {
  encoding: "pcm_s16le" as const,
  sampleRate: 24000,
  channels: 1,
};

/**
 * Startet eine Anam-Session und gibt Steuerungs-Handles zurück.
 * Wirft bei Fehlern — die aufrufende Komponente fällt dann auf den
 * Fallback-Avatar (+ Browser-Audio) zurück.
 */
export async function startAnamSession(
  opts: AnamSessionOptions,
): Promise<AnamSession> {
  const { createClient } = await import("@anam-ai/js-sdk");

  const client = createClient(opts.sessionToken);

  if (opts.onDisconnected) {
    // Verbindungsabbruch best-effort abfangen; SDK-Event-Namen variieren je
    // Version, deshalb defensiv.
    try {
      (client as unknown as {
        addListener?: (e: string, cb: () => void) => void;
      }).addListener?.("CONNECTION_CLOSED", opts.onDisconnected);
    } catch {
      /* Event nicht verfügbar — egal. */
    }
  }

  await client.streamToVideoAndAudioElements(
    opts.videoElementId,
    opts.audioElementId,
  );

  const audioInput = client.createAgentAudioInputStream(PCM_CONFIG);

  return {
    sendPcm: (audio) => {
      try {
        audioInput.sendAudioChunk(
          audio instanceof Uint8Array ? audio : new Uint8Array(audio),
        );
      } catch {
        /* Einzelner Chunk-Fehler soll den Fluss nicht abreißen. */
      }
    },
    endTurn: () => {
      try {
        audioInput.endSequence();
      } catch {
        /* ignorieren */
      }
    },
    interrupt: () => {
      try {
        client.interruptPersona();
      } catch {
        /* Avatar spricht evtl. gerade nicht. */
      }
    },
    stop: async () => {
      try {
        await client.stopStreaming();
      } catch {
        /* Session evtl. schon beendet. */
      }
    },
  };
}
