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
