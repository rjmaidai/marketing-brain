import Link from "next/link";
import { VideoAdvisor } from "@/components/VideoAdvisor";

export const metadata = {
  title: "Marketing Brain — Video-Berater",
  description:
    "Ein Echtzeit-Videoberater, hinter dem 45 Marketing-Köpfe urteilen. Schildern Sie Ihr Anliegen, hören Sie eine klare Empfehlung.",
};

export default function BeraterPage() {
  return (
    <main className="min-h-screen px-4 py-10 max-w-6xl mx-auto flex flex-col">
      <header className="mb-8 text-center">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-gold opacity-70">
          Marketing Brain — Video-Berater
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
          Ihr Marketing-Berater. Live.
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted">
          Schildern Sie Ihr Anliegen — per Sprache oder Text. Hinter dem
          Berater urteilen 45 Marketing-Köpfe. Sie bekommen kein Gremiums-Wirrwarr,
          sondern eine klare, souveräne Empfehlung — und die eine Frage, die Sie
          selbst beantworten müssen.
        </p>
      </header>

      <VideoAdvisor />

      <footer className="mt-12 flex items-center justify-center gap-4 pt-8 text-[11px] uppercase tracking-[0.18em] text-muted">
        <Link href="/" className="transition hover:text-ink">
          ← Zum Gremium (45 Köpfe im Streit)
        </Link>
      </footer>
    </main>
  );
}
