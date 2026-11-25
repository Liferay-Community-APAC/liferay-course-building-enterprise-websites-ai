# Building Enterprise Websites with Liferay and AI — Workbook

Over two days you build **Clarity Vision Solutions' public enterprise website** on Liferay DXP 2026.Q3. Every exercise is a **prompt** you give your AI coding agent, followed by a **check** you do yourself in Liferay: the agent does the typing, and you confirm the result on screen before you build on it.

## How the workbook works

Each level opens with a short intro, then its exercises. Every exercise uses the same blocks, always in this order. A block is left out when the exercise doesn't need it.

| Block | Meaning |
| --- | --- |
| 🎯 **Goal** | What exists when you're done. |
| **Requirement** and **Skills** | The requirement the exercise builds (R1 to R13) and the skills your agent relies on. |
| 📋 **Before the prompt** | Steps you do yourself before you send the prompt. |
| 💬 **Prompt** | The text to paste into your agent. |
| 📋 **After the prompt** | Steps you do yourself after the agent answers. |
| ✅ **Verify** | Where to look in Liferay, and what you should see. Look, don't change anything. |
| 🧪 **Acceptance criteria** | What must be true when the exercise is done, as checks a test can run: who checks (Guest, a persona, the admin over the API, or the files) and what they find. Each has an id, such as AC 2.3-1. |
| ⚠️ **If it doesn't match** | Likely causes, and what to tell the agent. |
| 📖 **Why it matters** | The concept behind the exercise, in a few sentences. |
| 🧠 **Knowledge check** | Three questions at the end of each level, after its exercises. Answer them on your own while your last prompt runs (about 3 minutes); your instructor then goes over the answers with the class. They're for you, not graded. |
| ⭐ **Extras** | Optional bonus exercises at the end of a level, for when you finish early. Every level's last bonus has your agent write a Playwright test of that level's acceptance criteria, so you can check your whole build again in a minute. |

Level intros also have:

| Block | Meaning |
| --- | --- |
| ⏱ | How long the level takes, including the talk, and which levels it builds on. |
| **Key terms** | The terms the level's exercises use, defined before you need them. |

## Working rules

- **Your agent builds, you verify.** ✅ **Verify** steps are read-only: open the screen, look, don't change anything. If what you see doesn't match, tell the agent what's wrong and let it fix it.
- **One fresh agent session per exercise**, or per small group of related ones. A fresh session costs fewer tokens and stays focused. It picks the project up from `solution-context.md` and `solution-index.yaml` (Exercise S.1).
- **Personas sign in with the password `learn`.** Use a private window for a persona, so you stay signed in as the admin in the other window.
- **You start and stop Liferay yourself, never the agent.** A server started inside an agent session stops when that session ends (Exercise S.2).
- **Keep the access lines.** Prompts that create something public say who may see it. Permission gaps fail silently: a page answers, a form saves, and only a visitor notices. Keep those lines when you adapt a prompt.

## Glossary

- **Global Menu:** the grid icon, top right. It opens the *Control Panel*, *CMS*, *Applications* and *Commerce*.
- **Site Menu:** the panel on the left of a site, opened with the icon at the top left. It holds the site's *Site Builder*, *Design*, *People* and *Configuration* sections.
- **Control Panel:** *Global Menu* → *Control Panel*. Settings for the whole instance: users, user groups, roles, sites and instance settings.
- **CMS:** *Global Menu* → *CMS*. Liferay CMS, where Spaces, content structures, content and files live (Level 6).
- **Applications menu:** *Global Menu* → *Applications*. Instance-wide applications, such as *Client Extensions*.
- **Private window:** your browser's private (incognito) window. Use it to look at the site as a visitor, or to sign in as a persona while you stay signed in as the admin.
- **Persona:** one of Clarity's test users, such as Christian Carter (Marketing Coordinator). Level 1 creates them from `context-source/data/personas.csv`. Their password is `learn`.
- **External reference code (ERC):** an ID you choose, such as `clarity-public`, that prompts use to address an item. It stays the same when the agent runs a prompt again or on another environment.
- **Requirement IDs (R1 to R13):** Clarity's requirements, from section 8 of `context-source/clarity-brief.md`. `solution-index.yaml` tracks which are done.
- **Skills:** instructions in `.claude/skills/` (or `.agents/skills/`) that tell your agent how Liferay behaves. You don't have to name them: the agent loads them from the prompt's wording. Naming one helps a less capable agent.
- **Workspace root:** the `bewl-ai` folder you open in VS Code (Exercise S.0). VS Code's terminal opens there.
- **MCP:** the Model Context Protocol, a standard way for an AI agent to use tools. Liferay's MCP server exposes Liferay's headless APIs as tools for your agent (Exercise S.4).

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
| Bonus | [14 — Website chatbot](#level-14-a-website-chatbot-bonus-ai-hubs-setup-with-your-own-ai) | A chatbot on every page, set up like Liferay AI Hub, answering from the site's content with your own AI agent | — |

Challenge 1 (touring the finished site), Challenge 13 (ChatGPT content creation), the Liferay Data Platform overview and the performance tuning module aren't exercises in this course. Your instructor covers them in the slides.

The course avoids features Liferay has deprecated or moved to maintenance mode on 2026.Q3: it uses Liferay CMS instead of Web Content, Blogs, Documents and Media and Asset Libraries; workflow instead of Publications; Object fields instead of Custom Fields; and user-group targeting instead of DXP segments.
