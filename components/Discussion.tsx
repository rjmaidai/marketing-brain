"use client";

import { useEffect, useRef } from "react";
import type { ParsedBlock } from "@/lib/parser";
import { MessageBubble } from "./MessageBubble";
import { Conclusion } from "./Conclusion";

interface DiscussionProps {
  blocks: ParsedBlock[];
  openBlockIndex: number;
  isStreaming: boolean;
  isSelecting: boolean;
  selection: SelectionView | null;
  error: string | null;
}

export interface SelectionView {
  heads: Array<{
    id: string;
    name: string;
    segment: string;
    color: string;
    reason: string;
  }>;
  ritsonGate: { triggered: boolean; missing_layer?: string; note?: string };
  notes?: string;
}

export function Discussion({
  blocks,
  openBlockIndex,
  isStreaming,
  isSelecting,
  selection,
  error,
}: DiscussionProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [blocks, isStreaming, isSelecting]);

  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (isSelecting) {
    return (
      <div className="mt-10 flex items-center gap-3 text-sm text-muted">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
        Köpfe werden ausgewählt …
      </div>
    );
  }

  const messageBlocks = blocks.filter((b) => b.kind === "message");
  const erkenntnis = blocks.find((b) => b.kind === "erkenntnis");
  const frage = blocks.find((b) => b.kind === "frage");

  const lastBlock = blocks[openBlockIndex];
  const erkenntnisStreaming =
    isStreaming && lastBlock?.kind === "erkenntnis";
  const frageStreaming = isStreaming && lastBlock?.kind === "frage";

  return (
    <div className="mt-8 flex flex-col gap-6">
      {selection && selection.heads.length > 0 && (
        <SelectionStrip selection={selection} />
      )}

      {messageBlocks.length === 0 && isStreaming && (
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
          Diskussion startet …
        </div>
      )}

      <div className="flex flex-col gap-7">
        {messageBlocks.map((b, i) => {
          const globalIndex = blocks.indexOf(b);
          const isOpen =
            isStreaming &&
            globalIndex === openBlockIndex &&
            b.kind === "message";
          if (b.kind !== "message") return null;
          return (
            <MessageBubble
              key={`${b.headId}-${i}`}
              headId={b.headId}
              headName={b.headName}
              segment={b.segment}
              color={b.color}
              text={b.text}
              isStreaming={isOpen}
            />
          );
        })}
      </div>

      <Conclusion
        nenner={erkenntnis?.text ?? ""}
        frage={frage?.text ?? ""}
        nennerStreaming={erkenntnisStreaming}
        frageStreaming={frageStreaming}
      />

      <div ref={endRef} />
    </div>
  );
}

function SelectionStrip({ selection }: { selection: SelectionView }) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface/30 p-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
        Aktivierte Köpfe
      </div>
      <ul className="flex flex-wrap gap-2">
        {selection.heads.map((h) => (
          <li
            key={h.id}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-bg/40 px-3 py-1.5 text-xs"
            title={h.reason}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: h.color }}
              aria-hidden
            />
            <span className="font-semibold">{h.id}</span>
            <span className="text-muted">{h.name}</span>
          </li>
        ))}
      </ul>
      {selection.ritsonGate.triggered && selection.ritsonGate.missing_layer && (
        <p className="mt-3 text-xs text-gold/90">
          Gate aktiv · {selection.ritsonGate.missing_layer}
          {selection.ritsonGate.note ? ` — ${selection.ritsonGate.note}` : ""}
        </p>
      )}
    </div>
  );
}
