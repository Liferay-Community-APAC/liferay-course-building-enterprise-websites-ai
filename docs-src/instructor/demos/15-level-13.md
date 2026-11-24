# Level 13 — Personalization: a Home page for distributors

⏱ **30-minute block** · **Slides:** [Day 2, 34–36](slides/day-2.html#34) · **Learners:** [Level 13](../workbook/level-13.html)

**In this block:** Learners build the audience container fragment and the distributor variant of Home.

**Demos:** D2.12 (6 min)

### D2.12 — Personalization by audience

🕒 **6 minutes** · Day 2, slides 35 and 36 · with *Segments and experiences* (instructor only), then at the Level 13 challenge

🎯 **Show:** one Home page that shows a different banner to signed-in distributors.

💡 **Say:** the check runs on the server, so hidden content never reaches the browser. DXP segments and experiences are deprecated; anonymous personalization belongs to Liferay Data Platform (D1.5).

📋 **Steps:**
1. Open **Home** in edit mode → **expect:** both banners show, each labeled *Shown to everyone except signed-in members of Distributors* or *Shown only to signed-in members of Distributors*. Leave without publishing.
2. *Site Menu* → *Design* → *Fragments* → **expect:** **Clarity Audience Container**, with its user group and mode settings.
3. In a private window, open Home as Guest, then sign in as `terrence.wheatley@distributor.com` → **expect:** **Welcome Back!**, and no distributor promotion. Sign out → **expect:** the promotion is back.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block · learners answer on their own first ([Level 13, Knowledge check](../workbook/level-13.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** Why does the Clarity Audience Container decide in FreeMarker, on the server, instead of hiding content with JavaScript?

✔ **Answer: C.** Hidden content never reaches the browser. Content hidden in the browser has already been sent: anyone can read it in the page source. Deciding on the server means a visitor outside the audience never receives it.

- **A:** JavaScript could fetch them, but the content would already be in the page.
- **B:** Speed isn't the reason.
- **D:** Fragments can run JavaScript.

**Ask next:** Is this a security control? (For promotions, it's tidiness. Real access control belongs in page and content permissions.)

**Question 2.** Marketing wants a different Home banner for anonymous visitors arriving from a spring campaign. What does Clarity need?

✔ **Answer: A.** Liferay Data Platform segments. The Audience Container reads who's signed in. Anonymous visitors are all just Guest to it. Behavior, location or campaign targeting is Liferay Data Platform's job.

- **B:** "Others" means everyone outside the user group, campaign or not.
- **C:** They're deprecated on this release; the course doesn't build on them.
- **D:** A second site doesn't target anyone.

**Ask next:** What do you need before using Data Platform segments? (A Data Platform workspace connected to your instance.)

**Question 3.** In the page editor, the admin sees both Home banners, each with a label. Is that a bug?

✔ **Answer: B.** No: the editor shows both so both can be edited. 13.1 asks for that: in edit mode the container shows its content with a label saying who it's for. On the live page, only the matching banner renders.

- **A:** Authors couldn't edit the other banner then.
- **C:** Both compiled; that's why both show.
- **D:** On the live site the admin sees the "others" version, since the admin isn't a distributor.

**Ask next:** How do you check what Terrence sees? (A private window signed in as Terrence, or the agent fetching as Terrence.)
