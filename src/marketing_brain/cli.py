"""CLI: `brain <command>` — der Eingang ins Hirn."""
from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap
from pathlib import Path

from .catalog import SEGMENT_LABELS, load_catalog
from .engine import Engine
from .router import route


def _add_data_root(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--data-root",
        type=Path,
        default=None,
        help="Pfad zum data/-Verzeichnis (Default: <repo>/data).",
    )


def cmd_list(args) -> int:
    catalog = load_catalog(args.data_root)
    if args.segment:
        lobes = catalog.by_segment(args.segment)
        if not lobes:
            print(f"Segment unbekannt oder leer: {args.segment}", file=sys.stderr)
            return 2
        for lobe in lobes:
            print(f"{lobe.address:24s}  {lobe.author}")
        return 0

    for segment in (
        "social_media", "strategie", "audience", "distribution",
        "conversion", "retention", "storytelling", "crisis", "influencer",
    ):
        lobes = catalog.by_segment(segment)
        if not lobes:
            continue
        print(f"\n{SEGMENT_LABELS[segment].upper()}")
        for lobe in lobes:
            dna = (lobe.one_sentence_dna or "")[:80]
            print(f"  {lobe.address:24s}  {lobe.author:30s}  {dna}")
    print(f"\n→ {len(catalog.lobes)} Lobes geladen.")
    return 0


def cmd_show(args) -> int:
    catalog = load_catalog(args.data_root)
    address = args.address.strip()

    if "." in address.split(":", 1)[-1]:
        lobe, section = catalog.get_section(address)
        if not lobe or not section:
            print(f"Nicht gefunden: {address}", file=sys.stderr)
            return 2
        print(f"\n# {lobe.address}.{section.number} — {section.title}")
        print(f"# (aus {lobe.address} — {lobe.author})\n")
        print(section.body)
        return 0

    lobe = catalog.get(address)
    if not lobe:
        print(f"Lobe nicht gefunden: {address}", file=sys.stderr)
        print(f"\nGültige Adressen: {', '.join(catalog.all_addresses()[:8])}, ...", file=sys.stderr)
        return 2
    print(f"\n# {lobe.address} — {lobe.author}")
    print(f"  Quelle: {lobe.source_path}")
    if lobe.one_sentence_dna:
        print(f"\nEin-Satz-DNA: {lobe.one_sentence_dna}")
    if lobe.axis_position:
        print(f"Achse:        {lobe.axis_position}")
    if lobe.function:
        print(f"Funktion:     {lobe.function}")
    print(f"\nSektionen ({len(lobe.sections)}):")
    for key in sorted(lobe.sections.keys(), key=lambda k: tuple(int(p) for p in k.split('.'))):
        sec = lobe.sections[key]
        print(f"  .{key:<5s}  {sec.title}")
    pitch = lobe.pitch_oneliner
    regel = lobe.gehirn_regel
    if pitch:
        print(f"\nPitch (.11):     „{pitch}\"")
    if regel:
        print(f"Gehirn-Regel (.8): {regel}")
    return 0


