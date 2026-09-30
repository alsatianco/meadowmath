#!/usr/bin/env python3
"""Build data/search-index.json for the Meadow Math site search (search.html).

The index is generated from the existing sources of truth, so it never drifts:
  - data/<section>.json         -> activity list, icons, paths, level skills
  - lang/{en,vi}/<section>.json -> translated titles, descriptions, level names/goals
  - lang/{en,vi}/tools.json     -> tool titles/descriptions
  - lang/{en,vi}/common.json    -> grade/region names and descriptions

Each document holds, per language: title, description, topic (level/stage name),
goal (what the level teaches) and skills, plus grade metadata used for filtering.

Run from the repo root after adding or renaming activities:
  python3 utils/search/build_search_index.py

Check mode (exit 1 if the committed index is stale; useful in CI):
  python3 utils/search/build_search_index.py --check
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
LANG_DIR = REPO_ROOT / "lang"
OUTPUT = DATA_DIR / "search-index.json"
LANGS = ("en", "vi")

# Sections in display order. `nav` is the key in common.json -> nav / regions.
SECTIONS: List[Dict[str, Any]] = [
    {"id": "number-friends", "nav": "numberFriends", "icon": "🧱"},
    {"id": "prek", "nav": "prek", "icon": "🪺"},
    {"id": "kinder", "nav": "kindergarten", "icon": "🌱"},
    {"id": "grade1", "nav": "grade1", "icon": "📐"},
    {"id": "grade2", "nav": "grade2", "icon": "➕"},
    {"id": "grade3", "nav": "grade3", "icon": "➖"},
    {"id": "grade4", "nav": "grade4", "icon": "✖️"},
    {"id": "grade5", "nav": "grade5", "icon": "➗"},
    {"id": "tools", "nav": "tools", "icon": "🧰"},
]

# Tools have no data/*.json; keep this small list in sync with tools/index.html.
TOOLS = [
    {"key": "numberLine", "dir": "number-line", "icon": "📏",
     "keywords": "counting addition subtraction negative numbers hops distance"},
    {"key": "fractionBars", "dir": "fraction-bars", "icon": "🍫",
     "keywords": "fractions halves thirds quarters equivalent compare"},
    {"key": "base10Blocks", "dir": "base10-blocks", "icon": "🧊",
     "keywords": "place value ones tens hundreds regroup trade"},
    {"key": "arrayBuilder", "dir": "array-builder", "icon": "🔲",
     "keywords": "multiplication times tables rows columns area"},
    {"key": "clock", "dir": "clock", "icon": "🕐",
     "keywords": "time hours minutes analog clock elapsed time"},
    {"key": "geoboard", "dir": "geoboard", "icon": "📌",
     "keywords": "shapes geometry polygons perimeter area triangles squares"},
    {"key": "coordinatePlane", "dir": "coordinate-plane", "icon": "📍",
     "keywords": "graph coordinates points x y axis grid plotting"},
]


def load_json(path: Path) -> Dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def clean(text: Optional[str]) -> str:
    """Strip markdown/HTML markers and collapse whitespace."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", str(text))
    text = re.sub(r"[*_`#]+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def first(*values: Optional[str]) -> str:
    for value in values:
        if value:
            return clean(value)
    return ""


def build_sections(common: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    sections = []
    for order, sec in enumerate(SECTIONS):
        entry: Dict[str, Any] = {"id": sec["id"], "order": order, "icon": sec["icon"]}
        for lang in LANGS:
            entry[lang] = common[lang]["nav"].get(sec["nav"]) or common["en"]["nav"][sec["nav"]]
        sections.append(entry)
    return sections


def build_region_docs(common: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """One document per grade/region landing page so broad queries land somewhere useful."""
    docs = []
    for sec in SECTIONS:
        if sec["id"] == "tools":
            continue
        doc: Dict[str, Any] = {
            "id": f"{sec['id']}/index",
            "type": "grade",
            "section": sec["id"],
            "url": f"{sec['id']}/index.html",
            "icon": sec["icon"],
        }
        for lang in LANGS:
            region = common[lang].get("regions", {}).get(sec["nav"]) or common["en"]["regions"][sec["nav"]]
            doc[lang] = {
                "title": first(region.get("title"), common[lang]["nav"].get(sec["nav"])),
                "description": first(region.get("desc")),
            }
        docs.append(doc)
    return docs


def build_activity_docs(section: str) -> List[Dict[str, Any]]:
    data = load_json(DATA_DIR / f"{section}.json")
    lang_data = {lang: load_json(LANG_DIR / lang / f"{section}.json") for lang in LANGS}
    docs: Dict[str, Dict[str, Any]] = {}

    for level in data.get("levels", []):
        entries = list(level.get("activities", []))
        if level.get("intro"):
            entries.insert(0, {**level["intro"], "icon": level.get("icon", "")})

        for act in entries:
            url = f"{section}/{act['path']}"
            if url in docs:
                continue  # Some activities are reused across stages; keep the first.
            doc: Dict[str, Any] = {
                "id": f"{section}/{act['id']}",
                "type": "activity",
                "section": section,
                "url": url,
                "icon": act.get("icon") or level.get("icon", ""),
            }
            en = lang_data["en"]
            a_en = en.get("activities", {}).get(act["id"], {})
            if section == "number-friends":
                levels_key, level_id = "stages", level["id"]
            else:
                levels_key, level_id = "levels", f"level{level.get('number')}"
            lv_en = en.get(levels_key, {}).get(level_id, {})

            for lang in LANGS:
                ld = lang_data[lang]
                a = ld.get("activities", {}).get(act["id"], {})
                lv = ld.get(levels_key, {}).get(level_id, {})
                is_en = lang == "en"
                entry = {
                    "title": first(a.get("title"), a_en.get("title"), act.get("title"),
                                   act["id"].replace("-", " ")),
                    "description": first(
                        a.get("description"), a.get("instruction"),
                        a_en.get("description"), a_en.get("instruction"), act.get("description"),
                    ) if is_en else first(a.get("description"), a.get("instruction")),
                    "topic": first(lv.get("title"), lv_en.get("title"), level.get("title")),
                    "goal": first(lv.get("goal"), lv_en.get("goal"), level.get("goal"))
                    if is_en else first(lv.get("goal")),
                }
                # Level skills only exist in English (data/*.json).
                if is_en and level.get("skills"):
                    entry["skills"] = [clean(s) for s in level["skills"]]
                doc[lang] = {k: v for k, v in entry.items() if v}
            docs[url] = doc
    return list(docs.values())


def build_tool_docs() -> List[Dict[str, Any]]:
    lang_tools = {lang: load_json(LANG_DIR / lang / "tools.json") for lang in LANGS}
    docs = []
    for tool in TOOLS:
        if not (REPO_ROOT / "tools" / tool["dir"] / "index.html").exists():
            continue
        doc: Dict[str, Any] = {
            "id": f"tools/{tool['dir']}",
            "type": "tool",
            "section": "tools",
            "url": f"tools/{tool['dir']}/index.html",
            "icon": tool["icon"],
        }
        for lang in LANGS:
            t = lang_tools[lang].get("tools", {}).get(tool["key"]) or lang_tools["en"]["tools"][tool["key"]]
            doc[lang] = {"title": clean(t.get("title")), "description": clean(t.get("description"))}
        doc["en"]["keywords"] = tool["keywords"]
        docs.append(doc)
    return docs


def build_index() -> Dict[str, Any]:
    common = {lang: load_json(LANG_DIR / lang / "common.json") for lang in LANGS}
    docs: List[Dict[str, Any]] = []
    docs.extend(build_region_docs(common))
    for sec in SECTIONS:
        if sec["id"] != "tools":
            docs.extend(build_activity_docs(sec["id"]))
    docs.extend(build_tool_docs())

    missing = [d["url"] for d in docs if not (REPO_ROOT / d["url"]).exists()]
    if missing:
        raise SystemExit(f"Index references missing pages: {missing}")
    ids = [d["id"] for d in docs]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit(f"Duplicate document ids: {dupes}")

    return {"version": 1, "sections": build_sections(common), "docs": docs}


def serialize(index: Dict[str, Any]) -> str:
    return json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build data/search-index.json")
    parser.add_argument("--check", action="store_true", help="Exit 1 if data/search-index.json is out of date")
    args = parser.parse_args()

    output = serialize(build_index())
    if args.check:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if current != output:
            print("data/search-index.json is out of date. Run: python3 utils/search/build_search_index.py")
            return 1
        print("data/search-index.json is up to date.")
        return 0

    OUTPUT.write_text(output, encoding="utf-8")
    count = len(json.loads(output)["docs"])
    print(f"Wrote {OUTPUT.relative_to(REPO_ROOT)} ({count} documents, {len(output.encode('utf-8')) // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
