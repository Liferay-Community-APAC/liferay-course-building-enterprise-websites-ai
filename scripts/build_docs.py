#!/usr/bin/env python3
"""
Build the course's GitHub Pages site (docs/) from docs-src/.

    python3 -m venv .venv && .venv/bin/pip install markdown beautifulsoup4
    .venv/bin/python scripts/build_docs.py

Writes:
    docs/workbook/index.html      the student workbook (both days, one page)
    docs/instructor/index.html    the instructor guide
    docs/instructor/schedule.html the two-day schedule
    docs/instructor/demos.html    the instructor demo workbook
    docs/screenshots/             copied from docs-src/workbook/screenshots/

The landing page (docs/index.html) and the slides (docs/instructor/slides/)
are hand-written HTML and are not touched here.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from md_to_html import build_page  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs-src"
OUT = ROOT / "docs"

DAY_1 = ["00-setup", "01-users-permissions", "02-sites", "03-pages-navigation", "04-fragments", "05-design", "06-cms"]
DAY_2 = ["07-displaying-content", "08-commerce", "09-headless", "10-workflow", "11-search", "12-objects", "13-personalization"]


def demote(md: str) -> str:
    """A level file's '# Level' becomes '### Level' and its '###' exercises become '####'."""
    out, fence = [], False
    for line in md.splitlines():
        if line.lstrip().startswith("```"):
            fence = not fence
        if not fence and re.match(r"^#{1,3} ", line):
            hashes = len(line) - len(line.lstrip("#"))
            line = "#" * {1: 3, 2: 3, 3: 4}[hashes] + line[hashes:]
        out.append(line)
    return "\n".join(out)


def workbook() -> str:
    wb = SRC / "workbook"
    parts = [(wb / "README.md").read_text(encoding="utf-8")]
    for title, files in (("Day 1", DAY_1), ("Day 2", DAY_2)):
        present = [name for name in files if (wb / f"{name}.md").exists()]
        if not present:
            continue
        parts.append(f"## {title}")
        for name in present:
            parts.append(demote((wb / f"{name}.md").read_text(encoding="utf-8")))
    text = "\n\n".join(parts)
    # Screenshots are referenced as screenshots/<file> from the workbook source.
    return text.replace("](screenshots/", "](../screenshots/")


def write(path: Path, page: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(page, encoding="utf-8")
    print(f"Wrote {path.relative_to(ROOT)} ({len(page):,} bytes)")


def main() -> None:
    write(OUT / "workbook" / "index.html", build_page(workbook(), home="../"))
    write(OUT / "instructor" / "index.html", build_page((SRC / "instructor" / "guide.md").read_text(encoding="utf-8"), home="../"))
    write(OUT / "instructor" / "demos.html", build_page((SRC / "instructor" / "demos.md").read_text(encoding="utf-8"), home="../"))
    write(OUT / "instructor" / "schedule.html", build_page((SRC / "instructor" / "schedule.md").read_text(encoding="utf-8"), home="../"))
    shots = SRC / "workbook" / "screenshots"
    if shots.is_dir():
        shutil.copytree(shots, OUT / "screenshots", dirs_exist_ok=True)


if __name__ == "__main__":
    main()
