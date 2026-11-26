# Instructor demo workbook

The demos you run on the projector, in course order. Learners don't do these: some cover topics with no exercise (the slides marked *Instructor only*), and the rest show a screen or a behavior before learners meet it in a level.

## How the workbook works

It follows the course, like the learners' workbook: a page per teaching block, in schedule order (the level list in the sidebar). Use the checklists below the evening before each day, then open each block's page as you reach it.

**Each page opens with** the block's length, its slides, and the learners' workbook level it goes with, a one-line summary of what learners do in it, and its demos with their minutes.

**Each demo uses the same blocks, in this order.** A demo leaves out the blocks it doesn't need.

| Block | Meaning |
| --- | --- |
| 🕒 **When** | How long it takes, the slide it belongs to, and the moment in the block. |
| 🎯 **Show** | What it shows, in one line. |
| 💡 **Say** | The takeaway. Open the demo with it. |
| 🧰 **Prepare** | What to set up in the break before the block. A preparation prompt sits under the step that needs it. |
| 📋 **Steps** | What you click, in order, and what the room should see (**expect:**). Read-only unless a step says otherwise. |
| 💬 **Live prompt** | Optional: a prompt you run during the demo. Its first words say which step it is, or which steps it replaces. |
| 🧹 **After the demo** | Cleanup, if any. It's also in the After class checklist. |

**Each level's page ends with its Knowledge check answers.** Learners answer three questions on their own at the end of the level, in their workbook, while their last prompt runs; then you go over them with the class (about 5 minutes, included in the block's time in the [schedule](schedule.html)). For each question the page gives the answer (✔) and why, why each other option is wrong, and an **Ask next** question to take the discussion one step further.

## Working rules

- **Run the demos on your own finished build.** The week before the course you run the whole learners' workbook from a clean clone (see the [instructor guide](index.html)). Keep that instance: every demo assumes the Clarity site exists end to end, with the personas, content, products, workflows and objects.
- **Your agent is set up exactly like a learner's** (Setup S.0 to S.4), so a live prompt behaves as it will on their laptops.
- **Personas sign in with password `learn`.** Use a **private window** for any persona or Guest, so your admin session stays signed in.
- **Use it with** the [schedule](schedule.html) and the speaker notes: press N in the slides, or **▶ Present** (P) to show the deck full screen and open a presenter view in a new window, with the timer, the current and next slides and the notes, like Google Slides. Drag the presenter window to your laptop screen and the deck to the projector.

## Before Day 1

