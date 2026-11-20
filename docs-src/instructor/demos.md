# Instructor demo workbook

The demos you run on the projector, in course order. Learners don't do these: some cover topics with no exercise (the slides marked *Instructor only*), and the rest show a screen or a behavior before learners meet it in a level. Use it with the [schedule](schedule.html) and the speaker notes.

## How to use this workbook

**Run the demos on your own finished build.** The day before the course you run the whole workbook from a clean clone (see the [instructor guide](index.html)). Keep that instance: every demo here assumes the Clarity site exists end to end, with the personas, content, products, workflows and objects. When a demo needs a fresh state, its 🧰 line says how to get it, often with a prompt.

Each demo has:

- 🕒 **When:** the slide it belongs to, and how long it takes.
- 🎯 **What it shows**, in one line.
- 🧰 **Before:** what to prepare. Do it during the break before the block.
- 📋 **Steps:** what you click, in order. Demos are read-only unless a step says otherwise.
- 💬 **Prompt** (optional): when it helps, ask your agent instead of clicking, or to prepare data. Your agent is set up exactly like a learner's (Setup S.0 to S.4).
- 💡 **Point out:** what learners should take from it.

Personas sign in with password `learn`. Use a **private window** for any persona or Guest, so your admin session stays signed in.

## Roadmap

