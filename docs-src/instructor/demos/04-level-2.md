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
