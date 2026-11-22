# Instructor demo workbook

The demos you run on the projector, in course order. Learners don't do these: some cover topics with no exercise (the slides marked *Instructor only*), and the rest show a screen or a behavior before learners meet it in a level. Use it with the [schedule](schedule.html) and the speaker notes.

## How to use this workbook

**Run the demos on your own finished build.** The day before the course you run the whole workbook from a clean clone (see the [instructor guide](index.html)). Keep that instance: every demo here assumes the Clarity site exists end to end, with the personas, content, products, workflows and objects. When a demo needs something more (a key, a backup, a pending entry), its 🧰 **Prepare** block says how to get it, sometimes with a prompt. The checklists below collect every preparation and cleanup by day.

Each demo has, in this order:

- 🕒 **When:** how long it takes, the slide it belongs to, and the moment in the course.
- 🎯 **Show:** what it shows, in one line.
- 💡 **Say:** the takeaway. Open the demo with it.
- 🧰 **Prepare:** what to set up, in the break before the block. A preparation prompt sits under the step that needs it.
- 📋 **Steps:** what you click, in order, and what the room should see (**expect:**). Demos are read-only unless a step says otherwise.
- 💬 **Live prompt** (optional): a prompt you run during the demo. Its first words say which step it is, or which steps it replaces. Your agent is set up exactly like a learner's (Setup S.0 to S.4).
- 🧹 **After the demo:** cleanup, if any. It's also in the After class checklist.

A demo leaves out the blocks it doesn't need.

Personas sign in with password `learn`. Use a **private window** for any persona or Guest, so your admin session stays signed in.

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

## After class

