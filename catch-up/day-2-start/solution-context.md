# Clarity Vision Solutions: solution context

Short working summary for agents. The source of truth is `context-source/clarity-brief.md`; sample content, data and assets are indexed in `context-source/README.md`. Cite those files; don't copy them.

## Who Clarity is

Clarity Vision Solutions is a fictional eyewear manufacturer (eyeglasses, sunglasses, contact lenses, prescription lenses) that sells mostly through distributors and retail partners. We build its public enterprise website on Liferay DXP 2026.Q3. See `context-source/clarity-brief.md` (intro).

## The site's five goals

1. Increase brand awareness (story, leadership, innovations).
2. Showcase products (catalog by category, a page per product).
3. Convert visitors into customers, distributors and job applicants.
4. Serve an international audience: English (US) and Spanish (Spain).
5. Be run by a team with least-privilege permissions and approval before content goes live.

Details: `context-source/clarity-brief.md` section 1.

## Personas

Training password `learn`; email domain `clarityvisionsolutions.com`. Full data (groups, roles, portraits): `context-source/data/personas.csv`.

| Persona | Role on the site |
| --- | --- |
| admin (Clarity Admin) | Instance-level settings only |
| ianmiller (IT Manager, IT) | Sites, commerce catalog, objects, workflow definitions |
| walterdouglas (Web Developer, IT) | Pages, masters, fragments, design, search pages; Site Administrator of the public site |
| claramurphy (Marketing Manager, Marketing) | Owns marketing content; approves articles |
| christiancarter (Marketing Coordinator, Marketing) | Writes articles, FAQs, announcements |
| harperroberts (HR Specialist, Human Resources) | Job listings |
| danielraymond (Distributor Representative, Support Agents) | Follows up Contact Us requests |
| terrencewheatley (Distributor, external, Distributors) | Signs in to the public site |

User groups and roles: `context-source/data/user-groups.csv`, `context-source/data/roles.csv` (brief section 2).

## The two sites

| Site | ERC | Friendly URL | Notes |
| --- | --- | --- | --- |
| Clarity Public Enterprise Website | `clarity-public` | `/clarity` | Public marketing site; virtual host `www.clarityvisionsolutions.com`; open membership; en_US (default) + es_ES; accessibility menu on |
| Clarity Distributor Portal | `clarity-distributor-portal` | `/distributor-portal` | Future B2B storefront, created empty |

Instance home, default landing and logout pages: `/web/clarity`. Site map, master pages and menus: brief sections 3-4.

## Where the content lives

Editorial content lives in Liferay CMS Spaces, not Classic Web Content: Marketing (Article, FAQ, Announcement, Leadership Profile), Branding (files), HR (Job Listing), Events (Event Information, Event Image), Products (files). Taxonomy and commerce: brief sections 6-7. Sample content: `context-source/content/`, images in `context-source/assets/`, legacy data in `context-source/legacy-import/`.

## Requirements

R1-R13 (brief section 8) are tracked in `solution-index.yaml`.

## Where the build stands

Setup and Levels 1–6 (Day 1) are done (from the `catch-up/day-2-start` kit): R1–R6 are `done` in `solution-index.yaml`, and the next exercise is Level 7. The site's structure lives in `client-extensions/clarity-site`; deploy it with `scripts/deploy_site.sh`. Data that isn't in the tree is created by the re-runnable scripts in `scripts/`, listed in the kit's README.
