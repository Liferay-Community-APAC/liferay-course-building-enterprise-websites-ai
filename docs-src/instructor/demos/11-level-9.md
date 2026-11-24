# Level 9 — Headless APIs: importing legacy data

⏱ **40-minute block** · **Slides:** [Day 2, 16–19](slides/day-2.html#16) · **Learners:** [Level 9](../workbook/level-9.html)

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
