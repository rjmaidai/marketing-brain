import type { Segment, SegmentId } from "./types";

export const SEGMENTS: Record<SegmentId, Segment> = {
  Strategie: {
    id: "Strategie",
    color: "#2A5C8A",
    description: "Wahl des Vergleichsrahmens, Verzicht, kohärente Kaskade.",
  },
  Audience: {
    id: "Audience",
    color: "#2A7A4B",
    description: "Job-to-be-done, Wechselgeschichte, kognitive Architektur.",
  },
  Distribution: {
    id: "Distribution",
    color: "#7A4B2A",
    description: "Erlaubnis, Fit-Kaskaden, Netzwerk-Effekte, PMF-Vorbedingung.",
  },
  Conversion: {
    id: "Conversion",
    color: "#8A2A4B",
    description: "Bewusstseinsstadium, Angebot, Funnel-Architektur.",
  },
  Retention: {
    id: "Retention",
    color: "#4B2A8A",
    description: "Loyalität, Onboarding, Gewohnheits-Schleifen, Community.",
  },
  "Social Media": {
    id: "Social Media",
    color: "#2A8A7A",
    description: "Was, wann, warum messen — und was Messung nicht sieht.",
  },
  Storytelling: {
    id: "Storytelling",
    color: "#8A6B2A",
    description: "Form, Archetyp, Stimme, Klebrigkeit, Defekt des Selbst.",
  },
  Krise: {
    id: "Krise",
    color: "#5A5A5A",
    description: "Diagnose, Verantwortlichkeit, Schutzinformation, Ethik, Reflex-Audit.",
  },
  Influencer: {
    id: "Influencer",
    color: "#8A2A8A",
    description: "Ziel, Seele, Ballast, Timing, Owned vs Rented.",
  },
};

export function segmentColor(id: SegmentId): string {
  return SEGMENTS[id].color;
}