def cmd_ask(args) -> int:
    catalog = load_catalog(args.data_root)
    engine = Engine(catalog=catalog, model=args.model, max_tokens=args.max_tokens)

    mock_flag: bool | None
    if args.live:
        mock_flag = False
    elif args.mock:
        mock_flag = True
    else:
        mock_flag = None

    result = engine.ask(args.query, mock=mock_flag)

    if args.json:
        out = {
            "query": result.query,
            "mode": result.mode,
            "plan": result.plan.to_dict(),
            "answer": result.answer,
            "usage": result.usage,
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0

    print(f"╭── Marketing-Hirn — {result.mode.upper()}-Modus")
    print(f"│  Anfrage: {args.query}")
    print(f"│  Routing: {result.plan.mode.value}")
    if result.plan.primary_lobes:
        print(f"│  Aktive Lobes: {', '.join(result.plan.primary_lobes)}")
    if result.plan.skeptic:
        print(f"│  Skeptiker:    {result.plan.skeptic}")
    print("╰──")
    print()
    print(result.answer)
    if result.usage:
        print("\n— Usage —")
        for k, v in result.usage.items():
            print(f"  {k}: {v}")
    if args.show_prompt:
        print("\n— Prompt-Inspection —")
        print("─── system ───")
        print(result.prompt_system)
        print("\n─── lobe-bundle (Vorschau) ───")
        print(result.prompt_lobe_bundle_preview)
        print("\n─── user ───")
        print(result.prompt_user)
    return 0


def cmd_route(args) -> int:
    catalog = load_catalog(args.data_root)
    plan = route(args.query, catalog=catalog)
    if args.json:
        print(json.dumps(plan.to_dict(), ensure_ascii=False, indent=2))
        return 0
    print(f"Anfrage: {args.query}")
    print(f"Modus:   {plan.mode.value}")
    print(f"\nAktive Lobes ({len(plan.primary_lobes)}):")
    for addr in plan.primary_lobes:
        lobe = catalog.get(addr)
        author = f" — {lobe.author}" if lobe else ""
        print(f"  · {addr}{author}")
    if plan.skeptic:
        skeptic = catalog.get(plan.skeptic)
        author = f" — {skeptic.author}" if skeptic else ""
        print(f"\nSkeptiker-Korrektiv: {plan.skeptic}{author}")
    if plan.sequence_notes:
        print(f"\nSequenz-Gates:")
        for note in plan.sequence_notes:
            print(textwrap.fill(f"  · {note}", width=92, subsequent_indent="    "))
    if plan.open_axes:
        print(f"\nOffene Achsen (nicht glätten):")
        for a, b, desc in plan.open_axes:
            print(f"  · {a} ↔ {b}: {desc}")
    if plan.rhyme_partners:
        print(f"\nReim-Brücken:")
        for a, b, axis in plan.rhyme_partners:
            print(f"  · {a} ↔ {b} ({axis})")
    return 0


def cmd_validate(args) -> int:
    catalog = load_catalog(args.data_root)
    problems = catalog.validate()
    if not problems:
        print(f"OK — {len(catalog.lobes)} Lobes vollständig geladen, keine Warnungen.")
        return 0
    print(f"{len(problems)} Hinweis(e):")
    for p in problems:
        print(f"  · {p}")
    # Warnungen sind nicht-fatal
    fatal = [p for p in problems if "FEHLT" in p or "fehlende Sektionen" in p]
    return 1 if fatal else 0


def cmd_rhymes(args) -> int:
    catalog = load_catalog(args.data_root)
    from .catalog import RHYME_AXIS
    if args.address:
        peers = catalog.rhyme_peers(args.address)
        if not peers:
            print(f"Keine Reim-Achse für {args.address} gefunden.", file=sys.stderr)
            return 2
        print(f"Reim-Partner für {args.address}:")
        for axis, members in peers.items():
            print(f"  · {axis}: {', '.join(members)}")
        return 0
    for axis, members in RHYME_AXIS.items():
        print(f"{axis}")
        for m in members:
            lobe = catalog.get(m)
            print(f"  · {m:24s}  {lobe.author if lobe else ''}")
        print()
    return 0


def cmd_serve(args) -> int:
    try:
        import uvicorn
    except ImportError:
        print("Bitte zuerst FastAPI installieren: pip install fastapi uvicorn", file=sys.stderr)
        return 2
    # Import erst hier — damit `brain list/show/...` ohne FastAPI laufen.
    print(f"╭── Marketing-Hirn Dashboard")
    print(f"│  http://{args.host}:{args.port}")
    print(f"│  API-Key gesetzt: {'JA (Live)' if os.environ.get('ANTHROPIC_API_KEY') else 'nein (Mock-Modus)'}")
    print(f"╰──")
    uvicorn.run(
        "marketing_brain.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="brain",
        description="Marketing-Hirn — Reference-First Engine über 45 Lobes / 5 Sub-Hirne.",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="Liste alle 45 Lobes (oder eines Segments).")
    p_list.add_argument("--segment", help="z. B. Strategie, Crisis, Storytelling.")
    _add_data_root(p_list)
    p_list.set_defaults(func=cmd_list)

    p_show = sub.add_parser("show", help="Zeige einen Lobe oder eine Sektion.")
    p_show.add_argument("address", help="z. B. 'Strategie:S1' oder 'Crisis:K3.4.4'.")
    _add_data_root(p_show)
    p_show.set_defaults(func=cmd_show)

    p_ask = sub.add_parser("ask", help="Stelle dem Hirn eine Frage.")
    p_ask.add_argument("query", help="Deine Frage.")
    p_ask.add_argument("--mock", action="store_true", help="Erzwinge Mock-Modus (kein API-Call).")
    p_ask.add_argument("--live", action="store_true", help="Erzwinge Live-Modus (braucht ANTHROPIC_API_KEY).")
    p_ask.add_argument("--model", default="claude-opus-4-7", help="Anthropic-Modell-ID.")
    p_ask.add_argument("--max-tokens", type=int, default=16_000)
    p_ask.add_argument("--json", action="store_true", help="Strukturierte JSON-Ausgabe.")
    p_ask.add_argument("--show-prompt", action="store_true", help="Den vollständigen Prompt anzeigen.")
    _add_data_root(p_ask)
    p_ask.set_defaults(func=cmd_ask)

    p_route = sub.add_parser("route", help="Zeige nur den Routing-Plan zu einer Frage.")
    p_route.add_argument("query")
    p_route.add_argument("--json", action="store_true")
    _add_data_root(p_route)
    p_route.set_defaults(func=cmd_route)

    p_val = sub.add_parser("validate", help="Sanity-Check: alle Lobes vollständig?")
    _add_data_root(p_val)
    p_val.set_defaults(func=cmd_validate)

    p_rh = sub.add_parser("rhymes", help="Zeige die Reim-Achsen über die 4 Hirne.")
    p_rh.add_argument("--address", help="Optional: Reim-Partner eines bestimmten Lobes.")
    _add_data_root(p_rh)
    p_rh.set_defaults(func=cmd_rhymes)

    p_srv = sub.add_parser("serve", help="Starte das Web-Dashboard (FastAPI).")
    p_srv.add_argument("--host", default="0.0.0.0")
    p_srv.add_argument("--port", type=int, default=8000)
    p_srv.add_argument("--reload", action="store_true", help="Auto-Reload bei Code-Änderung.")
    p_srv.set_defaults(func=cmd_serve)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
