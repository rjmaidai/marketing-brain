"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdvisorOrb, type OrbState } from "@/components/AdvisorOrb";
import { startAnamSession, type AnamSession } from "@/lib/anam";

type Status = "cold" | "connecting" | "idle" | "consulting" | "speaking" | "error";
type Provider = "anam" | "fallback";

const ANAM_VIDEO_ID = "anam-video";
const ANAM_AUDIO_ID = "anam-audio";

interface Turn {
  user: string;
  advisor: string;
  files?: string[];
}

interface Attachment {
  name: string;
  kind: "pdf" | "image" | "text";
  mediaType?: string;
  data: string; // base64 (pdf/image) oder Text
  bytes: number;
}

const MAX_ATTACHMENTS = 6;
const MAX_FILE_BYTES = 3_500_000; // ~3,5 MB je Datei (Vercel-Body-Limit)
const MAX_TEXT_BYTES = 500_000;
const IMAGE_MIME = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

async function readAttachment(
  file: File,
): Promise<Attachment | { error: string }> {
  const name = file.name;
  const type = file.type;
  const lower = name.toLowerCase();
  const isImage = IMAGE_MIME.includes(type);
  const isPdf = type === "application/pdf" || lower.endsWith(".pdf");
  const isText =
    type.startsWith("text/") || /\.(txt|md|csv|json|tsv|log)$/i.test(lower);

  if (isPdf || isImage) {
    if (file.size > MAX_FILE_BYTES)
      return { error: `„${name}" ist zu groß (max. ~3,5 MB).` };
    const data = await fileToBase64(file);
    return {
      name,
      kind: isPdf ? "pdf" : "image",
      mediaType: isPdf ? "application/pdf" : type,
      data,
      bytes: file.size,
    };
  }
  if (isText) {
    if (file.size > MAX_TEXT_BYTES)
      return { error: `„${name}" (Text) ist zu groß.` };
    const data = await file.text();
    return { name, kind: "text", data, bytes: file.size };
  }
  return {
    error: `„${name}": Typ nicht unterstützt (PDF, Bild, txt/md/csv/json).`,
  };
}

/** Zerlegt einen Puffer ab `from` in vollständige Sätze (für satzweise TTS). */
function extractSentences(
  buffer: string,
  from: number,
): { sentences: string[]; next: number } {
  const sentences: string[] = [];
  let cursor = from;
  const re = /[^.!?…\n]*[.!?…\n]+/g;
  re.lastIndex = from;
  let m: RegExpExecArray | null;
  while ((m = re.exec(buffer)) !== null) {
    const s = m[0].trim();
    if (s) sentences.push(s);
    cursor = re.lastIndex;
  }
  return { sentences, next: cursor };
}

