# Level 11 — Search: job openings, blueprints and events

⏱ **55-minute block** · **Slides:** [Day 2, 24–28](slides/day-2.html#24) · **Learners:** [Level 11](../workbook/level-11.html)

**In this block:** Learners build the job search page with facets, Search Blueprints and the upcoming events list.

**Demos:** D2.10 (8 min)

### D2.10 — Search, facets and a blueprint

🕒 **8 minutes** · Day 2, slides 25 to 27 · with search and Search Blueprints

🎯 **Show:** site search, facets, and blueprints that shape results without code.

💡 **Say:** each search widget reads the same query; a blueprint shapes that query without code.

📋 **Steps:**
1. In a private window, use the search bar in the header → **expect:** results from pages and CMS content.
2. From the **Careers** banner, open **Open Positions**, search **Developer** and narrow by the *Remote* location → **expect:** the results narrow to remote positions.
3. As admin: *Global Menu* → *Applications* → *Blueprints* → **Boost Associate Job Listings** → *Preview*, search **Associate** → **expect:** Associate positions rank first. Close without saving.
4. Open **Events** in a private window → **expect:** only upcoming events, from the **Future Events** blueprint.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block, included in its time · learners answer on their own first, while their last prompt runs ([Level 11, Knowledge check](../workbook/level-11.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** You saved the *Boost Associate Job Listings* blueprint, but Open Positions still shows FAQs and articles. What's missing?

✔ **Answer: A.** A Blueprints Options widget on the page. A blueprint changes the search only on pages that apply it, through the Blueprints Options widget. 11.2 adds that widget under Search Options.

- **B:** The job listings are already indexed; a blueprint changes the query, not the index.
- **C:** Blueprints apply live.
- **D:** There's no site-wide default; a page applies a blueprint through the widget.

**Ask next:** Why is that a good design? (The same blueprint can serve several pages, and pages can use different ones.)

**Question 2.** A visitor opens Open Positions without typing anything. Without **Allow Empty Searches**, what do they see?

✔ **Answer: B.** No results until they type a keyword. By default, search needs keywords. Allow Empty Searches lets the page list everything (filtered by the blueprint) as soon as it opens, which is what a job board needs.

- **A:** That's with the option on.
- **C:** It's not an error, just no results.
- **D:** The boost only orders results; it doesn't create them.

**Ask next:** What does the blueprint add to an empty search? (Only job listings, Associate first.)

**Question 3.** A week after the *Summer Job Fair*, it no longer appears under Upcoming Events, though nobody edited the page. Why?

✔ **Answer: A.** Its search keeps only events that start after now. The blueprint runs as a collection provider: each view runs the search, and its element compares the start date with the current time. No one maintains the list.

- **B:** Nothing unpublishes the events.
- **C:** It's a blueprint, not a manual collection.
- **D:** Categories don't change by themselves.

**Ask next:** Why not use the Calendar widget, as the original course did? (Calendar events have no REST API on this release; CMS entries do.)
