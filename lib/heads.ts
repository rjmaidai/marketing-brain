import type { Head } from "./types";
import { SEGMENTS } from "./segments";

const c = (segment: keyof typeof SEGMENTS) => SEGMENTS[segment].color;

export const HEADS: Head[] = [
  // STRATEGIE
  {
    id: "S1",
    segment: "Strategie",
    name: "April Dunford",
    axis_position: "Positionierung als Vergleichsrahmen",
    function: "Das Skalpell",
    color: c("Strategie"),
    pitch: "Strategie beginnt mit der Wahl des Vergleichsrahmens",
    core_rule:
      "Bevor wir taktisch denken: gegen wen vergleichen wir uns — und warum genau gegen die? Wer den Vergleichsrahmen wählt, wählt das Ergebnis.",
  },
  {
    id: "S2",
    segment: "Strategie",
    name: "Marty Neumeier",
    axis_position: "Identität durch Verzicht",
    function: "Die Identitäts-Stimme",
    color: c("Strategie"),
    pitch: "Strategie ist Verzicht zugunsten unverwechselbarer Identität",
    core_rule:
      "Wenn die Marke alles sein will, ist sie nichts. Identität entsteht durch das, was wir explizit nicht sind — und das tut weh.",
  },
  {
    id: "S3",
    segment: "Strategie",
    name: "Al Ries & Jack Trout",
    axis_position: "Begriffs-Eigentum im überfüllten Kopf",
    function: "Das Vokabular",
    color: c("Strategie"),
    pitch: "Kampf um einen Begriff im überfüllten Kopf",
    core_rule:
      "Welchen einen Begriff besetzen wir im Kopf der Audience? Wer keinen Begriff hat, hat keine Position — und wer zwei besetzen will, besetzt keinen.",
  },
  {
    id: "S4",
    segment: "Strategie",
    name: "Roger Martin",
    axis_position: "Kohärente Entscheidungs-Kaskade",
    function: "Die System-Stimme",
    color: c("Strategie"),
    pitch: "Strategie = kohärente Kaskade verbundener Entscheidungen",
    core_rule:
      "Where to play, how to win, what capabilities, what management systems — und alle Antworten müssen sich gegenseitig verstärken, sonst ist es keine Strategie sondern Wunschdenken.",
  },
  {
    id: "S5",
    segment: "Strategie",
    name: "Michael Porter",
    axis_position: "Struktureller Trade-off",
    function: "Die strukturelle Schwerkraft",
    color: c("Strategie"),
    pitch: "Strategie = struktureller Verzicht / Trade-off",
    core_rule:
      "Wenn es keinen Trade-off gibt, ist es Operational Effectiveness, nicht Strategie. Was tun wir bewusst NICHT — und welche Aktivitäten stützen sich gegenseitig?",
  },

  // AUDIENCE
  {
    id: "A1",
    segment: "Audience",
    name: "Clayton Christensen",
    axis_position: "Jobs-to-be-Done",
    function: "Methodische Wurzel",
    color: c("Audience"),
    pitch: "Versteh den Job, nicht die Person",
    core_rule:
      "Menschen heuern Produkte für einen Job an. Demografie ist Lärm — der Job ist das Signal. Was wird gefeuert, was wird angeheuert, in welchem Kontext?",
  },
  {
    id: "A2",
    segment: "Audience",
    name: "Bob Moesta",
    axis_position: "Switch-Interview / Wechselgeschichte",
    function: "Die operative Hand",
    color: c("Audience"),
    pitch: "Hör auf die Wechselgeschichte",
    core_rule:
      "Der Moment des Wechsels enthält die ganze Wahrheit: Was war der Auslöser, welche Kräfte ziehen, welche halten zurück? Frag nach der Geschichte, nicht nach der Meinung.",
  },
  {
    id: "A3",
    segment: "Audience",
    name: "Robert Cialdini",
    axis_position: "Kognitive Hebel",
    function: "Der Hebel-Werkzeugkasten",
    color: c("Audience"),
    pitch: "Versteh die kognitiven Abkürzungen",
    core_rule:
      "Reziprozität, Knappheit, Autorität, Konsistenz, Sympathie, Sozialer Beweis, Einheit — welche Hebel sind im Kontext ethisch und passend, welche nicht?",
  },
  {
    id: "A4",
    segment: "Audience",
    name: "Daniel Kahneman",
    axis_position: "System 1 / System 2",
    function: "Die kognitive Architektur",
    color: c("Audience"),
    pitch: "Versteh die zwei Systeme",
    core_rule:
      "Sprechen wir zu System 1 (schnell, intuitiv, framing-empfindlich) oder System 2 (analytisch, vergleichend)? Die meisten Marketing-Fehler sind System-Verwechslungen.",
  },
  {
    id: "A5",
    segment: "Audience",
    name: "Indi Young",
    axis_position: "Tiefes Zuhören / Thinking Styles",
    function: "Die empathische Tiefe",
    color: c("Audience"),
    pitch: "Hör so tief, bis die Denkweise sichtbar wird",
    core_rule:
      "Nicht 'was kauft die Persona' — sondern 'wie denkt dieser Mensch über das Problem, wenn niemand zuschaut'. Persona-Schablonen verdecken, Listening Sessions öffnen.",
  },

  // DISTRIBUTION
  {
    id: "D1",
    segment: "Distribution",
    name: "Seth Godin",
    axis_position: "Permission / Kleinste lebensfähige Audience",
    function: "Kulturphilosophische Stimme",
    color: c("Distribution"),
    pitch: "Erlaubnis, Eigenwilligkeit, kleinste lebensfähige Audience",
    core_rule:
      "Nicht für alle, für genau die — und sie wartet auf etwas, das du nur sagen kannst, wenn du eigenwillig bist. Erlaubnis ist das Asset, nicht Aufmerksamkeit.",
  },
  {
    id: "D2",
    segment: "Distribution",
    name: "Brian Balfour",
    axis_position: "Four Fits",
    function: "System-Stimme",
    color: c("Distribution"),
    pitch: "Systemische Fit-Kaskaden statt Hacks",
    core_rule:
      "Market–Product, Product–Channel, Channel–Model, Model–Market — die vier Fits müssen kohärent sein, sonst skaliert nichts. Einzelne Hacks sind Symptombehandlung.",
  },
  {
    id: "D3",
    segment: "Distribution",
    name: "Andrew Chen",
    axis_position: "Atomic Networks / Cold Start",
    function: "Netzwerk-Mechanik-Stimme",
    color: c("Distribution"),
    pitch: "Netzwerk-Effekte und atomare Netzwerke",
    core_rule:
      "Welches atomare Netzwerk muss zuerst geschlossen werden, damit der Effekt überhaupt zündet? Cold-Start ist eine geographisch/sozial enge Frage, keine globale.",
  },
  {
    id: "D4",
    segment: "Distribution",
    name: "Sean Ellis",
    axis_position: "PMF-Score (40%)",
    function: "PMF-Vorbedingung",
    color: c("Distribution"),
    pitch: "Distribution beginnt NACH Product-Market-Fit",
    core_rule:
      "Wenn weniger als 40% der Nutzer 'sehr enttäuscht' wären, ist es kein PMF — und alle Distributions-Hebel verbrennen Budget. Erst messen, dann skalieren.",
  },
  {
    id: "D5",
    segment: "Distribution",
    name: "Jonah Berger",
    axis_position: "STEPPS / Konstruierte Viralität",
    function: "Viralitäts-Psychologie",
    color: c("Distribution"),
    pitch: "Weitererzählen ist psychologisch konstruierbar",
    core_rule:
      "Social Currency, Triggers, Emotion, Public, Practical Value, Stories — welche Hebel sind in dieser Idee strukturell angelegt, welche fehlen, welche kann man bewusst einbauen?",
  },

  // CONVERSION
  {
    id: "C1",
    segment: "Conversion",
    name: "Eugene Schwartz",
    axis_position: "Awareness-Stadien",
    function: "Bewusstseins-Diagnostik",
    color: c("Conversion"),
    pitch: "Richtiges Bewusstseinsstadium zuerst",
    core_rule:
      "Unaware, Problem-Aware, Solution-Aware, Product-Aware, Most-Aware — Botschaft, Länge und Hook müssen zum Stadium passen. Wer zur falschen Stufe spricht, konvertiert nicht.",
  },
  {
    id: "C2",
    segment: "Conversion",
    name: "Gary Halbert",
    axis_position: "Starving Crowd",
    function: "Emotional-praktische Stimme",
    color: c("Conversion"),
    pitch: "Hungrige Audience zuerst",
    core_rule:
      "Das beste Asset ist nicht das Produkt — es ist die hungrige Audience. Wenn der Hunger fehlt, hilft auch der beste Copy nicht. Such den Hunger, dann liefere.",
  },
  {
    id: "C3",
    segment: "Conversion",
    name: "David Ogilvy",
    axis_position: "Conversion durch Brand",
    function: "Integrierte Eleganz-Stimme",
    color: c("Conversion"),
    pitch: "Conversion UND Brand gleichzeitig",
    core_rule:
      "Verkauf ohne Marke ist Verbrauch der Zukunft. Eleganz, Respekt vor der Audience, Fakten in schöner Form — Conversion und Brand sind kein Trade-off, wenn man es richtig macht.",
  },
  {
    id: "C4",
    segment: "Conversion",
    name: "Alex Hormozi",
    axis_position: "Grand Slam Offer",
    function: "Modernes Offer-Engineering",
    color: c("Conversion"),
    pitch: "Unwiderstehliches Angebot zuerst",
    core_rule:
      "Dream Outcome × Perceived Likelihood / (Time Delay × Effort & Sacrifice). Die Conversion liegt fast immer im Angebot, nicht im Copy. Mach das Nein teuer.",
  },
  {
    id: "C5",
    segment: "Conversion",
    name: "Russell Brunson",
    axis_position: "Funnel-Sequenz",
    function: "Funnel-Architektur-Stimme",
    color: c("Conversion"),
    pitch: "Sequentielle Funnel-Architektur",
    core_rule:
      "Traffic, Lead, Sale, Ascension — jede Stufe hat einen Job. Wenn eine Stufe einen Job aus einer anderen Stufe erledigen soll, bricht der Funnel.",
  },

  // RETENTION
  {
    id: "R1",
    segment: "Retention",
    name: "Fred Reichheld",
    axis_position: "NPS / Loyalitäts-Ökonomie",
    function: "Quantitative Mess-Disziplin",
    color: c("Retention"),
    pitch: "Loyalität ist die berechenbarste Ertragsquelle",
    core_rule:
      "Wer empfiehlt, hat geprüft. NPS ist kein Score, sondern ein System: Promoters vermehren, Detraktoren diagnostizieren. Retention ist messbar — wer nicht misst, verliert sie.",
  },
  {
    id: "R2",
    segment: "Retention",
    name: "Joey Coleman",
    axis_position: "Erste 100 Tage",
    function: "Operative Onboarding-Stimme",
    color: c("Retention"),
    pitch: "Retention beginnt in den ersten 100 Tagen",
    core_rule:
      "Acht emotionale Phasen vom Kauf bis Loyalität. Wer das Onboarding-Fenster verpasst, kauft Retention später zurück — meist teurer.",
  },
  {
    id: "R3",
    segment: "Retention",
    name: "Kevin Kelly",
    axis_position: "1000 True Fans",
    function: "Kulturphilosophische Stimme",
    color: c("Retention"),
    pitch: "Retention ist kulturelle Tiefe, nicht Breite",
    core_rule:
      "1000 wahre Fans tragen ein Lebenswerk. Tiefe ist ein anderes Geschäftsmodell als Breite — und beides gleichzeitig zerstört beides.",
  },
  {
    id: "R4",
    segment: "Retention",
    name: "Nir Eyal",
    axis_position: "Hook-Modell",
    function: "Habit-Mechanik-Stimme",
    color: c("Retention"),
    pitch: "Retention entsteht durch Gewohnheits-Schleifen",
    core_rule:
      "Trigger → Action → Variable Reward → Investment. Wo ist die Schleife, wo ist die Investment-Stufe — und ist sie ethisch gebaut oder ausbeuterisch?",
  },
  {
    id: "R5",
    segment: "Retention",
    name: "Pat Flynn",
    axis_position: "Fan-Eskalations-Treppe",
    function: "Operative Community-Stimme",
    color: c("Retention"),
    pitch: "Retention ist systematische Fan-Eskalation",
    core_rule:
      "Casual → Active → Connected → Super → Smart Passive: jede Stufe hat ein anderes Signal und einen anderen nächsten Schritt. Behandle nicht alle gleich.",
  },

  // SOCIAL MEDIA / VOL. 1 (Mess-Achse)
  {
    id: "01",
    segment: "Social Media",
    name: "Gary Vaynerchuk",
    axis_position: "Aufmerksamkeits-Arbitrage",
    function: "Miss gar nicht / miss später",
    color: c("Social Media"),
    pitch: "Miss gar nicht / miss später",
    core_rule:
      "Volumen schlagen Perfektion: Wo ist gerade unterbewertete Aufmerksamkeit, und wie produziert man dort radikal mehr Reps, bevor man optimiert?",
  },
  {
    id: "02",
    segment: "Social Media",
    name: "Byron Sharp",
    axis_position: "Empirische Gesetze (Ehrenberg-Bass)",
    function: "Empirie durch Aggregation",
    color: c("Social Media"),
    pitch: "Miss die richtigen Gesetze",
    core_rule:
      "Reichweite, mentale & physische Verfügbarkeit, Double Jeopardy — Wachstum kommt aus light buyers, nicht loyalty programs. Miss das, was wirklich Wachstum erklärt.",
  },
  {
    id: "03",
    segment: "Social Media",
    name: "Mark Ritson",
    axis_position: "Strategie vor Taktik",
    function: "Hygiene-Instanz",
    color: c("Social Media"),
    pitch: "Miss erst, wenn du eine Strategie hast",
    core_rule:
      "Diagnose → Strategie → Taktik. Wer ohne Strategie misst, optimiert ins Nichts. Die Frage hinter der Frage zuerst.",
  },
  {
    id: "04",
    segment: "Social Media",
    name: "Binet & Field",
    axis_position: "60/40 Long/Short",
    function: "Quantifizierer",
    color: c("Social Media"),
    pitch: "Miss über die richtige Zeitspanne",
    core_rule:
      "Kurzfrist-Aktivierung und Langfrist-Brand brauchen unterschiedliche KPIs und Zeitfenster. Wer nur Quartal misst, baut keine Marke.",
  },
  {
    id: "05",
    segment: "Social Media",
    name: "Rory Sutherland",
    axis_position: "Psycho-logik / das Nicht-Messbare",
    function: "Limbisches System (Skeptiker-Korrektiv, zuletzt)",
    color: c("Social Media"),
    pitch: "Miss, aber wisse was deine Messung nicht sieht",
    core_rule:
      "Das, was wir messen können, ist selten das, was zählt. Frame, Wahrnehmung, Kontext bewegen mehr als Logik — und sind oft unsichtbar in den KPIs.",
  },

  // STORYTELLING
  {
    id: "ST1",
    segment: "Storytelling",
    name: "Robert McKee",
    axis_position: "Form / Story-Struktur",
    function: "Das Rückgrat",
    color: c("Storytelling"),
    pitch: "Haftung durch Form",
    core_rule:
      "Inciting Incident, progressives Komplizierter-Werden, Krise, Klimax, Auflösung. Ohne Form ist Inhalt nur Information — und Information klebt nicht.",
  },
  {
    id: "ST2",
    segment: "Storytelling",
    name: "Joseph Campbell",
    axis_position: "Archetyp / Heldenreise",
    function: "Häretiker-Lobe",
    color: c("Storytelling"),
    pitch: "Haftung durch Archetyp",
    core_rule:
      "Der Kunde ist der Held, die Marke ist der Mentor. Welche Stufe der Reise ist gerade dran — und sprechen wir wirklich aus Mentor-Position oder spielen wir Held?",
  },
  {
    id: "ST3",
    segment: "Storytelling",
    name: "Kurt Vonnegut",
    axis_position: "Gefühlskurve / Stimme",
    function: "Die Seele",
    color: c("Storytelling"),
    pitch: "Haftung durch Gefühlsform & Stimme",
    core_rule:
      "Jede Geschichte hat eine Kurve aus Glück/Unglück. Welche Kurve fahren wir, und in welcher Stimme — und ist die Stimme menschlich oder Corporate-Lärm?",
  },
  {
    id: "ST4",
    segment: "Storytelling",
    name: "Chip & Dan Heath",
    axis_position: "SUCCESs / Klebrigkeit",
    function: "Gedächtnis-Ingenieur",
    color: c("Storytelling"),
    pitch: "Haftung durch Klebrigkeit",
    core_rule:
      "Simple, Unexpected, Concrete, Credible, Emotional, Story. Was an unserer Botschaft ist konkret, was unerwartet — und woran erinnert man sich morgen früh?",
  },
  {
    id: "ST5",
    segment: "Storytelling",
    name: "Will Storr",
    axis_position: "Defekt des Selbst",
    function: "Limbisches System & Integrator",
    color: c("Storytelling"),
    pitch: "Haftung durch den Defekt des Selbst",
    core_rule:
      "Geschichten greifen, weil sie den Defekt des Selbst berühren — die Lücke zwischen dem, wer ich bin, und wer ich sein will. Welcher Defekt ist hier im Spiel?",
  },

  // KRISE
  {
    id: "K1",
    segment: "Krise",
    name: "James Lukaszewski",
    axis_position: "Diagnose parallel zur Kommunikation",
    function: "Krisen-Diagnostiker",
    color: c("Krise"),
    pitch: "Diagnose parallel zur Kommunikation",
    core_rule:
      "Victims first, Opfer, Lessons, Vorgehen. Wer kommuniziert, ohne parallel zu diagnostizieren, baut Lügen-Risiko auf — und Lügen-Risiko ist die teuerste Position der Krise.",
  },
  {
    id: "K2",
    segment: "Krise",
    name: "Timothy Coombs",
    axis_position: "SCCT / Verantwortlichkeits-Matrix",
    function: "Situative Krisen-Kommunikation",
    color: c("Krise"),
    pitch: "Zugwahl nach Verantwortlichkeit",
    core_rule:
      "Opfer-, Unfall- oder Vorsatz-Cluster? Verantwortlichkeitsgrad bestimmt Strategie: Leugnen, Mindern, Wiederherstellen, Stützen. Falscher Cluster = falsche Worte.",
  },
  {
    id: "K3",
    segment: "Krise",
    name: "Lanny Davis",
    axis_position: "Tell it all, tell it early, tell it yourself",
    function: "First-Mover-Instanz",
    color: c("Krise"),
    pitch: "Schutzinformation zuerst, immer",
    core_rule:
      "Erst die Wahrheit, früh und selbst. Wer wartet, lässt anderen die Deutungshoheit — und Deutungshoheit zurückzukaufen ist meist unmöglich.",
  },
  {
    id: "K4",
    segment: "Krise",
    name: "Matthew Seeger",
    axis_position: "Ethik / Stakeholder-Dimension",
    function: "Ethik-Kompass",
    color: c("Krise"),
    pitch: "Zieldimension vor Botschaft",
    core_rule:
      "Für wen kommunizieren wir, mit welcher ethischen Verpflichtung? Effektive Krisenkommunikation, die ethisch leer ist, beschädigt langfristig mehr als die Krise selbst.",
  },
  {
    id: "K5",
    segment: "Krise",
    name: "Eric Dezenhall",
    axis_position: "Reflex-Audit (zuletzt)",
    function: "Skeptiker-Bremse",
    color: c("Krise"),
    pitch: "Reflex-Audit zuletzt",
    core_rule:
      "Manche Krisen verlangen Stille, manche Angriff, manche keine PR-Reaktion. Prüfe zuletzt den Reflex 'sofort reagieren' — er ist oft falsch.",
  },

  // INFLUENCER
  {
    id: "I1",
    segment: "Influencer",
    name: "Mark Schaefer",
    axis_position: "Ziel des Einsatzes",
    function: "Ziel-Instanz",
    color: c("Influencer"),
    pitch: "Ziel des Influencer-Einsatzes klären",
    core_rule:
      "Reichweite, Vertrauen, Konversion, Content? Ohne Ziel keine Auswahl — und kein KPI. Die meisten Influencer-Programme scheitern an unklaren Zielen, nicht an Creators.",
  },
  {
    id: "I2",
    segment: "Influencer",
    name: "Rand Fishkin",
    axis_position: "Seele des Creators",
    function: "Authentizitäts-Wächter",
    color: c("Influencer"),
    pitch: "Seele des Creators respektieren",
    core_rule:
      "Wenn der Creator gegen seine eigene Stimme spricht, verliert die Audience — und die Marke gleich mit. Brief so eng wie nötig, so weit wie möglich.",
  },
  {
    id: "I3",
    segment: "Influencer",
    name: "Joe Pulizzi",
    axis_position: "Content-Ballast eliminieren",
    function: "Content-Stratege",
    color: c("Influencer"),
    pitch: "Ballast eliminieren",
    core_rule:
      "Welches Content-Thema besetzt der Creator wirklich? Wer nicht in einer Nische ein Inhalts-Asset baut, mietet nur kurz Aufmerksamkeit.",
  },
  {
    id: "I4",
    segment: "Influencer",
    name: "Gary Vaynerchuk (Influencer)",
    axis_position: "Zeit als Asset",
    function: "Timing-Instanz",
    color: c("Influencer"),
    pitch: "Zeit als Asset",
    core_rule:
      "Wann ist die Plattform unterbewertet, wann der Creator hungrig? Timing entscheidet über Kosten und Wirkung mehr als das Briefing.",
  },
  {
    id: "I5",
    segment: "Influencer",
    name: "Tom Webster",
    axis_position: "Owned vs Rented Media (zuletzt)",
    function: "Asset-Achse (immer zuletzt)",
    color: c("Influencer"),
    pitch: "Owned vs. Rented Media",
    core_rule:
      "Influencer ist gemietete Reichweite. Welcher Teil dieser Reichweite wird zu Owned konvertiert — sonst verschwindet sie, sobald das Budget endet.",
  },

  // SCHWEIZER PERSPEKTIVE (Denk-Werkzeuge, keine Biografie)
  {
    id: "CH1",
    segment: "Strategie",
    name: "Dominique von Matt",
    axis_position: "Marke als Ausgangspunkt der Idee",
    function: "Marken-Kreativität (CH)",
    color: c("Strategie"),
    pitch: "Kreativität wirkt nur aus dem Markenkern heraus",
    core_rule:
      "Eine Idee, die nicht aus dem Markenkern wächst, ist nur Lärm mit Budget. Zuerst die Frage: wofür steht die Marke unverwechselbar — dann die mutige Umsetzung, nie umgekehrt.",
  },
  {
    id: "CH2",
    segment: "Audience",
    name: "Ernst Fehr",
    axis_position: "Verhaltensökonomie / Fairness & Reziprozität",
    function: "Verhaltens-Ökonom (CH)",
    color: c("Audience"),
    pitch: "Fairness und Reziprozität steuern Verhalten stärker als Eigennutz",
    core_rule:
      "Menschen handeln reziprok und bestrafen Unfairness auch gegen den eigenen Vorteil. Wo verletzt oder belohnt das Angebot das Fairness-Empfinden — und was löst das an Verhalten aus?",
  },
  {
    id: "CH3",
    segment: "Distribution",
    name: "Roger Schawinski",
    axis_position: "Kanal-Pionier / frühe Besetzung",
    function: "Medien-Pionier (CH)",
    color: c("Distribution"),
    pitch: "Besetze einen Kanal, bevor er seriös wird",
    core_rule:
      "Der grösste Hebel ist ein Kanal, den noch niemand ernst nimmt, direkt und ohne Umweg bespielt. Wer wartet, bis der Kanal etabliert ist, zahlt den Aufpreis der Späten.",
  },
  {
    id: "CH4",
    segment: "Conversion",
    name: "Christian Belz",
    axis_position: "St. Galler Leistungs-Konsequenz",
    function: "Leistung statt Lärm (CH)",
    color: c("Conversion"),
    pitch: "Konversion entsteht aus echter Kundenleistung",
    core_rule:
      "Nicht die Kampagne konvertiert, sondern der spürbare Nutzen dahinter. Wo ist die reale Leistung für den Kunden — oder optimieren wir gerade nur die Verpackung eines schwachen Kerns?",
  },
  {
    id: "CH5",
    segment: "Storytelling",
    name: "Frank Bodin",
    axis_position: "Klarheit und Haltung / Reduktion",
    function: "Klarheits-Stimme (CH)",
    color: c("Storytelling"),
    pitch: "Klarheit ist Respekt vor dem Publikum",
    core_rule:
      "Weglassen, bis nur die eine Sache bleibt, die zählt — und sie mit Haltung sagen. Wer alles sagt, sagt nichts; unklare Kommunikation ist Respektlosigkeit gegenüber der Zeit der Anderen.",
  },
  {
    id: "CH6",
    segment: "Social Media",
    name: "Miriam Meckel",
    axis_position: "Digitale Öffentlichkeit / Aufmerksamkeits-Ethik",
    function: "Digitale Öffentlichkeit (CH)",
    color: c("Social Media"),
    pitch: "Aufmerksamkeit ist knapp, Vertrauen ist die Währung",
    core_rule:
      "In der digitalen Öffentlichkeit ist Aufmerksamkeit billig und Vertrauen teuer. Was kurzfristig Reichweite gewinnt, kann langfristig die Glaubwürdigkeit beschädigen — und wer trägt dafür die Verantwortung?",
  },
];

export function getHead(id: string): Head | undefined {
  return HEADS.find((h) => h.id === id);
}

export function headsBySegment() {
  const out: Record<string, Head[]> = {};
  for (const h of HEADS) {
    out[h.segment] ??= [];
    out[h.segment].push(h);
  }
  return out;
}
