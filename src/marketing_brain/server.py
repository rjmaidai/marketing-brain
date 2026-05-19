"""FastAPI-Server: stellt das Hirn als Web-Service + Dashboard zur Verfügung.

Startet via `brain serve` (siehe cli.py) oder direkt:
    uvicorn marketing_brain.server:app --reload --port 8000
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from .catalog import SEGMENT_LABELS, load_catalog
from .engine import Engine


# ---------------------------------------------------------------- app & state

app = FastAPI(title="Marketing-Hirn", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


_catalog = load_catalog()
_engine = Engine(catalog=_catalog)


# ---------------------------------------------------------------- schemas


class AskRequest(BaseModel):
    query: str
    force_mock: bool = False     # Default: live wenn Key da ist, sonst Mock


class AskResponse(BaseModel):
    query: str
    mode_used: str               # "mock" | "live"
    routing: dict[str, Any]
    answer: str
    usage: dict[str, Any]
    has_api_key: bool


# ---------------------------------------------------------------- API


@app.get("/api/status")
def status() -> dict[str, Any]:
    return {
        "lobes_loaded": len(_catalog.lobes),
        "segments": list(SEGMENT_LABELS.values()),
        "has_api_key": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "model": _engine.model,
    }


@app.get("/api/lobes")
def list_lobes() -> dict[str, Any]:
    by_segment: dict[str, list[dict]] = {}
    for seg_key, label in SEGMENT_LABELS.items():
        lobes = _catalog.by_segment(seg_key)
        by_segment[label] = [
            {
                "address": l.address,
                "id": l.lobe_id,
                "author": l.author,
                "dna": l.one_sentence_dna,
                "axis": l.axis_position,
                "function": l.function,
            }
            for l in lobes
        ]
    return {"by_segment": by_segment, "total": len(_catalog.lobes)}


@app.get("/api/lobe/{address:path}")
def get_lobe(address: str) -> dict[str, Any]:
    lobe = _catalog.get(address)
    if not lobe:
        raise HTTPException(status_code=404, detail=f"Lobe nicht gefunden: {address}")
    return {
        "address": lobe.address,
        "author": lobe.author,
        "segment": lobe.segment,
        "dna": lobe.one_sentence_dna,
        "axis": lobe.axis_position,
        "function": lobe.function,
        "pitch": lobe.pitch_oneliner,
        "gehirn_regel": lobe.gehirn_regel,
        "sections": [
            {"number": s.number, "title": s.title, "body": s.body}
            for s in sorted(lobe.sections.values(), key=lambda s: tuple(int(p) for p in s.number.split(".")))
        ],
    }


@app.post("/api/ask", response_model=AskResponse)
def ask(req: AskRequest) -> AskResponse:
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Anfrage ist leer.")
    has_key = bool(os.environ.get("ANTHROPIC_API_KEY"))
    use_mock = req.force_mock or not has_key
    try:
        result = _engine.ask(req.query, mock=use_mock)
    except Exception as exc:                       # live-Fehler abfangen → Mock
        fallback = _engine.ask(req.query, mock=True)
        fallback.answer = (
            f"[Live-Modus fehlgeschlagen: {exc}. Hier die Mock-Antwort:]\n\n"
            + fallback.answer
        )
        result = fallback
    return AskResponse(
        query=req.query,
        mode_used=result.mode,
        routing=result.plan.to_dict(),
        answer=result.answer,
        usage=result.usage,
        has_api_key=has_key,
    )


# ---------------------------------------------------------------- static


_WEB_DIR = Path(__file__).resolve().parents[2] / "web"


@app.get("/")
def index() -> FileResponse:
    return FileResponse(_WEB_DIR / "index.html")


@app.get("/favicon.ico")
def favicon():
    return JSONResponse(content={}, status_code=204)
