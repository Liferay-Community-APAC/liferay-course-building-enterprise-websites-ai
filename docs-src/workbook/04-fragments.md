# Level 4 — Fragments and page compositions

⏱ **About 50 minutes**, with the talk and the knowledge check · **Builds on:** Level 3

**What you'll build:** Clarity's own fragments in a **Clarity Components** fragment set, placed in the master pages' header, and the Home and FAQ pages laid out like Clarity's previous site.

**Key terms**
- **Fragment:** a building block of a content page: HTML, CSS and JavaScript with editable areas.
- **Editable:** an area of a fragment an author can change or map to content, identified by an editable id (for example `card-title`).
- **Fragment configuration:** a JSON file that defines the options an author sets in the page editor (text, select, checkbox, color, URL…).
- **Fragment set:** a named group of fragments. Clarity keeps its own in **Clarity Components**.
- **Composition:** a saved arrangement of fragments that authors reuse. In the site initializer, a page's arrangement lives in its `page-definition.json`.
- **Edit mode:** the page editor, opened with the pencil icon at the top right of a page.

### 4.1 — Create the Clarity Components fragments

🎯 **Goal:** five custom fragments in a *Clarity Components* set: **Search Button**, **Login and User Menu**, **Clarity Button**, **Clarity Card** and **FAQ Question and Answer Pair**.

**Requirement:** R4 · **Skills:** `scaffold-fragment`

💬 **Prompt:**
```
Using the scaffold-fragment skill, add a "Clarity Components" fragment set
to client-extensions/clarity-site with these fragments. Use
context-source/design-reference/clarity-components/ as the visual reference
(same markup ideas, editable ids and configuration), but write clean code
that works on this release, uses CSS variables rather than hard-coded
colors, and needs no theme other than Classic:

1. Search Button: a Clay icon link. Configuration: iconName (text, default
   "search"), iconSize (select: 1rem, 1.5rem, 2rem, 2.5rem, 3rem; default
   1rem), link (url), hideLabel (checkbox, default true) and buttonLabel
   (text, default "Search", shown only when hideLabel is false).
2. Login and User Menu: a "Sign In" button for guests, Liferay's user
   personal bar for signed-in users.
3. Clarity Button: an editable link styled as a button, with type (solid,
   outline, borderless), style (primary, secondary), size (small, regular,
   large) and inverted (checkbox) options.
4. Clarity Card: editable image "card-image", text "category", text
   "card-title", rich text "summary" and link "card-link" (editable ids
   exactly as written, so they can be mapped later).
5. FAQ Question and Answer Pair: an accessible disclosure with editable
   text "main-text" (the question) and rich text "answer-text".

Deploy, and check in the log that addFragmentEntries ran and none of the
fragments failed to compile.
```

