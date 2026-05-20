"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { InputForm } from "@/components/InputForm";
import { Discussion, type SelectionView } from "@/components/Discussion";
import { parseStream, type ParsedBlock } from "@/lib/parser";

type Phase = "idle" | "selecting" | "discussing" | "done" | "error";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [buffer, setBuffer] = useState("");
  const [selection, setSelection] = useState<SelectionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { blocks, openBlockIndex } = useMemo<{
    blocks: ParsedBlock[];
    openBlockIndex: number;
  }>(() => parseStream(buffer), [buffer]);

  const isLoading = phase === "selecting" || phase === "discussing";
  const hasResult = blocks.length > 0 || !!selection || phase === "done";

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setBuffer("");
    setSelection(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (idea: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("selecting");
    setBuffer("");
    setSelection(null);
    setError(null);

    try {
      const res = await fetch("/api/discuss", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea }),
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
            setBuffer,
            setSelection,
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
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
          Marketing Brain
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
          Ein strukturierter Denkraum.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Beschreibe deine Idee oder dein Problem. 3–5 Köpfe des Marketing-Hirns
          diskutieren — und liefern dir am Ende einen belastbaren Nenner und
          eine offene Frage, die du selbst beantworten musst.
        </p>
      </header>

      <InputForm
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onReset={reset}
        hasResult={hasResult}
      />

      <Discussion
        blocks={blocks}
        openBlockIndex={openBlockIndex}
        isStreaming={phase === "discussing"}
        isSelecting={phase === "selecting"}
        selection={selection}
        error={error}
      />

      <footer className="mt-auto pt-16 text-center text-[11px] uppercase tracking-[0.18em] text-muted">
        45 Köpfe · 9 Segmente · Reibung statt Glättung
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
  setBuffer: (updater: (prev: string) => string) => void;
  setSelection: (s: SelectionView | null) => void;
  setError: (e: string | null) => void;
}

function handleEvent(event: string, data: string, h: EventHandlers) {
  let payload: any = {};
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
      h.setSelection({
        heads: payload.heads ?? [],
        ritsonGate: payload.ritson_gate ?? { triggered: false },
        notes: payload.notes ?? "",
      });
      break;
    case "delta":
      if (typeof payload.text === "string") {
        h.setBuffer((prev) => prev + payload.text);
      }
      break;
    case "error":
      h.setError(payload.message ?? "Unbekannter Fehler.");
      h.setPhase("error");
      break;
    case "done":
      h.setPhase("done");
      break;
  }
}
