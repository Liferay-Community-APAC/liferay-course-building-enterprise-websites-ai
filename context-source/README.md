# Context source

Everything the course's prompts read: the brief, the sample content, the images and the data. Your agent reads these files instead of you typing content into prompts. Nothing here is deployed as is: the exercises tell the agent what to build from it.

| Path | What it is | Used in |
| --- | --- | --- |
| `clarity-brief.md` | The customer brief: goals, personas, sites, site map, brand, content model, requirements R1–R13 | Every level |
| `data/personas.csv` | The seven Clarity personas (all passwords `learn`) with user groups, roles and portraits | Level 1 |
| `data/user-groups.csv`, `data/roles.csv` | Clarity's user groups and custom roles | Level 1 |
| `data/job-taxonomy.csv` | Region, Location and Job Positions categories for job listings | Level 6 |
| `data/products.csv` | The three products created one by one in Level 8 | Level 8 |
| `content/articles.json` | Three articles for the *Helpful Articles* collection | Levels 6, 7 |
| `content/faqs.json` | Eight FAQ entries, each with its FAQ category | Levels 6, 7 |
| `content/announcements.json` | The header announcement | Levels 6, 7 |
| `content/leadership-profiles.json` | Eight leadership profiles with portraits | Levels 3, 6 |
| `content/job-listings.json` | Ten job listings with region, location and job position | Levels 6, 11 |
| `content/about-us.json`, `content/legal-pages.json` | About Us copy; Cookie Policy, Terms of Use, Privacy Policy | Level 6 |
| `content/events.json` | The Clarity Vision Showcase event and its image | Level 6 |
| `content/hiring-events.json` | Hiring events (Event Information entries), dated relative to today | Level 11 |
| `content/blog-posts.json` | 27 blog posts with images: extra content for your own experiments | — |
| `legacy-import/` | Content from Clarity's old portal, imported through the APIs: three articles, eight products, twelve office locations and a blog post | Level 9 |
| `assets/branding/` | Logos (SVG and PNG, several shapes) and the favicon | Levels 5, 6 |
| `assets/marketing/` | Banners, promotions, category images and article images | Levels 6, 7, 8 |
| `assets/leadership/`, `assets/personas/` | Portraits | Levels 1, 6 |
| `assets/products/`, `assets/blog/`, `assets/error-pages/` | Product, blog and error page images | Levels 6, 8, 9 |
| `design-reference/clarity-components/` | The fragments of Clarity's previous site (HTML, CSS, configuration): a visual reference for the fragments you generate | Level 4 |
| `design-reference/compositions/` | Page compositions exported from Clarity's previous site (Home, FAQ, Leadership Profile): a layout reference | Levels 4, 7 |

Rich text fields are stored as HTML. Images are referenced by their path from this folder.