- [D1.1](#d11-tour-of-the-finished-clarity-site): your finished build is running at `http://localhost:8080`.
- [D1.2](#d12-the-first-start-of-liferay): stop your demo build, or have its log ready.
- [D1.4](#d14-setup-s1-on-the-projector): back up `solution-context.md` and `solution-index.yaml`.
- [D1.5](#d15-liferay-data-platform): access to a Liferay Data Platform workspace connected to a DXP instance, or plan to present the slide only.
- [D1.8](#d18-least-privilege-as-christian): optional, remove Christian's site permissions with the reset prompt.

## Before Day 2

- [D2.3](#d23-generative-ai-in-dxp-ai-creator): an OpenAI API key you're allowed to use for demos.
- [D2.9](#d29-a-pending-workflow-task): create the pending demo article with the prompt.
- [D2.13](#d213-page-audit): a Google PageSpeed Insights API key and a demo environment with a public URL.
- [D2.14](#d214-an-ai-hub-chatbot-on-the-clarity-site) (optional, bonus Level 14): Level 14 done on your demo build, and the AI Hub mock ready to start.

## After class

- [D1.4](#d14-setup-s1-on-the-projector): put your copies of `solution-context.md` and `solution-index.yaml` back (right after the demo).
- [D2.3](#d23-generative-ai-in-dxp-ai-creator): remove the OpenAI API key and save (right after the demo).
- [D2.9](#d29-a-pending-workflow-task): delete the demo entry, or ask the agent to.
- [D2.11](#d211-an-object-its-picklist-and-its-form): delete your test Contact Us entry.
- [D2.13](#d213-page-audit): remove the PageSpeed API key and save (right after the demo).
- [D2.14](#d214-an-ai-hub-chatbot-on-the-clarity-site): stop the AI Hub mock (`Ctrl+C` in its terminal).

## Roadmap

Every demo in course order. **Demo** jumps to its steps below, **Slides** opens the deck at that slide, and **Level** opens the workbook chapter learners do next (*Slides only* means a topic with no exercise, from the slides marked *Instructor only*). **Prepare** names anything to set up in the break before. Cleanup is in the [After class](#after-class) checklist.

**Day 1** · 13 demos, about 68 minutes

| Demo | Slides | Level | Minutes | Prepare |
| --- | --- | --- | --- | --- |
| [D1.1 — Tour of the finished Clarity site](#d11-tour-of-the-finished-clarity-site) | [6](slides/day-1.html#6) | Slides&nbsp;only | 8 | Your finished build running |
| [D1.2 — The first start of Liferay](#d12-the-first-start-of-liferay) | [10](slides/day-1.html#10) | [Setup](../workbook/#setup-your-workspace-liferay-dxp-and-the-mcp-server) | 5 | Restart your build, or use its log |
| [D1.3 — The agent connected to Liferay's MCP server](#d13-the-agent-connected-to-liferays-mcp-server) | [11](slides/day-1.html#11) | [Setup](../workbook/#setup-your-workspace-liferay-dxp-and-the-mcp-server) | 5 | — |
| [D1.4 — Setup S.1 on the projector](#d14-setup-s1-on-the-projector) | [12](slides/day-1.html#12) | [Setup](../workbook/#setup-your-workspace-liferay-dxp-and-the-mcp-server) | 5 | Back up two files |
| [D1.5 — Liferay Data Platform](#d15-liferay-data-platform) | [15](slides/day-1.html#15) | Slides&nbsp;only | 8 | A Data Platform workspace |
| [D1.6 — Roles: who holds them, and why the API differs](#d16-roles-who-holds-them-and-why-the-api-differs) | [18](slides/day-1.html#18) | [Level 1](../workbook/#level-1-users-and-permissions) | 4 | — |
| [D1.7 — Site settings and instance settings](#d17-site-settings-and-instance-settings) | [22](slides/day-1.html#22) | [Level 2](../workbook/#level-2-sites) | 4 | — |
| [D1.8 — Least privilege, as Christian](#d18-least-privilege-as-christian) | [24](slides/day-1.html#24) | [Level 2](../workbook/#level-2-sites) | 6 | Optional reset prompt |
| [D1.9 — The site initializer: folders in, pages out](#d19-the-site-initializer-folders-in-pages-out) | [26](slides/day-1.html#26) | [Level 3](../workbook/#level-3-pages-master-pages-and-navigation) | 6 | — |
| [D1.10 — Inside a master page](#d110-inside-a-master-page) | [28](slides/day-1.html#28) | [Level 3](../workbook/#level-3-pages-master-pages-and-navigation) | 4 | — |
| [D1.11 — A fragment's configuration and code](#d111-a-fragments-configuration-and-code) | [32](slides/day-1.html#32) | [Level 4](../workbook/#level-4-fragments-and-page-compositions) | 4 | — |
| [D1.12 — Brand tokens in the page editor](#d112-brand-tokens-in-the-page-editor) | [37](slides/day-1.html#37) | [Level 5](../workbook/#level-5-design-style-book-theme-css-favicon-and-logo) | 3 | — |
| [D1.13 — A Space, its members and its connected site](#d113-a-space-its-members-and-its-connected-site) | [41–43](slides/day-1.html#41) | [Level 6](../workbook/#level-6-content-in-liferay-cms) | 6 | — |

**Day 2** · 13 demos, about 68 minutes

| Demo | Slides | Level | Minutes | Prepare |
| --- | --- | --- | --- | --- |
| [D2.1 — Mapping, not copying](#d21-mapping-not-copying) | [5](slides/day-2.html#5) | [Level 7](../workbook/#level-7-displaying-content-mapping-display-pages-and-collections) | 4 | — |
| [D2.2 — A display page as a visitor](#d22-a-display-page-as-a-visitor) | [6](slides/day-2.html#6) | [Level 7](../workbook/#level-7-displaying-content-mapping-display-pages-and-collections) | 3 | — |
| [D2.3 — Generative AI in DXP: AI Creator](#d23-generative-ai-in-dxp-ai-creator) | [8](slides/day-2.html#8) | Slides&nbsp;only | 6 | An OpenAI API key |
| [D2.4 — Auto-tagging, and where AI Hub fits](#d24-auto-tagging-and-where-ai-hub-fits) | [9](slides/day-2.html#9) | Slides&nbsp;only | 4 | — |
| [D2.5 — Collections, from Home to Site Builder](#d25-collections-from-home-to-site-builder) | [10](slides/day-2.html#10) | [Level 7](../workbook/#level-7-displaying-content-mapping-display-pages-and-collections) | 5 | — |
| [D2.6 — The product journey](#d26-the-product-journey) | [13](slides/day-2.html#13), [15](slides/day-2.html#15) | [Level 8](../workbook/#level-8-commerce-catalog-products-and-product-pages) | 5 | — |
| [D2.7 — The API Explorer](#d27-the-api-explorer) | [17](slides/day-2.html#17) | [Level 9](../workbook/#level-9-headless-apis-importing-legacy-data) | 5 | — |
| [D2.8 — A batch import task](#d28-a-batch-import-task) | [18](slides/day-2.html#18) | [Level 9](../workbook/#level-9-headless-apis-importing-legacy-data) | 4 | — |
| [D2.9 — A pending workflow task](#d29-a-pending-workflow-task) | [23](slides/day-2.html#23) | [Level 10](../workbook/#level-10-workflow-and-publishing) | 6 | A prompt that creates a pending article |
| [D2.10 — Search, facets and a blueprint](#d210-search-facets-and-a-blueprint) | [25–27](slides/day-2.html#25) | [Level 11](../workbook/#level-11-search-job-openings-blueprints-and-events) | 8 | — |
| [D2.11 — An object, its picklist and its form](#d211-an-object-its-picklist-and-its-form) | [31](slides/day-2.html#31), [33](slides/day-2.html#33) | [Level 12](../workbook/#level-12-objects-the-contact-us-form-and-its-follow-up) | 8 | — |
| [D2.12 — Personalization by audience](#d212-personalization-by-audience) | [35](slides/day-2.html#35), [36](slides/day-2.html#36) | [Level 13](../workbook/#level-13-personalization-a-home-page-for-distributors) | 6 | — |
| [D2.13 — Page Audit](#d213-page-audit) | [38](slides/day-2.html#38) | Slides&nbsp;only | 4 | A PageSpeed key and a public URL |
| [D2.14 — An AI Hub chatbot on the Clarity site](#d214-an-ai-hub-chatbot-on-the-clarity-site) (optional) | [42–44](slides/day-2.html#42) | [Level 14](../workbook/level-14.html) (bonus) | 8 | Level 14 done, the AI Hub mock |
