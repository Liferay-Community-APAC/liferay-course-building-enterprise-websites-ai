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
