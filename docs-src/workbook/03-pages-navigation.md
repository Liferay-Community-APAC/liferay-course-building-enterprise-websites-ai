# Level 3 — Pages, master pages and navigation

⏱ **About 70 minutes**, with the talk and the knowledge check · **Builds on:** Level 2

**What you'll build:** Clarity's page hierarchy, the two master pages that frame every page, and the four navigation menus, all in a site initializer your agent deploys.

**Key terms**
- **Site initializer:** a client extension (code you deploy to Liferay without changing Liferay itself), here in `client-extensions/clarity-site/`, holding a folder tree of JSON files (pages, master pages, menus, fragments, style books) that Liferay applies to the site every time you deploy it.
- **Content page:** a page built from fragments.
- **Fragment:** a building block of a content page, such as a container, a grid, an image or a menu.
- **Master page:** what every page shares (header, footer) around a drop zone. Clarity uses a **Primary Master Page** for content pages and a lighter **Secondary Master Page** for the sign-in and utility pages.
- **Drop zone:** the area of a master page where each page's own content goes. A master page can limit which fragments authors may drop there.
- **Classic theme:** the theme Liferay uses by default. Clarity's master pages turn off its own header and footer.
- **Navigation menu:** a list of links to pages or URLs, shown on a page by a Menu Display fragment.

ℹ️ **Note:** from here on, the site's structure lives in code. Your agent edits the site initializer's tree and deploys it; you check the result in Liferay's own editors. The site is version-controlled and can be rebuilt on any environment, and the agent never has to click through the page editor.

### 3.1 — Scaffold the site initializer and the page hierarchy

🎯 **Goal:** a `clarity-site` site initializer, bound to the existing site `clarity-public`, that creates Clarity's page hierarchy as empty content pages.

**Requirement:** R3 · **Skills:** `scaffold-client-extension`, `manage-pages`, `deploy-and-verify`

💬 **Prompt:**
```
Using the scaffold-client-extension, manage-pages and deploy-and-verify
skills, create a site initializer client extension in
client-extensions/clarity-site whose siteExternalReferenceCode is
clarity-public (the site created in Level 2: the initializer must update
that site, not create a new one).

In it, create the page hierarchy from section 4 of
context-source/clarity-brief.md as empty, public content pages, in this
order: Home (/home), Products (/products) with its child Product List
(/product-list), About Us (/about-us), Blog (/blog), FAQ (/faq), Careers
(/careers) with its child Open Positions (/open-positions), Contact Us
(/contact-us) and Search (/search-results — /search is reserved). Leave out
Product Detail, Events and Contact Us Responses: later levels add them.

Keep the site's Open membership from Level 2 in the initializer
(site-configuration.json). Each deploy of this initializer resets the
site's languages, so also write scripts/deploy_site.sh: a clean deploy of
client-extensions/clarity-site, a wait for its "Initialized" log line, then
scripts/site_settings.py from 2.3. Use it for every deploy of clarity-site
from now on.

Deploy it with that script, confirm in the log that the initializer ran
for clarity-public, read the page tree back from Liferay, and confirm the
site still has Open membership and only English and Spanish. Update
solution-index.yaml (R3).
```

