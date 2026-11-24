# Level 1 — Users and permissions

⏱ **About 35 minutes**, with the talk and the knowledge check · **Builds on:** Setup

**What you'll build:** the accounts of the team that builds Clarity's website, grouped by department, each with a role that grants only what their work requires.

**Key terms**
- **Persona:** one of Clarity's seven test users, from `context-source/data/personas.csv`. Their password is `learn`.
- **User group:** a set of users, here one per Clarity department (for example *Marketing*).
- **Regular role:** a role that applies everywhere in the instance.
- **Site role:** a role that applies only inside the sites where it's assigned.
- **External reference code (ERC):** an ID you choose (here `PERSONA-<SCREENNAME>`) that lets a prompt find the same item again, so it can run twice safely.
- **Impersonate:** an admin action that opens Liferay as another user, so you see exactly what they see.

ℹ️ **Note:** the roles get their permissions once the site exists, in Level 2.

### 1.1 — Create Clarity's user groups, roles and personas

🎯 **Goal:** five user groups, six custom roles and seven personas, each persona in its user group with its regular role and portrait.

**Requirement:** R1 · **Skills:** `manage-roles-permissions`

💬 **Prompt:**
```
Using the manage-roles-permissions skill, set up Clarity's people from
context-source:

1. Create the user groups in data/user-groups.csv, with their descriptions.
2. Create the roles in data/roles.csv: "regular" rows as regular roles,
   "site" rows as site roles, each with its description.
3. Create the users in data/personas.csv, with an external reference code
   of the form PERSONA-<SCREENNAME>, the screen name, email, first and last
   name and job title from the file. Give each of them the password "learn"
   (the course's shared training password) and make sure none of them is
   asked to change it at first sign-in. Upload the portrait where the file
   lists one.
4. Add each user to the user group in their row, and assign them the
   regular role in the "regularRoles" column.

Make every step idempotent (upsert by external reference code or name), so
I can run this prompt again safely. Report a table of users with their
groups and roles as Liferay returns them, not as you intended them.
```

