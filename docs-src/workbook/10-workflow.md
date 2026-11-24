# Level 10 — Workflow and publishing

⏱ **About 50 minutes**, with the talk and the knowledge check · **Builds on:** Levels 1, 6 and 7

**What you'll build:** an approval step for Clarity's articles and announcements. Christian submits, Clara reviews, and nothing reaches visitors until it's approved.

**Key terms**
- **Workflow:** a review step between *submitted* and *published*: an item waits, a reviewer is notified, and approves or rejects it.
- **Single Approver:** the workflow Liferay ships, which sends new content to a reviewer role.
- **Workflow task:** the review item a reviewer finds in *My Workflow Tasks*, assigns to themself, and approves or rejects.
- **Process Builder:** the screen where workflow definitions are listed and edited.
- **Acting as a persona:** your agent authenticates with a persona's credentials, so Liferay applies that user's permissions and records them as the author or reviewer.

ℹ️ **Note:** Liferay's **Publications**, which releases batches of page changes, is in maintenance mode on this release with no replacement, so the course uses workflow for publishing.

### 10.1 — Approval workflow for Marketing articles

🎯 **Goal:** new and edited **Article** entries need a Content Manager's approval before they're published.

**Requirement:** R10 · **Skills:** `manage-object-logic`, `manage-cms`

💬 **Prompt:**
```
Using the manage-object-logic and manage-cms skills, make the Article CMS
structure go through the Single Approver workflow in the Marketing Space,
with the Content Manager role as the reviewer (Clara Murphy holds it).
Use the workflow definition Liferay ships; if its reviewer roles don't
include Content Manager, publish a copy named "Clarity Article Approval"
that does, instead of editing the original. Read back which workflow is
now linked to Article in the Marketing Space.
```

