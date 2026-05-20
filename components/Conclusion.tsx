"use client";

interface ConclusionProps {
  nenner: string;
  frage: string;
  nennerStreaming: boolean;
  frageStreaming: boolean;
}

export function Conclusion({
  nenner,
  frage,
  nennerStreaming,
  frageStreaming,
}: ConclusionProps) {
  if (!nenner && !frage) return null;

  return (
    <section className="mb-fadein mt-10 overflow-hidden rounded-2xl border border-gold/30 bg-surface/40 shadow-[0_8px_40px_-20px_rgba(201,168,76,0.5)]">
      {nenner && (
        <div className="border-b border-white/5 px-5 py-5 sm:px-7 sm:py-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            Der Nenner
          </h3>
          <p
            className={`mt-3 whitespace-pre-wrap text-[17px] leading-[1.6] text-ink sm:text-[18px] ${
              nennerStreaming ? "mb-cursor" : ""
            }`}
          >
            {nenner}
          </p>
        </div>
      )}
      {frage && (
        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            Die offene Frage
          </h3>
          <p
            className={`mt-3 whitespace-pre-wrap text-[17px] leading-[1.55] text-ink sm:text-[18px] ${
              frageStreaming ? "mb-cursor" : ""
            }`}
          >
            {frage}
          </p>
        </div>
      )}
    </section>
  );
}