Every demo in course order. **Demo** jumps to its steps below, **Slides** opens the deck at that slide, and **Level** opens the workbook chapter learners do next (*Slides only* means a topic with no exercise, from the slides marked *Instructor only*). **Prepare** names anything to set up in the break before.

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
| [D2.11 — An object, its picklist and its form](#d211-an-object-its-picklist-and-its-form) | [31](slides/day-2.html#31), [33](slides/day-2.html#33) | [Level 12](../workbook/#level-12-objects-the-contact-us-form-and-its-follow-up) | 8 | Delete the test entry after class |
| [D2.12 — Personalization by audience](#d212-personalization-by-audience) | [35](slides/day-2.html#35), [36](slides/day-2.html#36) | [Level 13](../workbook/#level-13-personalization-a-home-page-for-distributors) | 6 | — |
| [D2.13 — Page Audit](#d213-page-audit) | [38](slides/day-2.html#38) | Slides&nbsp;only | 4 | A PageSpeed key and a public URL |

## Day 1

### D1.1 — Tour of the finished Clarity site

🕒 **When:** Day 1 slide 6, *Tour of the finished Clarity site* (instructor only). 8 minutes.

🎯 The site learners will build in two days, seen as a visitor and as a distributor.

🧰 **Before:** your finished build is running at `http://localhost:8080`.

📋 **Steps:**
1. In a private window, open `http://localhost:8080/web/clarity/home`. Point at the announcement bar, the main menu, search and **Sign In**.
2. Click through **Products** (category cards), a category, then a product; **Blog**; **FAQ** (expand a question); **Careers** → **Open Positions**; **Contact Us**.
3. Sign in as `terrence.wheatley@distributor.com`. Home now says **Welcome Back!** and the distributor promotion is gone. Sign out.
4. As you go, name the personas learners create in Level 1: Walter the web developer, Clara the marketing manager, Christian the marketing coordinator, Terrence the distributor.

💡 **Point out:** every page, menu, product and piece of content here is generated by the agent from `context-source/` and checked by the learner. Nothing is imported from a seeded database.

### D1.2 — The first start of Liferay

🕒 **When:** Day 1 slide 10, *Running Liferay locally*. 5 minutes.

🎯 What a healthy first start looks like, so learners recognize it in S.2.

🧰 **Before:** stop your demo build (`docker compose stop`) so you can show a start from the beginning. Its data stays; the start just isn't the first one. If you'd rather not restart, show the log of your dry run instead (`docker compose logs liferay`).

📋 **Steps:**
1. In VS Code's terminal: `docker compose up -d`. Point out the three containers: the database, a one-off `clarity-liferay-init` that prepares `bundles/`, and Liferay.
2. `docker compose logs -f liferay`. Wait for `Server startup in [...] milliseconds`, then `Ctrl+C` (it stops following, not Liferay). `docker compose ps` now shows both as *healthy*. Tell learners their first start also creates the database, so it takes a few minutes longer, and that the commands are the same on macOS, Windows and Linux.
3. Open `http://localhost:8080` and sign in as `admin@clarityvisionsolutions.com`. On their first sign-in learners see a *Terms of Use* notice: they read it and close it with *Done*.

💡 **Point out:** you started Liferay in your own terminal, not through the agent: restarting Liferay drops the agent's MCP connection. And `bundles/` on your laptop is shared with the container: the agent deploys into `bundles/osgi/client-extensions` and reads `bundles/logs`.

### D1.3 — The agent connected to Liferay's MCP server

🕒 **When:** Day 1 slide 11, *MCP: how the agent talks to Liferay*. 5 minutes.

🎯 The two switches that turn on MCP, and the agent using it.

📋 **Steps:**
1. Global Menu (grid icon) → *Control Panel* → *Instance Settings* → *Platform* → **MCP Server**: *Enabled* is checked. Don't change it.
2. In your agent, list its MCP servers (Claude Code: `/mcp`): **liferay** is connected.
3. Ask the prompt below and show that the answer comes from the server.

💬 **Prompt:**
```
Using the liferay MCP server, list the tool sets it offers, then list the
sites in this instance with their external reference codes. Tell me which
MCP tools you called.
```

💡 **Point out:** the agent calls the same headless APIs a script would, with the permissions of the user it signs in as. If the list of tools is empty, Liferay restarted since the session began: reconnect.

### D1.4 — Setup S.1 on the projector

🕒 **When:** Day 1 slide 12, the Setup challenge. 5 minutes.

🎯 The prompt-then-verify loop, once, before learners try it.

🧰 **Before:** S.1 rewrites `solution-context.md` and `solution-index.yaml`, and your finished build's index records all 13 requirements as done. Keep a copy:
```bash
mkdir -p ~/courses/s1-backup
cp solution-context.md solution-index.yaml ~/courses/s1-backup/
```

📋 **Steps:**
1. Run [S.1 from the workbook](../workbook/#s1-seed-the-context-files) in a new agent session.
2. Open both files: `solution-context.md` fits on a screen or two and names the personas; `solution-index.yaml` lists the 13 requirements, all `status: todo`, which is where learners start.
3. Put your copies back:
   ```bash
   cp ~/courses/s1-backup/solution-context.md ~/courses/s1-backup/solution-index.yaml .
   ```

💡 **Point out:** the verify step is yours, not the agent's: open the file and check it against the brief.

### D1.5 — Liferay Data Platform

🕒 **When:** Day 1 slide 15, *Knowing what visitors actually did* (instructor only). 8 minutes.

🎯 Where visitor analytics and segmentation live now that DXP segments are deprecated.

🧰 **Before:** this demo needs access to a Liferay Data Platform workspace connected to a DXP instance, for example a Liferay demo environment. If you have none, present the slide and skip the demo.

📋 **Steps:**
1. In the Data Platform workspace, open the site dashboard, then a page and a piece of content: views, visitors, engagement.
2. Open one individual's profile and its activity.
3. Open the segment builder and show a segment's criteria.
4. Back in DXP: *Instance Settings* → *Platform* → **Analytics Cloud** shows the connection settings. Don't change them.

💡 **Point out:** on 2026.Q1 and later, Data Platform is the source of truth for segments. That's why Level 13 targets signed-in users by user group instead.

### D1.6 — Roles: who holds them, and why the API differs

🕒 **When:** Day 1 slide 18, *Users, user groups and roles*. 4 minutes.

📋 **Steps:**
1. *Control Panel* → *Roles* → *Regular Roles* → **Marketing Coordinator** → *Assignees*. Show the *Users* and *User Groups* tabs.
2. *Control Panel* → *User Groups* → **Marketing** → its members.

💡 **Point out:** in the UI you can assign a role to a user group; the headless API assigns roles to users only, so in Level 1 the agent assigns them one by one.

### D1.7 — Site settings and instance settings

🕒 **When:** Day 1 slide 22, *Instances and sites*. 4 minutes.

📋 **Steps:**
1. Site Menu (Clarity Public Enterprise Website) → *Configuration* → *Site Settings*: membership type, languages, virtual host.
2. Global Menu → *Control Panel* → *Instance Settings*: the categories that apply to every site in the instance.

💡 **Point out:** a second instance separates users, content and configuration; Clarity only needs two sites.

### D1.8 — Least privilege, as Christian

🕒 **When:** Day 1 slide 24, the Level 2 challenge, before learners run 2.4. 6 minutes.

🎯 What a role's permissions change in the UI, seen through impersonation.

🧰 **Before:** a fresh instance at the end of 2.3, or remove Christian's site permissions with the prompt below. Otherwise show steps 1 and 3 only.

📋 **Steps:**
1. *Control Panel* → *Users and Organizations* → **Christian Carter** → actions menu (⋮) → *Impersonate User*. A new tab opens as Christian.
2. In the impersonated tab, open the Site Menu: no *Site Builder* or *Categorization* section. Close the tab.
3. Run [2.4](../workbook/#24-give-the-marketing-coordinator-role-its-permissions). Read the agent's list of permissions with the class before it grants them.
4. Impersonate Christian again: the sections are there now.

💬 **Prompt (optional, to reset before step 1):**
```
Remove every permission the Marketing Coordinator role holds in the site
clarity-public, and list what you removed. Change nothing else.
```

💡 **Point out:** grant only what the job needs, and ask the agent to list a grant before it makes it.

### D1.9 — The site initializer: folders in, pages out

🕒 **When:** Day 1 slide 26, *The site lives in code*, and again at the Level 3 challenge. 6 minutes.

📋 **Steps:**
1. In VS Code, open `client-extensions/clarity-site/site-initializer/layouts/`: one folder per page, each with `page.json` and `page-definition.json`.
2. Open `layout-page-templates/master-pages/` and `site-navigation-menus.json`.
3. In the terminal, find the line that proves the initializer ran for this deploy, or ask the agent with the prompt.
4. Site Menu → *Site Builder* → *Pages*: the same hierarchy as the folders.

💬 **Prompt:**
```
Show me the last log line where the clarity-site site initializer finished
for the Clarity Public Enterprise Website, with its timestamp, and tell me
how you know it's from the latest deploy.
```

💡 **Point out:** a change made by hand in the page editor is overwritten by the next deploy. Changes that must stay go in the source tree.

### D1.10 — Inside a master page

🕒 **When:** Day 1 slide 28, *Master pages, page templates, display page templates*. 4 minutes.

📋 **Steps:**
1. Site Menu → *Design* → *Page Templates* → *Masters* → **Primary Master Page**.
2. Open the *Browser* panel (left sidebar): the named containers (*Header Announcement Bar*, the navigation bar, the drop zone, the footer).
3. Select the drop zone: it limits which fragments authors can drop into pages.
4. Leave without publishing.

💡 **Point out:** the container names become `data-name` attributes that later levels rely on.

### D1.11 — A fragment's configuration and code

🕒 **When:** Day 1 slide 32, *Fragments are the building blocks*, or at the Level 4 challenge. 4 minutes.

📋 **Steps:**
1. Site Menu → *Design* → *Fragments* → **Clarity Components** → **Search Button** → *Edit*.
2. Show the HTML, CSS and JavaScript panes, then the *Configuration* tab and the preview.
3. Leave without publishing.
4. Open **Home** in edit mode (pencil icon) and select the search button: its configuration appears in the right panel.

💡 **Point out:** Liferay copies fragment code into each page when it's placed, which is why the agent deploys fragments before pages.

### D1.12 — Brand tokens in the page editor

🕒 **When:** Day 1 slide 37, *Style book or Theme CSS*. 3 minutes.

📋 **Steps:**
1. Open the **Primary Master Page** in its editor.
2. Select the *Header Announcement Bar* container → *Styles* → *Background*: the color picker offers **Color Brand Primary** and its shades.
3. Leave without publishing.

💡 **Point out:** those names come from `frontend-token-definition.json` in the Theme CSS client extension the agent wrote in 5.2.

### D1.13 — A Space, its members and its connected site

🕒 **When:** Day 1 slides 41 to 43, *Spaces*, *Content and file structures*, *Categories or tags*. 6 minutes.

📋 **Steps:**
1. Global Menu → **CMS**. The sidebar lists the five Spaces.
2. Open **Marketing** → its settings: *Members* and *Connected Sites* (**Clarity Public Enterprise Website**).
3. *Content Structures* → **Event Information**: its fields, and that only the Events Space can use it.
4. Open the **HR** Space → *Categories* → **Location**: 26 categories on a finished build (14 from Level 6, twelve more from the Level 9 batch import).

💡 **Point out:** one Space can connect to many sites. When a page shows content to the admin but not to Guest, check the Space's connected sites and Guest access first.

## Day 2

### D2.1 — Mapping, not copying

🕒 **When:** Day 2 slide 5, *Map content, don't copy it*. 4 minutes.

📋 **Steps:**
1. Open **Home** in edit mode.
2. Select the hero banner's image. In the right panel, its source reads *Mapping* to a file in the Marketing Space.
3. Select a Clarity Card inside the Helpful Articles collection display: its fields are mapped to the Article structure.
4. Leave without publishing.

💡 **Point out:** the content lives once in its Space; the page holds only the mapping.

### D2.2 — A display page as a visitor

🕒 **When:** Day 2 slide 6, *Display page templates*. 3 minutes.

📋 **Steps:**
1. In a private window, open Home and click a Helpful Articles card. The URL is the article's display page.
2. Open a Leadership Profile entry's display page (ask the agent for one profile's URL, as in 7.2): a different template, on the Secondary master.
3. As admin: Site Menu → *Design* → *Page Templates* → *Display Page Templates*: the **Article** and **Leadership Profile** templates.

💡 **Point out:** one template renders every entry of a structure. A display page that answers 404 for Guest usually means the Space isn't connected or Guest can't view the entry.

### D2.3 — Generative AI in DXP: AI Creator

🕒 **When:** Day 2 slide 8, *Generative AI built into DXP* (instructor only). 6 minutes.

🎯 Authors writing and illustrating content with AI inside Liferay.

🧰 **Before:** an OpenAI API key you're allowed to use for demos. Type it into the settings form yourself; never paste it into an agent chat or the repository. Without a key, show step 1 and the slide only.

📋 **Steps:**
1. *Control Panel* → *Instance Settings* → *Content and Data* → **AI Creator**: the OpenAI API key, *Enable ChatGPT to Create Content* and *Enable DALL-E to Create Images*. Save with your key.
2. Global Menu → *CMS* → **Marketing** → open an Article entry. In a rich text field, use the editor's AI Creator action: ask for a 50-word summary, then insert it.
3. Don't publish: cancel the edit. When the demo is over, remove the key and save.

💡 **Point out:** DXP's AI helps authors inside the product; the coding agent builds the site from outside it. The key is instance-wide configuration that an administrator owns.

### D2.4 — Auto-tagging, and where AI Hub fits

🕒 **When:** Day 2 slide 9, *Auto-tagging and AI Hub* (instructor only). 4 minutes.

📋 **Steps:**
1. *Control Panel* → *Instance Settings* → *Content and Data* → **Assets**: *Asset Auto Tagging*, *OpenNLP Text Auto Tagging*, and the image auto-tagging providers (Google Cloud Vision, Microsoft Cognitive Services, TensorFlow).
2. Open *OpenNLP Text Auto Tagging* and show its settings. Don't save.

💡 **Point out:** AI Hub is a separate product in its own SaaS environment: its agents are built in an Agent Builder and run on Liferay workflow. Show it only if you have an AI Hub environment to demo.

### D2.5 — Collections, from Home to Site Builder

🕒 **When:** Day 2 slide 10, the Level 7 challenge. 5 minutes.

📋 **Steps:**
1. In a private window, show the three Clarity Cards on Home, then click one to its display page.
2. As admin: Site Menu → *Site Builder* → **Collections**: Helpful Articles, one FAQ collection per category, Announcements and Blog Posts, all *Dynamic*.
3. Open **Helpful Articles**: item type *Article (CMS)*, its filter and order.
4. Open FAQ in a private window and expand *What is your return policy?* under Returns and Exchanges.

💡 **Point out:** a dynamic collection updates itself when content is added; a manual one (the 7.3 bonus) is hand-picked.

### D2.6 — The product journey

🕒 **When:** Day 2 slides 13 and 15, product pages and the Level 8 challenge. 5 minutes.

📋 **Steps:**
1. In a private window: **Products** → a category card → the product list → a product's display page with name, SKU, description, specifications and **Contact Sales**.
2. As admin: Global Menu → *Commerce* → *Products*: the Clarity Eyewear catalog.
3. *Commerce* → *Specifications* → *Specification Labels*: Frame Material and Frame Color are marked *Use in Faceted Navigation*.
4. *Commerce* → *Channels* → **Clarity Public** → *Type*: linked to **Clarity Public Enterprise Website**.

💡 **Point out:** there's no price or cart: the channel showcases products and doesn't take orders.

### D2.7 — The API Explorer

🕒 **When:** Day 2 slide 17, *Everything your agent did went through these*. 5 minutes.

📋 **Steps:**
1. Open `http://localhost:8080/o/api` while signed in as the admin.
2. *REST Applications* → **headless-admin-user** → `GET /v1.0/my-user-account` → *Execute*: Clarity Admin.
3. Ask the agent the prompt below, and compare its answer with yours.

💬 **Prompt:**
```
Using the liferay MCP server, call the operation that returns my own user
account, and show me the operation name and the name and emailAddress it
returns. Don't call anything else.
```

💡 **Point out:** it's the same call the agent made in Setup S.3. The MCP server exposes these APIs; it doesn't add new ones.

### D2.8 — A batch import task

🕒 **When:** Day 2 slide 18, *Batch imports of legacy data*. 4 minutes.

📋 **Steps:**
1. Ask the agent for the import task ID from Level 9.2 (prompt below).
2. In the API Explorer: **headless-batch-engine** → `GET /v1.0/import-task/{importTaskId}` with that ID → *Execute*: `executeStatus` is **COMPLETED**, with the processed item count.
3. In a private window, open **Blog**: the imported post.

💬 **Prompt:**
```
Find the most recent batch import task in this instance and show me its id,
className, executeStatus and processedItemsCount. Read only.
```

💡 **Point out:** hundreds of items are one call and one task to check.

### D2.9 — A pending workflow task

🕒 **When:** Day 2 slide 23, the Level 10 challenge. 6 minutes.

🎯 Content waiting for approval, as the approver sees it.

🧰 **Before:** create a pending article with the prompt, so you don't reuse the learners' 10.2 article.

💬 **Prompt:**
```
Authenticating as Christian Carter (christian.carter@clarityvisionsolutions.com,
password learn), create a draft Article entry in the Marketing Space titled
"Demo: Autumn Collection Preview" with a one-sentence body, and submit it for
publication. Show me its status. Don't approve it.
```

📋 **Steps:**
1. Global Menu → *Applications* → *Process Builder*: **Clarity Article Approval** and **Contact Us Follow Up**.
2. In a private window, sign in as `clara.murphy@clarityvisionsolutions.com`. Avatar → *My Workflow Tasks* → *Assigned to My Roles*: the review task. Open it, show the *Approve* and *Reject* transitions, and don't act.
3. As admin: CMS → **Marketing** → the entry is **Pending**. Home as Guest doesn't show it.
4. After class, delete the demo entry, or ask the agent to.

💡 **Point out:** nothing reaches visitors before approval. This is how Clarity publishes now that Publications is in maintenance mode.

### D2.10 — Search, facets and a blueprint

🕒 **When:** Day 2 slides 25 to 27, search and Search Blueprints. 8 minutes.

📋 **Steps:**
1. In a private window, use the search bar in the header: results from pages and CMS content.
2. From the **Careers** banner, open **Open Positions**, search **Developer** and narrow by the *Remote* location.
3. As admin: Global Menu → *Applications* → *Blueprints* → **Boost Associate Job Listings** → *Preview*, search **Associate**: Associate positions rank first. Close without saving.
4. Open **Events** in a private window: only upcoming events, from the **Future Events** blueprint.

💡 **Point out:** each search widget reads the same query; a blueprint shapes that query without code.

### D2.11 — An object, its picklist and its form

🕒 **When:** Day 2 slides 31 and 33, *Liferay Objects* and the Level 12 challenge. 8 minutes.

📋 **Steps:**
1. *Control Panel* → *Objects* → **Contact Us**: published, scope *Site*, seven fields.
2. *Control Panel* → *Picklists* → **Inquiry Types**. Switch the language selector to Spanish: *Ventas, Soporte, Asociación, General*.
3. In a private window, submit the **Contact Us** form with test data. This creates a real entry.
4. In a private window, sign in as `daniel.raymond@clarityvisionsolutions.com` and open `/web/clarity/contact-us-responses`: the Data Set lists the new submission, pending review.
5. Use the prompt to show the same entry through the API.

💬 **Prompt:**
```
List the Contact Us entries of the site clarity-public created today, with
their title, inquiry type and workflow status. Read only.
```

💡 **Point out:** Guest can add entries but never view them; the Distributor Representative sees them through the Data Set. Delete your test entry after class.

### D2.12 — Personalization by audience

🕒 **When:** Day 2 slides 35 and 36, *Segments and experiences* (instructor only) and the Level 13 challenge. 6 minutes.

📋 **Steps:**
1. Open **Home** in edit mode: both banners show, each labeled *Shown to everyone except signed-in members of Distributors* or *Shown only to signed-in members of Distributors*. Leave without publishing.
2. Site Menu → *Design* → *Fragments*: **Clarity Audience Container**, with its user group and mode settings.
3. In a private window, open Home as Guest, then sign in as `terrence.wheatley@distributor.com`: **Welcome Back!**, and no distributor promotion. Sign out: the promotion is back.

💡 **Point out:** the check runs on the server, so hidden content never reaches the browser. DXP segments and experiences are deprecated; anonymous personalization belongs to Liferay Data Platform (D1.5).

### D2.13 — Page Audit

🕒 **When:** Day 2 slide 38, *Test, audit, monitor, upgrade* (instructor only). 4 minutes.

🧰 **Before:** a Google PageSpeed Insights API key, and a page the internet can reach: PageSpeed fetches the page from Google's servers, so it can't audit `localhost`. Use a demo environment with a public URL. Without one, present the slide only.

📋 **Steps:**
1. *Control Panel* → *Instance Settings* → *Content and Data* → **Pages** → *Google PageSpeed Insights*: enable it with your key.
2. Open the public Home page and the *Page Audit* panel from the top bar. Run the audit and walk through the accessibility and SEO findings.

💡 **Point out:** performance and quality checks are ongoing: rerun them after every code or infrastructure change.
