#!/usr/bin/env python3
"""Regénère assets/data/roster.json depuis un CSV "HOME".

Usage:
  python tools/build_roster.py "TUNING ULTRA RUMBLE - HOME.csv"

Ce script ne génère PAS les builds T.U.N.I.N.G (il faut les données détaillées pour ça),
mais il met à jour la liste des personnages/variantes.
"""

from __future__ import annotations
import csv
import json
import re
import sys
import unicodedata
from pathlib import Path
from collections import defaultdict

VARIANT_TOKENS = {"J","R","B","V"}

def slugify(s: str) -> str:
    s = s.strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

def main():
    if len(sys.argv) < 2:
        print("Missing CSV path.")
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"File not found: {csv_path}")
        sys.exit(1)

    # HOME export often contains empty rows/cols. We collect all non-empty cells.
    values = []
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            for cell in row:
                cell = (cell or "").strip()
                if not cell:
                    continue
                values.append(cell)

    # Extract links and names
    urls = [v for v in values if v.startswith("http")]
    names = [v for v in values if not v.startswith("http")]

    parsed = []
    for n in names:
        tokens = n.split()
        variant = None
        base = n.strip()
        if tokens and tokens[-1] in VARIANT_TOKENS:
            variant = tokens[-1]
            base = " ".join(tokens[:-1]).strip()

        parsed.append({
            "label": n.strip(),
            "base": base,
            "variant": variant,
            "base_id": slugify(base),
            "id": slugify(n.strip())
        })

    # Group by base
    order = {None:0,"J":1,"R":2,"B":3,"V":4}
    groups = defaultdict(list)
    for p in parsed:
        groups[p["base_id"]].append(p)

    bases = []
    for base_id, items in sorted(groups.items()):
        items = sorted(items, key=lambda x: (order.get(x["variant"], 99), x["label"]))
        bases.append({
            "id": base_id,
            "name": items[0]["base"],
            "variants": items
        })

    roster = {
        "variantTokens": sorted(list(VARIANT_TOKENS)),
        "variantMeaningNote": "Les lettres J/R/B/V viennent du fichier HOME. Leur signification exacte n’est pas fournie dans ce fichier.",
        "bases": bases,
        "links": {
            "youtube": urls[0] if len(urls) > 0 else "",
            "discord": urls[1] if len(urls) > 1 else "",
        }
    }

    out = Path(__file__).resolve().parent.parent / "assets" / "data" / "roster.json"
    out.write_text(json.dumps(roster, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote: {out}")

if __name__ == "__main__":
    main()
