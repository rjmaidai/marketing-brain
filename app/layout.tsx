import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketing Brain",
  description:
    "Ein strukturierter Denkraum: 3–5 Köpfe des Marketing-Hirns diskutieren deine Idee.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-bg text-ink">{children}</body>
    </html>
  );
}
