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
