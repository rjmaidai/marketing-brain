"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseStream } from "@/lib/parser";
import { MessageBubble } from "./MessageBubble";
import { Conclusion } from "./Conclusion";
import { FollowUpForm } from "./FollowUpForm";
import { HeadAvatar } from "./HeadAvatar";

export interface Round {
  userText: string;
  buffer: string;
  kind: "initial" | "followUp";
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

interface DiscussionProps {
  rounds: Round[];
  isStreaming: boolean;
  isSelecting: boolean;
  selection: SelectionView | null;
  error: string | null;
  canFollowUp: boolean;
  onFollowUp: (text: string) => void;
}

export function Discussion({
  rounds,
  isStreaming,
  isSelecting,
  selection,
  error,
  canFollowUp,
  onFollowUp,
}: DiscussionProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [rounds, isStreaming, isSelecting, canFollowUp]);

  const activeHeadId = useMemo(() => {
    if (!isStreaming || rounds.length === 0) return null;
    const last = rounds[rounds.length - 1];
    const { blocks, openBlockIndex } = parseStream(last.buffer);
    const lastBlock = blocks[openBlockIndex];
    if (lastBlock?.kind === "message") return lastBlock.headId;
    return null;
  }, [rounds, isStreaming]);

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

  if (rounds.length === 0 && !selection) {
    return null;
  }

  const lastRoundIndex = rounds.length - 1;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {selection && selection.heads.length > 0 && (
        <HeadGallery selection={selection} activeId={activeHeadId} />
      )}

      {rounds.map((round, idx) => (
        <RoundView
          key={idx}
          round={round}
          isLast={idx === lastRoundIndex}
          isStreaming={isStreaming && idx === lastRoundIndex}
        />
      ))}

      {canFollowUp && rounds.length > 0 && (
        <FollowUpForm onSubmit={onFollowUp} />
      )}

      <div ref={endRef} />
    </div>
  );
}

function RoundView({
  round,
  isLast,
  isStreaming,
}: {
  round: Round;
  isLast: boolean;
  isStreaming: boolean;
}) {
  const { blocks, openBlockIndex } = parseStream(round.buffer);
  const messageBlocks = blocks.filter((b) => b.kind === "message");
  const erkenntnis = blocks.find((b) => b.kind === "erkenntnis");
  const frage = blocks.find((b) => b.kind === "frage");

  const lastBlock = blocks[openBlockIndex];
  const erkenntnisStreaming = isStreaming && lastBlock?.kind === "erkenntnis";
  const frageStreaming = isStreaming && lastBlock?.kind === "frage";

  return (
    <div className="flex flex-col gap-6">
      {round.kind === "followUp" && (
        <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm leading-relaxed text-ink/90">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            Deine Nachfrage
          </div>
          <p className="whitespace-pre-wrap">{round.userText}</p>
        </div>
      )}

      {messageBlocks.length === 0 && isStreaming && isLast && (
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
          {round.kind === "initial"
            ? "Diskussion startet …"
            : "Köpfe antworten …"}
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
    </div>
  );
}

function HeadGallery({
  selection,
  activeId,
}: {
  selection: SelectionView;
  activeId: string | null;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface/30 p-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
        Aktivierte Köpfe
      </div>
      <ul className="flex flex-wrap items-end gap-x-4 gap-y-4">
        {selection.heads.map((h) => {
          const isSpeaking = activeId === h.id;
          const isMuted = !!activeId && !isSpeaking;
          return (
            <li
              key={h.id}
              className="flex w-16 flex-col items-center text-center"
              title={h.reason}
            >
              <HeadAvatar
                id={h.id}
                name={h.name}
                color={h.color}
                size={isSpeaking ? "lg" : "md"}
                isSpeaking={isSpeaking}
                isMuted={isMuted}
              />
              <span
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: h.color }}
              >
                {h.id}
              </span>
              <span className="text-[10px] leading-tight text-muted line-clamp-2">
                {h.name}
              </span>
            </li>
          );
        })}
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
