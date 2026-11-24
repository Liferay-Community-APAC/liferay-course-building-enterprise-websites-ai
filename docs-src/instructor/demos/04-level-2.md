# Level 2 — Sites

⏱ **45-minute block** · **Slides:** [Day 1, 21–24](slides/day-1.html#21) · **Learners:** [Level 2](../workbook/level-2.html)

**In this block:** Learners create the two sites, set membership and site settings, and give the Marketing Coordinator role its permissions.

**Demos:** D1.7 (4 min), D1.8 (6 min)

### D1.7 — Site settings and instance settings

🕒 **4 minutes** · Day 1, slide 22 · with *Instances and sites*

🎯 **Show:** which settings belong to one site and which apply to the whole instance.

💡 **Say:** a second instance separates users, content and configuration; Clarity only needs two sites.

📋 **Steps:**
1. *Site Menu* (Clarity Public Enterprise Website) → *Configuration* → *Site Settings* → **expect:** membership type, languages, virtual host.
2. *Global Menu* → *Control Panel* → *Instance Settings* → **expect:** the categories that apply to every site in the instance.

### D1.8 — Least privilege, as Christian

🕒 **6 minutes** · Day 1, slide 24 · at the Level 2 challenge, before learners run 2.4

🎯 **Show:** what a role's permissions change in the UI, seen through impersonation.

💡 **Say:** grant only what the job needs, and ask the agent to list a grant before it makes it.

🧰 **Prepare** (in the break before):
1. Optional: on your finished build, Christian already has the permissions. To show the before and after, remove them with this prompt. Without it, skip step 2, and in step 3 read the 2.4 prompt with the class instead of running it.
   ```
   Remove every permission the Marketing Coordinator role holds in the site
   clarity-public, and list what you removed. Change nothing else.
   ```

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Users and Organizations* → **Christian Carter** → actions menu (⋮) → *Impersonate User* → **expect:** a new tab opens as Christian.
2. In the impersonated tab, open the *Site Menu* → **expect:** no *Site Builder* or *Categorization* section. Close the tab.
3. Run [2.4](../workbook/#24-give-the-marketing-coordinator-role-its-permissions) → **expect:** the agent lists the permissions, with the class, before it grants them. Read the list.
4. Impersonate Christian again → **expect:** the sections are there now.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block · learners answer on their own first ([Level 2, Knowledge check](../workbook/level-2.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** In 2.4 you grant the **regular** role Marketing Coordinator permission to manage Collections, at company scope. Christian holds that role. In which sites can Christian now manage collections?

✔ **Answer: B.** In every site Christian can work in, because the role is regular. A regular role's permissions apply at company scope: in every site where its holder can work. That's why 2.4 lists exactly which actions to grant, and nothing beyond them.

- **A:** The site role plays no part; the permission comes from the regular role.
- **C:** Regular roles don't depend on site roles.
- **D:** Company scope already covers every site; there's no per-site switch for a regular role.

**Ask next:** If Clarity wanted Christian to curate collections in the public site only, what would change? (Use a site role, assigned in that site only.)

**Question 2.** The public site's membership type is **Open**. What does that allow?

✔ **Answer: D.** Any signed-in user can join the site without approval. Membership type controls how users join a site: Open lets any signed-in user join themself, Restricted needs approval, Private allows no requests. It says nothing about what visitors can see or do.

- **A:** Page visibility is set by page permissions, not by membership type.
- **B:** User groups are added as members explicitly (by hand, in Level 2).
- **C:** Guest's rights come from permissions; membership type doesn't grant any.

**Ask next:** Level 3's site initializer keeps this setting in `site-configuration.json`. Why? (A deploy otherwise resets an existing site to Restricted.)

**Question 3.** 2.3 puts the site settings in a re-runnable script, `scripts/site_settings.py`. Why does the course need to run it again later?

✔ **Answer: A.** Each site deploy resets some of them, such as languages. From Level 3 on, the site initializer is deployed over and over, and each deploy resets settings it has no file for, such as the languages. `scripts/deploy_site.sh` re-applies them right after every deploy.

- **B:** Settings are stored in the database and survive restarts.
- **C:** The agent writes them through the API (or an OSGi configuration) in 2.3.
- **D:** Nothing expires; the deploys are what reset them.

**Ask next:** What's the general lesson? (When a tool resets something, automate putting it back rather than remembering to.)