✅ **Verify** (look, don't change anything):
1. *Site Menu* → *Design* → *Fragments*: the **Clarity Components** set lists the five fragments.
2. Click **Search Button** → *Configuration* tab: the five options from the prompt.
3. In the same fragment, the *Code* tab's preview: a search icon. Close it without publishing.

![Design → Fragments: the Clarity Components set with Search Button, Login and User Menu, Clarity Button, Clarity Card and FAQ Question and Answer Pair.](screenshots/4-1-fragments.png)

🧪 **Acceptance criteria** (what the level's Playwright check tests, in ⭐ Extras):

- **AC 4.1-1** · *Browser, as the admin:* *Design* → *Fragments* → **Clarity Components** lists Search Button, Login and User Menu, Clarity Button, Clarity Card and FAQ Question and Answer Pair, all approved, none in draft.
- **AC 4.1-2** · *Browser, as the admin:* in the Clarity Components set's export, Search Button's configuration has `iconName`, `iconSize`, `link`, `hideLabel` and `buttonLabel`, with the defaults from the prompt.
- **AC 4.1-3** · *Browser, as the admin:* in the same export, Clarity Card's HTML has the editables `card-image`, `category`, `card-title`, `summary` and `card-link`.

### 4.2 — Put the custom fragments in the master pages

🎯 **Goal:** the search button and the login/user menu in the header of both master pages, the search button linking to the Search page.

**Skills:** `scaffold-fragment`, `manage-pages`

💬 **Prompt:**
```
In client-extensions/clarity-site, add the Search Button and Login and User
Menu fragments to the "Header User Actions" container of both master pages,
in that order. Configure the Search Button's link to the Search page
(/search-results). Deploy (fragments before pages: follow the deploy order
the site-initializer rules describe), and confirm on a rendered page as
Guest that both appear.
```

✅ **Verify** (look, don't change anything):
1. Open `http://localhost:8080/web/clarity/home` in a private window: the header shows a search icon and a **Sign In** button.
2. Click the search icon: you land on the Search page.
3. In the private window, sign in as any persona: the **Sign In** button is replaced by the user's avatar menu.

🧪 **Acceptance criteria** (what the level's Playwright check tests, in ⭐ Extras):

- **AC 4.2-1** · *Browser, as Guest:* Home's header has a search icon link and a **Sign In** button.
- **AC 4.2-2** · *Browser, as Guest:* the search icon link goes to `/web/clarity/search-results`.
- **AC 4.2-3** · *Browser, as Christian Carter:* Home's header has no **Sign In** button, and has Christian's user menu.

### 4.3 — Wireframe the Home and FAQ pages

🎯 **Goal:** the Home and FAQ pages laid out like Clarity's previous site, ready for content in Level 7.

**Requirement:** R4 · **Skills:** `manage-pages`, `scaffold-fragment`

💬 **Prompt:**
```
Using manage-pages, lay out two pages in client-extensions/clarity-site,
using the compositions in context-source/design-reference/compositions/
(page-composition-home.zip and page-composition-faq.zip) as the layout
reference. Unzip them to a temporary folder outside the workspace to read
them; don't import the zips.

Home: a "Banner" container holding a fixed-width "Banner Content"
container with a two-column grid (left: heading "Elevate Your Brand with
Premium Eyewear", a paragraph and a Clarity Button "Explore Products" to
/products; right: an Image fragment), a "Clarity Solutions Promo" container with a
"Content Wrapper" (heading, paragraph, Image), a "See the Difference"
section with three short value statements, a "Helpful Articles" container
(a heading only for now; Level 7 adds the collection) and a "Distributor
Promo" container (heading "Become a Clarity Distributor", a paragraph and a
Clarity Button to /contact-us).

FAQ: a two-column grid with an Image fragment on the left and an "FAQ
Content" container on the right holding four "FAQ Section" containers, one
per FAQ category in context-source/content/faqs.json, each with a heading
(the category name) and nothing else yet; then a "Promoted Articles"
container with a heading.

Use Clarity Button and built-in fragments only, name every container as
written, and deploy.
```

✅ **Verify** (look, don't change anything):
1. Open **Home** in edit mode (the pencil icon at the top right) → the *Browser* panel: the containers carry the names from the prompt. Leave without publishing.
2. Open **FAQ** in edit mode → the *Browser* panel: the containers carry the names from the prompt. Leave without publishing.

🧪 **Acceptance criteria** (what the level's Playwright check tests, in ⭐ Extras):

- **AC 4.3-1** · *Browser, as Guest:* Home has the heading *Elevate Your Brand with Premium Eyewear* and an **Explore Products** link to the Products page.
- **AC 4.3-2** · *Browser, as Guest:* Home has the heading *Become a Clarity Distributor* with a link to the Contact Us page.
- **AC 4.3-3** · *Browser, as Guest:* FAQ has four sections, headed with the four FAQ categories of `context-source/content/faqs.json`.

## 🧠 Knowledge check

⏱ **About 3 minutes, on your own**, while your last prompt runs. Choose one answer for each question. Your instructor then goes over the answers with the class.

**Question 1.** After Level 7 maps the Clarity Card's `card-title` editable to the article title, a teammate renames that editable id to `title` in the fragment's HTML. What happens to the cards on Home?

- **A.** Nothing: a mapping follows its editable by position in the HTML.
- **B.** The deploy fails, because the fragment no longer compiles.
- **C.** Liferay notices the rename and moves the mapping to the new id.
- **D.** The titles lose their mapping and show default text.

**Question 2.** Authors should be able to map a card's title to a CMS field in Level 7. What must the fragment provide for that?

- **A.** A text configuration option that authors point at a field.
- **B.** An editable with an id, such as `card-title`.
- **C.** A JavaScript function that fetches the title from the API.
- **D.** A composition that ties the card to the structure.

**Question 3.** You change the Clarity Button's CSS and deploy only the fragment. Home already uses the button. What does Home show?

- **A.** The new style: pages read the fragment's code live from the library.
- **B.** The new style, once each visitor's browser cache expires.
- **C.** The old style, until the page itself is imported again.
- **D.** The new style, but only after Liferay is restarted.

## ⭐ Extras

Optional, for when you finish early. The next level doesn't depend on them.

### ⭐ 4.4 — Bonus: a configurable sign-in URL

🎯 **Goal:** authors can set the **Login and User Menu** fragment's sign-in button target URL from the fragment configuration instead of a hard-coded one. Write the prompt yourself.

✅ **Success looks like:**
1. In the page editor, selecting the fragment shows a URL option.
2. Changing that option changes where *Sign In* goes.

### ⭐ 4.5 — Bonus: check Level 4 with Playwright

🎯 **Goal:** `tests/e2e/level-4.spec.ts`, with one test per acceptance criterion (🧪) of Level 4, added to the Playwright suite from 1.3. Write the prompt yourself: start from 1.3's and point it at this level's criteria.

📋 **Before the prompt:**
1. If you skipped 1.3, do it first: it sets up the suite and its sign-in helpers.

✅ **Success looks like:**
1. In `tests/e2e`, `npx playwright test level-4` runs one test per acceptance criterion of Level 4, each named by its id, and all pass.
2. In the Primary Master Page, change the Search Button's link to `/home` and publish, and run the tests again: **AC 4.2-2** fails. To undo it, redeploy the site with `scripts/deploy_site.sh`, and run them again: all pass.
3. `npx playwright test` still passes for every level you've added.
