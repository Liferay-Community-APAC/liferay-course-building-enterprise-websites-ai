# Level 1 — Users and permissions

⏱ **45-minute block** · **Slides:** [Day 1, 16–20](slides/day-1.html#16) · **Learners:** [Level 1](../workbook/level-1.html)

**In this block:** Learners create Clarity's user groups, roles and personas.

**Demos:** D1.6 (4 min)

### D1.6 — Roles: who holds them, and why the API differs

🕒 **4 minutes** · Day 1, slide 18 · with *Users, user groups and roles*

🎯 **Show:** who holds a role: users directly, or through a user group.

💡 **Say:** in the UI you can assign a role to a user group; the headless API assigns roles to users only, so in Level 1 the agent assigns them one by one.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Roles* → *Regular Roles* → **Marketing Coordinator** → *Assignees* → **expect:** the *Users* and *User Groups* tabs. Show both.
2. *Global Menu* → *Control Panel* → *User Groups* → **Marketing** → **expect:** its members.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block · learners answer on their own first ([Level 1, Knowledge check](../workbook/level-1.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** Clarity hires a second Marketing Coordinator. In the Control Panel you can give a role to the **Marketing** user group, so every member gets it. Why did your agent assign each persona's role to the user directly in 1.1?

✔ **Answer: C.** Liferay's headless API assigns roles to users only, not to user groups. Liferay's headless API assigns roles to users, not to user groups. The Control Panel can do both, which is why the 📖 note in 1.1 points learners to *Roles* → a role → *Assignees*, where both kinds of assignee show.

- **A:** Assigning a role to a user group is a normal, supported feature.
- **B:** The UI does it; D1.6 shows the *User Groups* tab of a role's assignees.
- **D:** The prompt adds users to user groups; it just can't assign roles to them over the API.

**Ask next:** When would you rather assign the role to the user group in the UI? (When people join and leave the team often: membership then carries the role.)

**Question 2.** Each persona gets an external reference code like `PERSONA-CCARTER`. You run the 1.1 prompt a second time. What does the ERC make possible?

✔ **Answer: A.** The agent updates the same user instead of adding a duplicate. An ERC is an ID you choose, so a prompt can find the same item again. The agent upserts by ERC: it updates the user that already has that code instead of adding a second one. That's what makes every prompt in the course safe to run twice.

- **B:** Sign-in uses the email and password; the ERC plays no part.
- **C:** Passwords are set explicitly (`learn`); the ERC is just an identifier.
- **D:** Site membership comes in Level 2, from a separate prompt.

**Ask next:** What would break in a real migration if you used Liferay's numeric ids instead? (They differ on every instance, so a second run or a second environment can't find the same item.)

**Question 3.** **Site Content Contributor** is a site role. Christian holds it in the public site. Later, Christian is added as a member of the Clarity Distributor Portal. What does that role give Christian there?

✔ **Answer: D.** Nothing, unless it's assigned in that site as well. A site role is assigned per site. Becoming a member of another site gives Christian that site's member permissions, not the site roles held elsewhere. Someone would have to assign Site Content Contributor in the distributor portal too.

- **A:** That describes a regular role, which applies across the instance.
- **B:** Liferay has no automatic read-only version of a role.
- **C:** This is the trap: membership and site roles are separate. Joining a site gives no site role.

**Ask next:** Which kind of role would you use for a reviewer who works in every site? (A regular role, as Level 2 does for Marketing Coordinator.)
