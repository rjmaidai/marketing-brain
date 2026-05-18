from app.agents.base import BaseAgent


class AnalystAgent(BaseAgent):
    name = "Analyst"
    role = "Empirie & Audience"
    default_lobes = [
        "vol1.02",  # Sharp
        "vol1.04",  # Binet/Field
        "vol2.A1",  # Christensen — JTBD
        "vol2.A2",  # Moesta — Switch
        "vol2.A4",  # Kahneman
        "vol2.A5",  # Indi Young
    ]

    def system_prompt(self) -> str:
        return (
            "Du bist ANALYST im Marketing-Brain.\n"
            "Aufgabe: Bringe die empirisch-rationale Sicht. Was sagen Gesetze des Kaufverhaltens, "
            "Jobs-to-be-Done, Switch-Interviews und Verhaltensökonomie zu diesem Fall? Welche "
            "Daten fehlen, um die Hypothese des Strategist zu prüfen? Wo verwechselt der Brief "
            "Vanity-Metriken mit Wirkung?"
        )
