# Building Enterprise Websites with Liferay and AI — Workbook

Over two days you build **Clarity Vision Solutions' public enterprise website** on Liferay DXP 2026.Q3. Every exercise is a **prompt** you give your AI coding agent, followed by a **check** you do yourself in Liferay. The agent does the typing; you set the requirement, read what it did, and confirm the result on screen before you build on it.

## How to use this workbook

- **Your agent works, you verify.** Each ✅ **Verify** step tells you where to look in Liferay. Verification is read-only: open the screen, look, don't change anything. If what you see doesn't match, tell the agent what's wrong and let it fix it.
- **Short sessions.** Start a fresh agent session for each exercise, or each small group of related ones. The agent picks the project up from `solution-context.md` and `solution-index.yaml` (Exercise S.1), and the skills in `.claude/skills/` (or `.agents/skills/`) tell it how Liferay behaves.
- **Prompts name their skill.** The 🧩 line lists the skills the exercise relies on. You don't have to type them: the agent loads them from the prompt's wording. Naming one in the prompt helps a less capable agent.
- **Every prompt that creates something says who may see it.** Permission gaps fail silently: a page answers, a form saves, and only a visitor notices. Keep the access lines when you adapt a prompt.
- **Personas.** Some checks ask you to sign in as a persona (all passwords are `learn`). Use a private browser window for a second persona, so you stay signed in as the admin in the other.

| Mark | Meaning |
| --- | --- |
| 🎯 | What you're building |
| 🧩 | Skills the exercise relies on (🆕 = written for this course) |
| 📖 | Concept to read before you start |
| 📋 | Steps you do yourself |
| 💬 | Prompt to paste into your agent |
| ✅ | How to check it worked, in Liferay |
| ⚠️ | A gotcha worth knowing before you start |
| ⭐ | Bonus challenge, if you finish early |

## Roadmap

| Day | Level | You build | Original BEWL challenge |
| --- | --- | --- | --- |
| 1 | [Setup](#setup-your-workspace-liferay-dxp-and-the-mcp-server) | The course repository in VS Code, PostgreSQL, DXP, MCP server, context files | 2 |
| 1 | [1 — Users and permissions](#level-1-users-and-permissions) | Personas, user groups, roles, least-privilege permissions | 3 |
| 1 | [2 — Sites](#level-2-sites) | The public site and the distributor portal, membership, site settings, instance home page | 4 |
| 1 | [3 — Pages and navigation](#level-3-pages-master-pages-and-navigation) | Page hierarchy, master pages, display page templates, navigation menus | 5, 6 |
| 1 | [4 — Fragments](#level-4-fragments-and-page-compositions) | The Clarity Components fragment set and page compositions | 7 |
| 1 | [5 — Design](#level-5-design-style-book-theme-css-favicon-and-logo) | Style book, Theme CSS client extension, favicon, logo | 8 |
| 1 | [6 — CMS content](#level-6-content-in-liferay-cms) | Spaces, content structures, file structures, entries, taxonomy | 9, 10, 11, 14 |
| 2 | [7 — Displaying content](#level-7-displaying-content-mapping-display-pages-and-collections) | Mapping, collections, the FAQ page, the announcement bar | 12, 15 |
| 2 | [8 — Commerce](#level-8-commerce-catalog-products-and-product-pages) | Catalog, specifications, products, channel, product pages | 16 |
| 2 | [9 — Headless APIs](#level-9-headless-apis-importing-legacy-data) | API Explorer, batch imports of legacy content and products | 17 |
| 2 | [10 — Workflow and publishing](#level-10-workflow-and-publishing) | Approval workflow for articles and the site-wide announcement | 18 |
| 2 | [11 — Search](#level-11-search-job-openings-blueprints-and-events) | Job search page, facets, search blueprints, upcoming events | 19, 20 |
| 2 | [12 — Objects](#level-12-objects-the-contact-us-form-and-its-follow-up) | Contact Us object, form, follow-up workflow, data set dashboard | 21 |
| 2 | [13 — Personalization](#level-13-personalization-a-home-page-for-distributors) | A Home page variant for distributors, by user group | 22 |

Challenge 1 (touring the finished site), Challenge 13 (ChatGPT content creation), the Liferay Data Platform overview and the performance tuning module aren't exercises in this course. Your instructor covers them in the slides.

The course avoids features Liferay has deprecated or moved to maintenance mode on 2026.Q3: it uses Liferay CMS instead of Web Content, Blogs, Documents and Media and Asset Libraries; workflow instead of Publications; Object fields instead of Custom Fields; and user-group targeting instead of DXP segments.