- [D1.4](#d14-setup-s1-on-the-projector): put your copies of `solution-context.md` and `solution-index.yaml` back (right after the demo).
- [D2.3](#d23-generative-ai-in-dxp-ai-creator): remove the OpenAI API key and save (right after the demo).
- [D2.9](#d29-a-pending-workflow-task): delete the demo entry, or ask the agent to.
- [D2.11](#d211-an-object-its-picklist-and-its-form): delete your test Contact Us entry.
- [D2.13](#d213-page-audit): remove the PageSpeed API key and save (right after the demo).

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

## Day 1

### D1.1 — Tour of the finished Clarity site

🕒 **8 minutes** · Day 1, slide 6 · with *Tour of the finished Clarity site* (instructor only)

🎯 **Show:** the site learners will build in two days, seen as a visitor and as a distributor.

💡 **Say:** every page, menu, product and piece of content here is generated by the agent from `context-source/` and checked by the learner. Nothing is imported from a seeded database.

🧰 **Prepare** (in the break before):
1. Your finished build is running at `http://localhost:8080`.

📋 **Steps:**
1. In a private window, open `http://localhost:8080/web/clarity/home` → **expect:** the announcement bar, the main menu, search and **Sign In**. Point at each.
2. Click through **Products** (category cards), a category, then a product; **Blog**; **FAQ** (expand a question); **Careers** → **Open Positions**; **Contact Us** → **expect:** every page of the public site, with its content.
3. Sign in as `terrence.wheatley@distributor.com` → **expect:** Home now says **Welcome Back!** and the distributor promotion is gone. Sign out.
4. As you go, name the personas learners create in Level 1: Walter the web developer, Clara the marketing manager, Christian the marketing coordinator, Terrence the distributor.

### D1.2 — The first start of Liferay

🕒 **5 minutes** · Day 1, slide 10 · with *Running Liferay locally*

🎯 **Show:** what a healthy first start looks like, so learners recognize it in S.2.

💡 **Say:** you start Liferay in your own terminal, not through the agent: restarting Liferay drops the agent's MCP connection. And `bundles/` on your laptop is shared with the container: the agent deploys into `bundles/osgi/client-extensions` and reads `bundles/logs`.

🧰 **Prepare** (in the break before):
1. Stop your demo build (`docker compose stop`) so you can show a start from the beginning. Its data stays; the start just isn't the first one.
2. If you'd rather not restart, show the log of your dry run instead (`docker compose logs liferay`).

📋 **Steps:**
1. In VS Code's terminal: `docker compose up -d` → **expect:** three containers: the database, a one-off `clarity-liferay-init` that prepares `bundles/`, and Liferay.
2. `docker compose logs -f liferay` → **expect:** `Server startup in [...] milliseconds`. Press `Ctrl+C` (it stops following, not Liferay). `docker compose ps` now shows both as *healthy*. Tell learners their first start also creates the database, so it takes a few minutes longer, and that the commands are the same on macOS, Windows and Linux.
3. Open `http://localhost:8080` and sign in as `admin@clarityvisionsolutions.com` → **expect:** you're signed in. Tell learners that on their first sign-in they see a *Terms of Use* notice: they read it and close it with *Done*.

### D1.3 — The agent connected to Liferay's MCP server

🕒 **5 minutes** · Day 1, slide 11 · with *MCP: how the agent talks to Liferay*

🎯 **Show:** the two switches that turn on MCP, and the agent using it.

💡 **Say:** the agent calls the same headless APIs a script would, with the permissions of the user it signs in as. If the list of tools is empty, Liferay restarted since the session began: reconnect.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → **MCP Server** → **expect:** *Enabled* is checked. Don't change it.
2. In your agent, list its MCP servers (Claude Code: `/mcp`) → **expect:** **liferay** is connected.
3. Ask the live prompt below → **expect:** the answer comes from the server, and the agent names the MCP tools it called.

💬 **Live prompt:** as step 3, ask:
```
Using the liferay MCP server, list the tool sets it offers, then list the
sites in this instance with their external reference codes. Tell me which
MCP tools you called.
```

### D1.4 — Setup S.1 on the projector

🕒 **5 minutes** · Day 1, slide 12 · at the Setup challenge

🎯 **Show:** the prompt-then-verify loop, once, before learners try it.

💡 **Say:** the verify step is yours, not the agent's: open the file and check it against the brief.

🧰 **Prepare** (in the break before):
1. S.1 rewrites `solution-context.md` and `solution-index.yaml`, and your finished build's index records all 13 requirements as done. Keep a copy:
   ```bash
   mkdir -p ~/courses/s1-backup
   cp solution-context.md solution-index.yaml ~/courses/s1-backup/
   ```

📋 **Steps:**
1. Run [S.1 from the workbook](../workbook/#s1-seed-the-context-files) in a new agent session → **expect:** the agent rewrites `solution-context.md` and `solution-index.yaml`.
2. Open both files → **expect:** `solution-context.md` fits on a screen or two and names the personas; `solution-index.yaml` lists the 13 requirements, all `status: todo`, which is where learners start.

🧹 **After the demo:** right away, put your copies back:
```bash
cp ~/courses/s1-backup/solution-context.md ~/courses/s1-backup/solution-index.yaml .
```

### D1.5 — Liferay Data Platform

🕒 **8 minutes** · Day 1, slide 15 · with *Knowing what visitors actually did* (instructor only)

🎯 **Show:** where visitor analytics and segmentation live now that DXP segments are deprecated.

💡 **Say:** on 2026.Q1 and later, Data Platform is the source of truth for segments. That's why Level 13 targets signed-in users by user group instead.

🧰 **Prepare** (in the break before):
1. Get access to a Liferay Data Platform workspace connected to a DXP instance, for example a Liferay demo environment. If you have none, present the slide and skip the demo.

📋 **Steps:**
1. In the Data Platform workspace, open the site dashboard, then a page and a piece of content → **expect:** views, visitors, engagement.
2. Open one individual's profile → **expect:** its activity.
3. Open the segment builder and a segment → **expect:** the segment's criteria.
4. Back in DXP: *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → **Analytics Cloud** → **expect:** the connection settings. Don't change them.

### D1.6 — Roles: who holds them, and why the API differs

🕒 **4 minutes** · Day 1, slide 18 · with *Users, user groups and roles*

🎯 **Show:** who holds a role: users directly, or through a user group.

💡 **Say:** in the UI you can assign a role to a user group; the headless API assigns roles to users only, so in Level 1 the agent assigns them one by one.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Roles* → *Regular Roles* → **Marketing Coordinator** → *Assignees* → **expect:** the *Users* and *User Groups* tabs. Show both.
2. *Global Menu* → *Control Panel* → *User Groups* → **Marketing** → **expect:** its members.

### D1.7 — Site settings and instance settings

🕒 **4 minutes** · Day 1, slide 22 · with *Instances and sites*

🎯 **Show:** which settings belong to one site and which apply to the whole instance.

💡 **Say:** a second instance separates users, content and configuration; Clarity only needs two sites.

📋 **Steps:**
1. *Site Menu* (Clarity Public Enterprise Website) → *Configuration* → *Site Settings* → **expect:** membership type, languages, virtual host.
2. *Global Menu* → *Control Panel* → *Instance Settings* → **expect:** the categories that apply to every site in the instance.

### D1.8 — Least privilege, as Christian

🕒 **6 minutes** · Day 1, slide 24 · at the Level 2 challenge, before learners run 2.4

🎯 **Show:** what a role's permissions change in the UI, seen through impersonation.

💡 **Say:** grant only what the job needs, and ask the agent to list a grant before it makes it.

🧰 **Prepare** (in the break before):
1. Optional: on your finished build, Christian already has the permissions. To show the before and after, remove them with this prompt. Without it, skip step 2, and in step 3 read the 2.4 prompt with the class instead of running it.
   ```
   Remove every permission the Marketing Coordinator role holds in the site
   clarity-public, and list what you removed. Change nothing else.
   ```

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Users and Organizations* → **Christian Carter** → actions menu (⋮) → *Impersonate User* → **expect:** a new tab opens as Christian.
2. In the impersonated tab, open the *Site Menu* → **expect:** no *Site Builder* or *Categorization* section. Close the tab.
3. Run [2.4](../workbook/#24-give-the-marketing-coordinator-role-its-permissions) → **expect:** the agent lists the permissions, with the class, before it grants them. Read the list.
4. Impersonate Christian again → **expect:** the sections are there now.

### D1.9 — The site initializer: folders in, pages out

🕒 **6 minutes** · Day 1, slide 26 · with *The site lives in code* (you can repeat it at the Level 3 challenge)

🎯 **Show:** the site initializer's folders, and the pages they produce.

💡 **Say:** a change made by hand in the page editor is overwritten by the next deploy. Changes that must stay go in the source tree.

📋 **Steps:**
1. In VS Code, open `client-extensions/clarity-site/site-initializer/layouts/` → **expect:** one folder per page, each with `page.json` and `page-definition.json`.
2. Open `layout-page-templates/master-pages/` and `site-navigation-menus.json`.
3. In the terminal, find the line that proves the initializer ran for this deploy → **expect:** the line where the clarity-site initializer finished for the Clarity Public Enterprise Website, with its timestamp.
4. *Site Menu* → *Site Builder* → *Pages* → **expect:** the same hierarchy as the folders.

💬 **Live prompt:** instead of searching the log by hand in step 3, ask:
```
Show me the last log line where the clarity-site site initializer finished
for the Clarity Public Enterprise Website, with its timestamp, and tell me
how you know it's from the latest deploy.
```

### D1.10 — Inside a master page

🕒 **4 minutes** · Day 1, slide 28 · with *Master pages, page templates, display page templates*

🎯 **Show:** the named containers and the drop zone inside a master page.

💡 **Say:** the container names become `data-name` attributes that later levels rely on.

📋 **Steps:**
1. *Site Menu* → *Design* → *Page Templates* → *Masters* → **Primary Master Page**.
2. Open the *Browser* panel (left sidebar) → **expect:** the named containers (*Header Announcement Bar*, the navigation bar, the drop zone, the footer).
3. Select the drop zone → **expect:** it limits which fragments authors can drop into pages.
4. Leave without publishing.

### D1.11 — A fragment's configuration and code

🕒 **4 minutes** · Day 1, slide 32 · with *Fragments are the building blocks* (or at the Level 4 challenge)

🎯 **Show:** a fragment's code and configuration, in the editor and on a page.

💡 **Say:** Liferay copies fragment code into each page when it's placed, which is why the agent deploys fragments before pages.

📋 **Steps:**
1. *Site Menu* → *Design* → *Fragments* → **Clarity Components** → **Search Button** → *Edit*.
2. Show the HTML, CSS and JavaScript panes, then the *Configuration* tab and the preview → **expect:** the fragment's code, its configuration and its preview.
3. Leave without publishing.
4. Open **Home** in edit mode (pencil icon) and select the search button → **expect:** its configuration appears in the right panel.

### D1.12 — Brand tokens in the page editor

🕒 **3 minutes** · Day 1, slide 37 · with *Style book or Theme CSS*

🎯 **Show:** the brand colors offered as named tokens in the page editor.

💡 **Say:** those names come from `frontend-token-definition.json` in the Theme CSS client extension the agent wrote in 5.2.

📋 **Steps:**
1. Open the **Primary Master Page** in its editor (*Site Menu* → *Design* → *Page Templates* → *Masters*).
2. Select the *Header Announcement Bar* container → *Styles* → *Background* → **expect:** the color picker offers **Color Brand Primary** and its shades.
3. Leave without publishing.

### D1.13 — A Space, its members and its connected site

🕒 **6 minutes** · Day 1, slides 41 to 43 · with *Spaces*, *Content and file structures*, *Categories or tags*

🎯 **Show:** the CMS Spaces, who belongs to them, and the site each one connects to.

💡 **Say:** one Space can connect to many sites. When a page shows content to the admin but not to Guest, check the Space's connected sites and Guest access first.

📋 **Steps:**
1. *Global Menu* → *CMS* → **expect:** the sidebar lists the five Spaces.
2. Open **Marketing** → its settings → **expect:** *Members* and *Connected Sites* (**Clarity Public Enterprise Website**).
3. *Content Structures* → **Event Information** → **expect:** its fields, and that only the Events Space can use it.
4. Open the **HR** Space → *Categories* → **Location** → **expect:** on the finished build, 26 categories (14 from Level 6, twelve more from the Level 9 batch import). Learners at Level 6 have 14, because the Level 9 import hasn't run yet.

## Day 2

### D2.1 — Mapping, not copying

🕒 **4 minutes** · Day 2, slide 5 · with *Map content, don't copy it*

🎯 **Show:** a page that maps content from a Space instead of holding a copy.

💡 **Say:** the content lives once in its Space; the page holds only the mapping.

📋 **Steps:**
1. Open **Home** in edit mode.
2. Select the hero banner's image → **expect:** in the right panel, its source reads *Mapping* to a file in the Marketing Space.
3. Select a Clarity Card inside the Helpful Articles collection display → **expect:** its fields are mapped to the Article structure.
4. Leave without publishing.

### D2.2 — A display page as a visitor

🕒 **3 minutes** · Day 2, slide 6 · with *Display page templates*

🎯 **Show:** display pages as a visitor sees them, and the templates behind them.

💡 **Say:** one template renders every entry of a structure. A display page that answers 404 for Guest usually means the Space isn't connected or Guest can't view the entry.

📋 **Steps:**
1. In a private window, open Home and click a Helpful Articles card → **expect:** the URL is the article's display page.
2. Open a Leadership Profile entry's display page (ask the agent for one profile's URL, as in 7.2) → **expect:** a different template, on the Secondary master.
3. As admin: *Site Menu* → *Design* → *Page Templates* → *Display Page Templates* → **expect:** the **Article** and **Leadership Profile** templates.

### D2.3 — Generative AI in DXP: AI Creator

🕒 **6 minutes** · Day 2, slide 8 · with *Generative AI built into DXP* (instructor only)

🎯 **Show:** authors writing and illustrating content with AI inside Liferay.

💡 **Say:** DXP's AI helps authors inside the product; the coding agent builds the site from outside it. The key is instance-wide configuration that an administrator owns.

🧰 **Prepare** (in the break before):
1. Have an OpenAI API key you're allowed to use for demos. Type it into the settings form yourself; never paste it into an agent chat or the repository. Without a key, show step 1 and the slide only.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Instance Settings* → *Content and Data* → **AI Creator** → **expect:** the OpenAI API key, *Enable ChatGPT to Create Content* and *Enable DALL-E to Create Images*. Save with your key.
2. *Global Menu* → *CMS* → **Marketing** → open an Article entry. In a rich text field, use the editor's AI Creator action: ask for a 50-word summary, then insert it → **expect:** the summary appears in the field.
3. Don't publish: cancel the edit → **expect:** nothing is saved.

🧹 **After the demo:** remove the key and save.

### D2.4 — Auto-tagging, and where AI Hub fits

🕒 **4 minutes** · Day 2, slide 9 · with *Auto-tagging and AI Hub* (instructor only)

🎯 **Show:** the auto-tagging settings in DXP, and where AI Hub sits beside them.

💡 **Say:** AI Hub is a separate product in its own SaaS environment: its agents are built in an Agent Builder and run on Liferay workflow. Show it only if you have an AI Hub environment to demo.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Instance Settings* → *Content and Data* → **Assets** → **expect:** *Asset Auto Tagging*, *OpenNLP Text Auto Tagging*, and the image auto-tagging providers (Google Cloud Vision, Microsoft Cognitive Services, TensorFlow).
2. Open *OpenNLP Text Auto Tagging* → **expect:** its settings. Don't save.

### D2.5 — Collections, from Home to Site Builder

🕒 **5 minutes** · Day 2, slide 10 · at the Level 7 challenge

🎯 **Show:** the collections behind Home and FAQ, from the visitor's view to their definition.

💡 **Say:** a dynamic collection updates itself when content is added; a manual one (bonus 7.6) is hand-picked.

📋 **Steps:**
1. In a private window, show Home, then click a card → **expect:** the three Clarity Cards; the card opens its display page.
2. As admin: *Site Menu* → *Site Builder* → **Collections** → **expect:** Helpful Articles, one FAQ collection per category, Announcements and Blog Posts, all *Dynamic*.
3. Open **Helpful Articles** → **expect:** item type *Article (CMS)*, its filter and order.
4. Open FAQ in a private window and expand *What is your return policy?* under Returns and Exchanges → **expect:** the answer appears.

### D2.6 — The product journey

🕒 **5 minutes** · Day 2, slides 13 and 15 · with the product pages, then at the Level 8 challenge

🎯 **Show:** a product from the visitor's journey back to the catalog and channel behind it.

💡 **Say:** there's no price or cart: the channel showcases products and doesn't take orders.

📋 **Steps:**
1. In a private window: **Products** → a category card → the product list → a product → **expect:** the product's display page with name, SKU, description, specifications and **Contact Sales**.
2. As admin: *Global Menu* → *Commerce* → *Products* → **expect:** the Clarity Eyewear catalog.
3. *Global Menu* → *Commerce* → *Specifications* → *Specification Labels* → **expect:** Frame Material and Frame Color are marked *Use in Faceted Navigation*.
4. *Global Menu* → *Commerce* → *Channels* → **Clarity Public** → *Type* → **expect:** linked to **Clarity Public Enterprise Website**.

### D2.7 — The API Explorer

🕒 **5 minutes** · Day 2, slide 17 · with *Everything your agent did went through these*

🎯 **Show:** the headless API behind the agent's work, called by hand and by the agent.

💡 **Say:** it's the same call the agent made in Setup S.3. The MCP server exposes these APIs; it doesn't add new ones.

📋 **Steps:**
1. Open `http://localhost:8080/o/api` while signed in as the admin.
2. *REST Applications* → **headless-admin-user** → `GET /v1.0/my-user-account` → *Execute* → **expect:** Clarity Admin.
3. Ask the live prompt below → **expect:** the same name and email as your call in step 2. Compare them.

💬 **Live prompt:** as step 3, ask:
```
Using the liferay MCP server, call the operation that returns my own user
account, and show me the operation name and the name and emailAddress it
returns. Don't call anything else.
```

### D2.8 — A batch import task

🕒 **4 minutes** · Day 2, slide 18 · with *Batch imports of legacy data*

🎯 **Show:** a Level 9 batch import, checked as one task.

💡 **Say:** hundreds of items are one call and one task to check.

📋 **Steps:**
1. Ask the live prompt below → **expect:** the import task ID from Level 9.2.
2. In the API Explorer: **headless-batch-engine** → `GET /v1.0/import-task/{importTaskId}` with that ID → *Execute* → **expect:** `executeStatus` is **COMPLETED**, with the processed item count.
3. In a private window, open **Blog** → **expect:** the imported post.

💬 **Live prompt:** as step 1, ask:
```
Find the most recent batch import task in this instance and show me its id,
className, executeStatus and processedItemsCount. Read only.
```

### D2.9 — A pending workflow task

🕒 **6 minutes** · Day 2, slide 23 · at the Level 10 challenge, before learners start Level 10

🎯 **Show:** content waiting for approval, as the approver sees it.

💡 **Say:** nothing reaches visitors before approval. This is how Clarity publishes now that Publications is in maintenance mode.

🧰 **Prepare** (in the break before):
1. Create a pending article with this prompt, so you don't reuse the learners' 10.2 article:
   ```
   Authenticating as Christian Carter (christian.carter@clarityvisionsolutions.com,
   password learn), create a draft Article entry in the Marketing Space titled
   "Demo: Autumn Collection Preview" with a one-sentence body, and submit it for
   workflow. Show me its status. Don't approve it.
   ```

📋 **Steps:**
1. *Global Menu* → *Applications* → *Process Builder* → **expect:** **Clarity Article Approval** and **Contact Us Follow Up**.
2. In a private window, sign in as `clara.murphy@clarityvisionsolutions.com`. The avatar, top right → *My Workflow Tasks* → *Assigned to My Roles* → **expect:** the review task. Open it, show the *Approve* and *Reject* transitions, and don't act.
3. As admin: *Global Menu* → *CMS* → **Marketing** → **expect:** the entry is **Pending**.
4. Open Home as Guest → **expect:** it doesn't show the entry.

🧹 **After the demo:** after class, delete the demo entry, or ask the agent to.

### D2.10 — Search, facets and a blueprint

🕒 **8 minutes** · Day 2, slides 25 to 27 · with search and Search Blueprints

🎯 **Show:** site search, facets, and blueprints that shape results without code.

💡 **Say:** each search widget reads the same query; a blueprint shapes that query without code.

📋 **Steps:**
1. In a private window, use the search bar in the header → **expect:** results from pages and CMS content.
2. From the **Careers** banner, open **Open Positions**, search **Developer** and narrow by the *Remote* location → **expect:** the results narrow to remote positions.
3. As admin: *Global Menu* → *Applications* → *Blueprints* → **Boost Associate Job Listings** → *Preview*, search **Associate** → **expect:** Associate positions rank first. Close without saving.
4. Open **Events** in a private window → **expect:** only upcoming events, from the **Future Events** blueprint.

### D2.11 — An object, its picklist and its form

🕒 **8 minutes** · Day 2, slides 31 and 33 · with *Liferay Objects*, then at the Level 12 challenge

🎯 **Show:** the Contact Us object, its translated picklist, and a submission from form to Data Set.

💡 **Say:** Guest can add entries but never view them; the Distributor Representative sees them through the Data Set.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Objects* → **Contact Us** → **expect:** published, scope *Site*, seven fields.
2. *Global Menu* → *Control Panel* → *Picklists* → **Inquiry Types**. Switch the language selector to Spanish → **expect:** *Ventas, Soporte, Asociación, General*.
3. In a private window, submit the **Contact Us** form with test data → **expect:** the form is submitted. This creates a real entry.
4. In a private window, sign in as `daniel.raymond@clarityvisionsolutions.com` and open `/web/clarity/contact-us-responses` → **expect:** the Data Set lists the new submission, pending review.
5. Ask the live prompt below → **expect:** the same entry, through the API.

💬 **Live prompt:** as step 5, ask:
```
List the Contact Us entries of the site clarity-public created today, with
their title, inquiry type and workflow status. Read only.
```

🧹 **After the demo:** after class, delete your test entry.

### D2.12 — Personalization by audience

🕒 **6 minutes** · Day 2, slides 35 and 36 · with *Segments and experiences* (instructor only), then at the Level 13 challenge

🎯 **Show:** one Home page that shows a different banner to signed-in distributors.

💡 **Say:** the check runs on the server, so hidden content never reaches the browser. DXP segments and experiences are deprecated; anonymous personalization belongs to Liferay Data Platform (D1.5).

📋 **Steps:**
1. Open **Home** in edit mode → **expect:** both banners show, each labeled *Shown to everyone except signed-in members of Distributors* or *Shown only to signed-in members of Distributors*. Leave without publishing.
2. *Site Menu* → *Design* → *Fragments* → **expect:** **Clarity Audience Container**, with its user group and mode settings.
3. In a private window, open Home as Guest, then sign in as `terrence.wheatley@distributor.com` → **expect:** **Welcome Back!**, and no distributor promotion. Sign out → **expect:** the promotion is back.

### D2.13 — Page Audit

🕒 **4 minutes** · Day 2, slide 38 · with *Test, audit, monitor, upgrade* (instructor only)

🎯 **Show:** a page audit of accessibility and SEO, run from the page itself.

💡 **Say:** performance and quality checks are ongoing: rerun them after every code or infrastructure change.

🧰 **Prepare** (in the break before):
1. Get a Google PageSpeed Insights API key.
2. Use a demo environment with a public URL: PageSpeed fetches the page from Google's servers, so it can't audit `localhost`. Without one, present the slide only.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Instance Settings* → *Content and Data* → **Pages** → *Google PageSpeed Insights*: enable it with your key → **expect:** Google PageSpeed Insights is enabled.
2. Open the public Home page and the *Page Audit* panel from the top bar. Run the audit → **expect:** the accessibility and SEO findings. Walk through them.

🧹 **After the demo:** remove the PageSpeed API key from *Instance Settings* → *Pages* → *Google PageSpeed Insights* and save.
