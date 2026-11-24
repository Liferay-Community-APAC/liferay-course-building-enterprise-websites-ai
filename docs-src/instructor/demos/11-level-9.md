# Level 9 — Headless APIs: importing legacy data

⏱ **55-minute block** · **Slides:** [Day 2, 16–19](slides/day-2.html#16) · **Learners:** [Level 9](../workbook/level-9.html)

**In this block:** Learners use the API Explorer and import legacy content and products in batches.

**Demos:** D2.7 (5 min), D2.8 (4 min)

### D2.7 — The API Explorer

🕒 **5 minutes** · Day 2, slide 17 · with *Everything your agent did went through these*

🎯 **Show:** the headless API behind the agent's work, called by hand and by the agent.

💡 **Say:** it's the same call the agent made in Setup S.3. The MCP server exposes these APIs; it doesn't add new ones.

📋 **Steps:**
1. Open `http://localhost:8080/o/api` while signed in as the admin.
2. *REST Applications* → **headless-admin-user** → `GET /v1.0/my-user-account` → *Execute* → **expect:** Clarity Admin.
3. Ask the live prompt below → **expect:** the same name and email as your call in step 2. Compare them.

💬 **Live prompt:** as step 3, ask:
```
Using the liferay MCP server, call the operation that returns my own user
account, and show me the operation name and the name and emailAddress it
returns. Don't call anything else.
```

### D2.8 — A batch import task

🕒 **4 minutes** · Day 2, slide 18 · with *Batch imports of legacy data*

🎯 **Show:** a Level 9 batch import, checked as one task.

💡 **Say:** hundreds of items are one call and one task to check.

📋 **Steps:**
1. Ask the live prompt below → **expect:** the import task ID from Level 9.2.
2. In the API Explorer: **headless-batch-engine** → `GET /v1.0/import-task/{importTaskId}` with that ID → *Execute* → **expect:** `executeStatus` is **COMPLETED**, with the processed item count.
3. In a private window, open **Blog** → **expect:** the imported post.

💬 **Live prompt:** as step 1, ask:
```
Find the most recent batch import task in this instance and show me its id,
className, executeStatus and processedItemsCount. Read only.
```

### Knowledge check answers

🕒 **5 minutes** · at the end of the block, included in its time · learners answer on their own first, while their last prompt runs ([Level 9, Knowledge check](../workbook/level-9.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** Your agent sends a batch request and gets a response right away. What does that response prove?

✔ **Answer: C.** Only that a task was created to run the import. A batch request is asynchronous: Liferay accepts the job and hands back a task. Only the task's final status and counts say what happened, which is why every 9.x prompt asks the agent to poll and report them.

- **A:** The import hasn't run yet when the response arrives.
- **B:** Items are validated while the task runs.
- **D:** The response holds the task's id.

**Ask next:** What if the task completes with fewer items processed than sent? (Read its failed items and fix the data; COMPLETED alone isn't success.)

**Question 2.** The CMS **Article** structure has no batch endpoint of its own. How did the agent import three articles in one request?

✔ **Answer: A.** Through the generic batch engine, scoped to the Space. The batch engine is generic: it can import any entity it has a delegate for. A CMS structure's entries are object entries, so the agent names the structure's delegate and the Space.

- **B:** 9.2 asks for one batch request, and it works.
- **C:** Articles aren't blog posts.
- **D:** The initializer isn't used for content imports here.

**Ask next:** How would you find a delegate name yourself? (The API Explorer's batch engine endpoints, or ask the agent to show the request.)

**Question 3.** Clarity's legacy blog post becomes an entry of CMS's built-in **Blog** structure, not a post in the Blogs application. Why?

✔ **Answer: D.** Blogs is in maintenance mode on this release. The course builds only on supported features. Blogs is in maintenance mode, so new work goes into Liferay CMS, where a blog post is a structure entry in a Space like any other.

- **A:** Blogs can hold images.
- **B:** Speed isn't the reason.
- **C:** Blogs can be public; it's the support status that matters.

**Ask next:** What else in the course replaces a maintenance-mode feature? (Spaces for asset libraries, workflow for Publications, user groups for segments.)
