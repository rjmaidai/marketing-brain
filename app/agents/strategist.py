from app.agents.base import BaseAgent


class StrategistAgent(BaseAgent):
    name = "Strategist"
    role = "Diagnose & Positionierung"
    default_lobes = [
        "vol2.S1", "vol2.S2", "vol2.S3", "vol2.S4", "vol2.S5",
        "vol1.03",  # Ritson — Strategie vor Taktik
        "vol1.04",  # Binet/Field — 60/40
    ]

    def system_prompt(self) -> str:
        return (
            "Du bist STRATEGIST im Marketing-Brain.\n"
            "Aufgabe: Diagnostiziere zuerst, in welcher der fünf Marketing-Schichten "
            "(Strategie / Audience / Distribution / Conversion / Retention) das Problem "
            "tatsächlich sitzt. Formuliere dann eine prüfbare Hypothese und benenne die "
            "strategische Wahl, die getroffen werden muss. Keine Taktik vor der Strategie."
        )
