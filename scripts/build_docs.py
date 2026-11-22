#!/usr/bin/env python3
"""
Build the course's GitHub Pages site (docs/) from docs-src/.

    python3 -m venv .venv && .venv/bin/pip install markdown beautifulsoup4
    .venv/bin/python scripts/build_docs.py

Writes:
    docs/workbook/index.html      the student workbook's start page
    docs/workbook/setup.html, level-1.html … level-13.html  one page per level
    docs/instructor/index.html    the instructor guide
    docs/instructor/schedule.html the two-day schedule
    docs/instructor/demos.html    the instructor demo workbook
    docs/screenshots/             copied from docs-src/workbook/screenshots/

The landing page (docs/index.html) and the slides (docs/instructor/slides/)
are hand-written HTML and are not touched here.
"""

from __future__ import annotations

import html
import json
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


def page_name(source: str) -> str:
    """00-setup -> setup.html, 07-displaying-content -> level-7.html."""
    number = int(source.split("-", 1)[0])
    return "setup.html" if number == 0 else f"level-{number}.html"


def level_page_markdown(md: str) -> str:
    """One level per page: '# Level' stays the page title, its '###'
    exercises become '##' and anything deeper moves up one level."""
    out, fence = [], False
    for line in md.splitlines():
        if line.lstrip().startswith("```"):
            fence = not fence
        if not fence and re.match(r"^#{3,4} ", line):
            line = line[1:]
        # "**Part 2 — Clara approves**" inside a multi-part exercise
        # becomes a sub-heading, so it stands out and shows in the sidebar.
        part = None if fence else re.match(r"^\*\*(Part \d+ — [^*]+)\*\*\s*$", line)
        if part:
            line = "### " + part.group(1)
        out.append(line)
    # Screenshots are referenced as screenshots/<file> from the workbook source.
    return "\n".join(out).replace("](screenshots/", "](../screenshots/")


def level_title(md: str) -> str:
    return re.search(r"^# (.+)$", md, re.M).group(1).strip()


def short_title(title: str) -> str:
    """'Level 3 — Pages, master pages and navigation' -> ('3', 'Pages, ...')."""
    head, _, rest = title.partition(" — ")
    return head.replace("Level ", ""), rest


def sidebar_nav(pages: list[dict], current: str) -> str:
    """A collapsible list of every workbook page; open on the start page."""
    links, position = [], "Start here"
    for day in (1, 2):
        links.append(f'<p class="day">Day {day}</p>')
        for page in pages:
            if page["day"] != day:
                continue
            number, rest = short_title(page["title"])
            name = rest.split(":")[0]
            label = "Setup" if number == "Setup" else f"{number} · {name}"
            cls = ""
            if page["file"] == current:
                cls = ' class="current"'
                position = "Setup" if number == "Setup" else f"Level {number} of 13"
            links.append(f'<a href="{page["file"]}"{cls}>{html.escape(label)}</a>')
    start_cls = ' class="current"' if current == "index.html" else ""
    is_open = " open" if current == "index.html" else ""
    return (f'<details class="wb-levels"{is_open}><summary><span class="wb-levels-title">Workbook</span> '
            f'<span class="wb-pos">{html.escape(position)}</span></summary>'
            f'<a href="index.html"{start_cls}>Start here</a>' + "".join(links) + "</details>")


def pager(pages: list[dict], index: int) -> str:
    links = []
    if index > 0:
        prev = pages[index - 1]
        links.append(f'<a class="prev" href="{prev["file"]}"><span>← Previous</span>{html.escape(prev["title"])}</a>')
    else:
        links.append('<a class="prev" href="index.html"><span>← Back to</span>Start here</a>')
    if index < len(pages) - 1:
        nxt = pages[index + 1]
        links.append(f'<a class="next" href="{nxt["file"]}"><span>Next →</span>{html.escape(nxt["title"])}</a>')
    return '<nav class="wb-pager" aria-label="Workbook pages">' + "".join(links) + "</nav>"


def collect_ids(page_html: str) -> set[str]:
    return set(re.findall(r'\bid="([^"]+)"', page_html))


