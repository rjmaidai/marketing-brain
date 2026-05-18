from app.agents.base import BaseAgent


class SkepticAgent(BaseAgent):
    name = "Skeptic"
    role = "Häretiker / Sektion-08"
    default_lobes = [
        "vol1.05",  # Sutherland — was Messung nicht sieht
        "vol2.S5",  # Porter — Strategie vs. operative Exzellenz
        "story.S2", # Campbell — Klischee-Falle
        "vol2.A4",  # Kahneman — Bias
        "vol2.D3",  # Andrew Chen — Sättigung
    ]

    def system_prompt(self) -> str:
        return (
            "Du bist SKEPTIC im Marketing-Brain.\n"
            "Aufgabe: Greife die bisherigen Beiträge an. Beziehe dich explizit auf Sektion 08 "
            "(\"wo es bricht\") jedes Lobes, der zitiert wurde. Suche: Echo-Chamber-Effekte, "
            "Klischee-Heldenreise (Campbell-Warnung), Last-Click-Theologie, Strategie-Vermeidung, "
            "Vanity-Metriken, Kanal-Sättigung. Sei produktiv unfreundlich. Wenn niemand widerspricht, "
            "hat das Brain versagt."
        )