✅ **Verify** (look, don't change anything):
1. *Global Menu* → *CMS* → **Marketing** → its settings → *Workflow*: **Article** uses the workflow the agent named.
2. *Global Menu* → *Applications* → *Process Builder* → open that workflow: the review task is assigned to **Content Manager**. Close without saving.

### 10.2 — Christian submits an article, Clara approves it

🎯 **Goal:** an article goes from Christian's draft to Clara's approval to the live site.

**Part 1 — Christian submits**

💬 **Prompt:**
```
Authenticating as Christian Carter (christian.carter@clarityvisionsolutions.com,
training password "learn"), not as the admin, create an Article in the
Marketing Space's "Articles" folder: title "Clarity x Almanac Optics",
headline "Summer 2027 Collaboration", content "Eyewear enthusiasts rejoice!
Fan favorites Clarity and Almanac Optics have joined forces for a
collaborative collection.", image: the Space file revolutionizing_industry.
Submit it for workflow rather than saving it as a draft. Show me its status
as Liferay returns it, and its workflow instance.
```

✅ **Verify** (look, don't change anything):
1. Sign in as **Clara Murphy** in a private window. User menu (the avatar, top right) → *My Workflow Tasks* → *Assigned to My Roles*: a review task for **Clarity x Almanac Optics**. Don't act on it.
2. *Global Menu* → *CMS* → **Marketing** → *Articles*: the entry is **Pending**, created by Christian Carter.

**Part 2 — Clara approves**

💬 **Prompt:**
```
Authenticating as Clara Murphy (clara.murphy@clarityvisionsolutions.com,
training password "learn"), assign the pending review task of "Clarity x
Almanac Optics" to herself and approve it with the comment "Approved for
the summer campaign." Then list the workflow instance's tasks, who
completed each with which transition and comment, and the entry's status.
```

✅ **Verify** (look, don't change anything):
1. As Clara, *My Workflow Tasks* → *Completed*: the task, approved, with the comment.
2. *Global Menu* → *CMS* → **Marketing** → *Articles*: the article is **Approved**, and it's published.

📖 **Why it matters:** your agent can act **as** a persona by authenticating with that persona's credentials. Liferay then applies that user's permissions and records them as the author or reviewer. That's how you test a workflow end to end without switching browser sessions.

### 10.3 — Publish a site-wide change through workflow

🎯 **Goal:** the announcement bar on every page changes only after Clara approves the new announcement: Christian prepares it, nothing reaches visitors until approval, then it goes live everywhere at once.

**Requirement:** R10 · **Skills:** `manage-object-logic`, `manage-cms`

**Part 1 — Workflow on announcements**

💬 **Prompt:**
```
Link the "Clarity Article Approval" workflow from 10.1 to the Announcement
structure in the Marketing Space as well. Read back which workflow each of
Article and Announcement uses there.
```

✅ **Verify** (look, don't change anything):
1. *Global Menu* → *CMS* → **Marketing** → its settings → *Workflow*: **Announcement** uses the same workflow as **Article**.

**Part 2 — Christian prepares the announcement**

💬 **Prompt:**
```
Authenticating as Christian Carter (training password "learn"), create an
Announcement in the Marketing Space's "Announcements" folder: title
"Spring Campaign", message "Spring into Style with Clarity: new frames
have arrived!", link text "Shop the collection", link URL /web/clarity/products.
Submit it for workflow. Show me its status, then fetch Home as Guest and
show me the announcement bar's text.
```

✅ **Verify** (look, don't change anything):
1. Open **Home** in a private window: the bar still says *See Clarity's latest eyewear innovations!*.
2. As Clara, *My Workflow Tasks* → *Assigned to My Roles* lists **Spring Campaign**. Don't act on it.

**Part 3 — Clara publishes it**

💬 **Prompt:**
```
Authenticating as Clara Murphy (training password "learn"), approve the
pending review task of the announcement "Spring Campaign" with the comment
"Go live." Then fetch Home and the FAQ page as Guest and show me the
announcement bar's text on each.
```

✅ **Verify** (look, don't change anything):
1. Open **Home** in a private window: the bar reads *Spring into Style with Clarity: new frames have arrived!* with a **Shop the collection** link.
2. Open **FAQ** in the same window: the same bar. It shows on every page that uses the Primary Master Page.

![After Clara's approval, the announcement bar on every page reads "Spring into Style with Clarity: new frames have arrived!" with a Shop the collection link.](screenshots/10-3-announcement.png)

⚠️ **If it doesn't match:** if the bar still shows the old text, the page may be cached for Guest: wait a minute and reload.

📖 **Why it matters:** the announcement bar (Level 7.5) shows the newest Announcement entry of the Marketing Space. Putting the Announcement structure under the same approval workflow means a site-wide message can't go live without review.



## 🧠 Knowledge check

⏱ **About 3 minutes, on your own**, while your last prompt runs. Choose one answer for each question. Your instructor then goes over the answers with the class.

**Question 1.** In 10.2, why does the agent authenticate as Christian to create the article, rather than as the admin?

- **A.** The admin isn't allowed to create articles in a Space.
- **B.** So Christian's own permissions are what's tested.
- **C.** Workflow only starts for content submitted by non-admins.
- **D.** Persona credentials are faster than the admin's.

**Question 2.** 10.1 publishes a copy of Single Approver named *Clarity Article Approval*, instead of editing Single Approver itself. Why?

- **A.** Liferay doesn't let you edit a workflow it ships.
- **B.** A copy runs faster than the shipped definition.
- **C.** Only a copied definition can assign tasks to custom roles.
- **D.** Editing it would change everything else that uses it.

**Question 3.** Christian has submitted *Spring Campaign*, and Clara hasn't approved it yet. What does the announcement bar show visitors?

- **A.** The new announcement, because it's the newest entry.
- **B.** Both announcements, the new one marked as pending.
- **C.** The previous announcement, until Clara approves.
- **D.** Nothing, while any review is pending.

## ⭐ Extras

Optional, for when you finish early. The next level doesn't depend on them.

### ⭐ Bonus: schedule the next announcement (after 10.3)

🎯 **Goal:** an announcement with a display date in the future: approved today, live later. You write the prompt yourself.

✅ **Success looks like:**
1. Your agent creates the announcement with a future display date, and it goes through the same approval.
2. After approval, the announcement bar keeps its current text until the display date.

📖 **Why it matters:** CMS structures can **schedule** an entry with a display date in the future: approve today, live on Monday.