def workbook() -> dict[str, str]:
    """Build the workbook pages: index.html (README) and one page per level.
    Returns {file name: html}."""
    wb = SRC / "workbook"
    pages = []
    for day, names in ((1, DAY_1), (2, DAY_2)):
        for name in names:
            path = wb / f"{name}.md"
            if path.exists():
                md = path.read_text(encoding="utf-8")
                pages.append({"file": page_name(name), "day": day, "title": level_title(md), "md": md})

    built = {}
    readme = (wb / "README.md").read_text(encoding="utf-8").replace("](screenshots/", "](../screenshots/")
    first = pages[0]
    start = (f'<nav class="wb-pager" aria-label="Workbook pages"><a class="next" href="{first["file"]}">'
             f'<span>Start →</span>{html.escape(first["title"])}</a></nav>')
    built["index.html"] = build_page(readme, home="../", sidebar_nav=sidebar_nav(pages, "index.html"), after=start)
    for i, page in enumerate(pages):
        crumb = f'<p class="wb-crumb"><a href="index.html">Workbook</a> › Day {page["day"]}</p>'
        built[page["file"]] = build_page(
            level_page_markdown(page["md"]), home="../",
            sidebar_nav=sidebar_nav(pages, page["file"]),
            before=crumb, after=pager(pages, i),
        )

    # Every id, and the page it's on; a page's own title id means the page itself.
    owner: dict[str, str] = {}
    for file, page_html in built.items():
        for anchor in collect_ids(page_html):
            owner.setdefault(anchor, file)
    titles = {re.search(r'<h1 id="([^"]+)"', h).group(1): f for f, h in built.items() if re.search(r'<h1 id="([^"]+)"', h)}

    def target(anchor: str) -> str | None:
        if anchor in titles:
            return titles[anchor]
        if anchor in owner:
            return f"{owner[anchor]}#{anchor}"
        return None

    # Same-page links that now point at another page.
    for file in list(built):
        def fix(m: re.Match) -> str:
            anchor = m.group(1)
            if anchor in collect_ids(built[file]) and anchor not in titles:
                return m.group(0)
            t = target(anchor)
            return f'href="{t}"' if t else m.group(0)
        built[file] = re.sub(r'href="#([^"]+)"', fix, built[file])

    # Old one-page links (workbook/#anchor) still arrive from bookmarks and
    # shared URLs: the start page forwards them to the right page.
    redirect = {a: target(a) for a in owner if owner[a] != "index.html" or a in titles}
    redirect = {a: t for a, t in redirect.items() if t and not t.startswith("index.html")}
    script = ("<script>(function(){var m=" + json.dumps(redirect, sort_keys=True) +
              ";var h=decodeURIComponent(location.hash.slice(1));if(h&&m[h]&&!document.getElementById(h)){location.replace(m[h]);}})();</script>")
    built["index.html"] = built["index.html"].replace("</head>", script + "\n</head>", 1)
    workbook.targets = target  # used to rewrite links on other pages
    return built


def rewrite_workbook_links(page_html: str, prefix: str) -> str:
    """Rewrite '<prefix>#anchor' links into the workbook to the page that holds the anchor."""
    def fix(m: re.Match) -> str:
        t = workbook.targets(m.group(1))
        return f'href="{prefix}{t}"' if t else m.group(0)
    return re.sub(r'href="' + re.escape(prefix) + r'#([^"]+)"', fix, page_html)


def write(path: Path, page: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(page, encoding="utf-8")
    print(f"Wrote {path.relative_to(ROOT)} ({len(page):,} bytes)")


def main() -> None:
    for file, page_html in workbook().items():
        write(OUT / "workbook" / file, page_html)
    for name, source in (("index.html", "guide.md"), ("demos.html", "demos.md"), ("schedule.html", "schedule.md")):
        page_html = build_page((SRC / "instructor" / source).read_text(encoding="utf-8"), home="../")
        write(OUT / "instructor" / name, rewrite_workbook_links(page_html, "../workbook/"))
    landing = OUT / "index.html"
    if landing.exists():
        updated = rewrite_workbook_links(landing.read_text(encoding="utf-8"), "workbook/")
        if updated != landing.read_text(encoding="utf-8"):
            write(landing, updated)
    shots = SRC / "workbook" / "screenshots"
    if shots.is_dir():
        shutil.copytree(shots, OUT / "screenshots", dirs_exist_ok=True)


if __name__ == "__main__":
    main()