✅ **Verify** (look, don't change anything; as the Clarity Admin):
1. *Global Menu* → *Control Panel* → *Users and Organizations*: the seven personas are listed and active.
2. Open **Christian Carter**: the portrait shows, the job title is *Marketing Coordinator*, and *Memberships* → *User Groups* lists **Marketing**.
3. *Global Menu* → *Control Panel* → *User Groups*: five groups.
4. Open **Marketing**: Christian Carter and Clara Murphy are members.
5. *Global Menu* → *Control Panel* → *Roles*: the *Regular Roles* tab has the five Clarity roles, and the *Site Roles* tab has **Site Content Contributor**.
6. Open **Marketing Coordinator** → *Assignees* → *Users*: **Christian Carter** is listed.
7. In a private window, sign in as `christian.carter@clarityvisionsolutions.com` / `learn`: you land in the portal without a password change prompt.

![Control Panel → Users and Organizations listing the seven Clarity personas with their screen names, job titles and user groups.](screenshots/1-1-users.png)

![Control Panel → Roles: the Regular Roles tab lists Content Manager, Distributor Representative, IT Manager, Marketing Coordinator and Web Developer next to Liferay's own roles.](screenshots/1-1-roles.png)

🧪 **Acceptance criteria** (what the level's Playwright check tests, in ⭐ Extras):

- **AC 1.1-1** · *API, as the admin:* the five user groups in `context-source/data/user-groups.csv` exist.
- **AC 1.1-2** · *API, as the admin:* the roles in `context-source/data/roles.csv` exist, each as the type its row says (regular or site).
- **AC 1.1-3** · *API, as the admin:* the seven personas exist with the external reference codes `PERSONA-<SCREENNAME>`, active, each with the job title, user group and regular role in `personas.csv`.
- **AC 1.1-4** · *Browser, as Christian Carter:* signing in with `learn` lands in the portal, not on a password change screen.

📖 **Why it matters:** in the Control Panel you can also assign a role to a **user group**, so every member gets it. Liferay's headless API assigns roles to users only, so the agent assigns them one by one here. You can see both kinds of assignee in *Global Menu* → *Control Panel* → *Roles* → a role → *Assignees*.



## 🧠 Knowledge check

⏱ **About 3 minutes, on your own**, while your last prompt runs. Choose one answer for each question. Your instructor then goes over the answers with the class.

**Question 1.** Clarity hires a second Marketing Coordinator. In the Control Panel you can give a role to the **Marketing** user group, so every member gets it. Why did your agent assign each persona's role to the user directly in 1.1?

- **A.** User group role assignment is deprecated on this release, so the agent avoided it.
- **B.** Regular roles go to users only; only site roles can go to user groups.
- **C.** Liferay's headless API assigns roles to users only, not to user groups.
- **D.** The prompt told the agent not to use user groups for anything.

**Question 2.** Each persona gets an external reference code like `PERSONA-CCARTER`. You run the 1.1 prompt a second time. What does the ERC make possible?

- **A.** The agent updates the same user instead of adding a duplicate.
- **B.** Personas sign in with it instead of an email, which is faster.
- **C.** Liferay generates each persona's password from the code.
- **D.** Each persona joins every site whose code matches the prefix.

**Question 3.** **Site Content Contributor** is a site role. Christian holds it in the public site. Later, Christian is added as a member of the Clarity Distributor Portal. What does that role give Christian there?

- **A.** The same permissions as in the public site: roles apply everywhere.
- **B.** Read-only versions of the same permissions, as a plain member.
- **C.** The same permissions: joining a site carries over a user's site roles.
- **D.** Nothing, unless it's assigned in that site as well.

## ⭐ Extras

Optional, for when you finish early. The next level doesn't depend on them.

### ⭐ 1.2 — Bonus: a manager for the Marketing team

🎯 **Goal:** Clara Murphy can view the members of the **Marketing** user group and add new ones, **without** the Administrator or Site Administrator role and without access to any other user group. Write the prompt yourself.

✅ **Success looks like:**
1. Impersonating Clara, you can open *Global Menu* → *Control Panel* → *User Groups* → *Marketing* and add a member.
2. Another user group shows no *Assign Members* action.

### ⭐ 1.3 — Bonus: check Setup and Level 1 with Playwright

🎯 **Goal:** an automated check of what you've built: a Playwright test suite in `tests/e2e/` with one test per acceptance criterion (🧪) of Setup and Level 1. At the end of every later level, you add that level's tests to it.

**Skills:** `browser-verify`

📋 **Before the prompt:**
1. Check that Node.js 20 or later is installed: `node --version`. If it isn't, install the LTS version from [nodejs.org](https://nodejs.org/).

💬 **Prompt:**
```
Using the browser-verify skill as a reference for signing in and asserting,
set up a Playwright Test suite in tests/e2e/ (its own package.json with
@playwright/test; nothing at the workspace root), then write
tests/e2e/setup.spec.ts and tests/e2e/level-1.spec.ts from the acceptance
criteria (🧪) in docs-src/workbook/00-setup.md and
docs-src/workbook/01-users-permissions.md:

- One test per acceptance criterion, titled with its id ("AC 1.1-3 ..."),
  so a failure names the criterion.
- Run headless in the installed Google Chrome (channel "chrome"); if it
  isn't installed, install Playwright's Chromium instead. Use Liferay's
  HTTP port (CLAUDE.md says how to find it).
- Shared helpers in tests/e2e/support/: an API client with Basic auth read
  from configs/local/admin.properties (never printed, logged or copied);
  sign-in for a persona (password "learn") through /c/portal/login, with
  one saved session per persona in tests/e2e/.auth/; Guest as a fresh
  context with no session.
- Check what Liferay returns, not what the prompts intended: read data
  over the headless APIs, and what a visitor or persona sees in the
  browser. Where a criterion says "only", "no" or "not", assert the
  absence too.
- Tests only read, unless a criterion says the test creates something;
  then it deletes it afterwards, even if the test fails.
- Add tests/e2e/.auth/, node_modules/, test-results/ and
  playwright-report/ to .gitignore.

Run the suite and show me the result of each test. If a test fails, tell
me whether the test or my build is wrong before changing either.
```

✅ **Success looks like:**
1. In `tests/e2e`, `npx playwright test` runs one test per acceptance criterion of Setup and Level 1, each named by its id, and all pass.
2. In the Control Panel, remove Christian Carter from the **Marketing** user group, and run the tests again: **AC 1.1-3** fails, and the others pass. Add Christian back: all pass.
3. No file under `tests/e2e` contains the admin password.

📖 **Why it matters:** the ✅ Verify steps are you checking once, by eye. A test suite checks the same criteria again in a minute, after every deploy and on every environment, and its failures name the criterion that broke. Writing it from acceptance criteria, rather than from what the agent built, is what makes it catch the agent's mistakes.
