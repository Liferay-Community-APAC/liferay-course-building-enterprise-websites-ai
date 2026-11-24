# Level 7 — Displaying content: mapping, display pages and collections

⏱ **90-minute block** · **Slides:** [Day 2, 4–10](slides/day-2.html#4) · **Learners:** [Level 7](../workbook/level-7.html)

**In this block:** Learners map content onto pages, build display page templates and collections. The block also covers the AI content tools in the slides.

**Demos:** D2.1 (4 min), D2.2 (3 min), D2.3 (6 min), D2.4 (4 min), D2.5 (5 min)

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

### Knowledge check answers

🕒 **5 minutes** · at the end of the block, included in its time · learners answer on their own first, while their last prompt runs ([Level 7, Knowledge check](../workbook/level-7.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** Marketing replaces the `gradient-overlay` file in the Marketing Space with a new version. What happens to the Home page?

✔ **Answer: C.** It shows the new image right away, with no page edit. Mapping links the page to the content item. Change the content and every page that maps it follows, with no page edit and no deploy.

- **A:** No page edit is needed: that's the point of mapping.
- **B:** No deploy is needed either.
- **D:** The mapping points to the file, which now has a new version.

**Ask next:** Where else on Clarity's site does this matter? (The logo in both masters: change it once in the Branding Space.)

**Question 2.** A new Article is published in the Marketing Space. What happens to **Helpful Articles** (dynamic, newest first, at most 3) and to a manual collection **Editor's Picks**?

✔ **Answer: B.** Helpful Articles adds it; Editor's Picks stays. A dynamic collection holds whatever matches its rules, so it updates itself. A manual collection holds exactly the items someone picked, in their order.

- **A:** A manual collection never adds items by itself.
- **C:** The dynamic one updates on its own.
- **D:** That's the reverse of how they behave.

**Ask next:** When would Clarity's editors want a manual collection? (A curated campaign page, where the order matters.)

**Question 3.** You deploy `clarity-site` to a fresh UAT environment. The display pages render, but the images mapped by file id show nothing. Why?

✔ **Answer: B.** The file ids in the tree only exist locally. The agent mapped some images by numeric id, and those ids come from your instance's database. On another instance the same file has another id. Real projects look ids up by name before each deploy (the 7.2 bonus).

- **A:** Then the display pages would answer 404, not render without images.
- **C:** They can; it worked on your instance.
- **D:** A restart doesn't change ids.

**Ask next:** What's portable in the tree, and what isn't? (ERCs and names are; numeric ids aren't.)
