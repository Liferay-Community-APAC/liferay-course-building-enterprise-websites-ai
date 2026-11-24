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
    docs/instructor/whats-new.html what's new compared to the original course
    docs/instructor/demos.html    the instructor demo workbook's start page
    docs/instructor/demos-kickoff.html … demos-operations.html  one page per teaching block
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


def page_label(title: str) -> tuple[str, str]:
    """Sidebar label and position text for a page title."""
    number, rest = short_title(title)
    if number.isdigit():
        return f"{number} · {rest.split(':')[0]}", f"Level {number} of 13"
    label = number if rest else title.split(",")[0].split(":")[0]
    return label, label


def sidebar_nav(book: dict, pages: list[dict], current: str) -> str:
    """A collapsible list of every page of a book; open on the start page."""
    links, position = [], "Start here"
    for day in (1, 2):
        links.append(f'<p class="day">Day {day}</p>')
        for page in pages:
            if page["day"] != day:
                continue
            label, where = page_label(page["title"])
            cls = ""
            if page["file"] == current:
                cls = ' class="current"'
                position = where
            links.append(f'<a href="{page["file"]}"{cls}>{html.escape(label)}</a>')
    index = book["index"]
    start_cls = ' class="current"' if current == index else ""
    is_open = " open" if current == index else ""
    return (f'<details class="wb-levels"{is_open}><summary><span class="wb-levels-title">{book["name"]}</span> '
            f'<span class="wb-pos">{html.escape(position)}</span></summary>'
            f'<a href="{index}"{start_cls}>Start here</a>' + "".join(links) + "</details>")


def pager(book: dict, pages: list[dict], index: int) -> str:
    links = []
    if index > 0:
        prev = pages[index - 1]
        links.append(f'<a class="prev" href="{prev["file"]}"><span>← Previous</span>{html.escape(prev["title"])}</a>')
    else:
        links.append(f'<a class="prev" href="{book["index"]}"><span>← Back to</span>Start here</a>')
    if index < len(pages) - 1:
        nxt = pages[index + 1]
        links.append(f'<a class="next" href="{nxt["file"]}"><span>Next →</span>{html.escape(nxt["title"])}</a>')
    return '<nav class="wb-pager" aria-label="Workbook pages">' + "".join(links) + "</nav>"


def collect_ids(page_html: str) -> set[str]:
    return set(re.findall(r'\bid="([^"]+)"', page_html))


# The two books: the student workbook (one page per level) and the instructor
# demo workbook (one page per teaching block). Each source folder has a
# README.md for the start page and one numbered Markdown file per page.
STUDENT = {"name": "Workbook", "src": SRC / "workbook", "out": OUT / "workbook", "index": "index.html",
           "pages": [(n, 1) for n in DAY_1] + [(n, 2) for n in DAY_2], "file": page_name}
INSTRUCTOR = {"name": "Demo workbook", "src": SRC / "instructor" / "demos", "out": OUT / "instructor", "index": "demos.html",
              "pages": None, "file": lambda source: "demos-" + source.split("-", 1)[1] + ".html"}
INSTRUCTOR_DAY_2_FROM = "09-"  # demo pages from 09-level-7 on are Day 2


def book_pages(book: dict) -> list[tuple[str, int]]:
    if book["pages"] is not None:
        return book["pages"]
    names = sorted(p.stem for p in book["src"].glob("[0-9][0-9]-*.md"))
    return [(n, 2 if n >= INSTRUCTOR_DAY_2_FROM else 1) for n in names]


def build_book(book: dict) -> tuple[dict[str, str], callable]:
    """Build a book's start page and pages. Returns ({file name: html}, target)
    where target(anchor) gives the page (and #anchor) that holds an anchor."""
    pages = []
    for name, day in book_pages(book):
        path = book["src"] / f"{name}.md"
        if path.exists():
            md = path.read_text(encoding="utf-8")
            pages.append({"file": book["file"](name), "day": day, "title": level_title(md), "md": md})

    built = {}
    index = book["index"]
    readme = (book["src"] / "README.md").read_text(encoding="utf-8").replace("](screenshots/", "](../screenshots/")
    first = pages[0]
    start = (f'<nav class="wb-pager" aria-label="Workbook pages"><a class="next" href="{first["file"]}">'
             f'<span>Start →</span>{html.escape(first["title"])}</a></nav>')
    built[index] = build_page(readme, home="../", sidebar_nav=sidebar_nav(book, pages, index), after=start)
    for i, page in enumerate(pages):
        crumb = f'<p class="wb-crumb"><a href="{index}">{book["name"]}</a> › Day {page["day"]}</p>'
        built[page["file"]] = build_page(
            level_page_markdown(page["md"]), home="../",
            sidebar_nav=sidebar_nav(book, pages, page["file"]),
            before=crumb, after=pager(book, pages, i),
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

    # Old one-page links (start page #anchor) still arrive from bookmarks and
    # shared URLs: the start page forwards them to the right page.
    redirect = {a: target(a) for a in owner if owner[a] != index or a in titles}
    redirect = {a: t for a, t in redirect.items() if t and not t.startswith(index)}
    script = ("<script>(function(){var m=" + json.dumps(redirect, sort_keys=True) +
              ";var h=decodeURIComponent(location.hash.slice(1));if(h&&m[h]&&!document.getElementById(h)){location.replace(m[h]);}})();</script>")
    built[index] = built[index].replace("</head>", script + "\n</head>", 1)
    return built, target


def rewrite_links(page_html: str, prefix: str, target) -> str:
    """Rewrite '<prefix>#anchor' links into a book to the page that holds the anchor."""
    # The link keeps its folder and drops the start page's file name:
    # "demos.html#x" -> "demos-level-2.html#x", "../workbook/#x" -> "../workbook/level-2.html#x".
    folder = prefix if prefix.endswith("/") else prefix[: prefix.rfind("/") + 1]

    def fix(m: re.Match) -> str:
        t = target(m.group(1))
        return f'href="{folder}{t}"' if t else m.group(0)
    return re.sub(r'href="' + re.escape(prefix) + r'#([^"]+)"', fix, page_html)


def write(path: Path, page: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(page, encoding="utf-8")
    print(f"Wrote {path.relative_to(ROOT)} ({len(page):,} bytes)")


def main() -> None:
    student, student_target = build_book(STUDENT)
    for file, page_html in student.items():
        write(OUT / "workbook" / file, page_html)
    demos, demos_target = build_book(INSTRUCTOR)
    for old in (OUT / "instructor").glob("demos-*.html"):
        old.unlink()
    for file, page_html in demos.items():
        write(OUT / "instructor" / file, rewrite_links(page_html, "../workbook/", student_target))
    for name, source in (("index.html", "guide.md"), ("schedule.html", "schedule.md"), ("whats-new.html", "whats-new.md")):
        page_html = build_page((SRC / "instructor" / source).read_text(encoding="utf-8"), home="../")
        page_html = rewrite_links(page_html, "../workbook/", student_target)
        write(OUT / "instructor" / name, rewrite_links(page_html, "demos.html", demos_target))
    landing = OUT / "index.html"
    if landing.exists():
        updated = rewrite_links(landing.read_text(encoding="utf-8"), "workbook/", student_target)
        updated = rewrite_links(updated, "instructor/demos.html", demos_target)
        if updated != landing.read_text(encoding="utf-8"):
            write(landing, updated)
    shots = SRC / "workbook" / "screenshots"
    if shots.is_dir():
        shutil.copytree(shots, OUT / "screenshots", dirs_exist_ok=True)


if __name__ == "__main__":
    main()
