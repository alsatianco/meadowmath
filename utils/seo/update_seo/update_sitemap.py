#!/usr/bin/env python3
"""Generate/update sitemap.xml for Meadow Math static site.

Scans the repository for all HTML pages and generates a sitemap.xml
file in the repository root. Automatically detects the site URL and
assigns priorities based on page type.

Run from anywhere (no params needed):
    python utils/seo/update_seo/update_sitemap.py

Or from repo root:
    python -m utils.seo.update_seo.update_sitemap
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent

# Resolve repository root (3 levels up from this script)
REPO_ROOT = Path(__file__).resolve().parents[3]

def _load_site_url() -> str:
    """Return the public site URL, preferring the deployed CNAME."""
    cname_path = REPO_ROOT / "CNAME"
    if cname_path.exists():
        hostname = cname_path.read_text(encoding="utf-8").strip()
        if hostname:
            return f"https://{hostname}"
    return "https://math.alsatian.co"


# Site base URL
SITE_URL = _load_site_url()

# Directories and files to exclude from sitemap
EXCLUDED_DIRS = {
    ".git",
    "node_modules",
    "utils",
    "docs",
    "lang",
    ".vscode",
    "__pycache__",
}

EXCLUDED_FILES = {
    "404.html",
}


class PageInfo(NamedTuple):
    """Information about a page for sitemap generation."""
    url: str
    priority: float
    changefreq: str


def get_html_files(root: Path) -> list[Path]:
    """Find all HTML files in the repository, excluding certain directories."""
    html_files = []
    
    for dirpath, dirnames, filenames in os.walk(root):
        # Skip excluded directories
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        
        for filename in filenames:
            if filename.endswith(".html") and filename not in EXCLUDED_FILES:
                html_files.append(Path(dirpath) / filename)
    
    return html_files


def get_page_priority(rel_path: str) -> tuple[float, str]:
    """
    Determine priority and change frequency based on page type.
    
    Returns:
        (priority, changefreq) tuple
    """
    rel_path_lower = rel_path.lower()
    
    # Homepage - highest priority
    if rel_path == "index.html":
        return (1.0, "weekly")
    
    # Main section landing pages (grade levels, tools, about)
    if rel_path.endswith("/index.html"):
        parts = rel_path.split("/")
        if len(parts) == 2:
            # Grade landing pages and tools index
            return (0.9, "weekly")
        elif len(parts) == 3 and "tools" in rel_path_lower:
            # Individual tool pages
            return (0.7, "monthly")
    
    # Activity pages
    if "/activities/" in rel_path_lower:
        return (0.8, "monthly")
    
    # Default for other pages
    return (0.5, "monthly")


def build_page_info(html_file: Path, root: Path) -> PageInfo:
    """Build PageInfo for a given HTML file."""
    rel_path = html_file.relative_to(root).as_posix()
    priority, changefreq = get_page_priority(rel_path)
    
    # Build full URL
    if rel_path == "index.html":
        url = f"{SITE_URL}/"
    else:
        url = f"{SITE_URL}/{rel_path}"
    
    return PageInfo(url=url, priority=priority, changefreq=changefreq)


def generate_sitemap_xml(pages: list[PageInfo]) -> ElementTree:
    """Generate sitemap XML from page info list."""
    # Create root element with namespace
    nsmap = {
        "xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
    }
    
    urlset = Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    
    # Sort pages: by priority (desc), then by URL (asc)
    sorted_pages = sorted(pages, key=lambda p: (-p.priority, p.url))
    
    # Get current date for lastmod
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    for page in sorted_pages:
        url_elem = SubElement(urlset, "url")
        
        loc = SubElement(url_elem, "loc")
        loc.text = page.url
        
        lastmod = SubElement(url_elem, "lastmod")
        lastmod.text = today
        
        changefreq = SubElement(url_elem, "changefreq")
        changefreq.text = page.changefreq
        
        priority = SubElement(url_elem, "priority")
        priority.text = f"{page.priority:.1f}"
    
    # Create ElementTree
    tree = ElementTree(urlset)
    
    return tree


def write_sitemap(tree: ElementTree, output_path: Path) -> None:
    """Write sitemap XML to file with proper formatting."""
    # Indent for readability (Python 3.9+)
    indent(tree, space="  ")
    
    # Write with XML declaration
    with open(output_path, "wb") as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        tree.write(f, encoding="utf-8", xml_declaration=False)
        f.write(b"\n")


def main() -> None:
    """Main entry point."""
    print(f"Scanning for HTML files in: {REPO_ROOT}")
    
    # Find all HTML files
    html_files = get_html_files(REPO_ROOT)
    print(f"Found {len(html_files)} HTML files")
    
    # Build page info for each file
    pages = [build_page_info(f, REPO_ROOT) for f in html_files]
    
    # Generate sitemap
    tree = generate_sitemap_xml(pages)
    
    # Write sitemap.xml to repo root
    output_path = REPO_ROOT / "sitemap.xml"
    write_sitemap(tree, output_path)
    
    print(f"\nSitemap written to: {output_path}")
    print(f"Total URLs: {len(pages)}")
    
    # Summary by priority
    priority_counts: dict[float, int] = {}
    for page in pages:
        priority_counts[page.priority] = priority_counts.get(page.priority, 0) + 1
    
    print("\nURLs by priority:")
    for priority in sorted(priority_counts.keys(), reverse=True):
        print(f"  {priority:.1f}: {priority_counts[priority]} pages")


if __name__ == "__main__":
    main()
