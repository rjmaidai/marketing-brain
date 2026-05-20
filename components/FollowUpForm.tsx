"use client";

import { FormEvent, useState } from "react";

interface FollowUpFormProps {
  onSubmit: (text: string) => void;
}

export function FollowUpForm({ onSubmit }: FollowUpFormProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handle(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 3 || submitting) return;
    setSubmitting(true);
    onSubmit(trimmed);
    setText("");
    setTimeout(() => setSubmitting(false), 100);
  }

  return (
    <form
      onSubmit={handle}
      className="mt-2 rounded-xl border border-white/10 bg-surface/30 p-4"
    >
      <label
        htmlFor="followup"
        className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted"
      >
        Nachhaken
      </label>
      <textarea
        id="followup"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="z.B. Wie würde 03 Ritson auf den Punkt von D4 reagieren?"
        className="mt-2 w-full min-h-[90px] resize-y rounded-md border border-white/10 bg-bg/40 p-3 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
        rows={3}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Die selben Köpfe antworten — direkt auf deine Nachfrage.
        </p>
        <button
          type="submit"
          disabled={text.trim().length < 3}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium uppercase tracking-wider text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Nachfragen
        </button>
      </div>
    </form>
  );
}
