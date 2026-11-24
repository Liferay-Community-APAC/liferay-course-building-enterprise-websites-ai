# Level 4 — Fragments and page compositions

⏱ **50-minute block** · **Slides:** [Day 1, 31–34](slides/day-1.html#31) · **Learners:** [Level 4](../workbook/level-4.html)

**In this block:** Learners create the Clarity Components fragments and wireframe Home and FAQ.

**Demos:** D1.11 (4 min)

### D1.11 — A fragment's configuration and code

🕒 **4 minutes** · Day 1, slide 32 · with *Fragments are the building blocks* (or at the Level 4 challenge)

🎯 **Show:** a fragment's code and configuration, in the editor and on a page.

💡 **Say:** Liferay copies fragment code into each page when it's placed, which is why the agent deploys fragments before pages.

📋 **Steps:**
1. *Site Menu* → *Design* → *Fragments* → **Clarity Components** → **Search Button** → *Edit*.
2. Show the HTML, CSS and JavaScript panes, then the *Configuration* tab and the preview → **expect:** the fragment's code, its configuration and its preview.
3. Leave without publishing.
4. Open **Home** in edit mode (pencil icon) and select the search button → **expect:** its configuration appears in the right panel.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block, included in its time · learners answer on their own first, while their last prompt runs ([Level 4, Knowledge check](../workbook/level-4.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** After Level 7 maps the Clarity Card's `card-title` editable to the article title, a teammate renames that editable id to `title` in the fragment's HTML. What happens to the cards on Home?

✔ **Answer: D.** The titles lose their mapping and show default text. A mapping is stored against the editable's id. Change the id and the mapping points at nothing, so the title falls back to the fragment's default text. That's why 4.1 says the ids must be exactly as written.

- **A:** Mappings are keyed by id, not by position.
- **B:** The fragment still compiles; the break is silent.
- **C:** Liferay doesn't track renames.

**Ask next:** How would you change an editable id safely? (Update every page definition and mapping that uses it in the same change.)

**Question 2.** Authors should be able to map a card's title to a CMS field in Level 7. What must the fragment provide for that?

✔ **Answer: B.** An editable with an id, such as `card-title`. Only editables (text, rich text, image, link) can be mapped to content fields. Configuration options are settings an author picks, such as a style or size; they can't be mapped.

- **A:** Configuration values can't be mapped to content.
- **C:** Mapping happens on the server; no JavaScript is needed.
- **D:** A composition arranges fragments; it doesn't make a field mappable.

**Ask next:** Which Clarity Button options are configuration, and which are editables? (Type, style and size are configuration; the link text and URL are an editable.)

**Question 3.** You change the Clarity Button's CSS and deploy only the fragment. Home already uses the button. What does Home show?

✔ **Answer: C.** The old style, until the page itself is imported again. When a page is imported, Liferay copies each fragment's HTML, CSS and JavaScript into the page. Updating the fragment doesn't touch those copies, so the page must be imported again afterwards. That's the deploy order 4.2 asks for: fragments first, then pages.

- **A:** Pages hold a copy, not a reference.
- **B:** The old code is in the page itself, not in the browser cache.
- **D:** A restart doesn't refresh the page's copy.

**Ask next:** What does that mean for a fragment used on fifty pages? (Every page needs re-importing; the initializer does it on the next deploy.)
