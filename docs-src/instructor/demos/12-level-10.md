# Level 10 — Workflow and publishing

⏱ **45-minute block** · **Slides:** [Day 2, 20–23](slides/day-2.html#20) · **Learners:** [Level 10](../workbook/level-10.html)

**In this block:** Learners add an approval workflow for articles and publish a site-wide announcement through it.

**Demos:** D2.9 (6 min)

### D2.9 — A pending workflow task

🕒 **6 minutes** · Day 2, slide 23 · at the Level 10 challenge, before learners start Level 10

🎯 **Show:** content waiting for approval, as the approver sees it.

💡 **Say:** nothing reaches visitors before approval. This is how Clarity publishes now that Publications is in maintenance mode.

🧰 **Prepare** (in the break before):
1. Create a pending article with this prompt, so you don't reuse the learners' 10.2 article:
   ```
   Authenticating as Christian Carter (christian.carter@clarityvisionsolutions.com,
   password learn), create a draft Article entry in the Marketing Space titled
   "Demo: Autumn Collection Preview" with a one-sentence body, and submit it for
   workflow. Show me its status. Don't approve it.
   ```

📋 **Steps:**
1. *Global Menu* → *Applications* → *Process Builder* → **expect:** **Clarity Article Approval** and **Contact Us Follow Up**.
2. In a private window, sign in as `clara.murphy@clarityvisionsolutions.com`. The avatar, top right → *My Workflow Tasks* → *Assigned to My Roles* → **expect:** the review task. Open it, show the *Approve* and *Reject* transitions, and don't act.
3. As admin: *Global Menu* → *CMS* → **Marketing** → **expect:** the entry is **Pending**.
4. Open Home as Guest → **expect:** it doesn't show the entry.

🧹 **After the demo:** after class, delete the demo entry, or ask the agent to.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block · learners answer on their own first ([Level 10, Knowledge check](../workbook/level-10.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** In 10.2, why does the agent authenticate as Christian to create the article, rather than as the admin?

✔ **Answer: B.** So Christian's own permissions are what's tested. Acting as a persona tests the permissions and workflow that persona actually has, and the history shows the right author and reviewer. As the admin, the test would pass even if Christian couldn't do it.

- **A:** The admin can.
- **C:** Workflow applies to admins' submissions too.
- **D:** Speed isn't the reason.

**Ask next:** Where else should you test as a persona rather than as the admin? (Anything about permissions: 2.4, 6.2, 12.4.)

**Question 2.** 10.1 publishes a copy of Single Approver named *Clarity Article Approval*, instead of editing Single Approver itself. Why?

✔ **Answer: D.** Editing it would change everything else that uses it. A workflow definition can be linked to many kinds of content. Editing the shipped one changes them all; a named copy changes only what Clarity chooses, and keeps Liferay's original as a reference.

- **A:** It can be edited in Process Builder.
- **B:** Speed is the same.
- **C:** Any definition can assign a task to any role.

**Ask next:** Why link Announcement to the same copy in 10.3? (One approval rule for everything that reaches every page.)

**Question 3.** Christian has submitted *Spring Campaign*, and Clara hasn't approved it yet. What does the announcement bar show visitors?

✔ **Answer: C.** The previous announcement, until Clara approves. Workflow sits between submitted and published. Until Clara approves, the new entry is pending, and the bar's collection only shows published entries. That's the point of putting a site-wide message under review.

- **A:** It isn't published yet.
- **B:** The bar shows one item.
- **D:** The published announcement keeps showing.

**Ask next:** What if the bar still shows the old text after approval? (The page may be cached for Guest: wait a minute and reload.)
