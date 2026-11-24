# Level 6 — Content in Liferay CMS

⏱ **70-minute block** · **Slides:** [Day 1, 39–44](slides/day-1.html#39) · **Learners:** [Level 6](../workbook/level-6.html)

**In this block:** Learners create the Spaces, structures and vocabularies, and load Clarity's content.

**Demos:** D1.13 (6 min)

### D1.13 — A Space, its members and its connected site

🕒 **6 minutes** · Day 1, slides 41 to 43 · with *Spaces*, *Content and file structures*, *Categories or tags*

🎯 **Show:** the CMS Spaces, who belongs to them, and the site each one connects to.

💡 **Say:** one Space can connect to many sites. When a page shows content to the admin but not to Guest, check the Space's connected sites and Guest access first.

📋 **Steps:**
1. *Global Menu* → *CMS* → **expect:** the sidebar lists the five Spaces.
2. Open **Marketing** → its settings → **expect:** *Members* and *Connected Sites* (**Clarity Public Enterprise Website**).
3. *Content Structures* → **Event Information** → **expect:** its fields, and that only the Events Space can use it.
4. Open the **HR** Space → *Categories* → **Location** → **expect:** on the finished build, 26 categories (14 from Level 6, twelve more from the Level 9 batch import). Learners at Level 6 have 14, because the Level 9 import hasn't run yet.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block, included in its time · learners answer on their own first, while their last prompt runs ([Level 6, Knowledge check](../workbook/level-6.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** Christian is a member of the public site but not of the HR Space. In the HR Space, Christian can browse content but sees no **New** button. Why?

✔ **Answer: B.** Connecting HR to the site gives site members read access. Connecting a Space to a site gives that site's members the Connected Site Member role in the Space: read access. Adding content takes Space membership and a Space role, which Christian has in Marketing, not in HR.

- **A:** A role can't block access; permissions only add.
- **C:** A user outside a Space and its connected sites can't read it.
- **D:** Published content can be edited by those with permission.

**Ask next:** What should Clarity do with a Space of confidential drafts? (Don't connect it to the site, or every site member can read it.)

**Question 2.** In 6.2, Christian creates a throwaway FAQ in the Marketing Space, then tries to delete it, and the delete is refused. Why?

✔ **Answer: A.** Its Space role lets members add and update, not delete. The prompt sets access through the Space's roles: members add, view and update; only administrators delete. Testing both sides, what's allowed and what's refused, is how you prove a permission design.

- **B:** Administrators can delete it, so it's not a global rule.
- **C:** Regular roles don't decide Space permissions here.
- **D:** The API deletes entries when the caller has permission.

**Ask next:** Why prove the refusal, not just the success? (A permission that's too broad also lets the success through.)

**Question 3.** 6.4 also sets Guest VIEW in each Space's **default permissions**. What would go wrong without that?

✔ **Answer: D.** Entries created later would be hidden from visitors. Permissions set on existing entries don't apply to new ones; default permissions do. Without them, each new entry is hidden from Guest, while it looks fine to the signed-in author who created it.

- **A:** Guest gets only what's explicitly granted.
- **B:** The entries themselves would be hidden too.
- **C:** Signed-in members still get access through their Space or connected site.

**Ask next:** How do you check what a visitor sees? (A private window, or the agent fetching with no credentials, as the 6.4 prompt asks.)
