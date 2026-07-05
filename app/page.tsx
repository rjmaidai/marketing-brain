"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { InputForm } from "@/components/InputForm";
import { Discussion, type Round, type SelectionView } from "@/components/Discussion";
import { HeadsSection } from "@/components/HeadsSection";

type Phase = "idle" | "selecting" | "discussing" | "done" | "error";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [idea, setIdea] = useState<string>("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selection, setSelection] = useState<SelectionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isLoading = phase === "selecting" || phase === "discussing";
  const hasResult = rounds.length > 0 || !!selection || phase === "done";

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setIdea("");
    setRounds([]);
    setSelection(null);
    setError(null);
  }, []);

  const runStream = useCallback(
    async (
      payload: Record<string, unknown>,
      onSelection: (s: SelectionView) => void,
      onDelta: (text: string) => void,
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/discuss", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? `Fehler vom Server (${res.status}).`);
          setPhase("error");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });

          let sepIndex: number;
          while ((sepIndex = sseBuffer.indexOf("\n\n")) !== -1) {
            const rawEvent = sseBuffer.slice(0, sepIndex);
            sseBuffer = sseBuffer.slice(sepIndex + 2);
            const { event, data } = parseSseEvent(rawEvent);
            if (!event) continue;
            handleEvent(event, data, {
              setPhase,
              onDelta,
              onSelection,
              setError,
            });
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Netzwerkfehler. Versuch's nochmal.",
        );
        setPhase("error");
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (nextIdea: string) => {
      setIdea(nextIdea);
      setRounds([{ userText: nextIdea, buffer: "", kind: "initial" }]);
      setSelection(null);
      setError(null);
      setPhase("selecting");

      await runStream(
        { idea: nextIdea },
        (s) => setSelection(s),
        (text) => {
          setRounds((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            next[0] = { ...next[0], buffer: next[0].buffer + text };
            return next;
          });
        },
      );
    },
    [runStream],
  );

  const handleFollowUp = useCallback(
    async (followUpText: string) => {
      if (!selection || rounds.length === 0) return;

      const previousFollowUps = rounds
        .filter((r) => r.kind === "followUp")
        .map((r) => r.userText);
      const previousBuffers = rounds.map((r) => r.buffer);

      setRounds((prev) => [
        ...prev,
        { userText: followUpText, buffer: "", kind: "followUp" },
      ]);
      setError(null);
      setPhase("discussing");

      await runStream(
        {
          idea,
          followUp: followUpText,
          headIds: selection.heads.map((h) => h.id),
          previousFollowUps,
          previousBuffers,
        },
        () => {},
        (text) => {
          setRounds((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const last = next.length - 1;
            next[last] = { ...next[last], buffer: next[last].buffer + text };
            return next;
          });
        },
      );
    },
    [idea, rounds, selection, runStream],
  );

  return (
    <main className="min-h-screen flex flex-col px-4 py-12 max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-3 opacity-70">
          Marketing Brain
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          51 Koepfe. Kein Konsens.
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Gib eine Idee ein. Das Gremium streitet. Du bekommst echte Reibung.
        </p>
        <div className="mt-6">
          <Link
            href="/berater"
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            Neu: Mit dem Video-Berater sprechen →
          </Link>
        </div>
      </header>

      <InputForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onReset={hasResult ? reset : undefined}
      />

      {(hasResult || error) && (
        <Discussion
          rounds={rounds}
          isStreaming={phase === "discussing"}
          isSelecting={phase === "selecting"}
          selection={selection}
          error={error}
          canFollowUp={phase === "done"}
          onFollowUp={handleFollowUp}
        />
      )}

      <HeadsSection />

      <footer className="mt-auto pt-16 text-center text-[11px] uppercase tracking-[0.18em] text-muted">
        51 Koepfe - 9 Segmente - Reibung statt Glaettung
      </footer>
    </main>
  );
}

function parseSseEvent(raw: string): { event: string | null; data: string } {
  const lines = raw.split("\n");
  let event: string | null = null;
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  return { event, data: dataLines.join("\n") };
}

interface EventHandlers {
  setPhase: (p: Phase) => void;
  onDelta: (text: string) => void;
  onSelection: (s: SelectionView) => void;
  setError: (e: string | null) => void;
}

function handleEvent(event: string, data: string, h: EventHandlers) {
  let payload: Record<string, unknown> = {};
  try {
    payload = data ? JSON.parse(data) : {};
  } catch {
    return;
  }

  switch (event) {
    case "status":
      if (payload.phase === "selecting") h.setPhase("selecting");
      else if (payload.phase === "discussing") h.setPhase("discussing");
      else if (payload.phase === "done") h.setPhase("done");
      break;
    case "selection":
      h.onSelection({
        heads: (payload.heads as SelectionView["heads"]) ?? [],
        ritsonGate: (payload.ritson_gate as SelectionView["ritsonGate"]) ?? { triggered: false },
        notes: (payload.notes as string) ?? "",
      });
      break;
    case "delta":
      if (typeof payload.text === "string") {
        h.onDelta(payload.text);
      }
      break;
    case "error":
      h.setError((payload.message as string) ?? "Unbekannter Fehler.");
      h.setPhase("error");
      break;
    case "done":
      h.setPhase("done");
      break;
  }
                            }
