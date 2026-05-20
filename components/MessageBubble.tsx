"use client";

import { HeadAvatar } from "./HeadAvatar";

interface MessageBubbleProps {
  headId: string;
  headName: string;
  segment: string;
  color: string;
  text: string;
  isStreaming: boolean;
}

export function MessageBubble({
  headId,
  headName,
  segment,
  color,
  text,
  isStreaming,
}: MessageBubbleProps) {
  return (
    <article className="mb-fadein flex gap-3 sm:gap-4">
      <HeadAvatar
        id={headId}
        name={headName}
        color={color}
        size="md"
        isSpeaking={isStreaming}
      />
      <div className="min-w-0 flex-1">
        <header className="mb-1 flex flex-wrap items-baseline gap-x-2">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color }}
          >
            {headId} · {headName}
          </span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
            {segment}
          </span>
        </header>
        <p
          className={`whitespace-pre-wrap text-[15px] leading-[1.65] text-ink/95 sm:text-base ${
            isStreaming ? "mb-cursor" : ""
          }`}
        >
          {text}
        </p>
      </div>
    </article>
  );
}