✅ **Verify** (look, don't change anything):
1. In the public site, *Site Menu* → *Configuration* → *Site Settings* → *Localization*: still only English and Spanish.
2. *Site Menu* → *Site Builder* → *Pages*: the pages are listed in the prompt's order, with **Product List** under **Products** and **Open Positions** under **Careers**.
3. Open `http://localhost:8080/web/clarity/home`: an empty page with Liferay's default header.

![Site Builder → Pages: Home, Products with Product List, About Us, Blog, FAQ, Careers with Open Positions, Contact Us and Search.](screenshots/3-1-pages.png)

### 3.2 — Build the Primary and Secondary master pages

🎯 **Goal:** two master pages wireframed as in section 4 of the brief, applied to the pages, with the allowed fragments limited on the primary one.

**Requirement:** R3 · **Skills:** `theme-and-design`, `manage-pages`

💬 **Prompt:**
```
Using the theme-and-design and manage-pages skills, add two master pages to
client-extensions/clarity-site, wireframed with Liferay's built-in Container,
Grid, Image, Paragraph and Menu Display fragments (no custom fragments yet;
Level 4 adds them):

Primary Master Page:
- A "Page Header" container holding:
  - a "Header Announcement Bar" container (empty for now; Level 7 fills it),
  - a "Header Navigation Bar" container, fixed width, with vertical padding
    spacer 3 and horizontal padding spacer 6, holding a three-column grid
    (middle column wider, vertically centered) whose columns contain:
    "Header Branding" (flex row, start: an Image fragment),
    "Header Navigation" (flex row, centered: a Menu Display fragment),
    "Header User Actions" (flex row, end: empty for now).
- The drop zone. On it, disallow the built-in "Footers" and "Navigation
  Bars" fragment sets.
- A "Page Footer" container with "Footer Branding" (an Image fragment),
  "Footer Navigation" (three Menu Display fragments side by side) and a
  "Footer Copyright" paragraph "© Clarity Vision Solutions".

Secondary Master Page: the same, without the Header Announcement Bar,
Footer Branding and Footer Navigation containers.

Name each container exactly as above (the names show in the page editor's
Browser panel). The Header Branding and Footer Branding Image fragments are
Clarity's logo (Level 7 maps it): keep them no wider than 200px.
Turn off the Classic theme's own header and footer on both masters. Apply
the Primary Master Page to every page from 3.1. Deploy, and confirm from
the log and from the pages' data that both masters exist and each page
uses the primary one.
```

✅ **Verify** (look, don't change anything):
1. *Site Menu* → *Design* → *Page Templates* → *Masters*: **Primary Master Page** and **Secondary Master Page** are listed.
2. Open the primary one (click its name). The *Browser* panel (the tree icon on the left) shows *Page Header* → *Header Announcement Bar* and *Header Navigation Bar* → grid → *Header Branding*, *Header Navigation*, *Header User Actions*, then the drop zone and *Page Footer*.
3. In the same editor, select the drop zone and click *Configure Allowed Fragments*: **Footers** and **Navigation Bars** are unchecked. Leave the editor without publishing.
4. Open the **Home** page: the header and footer wireframe surround an empty body.

![Design → Page Templates → Masters: Primary Master Page and Secondary Master Page.](screenshots/3-2-masters.png)

### 3.3 — Create the navigation menus and wire them in

🎯 **Goal:** the four menus from section 4 of the brief, with the header and footer Menu Display fragments pointing at them.

**Requirement:** R3 · **Skills:** `manage-pages`

💬 **Prompt:**
```
Using the manage-pages skill, add the four navigation menus from section 4
of context-source/clarity-brief.md to client-extensions/clarity-site, each
with its own external reference code. The Footer Legal Menu items are URL
items to https://www.clarityvisionsolutions.com/privacy and /terms, opening
in a new tab.

Then point the Menu Display fragments of both master pages at them: the
header one at Header Page Menu (on both masters), and the three footer ones
at Footer Resources Menu, Footer Company Menu and Footer Legal Menu, in that
order. Deploy, then count each menu's items over the API and compare with
the brief.
```

✅ **Verify** (look, don't change anything):
1. *Site Menu* → *Site Builder* → *Navigation Menus*: four menus.
2. Open **Header Page Menu**: Products, About Us, Blog, FAQ, Careers, Contact Us, in that order.
3. Open the **Home** page: the header shows those six links, and the footer shows the three footer menus.
4. Click **FAQ** in the header: you're on the FAQ page.

![Site Builder → Navigation Menus: Header Page Menu, Footer Resources Menu, Footer Company Menu and Footer Legal Menu.](screenshots/3-3-menus.png)



## 🧠 Knowledge check

⏱ **About 3 minutes, on your own**, while your last prompt runs. Choose one answer for each question. Your instructor then goes over the answers with the class.

**Question 1.** In the site initializer, you rename the FAQ page's friendly URL from `/faq` to `/help` and redeploy. What happens on the site?

- **A.** The existing FAQ page keeps its content and gets the URL /help.
- **B.** A new /help page is added, and the /faq page stays as it was.
- **C.** The deploy fails, because a page with that name already exists.
- **D.** The /faq page is deleted and recreated at /help, losing its content.

**Question 2.** Christian edits the Home page and can't find the built-in **Footers** fragments in the fragment panel. Why?

- **A.** Christian's role doesn't allow using built-in fragments.
- **B.** The Classic theme hides footer fragments while its footer is off.
- **C.** The master page's drop zone doesn't allow the Footers set.
- **D.** Footer fragments are deprecated on this release.

**Question 3.** 3.2 turns off the Classic theme's own header and footer on both master pages. What would visitors see if it didn't?

- **A.** Two headers and two footers, the theme's and the master's.
- **B.** Only the theme's header and footer: the theme overrides the master.
- **C.** No header at all: the two would cancel each other out.
- **D.** The same page: the setting only changes the page editor.

## ⭐ Extras

Optional, for when you finish early. The next level doesn't depend on them.

### ⭐ 3.4 — Bonus: the Sign In utility page

🎯 **Goal:** a **Sign In** utility page that uses the **Secondary Master Page** and holds Liferay's Sign In widget, set as the site's default sign-in page. Write the prompt yourself.

✅ **Success looks like:**
1. Sign out and click *Sign In*: Clarity's lighter header and footer surround the sign-in form.
