"use client";

import { FormEvent, useState } from "react";

interface InputFormProps {
  isLoading: boolean;
  onSubmit: (idea: string) => void;
  onReset: () => void;
  hasResult: boolean;
}

export function InputForm({
  isLoading,
  onSubmit,
  onReset,
  hasResult,
}: InputFormProps) {
  const [idea, setIdea] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = idea.trim();
    if (trimmed.length < 8 || isLoading) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="idea" className="sr-only">
        Beschreibe deine Idee oder dein Problem
      </label>
      <textarea
        id="idea"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        disabled={isLoading}
        placeholder="z.B. Ich möchte eine neue App für Eltern launchen, die …"
        className="w-full min-h-[140px] resize-y rounded-xl border border-white/10 bg-surface/40 p-4 text-base leading-relaxed text-ink placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 disabled:opacity-60"
        rows={5}
      />
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          1–3 Sätze reichen. Je konkreter, desto schärfer die Diskussion.
        </p>
        <div className="flex items-center gap-2">
          {hasResult && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setIdea("");
                onReset();
              }}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-muted transition hover:border-white/20 hover:text-ink"
            >
              Neu starten
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || idea.trim().length < 8}
            className="rounded-md bg-gold px-4 py-2 text-sm font-medium uppercase tracking-wider text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Köpfe denken …" : "Lass die Köpfe schreiben"}
          </button>
        </div>
      </div>
    </form>
  );
}
