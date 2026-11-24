# Level 3 — Pages, master pages and navigation

⏱ **60-minute block** · **Slides:** [Day 1, 25–30](slides/day-1.html#25) · **Learners:** [Level 3](../workbook/level-3.html)

**In this block:** Learners build the site initializer: the page hierarchy, the master pages and the menus.

**Demos:** D1.9 (6 min), D1.10 (4 min)

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

### Knowledge check answers

🕒 **5 minutes** · at the end of the block · learners answer on their own first ([Level 3, Knowledge check](../workbook/level-3.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** In the site initializer, you rename the FAQ page's friendly URL from `/faq` to `/help` and redeploy. What happens on the site?

✔ **Answer: B.** A new /help page is added, and the /faq page stays as it was. The initializer matches pages by friendly URL and never deletes anything. A new URL looks like a new page, so it's added, and the page at the old URL is left behind. Renaming or removing a page means deleting it (or the site) and deploying again.

- **A:** Pages are matched by friendly URL, so a new URL isn't recognized as the same page.
- **C:** The deploy succeeds; that's why the duplicate is easy to miss.
- **D:** The initializer adds and updates; it never removes.

**Ask next:** How would you notice? (*Site Builder* → *Pages*, or the agent reading the page tree back, as 3.1 asks.)

**Question 2.** Christian edits the Home page and can't find the built-in **Footers** fragments in the fragment panel. Why?

✔ **Answer: C.** The master page's drop zone doesn't allow the Footers set. A master page's drop zone can limit which fragments authors may drop into pages. 3.2 disallows Footers and Navigation Bars, so authors can't add a second footer or menu: the master already supplies them.

- **A:** Authors who can edit the page can use the allowed fragments.
- **B:** The theme doesn't filter the fragment panel.
- **D:** They're available; the master page excludes them on purpose.

**Ask next:** Which other sets would you disallow for Clarity's authors? (Anything that duplicates the master: headers, menus.)

**Question 3.** 3.2 turns off the Classic theme's own header and footer on both master pages. What would visitors see if it didn't?

✔ **Answer: A.** Two headers and two footers, the theme's and the master's. The master page draws Clarity's header and footer as fragments, and the theme draws its own around the page. Both render unless the theme's are switched off, so you'd see them stacked.

- **B:** The master page's fragments still render.
- **C:** Both render; neither replaces the other.
- **D:** It changes what visitors see.

**Ask next:** Why turn them off in the master page settings instead of hiding them with CSS? (The setting is scoped to this site; CSS hacks break on theme updates.)
