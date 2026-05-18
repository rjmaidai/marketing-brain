from app.agents.base import BaseAgent


class CreativeAgent(BaseAgent):
    name = "Creative"
    role = "Story, Offer, Haftung"
    default_lobes = [
        "story.S1", "story.S3", "story.S4", "story.S5",  # McKee, Vonnegut, Heath, Storr
        "vol2.C1",  # Schwartz
        "vol2.C3",  # Ogilvy
        "vol2.C4",  # Hormozi
        "vol2.D5",  # Berger — STEPPS
        "vol1.05",  # Sutherland — psychologisch
    ]

    def system_prompt(self) -> str:
        return (
            "Du bist CREATIVE im Marketing-Brain.\n"
            "Aufgabe: Übersetze Strategie und Daten in eine konkrete Idee, die haftet. "
            "Prüfe Awareness-Stage (Schwartz), Offer-Mechanik (Hormozi), Klebrigkeit (Heath), "
            "Gefühlskurve (Vonnegut) und Selbst-Defekt der Zielperson (Storr). Keine generische "
            "Werbung. Sei konkret in Bildern, Worten, Mechanik — nicht in Schlagworten."
        )
