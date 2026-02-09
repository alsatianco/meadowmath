#!/usr/bin/env python3
"""Update <title>, meta description, and Open Graph tags across the Meadow Math static site.

- Uses data/*.json to populate activity titles/descriptions.
- Adds/updates <meta name="description"> and <title> inside <head>.
- Adds/updates Open Graph (og:) meta tags for rich social previews.
- Pages in the same section share the same og:image.
- Keeps changes minimal and idempotent.

Run from repo root:
  python tools/seo/update_seo.py

Optional:
  python tools/seo/update_seo.py --check
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parents[2]

SITE_URL = "https://meadowmath.github.io"

# ---------------------------------------------------------------------------
# Open Graph image URLs — one per section.
# Replace these placeholder values with the final image URLs.
# ---------------------------------------------------------------------------
OG_IMAGE_HOME = "https://meadowmath.github.io/images/og/og-home.png"
OG_IMAGE_PREK = "https://meadowmath.github.io/images/og/og-prek.png"
OG_IMAGE_KINDER = "https://meadowmath.github.io/images/og/og-kinder.png"
OG_IMAGE_GRADE1 = "https://meadowmath.github.io/images/og/og-grade1.png"
OG_IMAGE_GRADE2 = "https://meadowmath.github.io/images/og/og-grade2.png"
OG_IMAGE_GRADE3 = "https://meadowmath.github.io/images/og/og-grade3.png"
OG_IMAGE_GRADE4 = "https://meadowmath.github.io/images/og/og-grade4.png"
OG_IMAGE_GRADE5 = "https://meadowmath.github.io/images/og/og-grade5.png"
OG_IMAGE_TOOLS = "https://meadowmath.github.io/images/og/og-tools.png"
OG_IMAGE_ABOUT = "https://meadowmath.github.io/images/og/og-about.png"

# Map section keys to their OG image URL.
_SECTION_OG_IMAGES: Dict[str, str] = {
    "home": OG_IMAGE_HOME,
    "prek": OG_IMAGE_PREK,
    "kinder": OG_IMAGE_KINDER,
    "grade1": OG_IMAGE_GRADE1,
    "grade2": OG_IMAGE_GRADE2,
    "grade3": OG_IMAGE_GRADE3,
    "grade4": OG_IMAGE_GRADE4,
    "grade5": OG_IMAGE_GRADE5,
    "tools": OG_IMAGE_TOOLS,
    "about": OG_IMAGE_ABOUT,
}


def _section_for_path(rel_path: str) -> str:
    """Return the section key for a relative HTML path."""
    if rel_path == "index.html":
        return "home"
    first = rel_path.split("/")[0]
    if first in {"prek", "kinder", "kindergarten"}:
        return "kinder" if first == "kindergarten" else first
    if first in {"grade1", "grade2", "grade3", "grade4", "grade5"}:
        return first
    if first == "tools":
        return "tools"
    if first == "about":
        return "about"
    # Default to home for any unrecognised top-level paths.
    return "home"


def _og_image_for_path(rel_path: str) -> str:
    """Return the og:image URL for a page based on its section."""
    section = _section_for_path(rel_path)
    return _SECTION_OG_IMAGES.get(section, OG_IMAGE_HOME)


def _og_url_for_path(rel_path: str) -> str:
    """Return the canonical og:url for a page."""
    if rel_path == "index.html":
        return f"{SITE_URL}/"
    # Strip trailing index.html for cleaner URLs.
    if rel_path.endswith("/index.html"):
        return f"{SITE_URL}/{rel_path[:-len('index.html')]}"
    return f"{SITE_URL}/{rel_path}"


@dataclass(frozen=True)
class SeoMeta:
    title: str
    description: str


def _norm_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _title_case_from_slug(slug: str) -> str:
    words = [w for w in re.split(r"[-_]+", slug) if w]
    # Preserve common tokens.
    acronyms = {"k": "K", "prek": "Pre-K"}
    result = []
    for w in words:
        lw = w.lower()
        if lw in acronyms:
            result.append(acronyms[lw])
        elif lw in {"2d", "3d"}:
            result.append(lw.upper())
        else:
            result.append(lw.capitalize())
    return " ".join(result)


def _truncate_words(text: str, max_len: int) -> str:
    text = _norm_space(text)
    if len(text) <= max_len:
        return text

    # Prefer cutting at sentence boundary.
    for m in re.finditer(r"[.!?] ", text):
        if m.end() - 1 <= max_len:
            candidate = text[: m.end() - 1].rstrip()
            if len(candidate) <= max_len:
                return candidate

    # Word boundary truncation with ellipsis.
    if max_len <= 1:
        return text[:max_len]

    limit = max_len - 1
    cut = text.rfind(" ", 0, limit)
    if cut < 0:
        cut = limit
    return text[:cut].rstrip() + "…"


def _compose_description(primary: str, suffixes: List[str], max_len: int = 160) -> str:
    primary = _norm_space(primary).rstrip(".?!")
    # Try progressively shorter suffixes.
    for suffix in suffixes:
        candidate = f"{primary}. {suffix}" if primary else suffix
        candidate = _norm_space(candidate)
        if len(candidate) <= max_len:
            return candidate

    # Fallback: truncate primary only.
    if primary:
        return _truncate_words(primary, max_len)
    return "Meadow Math — free, interactive math activities and tools."


def _grade_label_from_region(region: str) -> str:
    if region == "prek":
        return "Pre-K"
    if region in {"kinder", "kindergarten"}:
        return "Kindergarten"
    if region.startswith("grade"):
        return f"Grade {region.replace('grade', '')}".strip()
    return region


def _load_region_json(data_path: Path) -> Dict[str, SeoMeta]:
    """Return mapping: relative html path -> SeoMeta (activity and index pages)."""
    raw = json.loads(data_path.read_text(encoding="utf-8"))
    region = raw.get("region")
    if not region:
        return {}

    grade_label = _grade_label_from_region(region)

    mapping: Dict[str, SeoMeta] = {}

    # Region landing page.
    region_title = raw.get("title") or f"{grade_label} Activities"
    region_desc = raw.get("description") or "Browse free, interactive math activities."

    mapping[f"{region}/index.html"] = SeoMeta(
        title=f"{grade_label} Math Activities | Meadow Math",
        description=_compose_description(
            region_desc,
            [
                f"Browse free, interactive {grade_label} math activities on Meadow Math.",
                "Browse free, interactive math activities on Meadow Math.",
            ],
        ),
    )

    # Activities.
    levels = raw.get("levels") or []
    for level in levels:
        for act in level.get("activities") or []:
            path = act.get("path")
            if not path or not isinstance(path, str):
                continue

            act_title = _norm_space(str(act.get("title") or ""))
            act_desc = _norm_space(str(act.get("description") or ""))
            if not act_title:
                # Derive from the filename.
                act_title = _title_case_from_slug(Path(path).stem)

            rel_html = f"{region}/{path}".replace("\\", "/")

            title = f"{act_title} | {grade_label} Math Activity | Meadow Math"
            description = _compose_description(
                act_desc,
                [
                    f"Free interactive {grade_label} math practice on Meadow Math.",
                    "Free interactive math practice on Meadow Math.",
                    "Free interactive practice on Meadow Math.",
                ],
            )
            mapping[rel_html] = SeoMeta(title=title, description=description)

    return mapping


def _manual_pages() -> Dict[str, SeoMeta]:
    return {
        "index.html": SeoMeta(
            title="Meadow Math | Free Pre-K to Grade 5 Math Activities",
            description=_compose_description(
                "A gentle, joyful space for children to explore mathematics from Pre-K through Grade 5",
                [
                    "Free interactive activities by grade, plus classroom tools like number lines and fraction bars.",
                    "Free interactive math activities and classroom tools.",
                ],
            ),
        ),
        "about/index.html": SeoMeta(
            title="About Meadow Math | Free K-5 Math Activities",
            description=_compose_description(
                "Learn about Meadow Math and our goal to make math practice gentle, joyful, and accessible",
                [
                    "Explore our free interactive activities for Pre-K through Grade 5.",
                    "Explore free interactive math activities for kids.",
                ],
            ),
        ),
        "tools/index.html": SeoMeta(
            title="Math Tools for Kids | Meadow Math",
            description=_compose_description(
                "Explore free, interactive math tools to support learning and problem solving",
                [
                    "Use number lines, geoboards, fraction bars, clocks, base-ten blocks, and more.",
                    "Try free math tools like number lines and fraction bars.",
                ],
            ),
        ),
        "tools/number-line/index.html": SeoMeta(
            title="Number Line Tool | Meadow Math",
            description=_compose_description(
                "Interactive number line for counting, addition, subtraction, and place value",
                ["Free classroom-friendly math tool on Meadow Math."],
            ),
        ),
        "tools/geoboard/index.html": SeoMeta(
            title="Geoboard Tool | Meadow Math",
            description=_compose_description(
                "Interactive geoboard for exploring shapes, area, perimeter, and geometry",
                ["Free classroom-friendly math tool on Meadow Math."],
            ),
        ),
        "tools/fraction-bars/index.html": SeoMeta(
            title="Fraction Bars Tool | Meadow Math",
            description=_compose_description(
                "Interactive fraction bars for comparing fractions and building fraction models",
                ["Free classroom-friendly math tool on Meadow Math."],
            ),
        ),
        "tools/clock/index.html": SeoMeta(
            title="Clock Tool | Meadow Math",
            description=_compose_description(
                "Interactive clock for learning to tell time and practice time questions",
                ["Free classroom-friendly math tool on Meadow Math."],
            ),
        ),
        "tools/base10-blocks/index.html": SeoMeta(
            title="Base-Ten Blocks Tool | Meadow Math",
            description=_compose_description(
                "Interactive base-ten blocks for place value, regrouping, and number sense",
                ["Free classroom-friendly math tool on Meadow Math."],
            ),
        ),
        "tools/array-builder/index.html": SeoMeta(
            title="Array Builder Tool | Meadow Math",
            description=_compose_description(
                "Build arrays to model multiplication, division, area, and equal groups",
                ["Free classroom-friendly math tool on Meadow Math."],
            ),
        ),
        "tools/coordinate-plane/index.html": SeoMeta(
            title="Coordinate Plane Tool | Meadow Math",
            description=_compose_description(
                "Interactive coordinate plane for plotting points and exploring geometry",
                ["Free classroom-friendly math tool on Meadow Math."],
            ),
        ),
    }


def _derive_fallback_meta(rel_path: str) -> SeoMeta:
    parts = rel_path.split("/")
    filename = parts[-1]
    stem = Path(filename).stem

    site = "Meadow Math"

    if rel_path.endswith("/index.html") and len(parts) >= 2:
        section = parts[-2]
        section_label = _grade_label_from_region(section)
        return SeoMeta(
            title=f"{section_label} | {site}",
            description=_compose_description(
                f"Explore free, interactive {section_label} math activities and learning tools",
                ["Practice math with immediate feedback on Meadow Math."],
            ),
        )

    if "/activities/" in rel_path:
        # Try to infer grade label.
        region = parts[0]
        grade_label = _grade_label_from_region(region)
        act_title = _title_case_from_slug(stem)
        return SeoMeta(
            title=f"{act_title} | {grade_label} Math Activity | {site}",
            description=_compose_description(
                f"Interactive {grade_label} math activity: {act_title}",
                [
                    "Free practice with immediate feedback on Meadow Math.",
                    "Free interactive practice on Meadow Math.",
                ],
            ),
        )

    page_title = _title_case_from_slug(stem)
    return SeoMeta(
        title=f"{page_title} | {site}",
        description=_compose_description(
            f"{page_title} on Meadow Math",
            ["Free, interactive math activities and tools."],
        ),
    )


def _upsert_og_tag(head: str, og_property: str, content: str) -> str:
    """Update an existing og: meta tag or insert a new one."""
    og_re = rf"<meta\s+[^>]*property=['\"]og:{re.escape(og_property)}['\"][^>]*>"
    if re.search(og_re, head, flags=re.IGNORECASE):
        def _replace_og(match: re.Match) -> str:
            tag = match.group(0)
            if re.search(r"\bcontent=", tag, flags=re.IGNORECASE):
                return re.sub(
                    r"content=['\"][^'\"]*['\"]",
                    f'content="{content}"',
                    tag,
                    flags=re.IGNORECASE,
                    count=1,
                )
            return tag[:-1] + f' content="{content}">'

        return re.sub(og_re, _replace_og, head, flags=re.IGNORECASE, count=1)

    # Insert new tag. Place after existing og tags, or after </title>, or at end.
    # Find the last og: tag to group them together.
    last_og = None
    for m in re.finditer(r"<meta\s+[^>]*property=['\"]og:[^'\"]*['\"][^>]*>\s*", head, flags=re.IGNORECASE):
        last_og = m
    if last_og:
        pos = last_og.end()
        return head[:pos] + f'  <meta property="og:{og_property}" content="{content}">\n' + head[pos:]

    # No og tags yet — insert after meta description or </title>.
    anchor = re.search(r"<meta\s+[^>]*name=['\"]description['\"][^>]*>\s*", head, flags=re.IGNORECASE)
    if not anchor:
        anchor = re.search(r"</title>\s*", head, flags=re.IGNORECASE)
    if anchor:
        pos = anchor.end()
        return head[:pos] + f'  <meta property="og:{og_property}" content="{content}">\n' + head[pos:]

    # Last resort: append.
    return head + f'  <meta property="og:{og_property}" content="{content}">\n'


def _update_head(html: str, meta: SeoMeta, rel_path: str) -> Tuple[str, bool]:
    """Return (updated_html, changed)."""

    # Quick, targeted edits inside the <head>...</head> block.
    head_match = re.search(r"<head>([\s\S]*?)</head>", html, flags=re.IGNORECASE)
    if not head_match:
        return html, False

    head = head_match.group(1)
    original_head = head

    # Update or insert <title>.
    if re.search(r"<title>[\s\S]*?</title>", head, flags=re.IGNORECASE):
        head = re.sub(
            r"<title>[\s\S]*?</title>",
            lambda _: f"<title>{meta.title}</title>",
            head,
            flags=re.IGNORECASE,
            count=1,
        )
    else:
        # Insert after viewport/meta charset if possible.
        insert_after = None
        m = re.search(r"<meta[^>]+charset[^>]*>\s*", head, flags=re.IGNORECASE)
        if m:
            insert_after = m.end()
        else:
            m = re.search(r"<meta[^>]+name=['\"]viewport['\"][^>]*>\s*", head, flags=re.IGNORECASE)
            if m:
                insert_after = m.end()

        title_tag = f"  <title>{meta.title}</title>\n"
        if insert_after is not None:
            head = head[:insert_after] + title_tag + head[insert_after:]
        else:
            head = title_tag + head

    # Update or insert meta description.
    desc_re = r"<meta\s+[^>]*name=['\"]description['\"][^>]*>"
    if re.search(desc_re, head, flags=re.IGNORECASE):
        # Replace content attribute if present; otherwise add it.
        def _replace_desc_tag(match: re.Match) -> str:
            tag = match.group(0)
            if re.search(r"\bcontent=", tag, flags=re.IGNORECASE):
                tag = re.sub(
                    r"content=['\"][^'\"]*['\"]",
                    f"content=\"{meta.description}\"",
                    tag,
                    flags=re.IGNORECASE,
                    count=1,
                )
            else:
                # Add content before closing angle bracket.
                tag = tag[:-1] + f" content=\"{meta.description}\">"
            return tag

        head = re.sub(desc_re, _replace_desc_tag, head, flags=re.IGNORECASE, count=1)
    else:
        # Insert after viewport if possible, else after charset.
        insert_after = None
        m = re.search(r"<meta[^>]+name=['\"]viewport['\"][^>]*>\s*", head, flags=re.IGNORECASE)
        if m:
            insert_after = m.end()
        else:
            m = re.search(r"<meta[^>]+charset[^>]*>\s*", head, flags=re.IGNORECASE)
            if m:
                insert_after = m.end()

        tag = f"  <meta name=\"description\" content=\"{meta.description}\">\n"
        if insert_after is not None:
            head = head[:insert_after] + tag + head[insert_after:]
        else:
            head = tag + head

    # Update or insert Open Graph meta tags.
    og_url = _og_url_for_path(rel_path)
    og_image = _og_image_for_path(rel_path)

    head = _upsert_og_tag(head, "title", meta.title)
    head = _upsert_og_tag(head, "description", meta.description)
    head = _upsert_og_tag(head, "type", "website")
    head = _upsert_og_tag(head, "url", og_url)
    head = _upsert_og_tag(head, "image", og_image)
    head = _upsert_og_tag(head, "site_name", "Meadow Math")

    if head == original_head:
        return html, False

    updated_html = html[: head_match.start(1)] + head + html[head_match.end(1) :]
    return updated_html, True


def _iter_html_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*.html"):
        # Skip vendor-like directories if any are introduced later.
        if any(part.startswith(".") for part in path.parts):
            continue
        yield path


def _build_mapping() -> Dict[str, SeoMeta]:
    mapping: Dict[str, SeoMeta] = {}

    # Manual key pages and tools.
    mapping.update(_manual_pages())

    # Data-driven regions.
    data_dir = REPO_ROOT / "data"
    for name in ["prek", "kinder", "grade1", "grade2", "grade3", "grade4", "grade5"]:
        p = data_dir / f"{name}.json"
        if p.exists():
            mapping.update(_load_region_json(p))

    # Some repos have both kinder/ and kindergarten/.
    # kindergarten/index.html is a redirect/canonical shim; keep its title distinct.
    if (REPO_ROOT / "kindergarten" / "index.html").exists():
        mapping["kindergarten/index.html"] = SeoMeta(
            title="Kindergarten Activities (Redirect) | Meadow Math",
            description=_compose_description(
                "Redirecting to the canonical Kindergarten activities page",
                ["You can find the full list of free interactive activities on Meadow Math."],
            ),
        )

    return mapping


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Do not write; just report missing/duplicate tags")
    args = parser.parse_args()

    mapping = _build_mapping()

    updated = 0
    checked = 0
    missing_title = []
    missing_desc = []
    missing_og = []

    # Track title uniqueness.
    seen_titles: Dict[str, List[str]] = {}

    for html_path in _iter_html_files(REPO_ROOT):
        rel = html_path.relative_to(REPO_ROOT).as_posix()
        html = html_path.read_text(encoding="utf-8")

        meta = mapping.get(rel) or _derive_fallback_meta(rel)
        new_html, changed = _update_head(html, meta, rel)

        checked += 1

        # Basic checks.
        head_match = re.search(r"<head>([\s\S]*?)</head>", new_html, flags=re.IGNORECASE)
        head = head_match.group(1) if head_match else ""

        if not re.search(r"<title>[\s\S]*?</title>", head, flags=re.IGNORECASE):
            missing_title.append(rel)
        if not re.search(r"<meta\s+[^>]*name=['\"]description['\"][^>]*>", head, flags=re.IGNORECASE):
            missing_desc.append(rel)
        if not re.search(r"<meta\s+[^>]*property=['\"]og:title['\"][^>]*>", head, flags=re.IGNORECASE):
            missing_og.append(rel)

        # Extract title text for duplicate detection.
        m = re.search(r"<title>([\s\S]*?)</title>", head, flags=re.IGNORECASE)
        title_text = _norm_space(m.group(1)) if m else ""
        if title_text:
            seen_titles.setdefault(title_text, []).append(rel)

        if changed and not args.check:
            html_path.write_text(new_html, encoding="utf-8")
            updated += 1

    dup_titles = {t: paths for t, paths in seen_titles.items() if len(paths) > 1}

    print(f"Checked {checked} HTML files.")
    if args.check:
        print("(check-only mode; no files written)")
    else:
        print(f"Updated {updated} files.")

    if missing_title:
        print(f"Missing <title>: {len(missing_title)}")
        for p in missing_title[:20]:
            print(f"  - {p}")
        if len(missing_title) > 20:
            print("  (truncated)")

    if missing_desc:
        print(f"Missing meta description: {len(missing_desc)}")
        for p in missing_desc[:20]:
            print(f"  - {p}")
        if len(missing_desc) > 20:
            print("  (truncated)")

    if missing_og:
        print(f"Missing og:title: {len(missing_og)}")
        for p in missing_og[:20]:
            print(f"  - {p}")
        if len(missing_og) > 20:
            print("  (truncated)")

    if dup_titles:
        print(f"Duplicate titles: {len(dup_titles)}")
        # Show a few examples.
        shown = 0
        for t, paths in sorted(dup_titles.items(), key=lambda kv: (-len(kv[1]), kv[0])):
            print(f"  - '{t}' ({len(paths)} pages)")
            for p in paths[:5]:
                print(f"      * {p}")
            if len(paths) > 5:
                print("      (more…)")
            shown += 1
            if shown >= 8:
                print("  (truncated)")
                break

    # Non-zero exit if check fails.
    if missing_title or missing_desc or missing_og:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
