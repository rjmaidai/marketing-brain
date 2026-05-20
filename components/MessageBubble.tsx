"use client";

interface MessageBubbleProps {
  headId: string;
  headName: string;
  segment: string;
  color: string;
  text: string;
  isStreaming: boolean;
}

function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-ink shadow-md sm:h-11 sm:w-11"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 0 1px ${color}66, 0 4px 16px -8px ${color}`,
        }}
        aria-hidden
      >
        {initials(headName) || headId}
      </div>
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