export function VideoAdvisor() {
  const [status, setStatus] = useState<Status>("cold");
  const [provider, setProvider] = useState<Provider>("fallback");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentAdvisor, setCurrentAdvisor] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [listening, setListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState<boolean>(false);
  const [companyProfile, setCompanyProfile] = useState<string>("");
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const anamRef = useRef<AnamSession | null>(null);
  const providerRef = useRef<Provider>("fallback");
  const headIdsRef = useRef<string[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const speakChainRef = useRef<Promise<void>>(Promise.resolve());
  const recognitionRef = useRef<any>(null);
  const ttsActiveRef = useRef<number>(0);
  const companyProfileRef = useRef<string>("");
  // OpenAI-Stimme verfügbar? null = noch unbekannt, wird beim ersten TTS-Call gesetzt.
  const openaiVoiceRef = useRef<boolean | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);
  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);
  useEffect(() => {
    companyProfileRef.current = companyProfile;
  }, [companyProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setMicSupported(!!SR);
  }, []);

  // Firmenprofil / Ideologie aus dem Browser laden.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("mb_company_profile");
      if (saved) setCompanyProfile(saved);
    } catch {
      /* localStorage evtl. gesperrt. */
    }
  }, []);

  const saveProfile = useCallback(() => {
    try {
      window.localStorage.setItem("mb_company_profile", companyProfile);
      setProfileSaved(true);
    } catch {
      /* ignorieren */
    }
  }, [companyProfile]);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setAttachError(null);
    const incoming = Array.from(fileList);
    const added: Attachment[] = [];
    let err: string | null = null;

    for (const file of incoming) {
      const res = await readAttachment(file);
      if ("error" in res) {
        err = res.error;
        continue;
      }
      added.push(res);
    }

    setAttachments((prev) => {
      const combined = [...prev, ...added];
      if (combined.length > MAX_ATTACHMENTS) {
        err = `Maximal ${MAX_ATTACHMENTS} Dateien.`;
        return combined.slice(0, MAX_ATTACHMENTS);
      }
      const total = combined.reduce((s, a) => s + a.data.length, 0);
      if (total > 4_000_000) {
        err = "Anhänge zusammen zu groß (max. ~4 MB).";
        return prev;
      }
      return combined;
    });
    if (err) setAttachError(err);
  }, []);

  const removeAttachment = useCallback((i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  // ---- Sprachausgabe (OpenAI-Stimme, Fallback Browser) ----------------------

  const markSpeaking = useCallback((on: boolean) => {
    if (on) {
      ttsActiveRef.current += 1;
      setOrbState("speaking");
    } else {
      ttsActiveRef.current = Math.max(0, ttsActiveRef.current - 1);
      if (ttsActiveRef.current === 0) setOrbState("idle");
    }
  }, []);

  const browserSpeak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "de-DE";
    const voices = window.speechSynthesis.getVoices();
    const de = voices.find((v) => v.lang.toLowerCase().startsWith("de"));
    if (de) utt.voice = de;
    utt.rate = 1.02;
    utt.onstart = () => {
      ttsActiveRef.current += 1;
      setOrbState("speaking");
    };
    utt.onend = () => {
      ttsActiveRef.current = Math.max(0, ttsActiveRef.current - 1);
      if (ttsActiveRef.current === 0) setOrbState("idle");
    };
    window.speechSynthesis.speak(utt);
  }, []);

  const playMp3 = useCallback(
    (buf: ArrayBuffer) =>
      new Promise<void>((resolve) => {
        try {
          const blob = new Blob([buf], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;
          markSpeaking(true);
          const done = () => {
            markSpeaking(false);
            URL.revokeObjectURL(url);
            if (currentAudioRef.current === audio) currentAudioRef.current = null;
            resolve();
          };
          audio.onended = done;
          audio.onerror = done;
          audio.play().catch(done);
        } catch {
          resolve();
        }
      }),
    [markSpeaking],
  );

  /** Spricht einen Satz: OpenAI-Stimme (Anam-PCM oder Browser-MP3), sonst Browser-TTS. */
  const doSpeak = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      const useAnam = providerRef.current === "anam" && !!anamRef.current;

      if (openaiVoiceRef.current !== false) {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text: clean, format: useAnam ? "pcm" : "mp3" }),
          });
          const ct = res.headers.get("content-type") ?? "";
          const isAudio =
            res.ok &&
            (ct.startsWith("audio/") || ct === "application/octet-stream");

          if (isAudio) {
            openaiVoiceRef.current = true;
            const buf = await res.arrayBuffer();
            if (useAnam && anamRef.current) {
              anamRef.current.sendPcm(buf);
            } else {
              await playMp3(buf);
            }
            return;
          }
          // JSON { available:false } o.ä. → OpenAI nicht nutzbar. Grund sichtbar machen.
          openaiVoiceRef.current = false;
          try {
            const j = (await res.json()) as { reason?: string };
            setNotice(
              `Die OpenAI-Stimme ist nicht aktiv — Sie hören die Browser-Stimme. ${
                j?.reason ?? ""
              } (OPENAI_API_KEY im Vercel-Projekt setzen und neu deployen.)`,
            );
          } catch {
            setNotice(
              "Die OpenAI-Stimme ist nicht aktiv — Sie hören die Browser-Stimme. (OPENAI_API_KEY im Vercel-Projekt setzen und neu deployen.)",
            );
          }
        } catch {
          openaiVoiceRef.current = false;
          setNotice(
            "Stimme über den Browser (Fallback) — OpenAI nicht erreichbar.",
          );
        }
      }

      // Fallback: Browser-Stimme (funktioniert nicht in Anam-Gesicht — dann
      // spricht der Fallback-Orb).
      browserSpeak(clean);
    },
    [browserSpeak, playMp3],
  );

  const speakChunk = useCallback(
    (text: string) => {
      speakChainRef.current = speakChainRef.current
        .then(() => doSpeak(text))
        .catch(() => {});
    },
    [doSpeak],
  );

  const endSpokenTurn = useCallback(() => {
    speakChainRef.current = speakChainRef.current
      .then(() => {
        if (providerRef.current === "anam") anamRef.current?.endTurn();
      })
      .catch(() => {});
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch {
        /* ignore */
      }
      currentAudioRef.current = null;
    }
    ttsActiveRef.current = 0;
    anamRef.current?.interrupt();
    speakChainRef.current = Promise.resolve();
  }, []);

  // ---- Session-Start (Anam live oder Fallback) ------------------------------

  const ensureSession = useCallback(async (): Promise<Provider> => {
    if (status !== "cold") return providerRef.current;
    setStatus("connecting");
    setError(null);

    try {
      const res = await fetch("/api/anam-token", { method: "POST" });
      const data = (await res.json()) as {
        available?: boolean;
        sessionToken?: string;
        reason?: string;
      };

      if (data.available && data.sessionToken) {
        const session = await startAnamSession({
          sessionToken: data.sessionToken,
          videoElementId: ANAM_VIDEO_ID,
          audioElementId: ANAM_AUDIO_ID,
          onDisconnected: () => {
            setProvider("fallback");
            setNotice("Live-Verbindung getrennt — Fallback aktiv.");
          },
        });
        anamRef.current = session;
        setProvider("anam");
        setStatus("idle");
        return "anam";
      }

      setProvider("fallback");
      setNotice(
        data.reason?.includes("Kein ANAM")
          ? "Live-Gesicht noch nicht konfiguriert — Berater spricht über die Stimme. (ANAM_API_KEY setzen zum Freischalten.)"
          : (data.reason ?? "Live-Gesicht nicht verfügbar — Fallback aktiv."),
      );
      setStatus("idle");
      return "fallback";
    } catch {
      setProvider("fallback");
      setNotice("Live-Gesicht nicht erreichbar — Fallback aktiv.");
      setStatus("idle");
      return "fallback";
    }
  }, [status]);

  // ---- Beratung streamen ----------------------------------------------------

  const runStream = useCallback(
    async (
      payload: Record<string, unknown>,
      userText: string,
      fileNames: string[] = [],
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setCurrentUser(userText);
      setCurrentAdvisor("");
      setError(null);
      setStatus("consulting");
      setOrbState("thinking");

      let full = "";
      let spokenIndex = 0;
      let spokeAnything = false;

      try {
        const res = await fetch("/api/advise", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setError((data as any).error ?? `Serverfehler (${res.status}).`);
          setStatus("error");
          setOrbState("idle");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        const flushSentences = (finalize: boolean) => {
          const { sentences, next } = extractSentences(full, spokenIndex);
          for (const s of sentences) {
            speakChunk(s);
            spokeAnything = true;
          }
          spokenIndex = next;
          if (finalize) {
            const rest = full.slice(spokenIndex).trim();
            if (rest) {
              speakChunk(rest);
              spokeAnything = true;
              spokenIndex = full.length;
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = sseBuffer.indexOf("\n\n")) !== -1) {
            const rawEvent = sseBuffer.slice(0, sep);
            sseBuffer = sseBuffer.slice(sep + 2);
            const { event, data } = parseSse(rawEvent);
            if (!event) continue;

            if (event === "heads") {
              const ids = (data.ids as string[]) ?? [];
              if (ids.length) headIdsRef.current = ids;
            } else if (event === "status") {
              if (data.phase === "speaking") setStatus("speaking");
            } else if (event === "delta") {
              if (typeof data.text === "string") {
                full += data.text;
                setCurrentAdvisor(full);
                flushSentences(false);
              }
            } else if (event === "error") {
              setError((data.message as string) ?? "Unbekannter Fehler.");
              setStatus("error");
              setOrbState("idle");
              return;
            }
          }
        }

        flushSentences(true);
        if (spokeAnything) endSpokenTurn();

        setTurns((prev) => [
          ...prev,
          {
            user: userText,
            advisor: full.trim(),
            files: fileNames.length ? fileNames : undefined,
          },
        ]);
        setCurrentUser("");
        setCurrentAdvisor("");
        setStatus("idle");
        if (ttsActiveRef.current === 0 && providerRef.current !== "anam") {
          setOrbState("idle");
        }
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Netzwerkfehler.");
        setStatus("error");
        setOrbState("idle");
      }
    },
    [speakChunk, endSpokenTurn],
  );

  const submit = useCallback(
    async (text: string) => {
      const clean = text.trim();
      const files = attachments;
      if (clean.length < 8 && files.length === 0) {
        setError("Bitte schildern Sie Ihr Anliegen in ein paar Sätzen.");
        return;
      }
      const situationText =
        clean.length >= 8
          ? clean
          : "Bitte analysiere die angehängten Dateien und berate uns dazu.";

      setInput("");
      setAttachments([]);
      setAttachError(null);
      stopSpeaking();

      await ensureSession();

      const profile = companyProfileRef.current.trim();
      const filePayload = files.map((f) => ({
        name: f.name,
        kind: f.kind,
        mediaType: f.mediaType,
        data: f.data,
      }));
      const fileNames = files.map((f) => f.name);
      const isFollowUp = turnsRef.current.length > 0;
      if (isFollowUp) {
        await runStream(
          {
            situation: turnsRef.current[0].user,
            followUp: situationText,
            headIds: headIdsRef.current,
            previousTurns: turnsRef.current,
            companyProfile: profile,
            files: filePayload,
          },
          situationText,
          fileNames,
        );
      } else {
        await runStream(
          { situation: situationText, companyProfile: profile, files: filePayload },
          situationText,
          fileNames,
        );
      }
    },
    [attachments, ensureSession, runStream, stopSpeaking],
  );

  // ---- Mikrofon -------------------------------------------------------------

  const toggleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    stopSpeaking();
    const rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;

    let finalText = "";
    rec.onstart = () => {
      setListening(true);
      setOrbState("listening");
    };
    rec.onresult = (e: any) => {
      let interim = "";
      finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInput(finalText || interim);
    };
    rec.onerror = () => {
      setListening(false);
      if (status === "idle" || status === "cold") setOrbState("idle");
    };
    rec.onend = () => {
      setListening(false);
      const said = finalText.trim();
      if (said.length >= 8) {
        void submit(said);
      } else if (status === "idle" || status === "cold") {
        setOrbState("idle");
      }
    };

    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [listening, status, stopSpeaking, submit]);

  // ---- Cleanup --------------------------------------------------------------

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      recognitionRef.current?.stop?.();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      anamRef.current?.stop();
    };
  }, []);

  const busy = status === "consulting" || status === "speaking";
  const started = turns.length > 0 || !!currentUser || status !== "cold";
  const profileActive = companyProfile.trim().length > 0;
  const isLive = provider === "anam";

  return (
    <div className="w-full">
      {/* Firmenprofil / Ideologie */}
      <div className="mb-4 rounded-xl border border-white/10 bg-black/20">
        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                profileActive ? "bg-gold" : "bg-white/30"
              }`}
            />
            Firmenprofil &amp; Ideologie
            <span className="text-xs font-normal text-muted">
              {profileActive
                ? "— der Berater richtet sich danach aus"
                : "— optional: Positionierung, Werte, Weltsicht der Firma"}
            </span>
          </span>
          <span className="text-muted">{profileOpen ? "−" : "+"}</span>
        </button>

        {profileOpen && (
          <div className="border-t border-white/10 px-4 py-4">
            <p className="mb-2 text-xs leading-relaxed text-muted">
              Wofür steht die Firma? Positionierung, Werte, Tonalität, No-Gos,
              strategische Überzeugungen. Der Berater gewichtet die
              Kopf-Argumente danach — bleibt aber ehrlich, wenn die Ideologie
              mit solidem Marketing kollidiert.
            </p>
            <textarea
              value={companyProfile}
              onChange={(e) => {
                setCompanyProfile(e.target.value);
                setProfileSaved(false);
              }}
              rows={5}
              maxLength={2500}
              placeholder="z. B. Wir sind eine Schweizer Premium-Marke für nachhaltige Outdoor-Ausrüstung. Wir sprechen nie über Rabatte, sondern über Langlebigkeit und Handwerk. Unsere Haltung: Understatement statt Hype…"
              className="w-full resize-none rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-gold/50"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted">
                {companyProfile.trim().length}/2500 Zeichen — lokal im Browser
                gespeichert
              </span>
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/20"
              >
                {profileSaved ? "Gespeichert ✓" : "Profil speichern"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Video / Avatar */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-surface/40 to-bg shadow-2xl">
          {/* Anam rendert in diese Elemente. Immer im DOM, damit das SDK
              andocken kann; sichtbar nur im Live-Modus. */}
          <video
            id={ANAM_VIDEO_ID}
            className={`absolute inset-0 h-full w-full object-cover ${
              isLive ? "opacity-100" : "opacity-0"
            }`}
            playsInline
            autoPlay
          />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio id={ANAM_AUDIO_ID} autoPlay className="hidden" />

          {!isLive && (
            <div className="absolute inset-0">
              <AdvisorOrb state={orbState} />
            </div>
          )}

          {/* Status-Chip */}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-medium tracking-wide backdrop-blur">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                status === "consulting"
                  ? "animate-pulse bg-gold"
                  : status === "speaking" || orbState === "speaking"
                    ? "bg-emerald-400"
                    : listening
                      ? "animate-pulse bg-sky-400"
                      : status === "error"
                        ? "bg-red-400"
                        : "bg-white/40"
              }`}
            />
            {status === "connecting"
              ? "Verbinde…"
              : status === "consulting"
                ? "Das Gremium prüft…"
                : status === "speaking" || orbState === "speaking"
                  ? "Berät Sie"
                  : listening
                    ? "Hört zu…"
                    : status === "error"
                      ? "Fehler"
                      : isLive
                        ? "Live-Berater"
                        : "Berater bereit"}
          </div>

          {isLive && (
            <div className="absolute right-4 top-4 rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold backdrop-blur">
              Live
            </div>
          )}
        </div>

        {/* Transkript + Steuerung */}
        <div className="flex flex-col">
          <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-5 md:max-h-[520px]">
            {!started && (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <p className="mb-2 text-lg font-semibold">
                  Ihr Marketing-Berater
                </p>
                <p className="max-w-xs text-sm leading-relaxed text-muted">
                  Schildern Sie Ihr Anliegen — per Sprache oder Text, gern mit
                  Dateien (PDF, Studien, Meta-Analysen). Hinter dem Berater
                  urteilen 51 Marketing-Köpfe. Sie hören eine klare Empfehlung,
                  nicht zehn Meinungen.
                </p>
              </div>
            )}

            {turns.map((t, i) => (
              <div key={i} className="space-y-2">
                <UserLine text={t.user} files={t.files} />
                <AdvisorLine text={t.advisor} />
              </div>
            ))}

            {(currentUser || currentAdvisor) && (
              <div className="space-y-2">
                {currentUser && <UserLine text={currentUser} />}
                {status === "consulting" && !currentAdvisor && (
                  <p className="text-sm text-gold mb-cursor">
                    Das Gremium prüft Ihr Anliegen
                  </p>
                )}
                {currentAdvisor && (
                  <AdvisorLine text={currentAdvisor} streaming={busy} />
                )}
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
          </div>

          {notice && (
            <p className="mb-3 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-[12px] leading-relaxed text-gold/90">
              {notice}
            </p>
          )}

          {/* Anhänge */}
          {(attachments.length > 0 || attachError) && (
            <div className="mb-2 space-y-1.5">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-[12px]"
                    >
                      <span aria-hidden>
                        {a.kind === "pdf" ? "📄" : a.kind === "image" ? "🖼️" : "📝"}
                      </span>
                      <span className="max-w-[160px] truncate">{a.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        aria-label="Anhang entfernen"
                        className="ml-0.5 text-muted hover:text-ink"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {attachError && (
                <p className="text-[12px] text-red-300">{attachError}</p>
              )}
            </div>
          )}

          {/* Eingabe */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/png,image/jpeg,image/gif,image/webp,.txt,.md,.csv,.json,.tsv,.log,text/*"
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) submit(input);
            }}
            className="flex items-end gap-2"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Datei anhängen (PDF, Bild, Text)"
              title="Datei anhängen — PDF, Bild, Text (z.B. Studien, Meta-Analysen)"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-ink transition hover:border-gold/50"
            >
              <ClipIcon />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!busy) submit(input);
                }
              }}
              rows={2}
              placeholder={
                turns.length > 0
                  ? "Rückfrage stellen…"
                  : "Ihr Marketing-Anliegen in 1–3 Sätzen…"
              }
              className="min-h-[52px] flex-1 resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-gold/50"
            />
            {micSupported && (
              <button
                type="button"
                onClick={toggleMic}
                aria-label="Mit Stimme sprechen"
                className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border transition ${
                  listening
                    ? "border-sky-400 bg-sky-400/20 text-sky-300"
                    : "border-white/15 bg-black/30 text-ink hover:border-gold/50"
                }`}
              >
                <MicIcon active={listening} />
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-[52px] shrink-0 rounded-xl bg-gold px-5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "…" : "Senden"}
            </button>
          </form>

          {busy && (
            <button
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                stopSpeaking();
                setStatus("idle");
                setOrbState("idle");
              }}
              className="mt-2 self-start text-[12px] text-muted underline underline-offset-2 hover:text-ink"
            >
              Unterbrechen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserLine({ text, files }: { text: string; files?: string[] }) {
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-surface/60 px-4 py-2.5 text-sm">
      {files && files.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {files.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 text-[11px] text-muted"
            >
              📎 <span className="max-w-[140px] truncate">{f}</span>
            </span>
          ))}
        </div>
      )}
      {text}
    </div>
  );
}

function AdvisorLine({
  text,
  streaming,
}: {
  text: string;
  streaming?: boolean;
}) {
  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-gold/20 bg-gold/[0.06] px-4 py-3 text-sm leading-relaxed">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold/70">
        Berater
      </p>
      <span className={streaming ? "mb-cursor" : ""}>{text}</span>
    </div>
  );
}

function ClipIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "ha-speaking" : ""}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function parseSse(raw: string): {
  event: string | null;
  data: Record<string, unknown>;
} {
  const lines = raw.split("\n");
  let event: string | null = null;
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  let data: Record<string, unknown> = {};
  try {
    const joined = dataLines.join("\n");
    data = joined ? JSON.parse(joined) : {};
  } catch {
    data = {};
  }
  return { event, data };
}
