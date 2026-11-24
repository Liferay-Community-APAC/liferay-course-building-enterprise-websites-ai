# Setup — Your workspace, Liferay DXP and the MCP server

⏱ **60-minute block** · **Slides:** [Day 1, 9–12](slides/day-1.html#9) · **Learners:** [Setup](../workbook/setup.html)

**In this block:** Learners clone the course, start Liferay in Docker, save the admin credentials and connect their agent to the MCP server.

**Demos:** D1.2 (5 min), D1.3 (5 min), D1.4 (5 min)

### D1.2 — The first start of Liferay

🕒 **5 minutes** · Day 1, slide 10 · with *Running Liferay locally*

🎯 **Show:** what a healthy first start looks like, so learners recognize it in S.2.

💡 **Say:** you start Liferay in your own terminal, not through the agent: restarting Liferay drops the agent's MCP connection. And `bundles/` on your laptop is shared with the container: the agent deploys into `bundles/osgi/client-extensions` and reads `bundles/logs`.

🧰 **Prepare** (in the break before):
1. Stop your demo build (`docker compose stop`) so you can show a start from the beginning. Its data stays; the start just isn't the first one.
2. If you'd rather not restart, show the log of your dry run instead (`docker compose logs liferay`).

📋 **Steps:**
1. In VS Code's terminal: `docker compose up -d` → **expect:** three containers: the database, a one-off `clarity-liferay-init` that prepares `bundles/`, and Liferay.
2. `docker compose logs -f liferay` → **expect:** `Server startup in [...] milliseconds`. Press `Ctrl+C` (it stops following, not Liferay). `docker compose ps` now shows both as *healthy*. Tell learners their first start also creates the database, so it takes a few minutes longer, and that the commands are the same on macOS, Windows and Linux.
3. Open `http://localhost:8080` and sign in as `admin@clarityvisionsolutions.com` → **expect:** you're signed in. Tell learners that on their first sign-in they see a *Terms of Use* notice: they read it and close it with *Done*.

### D1.3 — The agent connected to Liferay's MCP server

🕒 **5 minutes** · Day 1, slide 11 · with *MCP: how the agent talks to Liferay*

🎯 **Show:** the two switches that turn on MCP, and the agent using it.

💡 **Say:** the agent calls the same headless APIs a script would, with the permissions of the user it signs in as. If the list of tools is empty, Liferay restarted since the session began: reconnect.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → **MCP Server** → **expect:** *Enabled* is checked. Don't change it.
2. In your agent, list its MCP servers (Claude Code: `/mcp`) → **expect:** **liferay** is connected.
3. Ask the live prompt below → **expect:** the answer comes from the server, and the agent names the MCP tools it called.

💬 **Live prompt:** as step 3, ask:
```
Using the liferay MCP server, list the tool sets it offers, then list the
sites in this instance with their external reference codes. Tell me which
MCP tools you called.
```

### D1.4 — Setup S.1 on the projector

🕒 **5 minutes** · Day 1, slide 12 · at the Setup challenge

🎯 **Show:** the prompt-then-verify loop, once, before learners try it.

💡 **Say:** the verify step is yours, not the agent's: open the file and check it against the brief.

🧰 **Prepare** (in the break before):
1. S.1 rewrites `solution-context.md` and `solution-index.yaml`, and your finished build's index records all 13 requirements as done. Keep a copy:
   ```bash
   mkdir -p ~/courses/s1-backup
   cp solution-context.md solution-index.yaml ~/courses/s1-backup/
   ```

📋 **Steps:**
1. Run [S.1 from the workbook](../workbook/#s1-seed-the-context-files) in a new agent session → **expect:** the agent rewrites `solution-context.md` and `solution-index.yaml`.
2. Open both files → **expect:** `solution-context.md` fits on a screen or two and names the personas; `solution-index.yaml` lists the 13 requirements, all `status: todo`, which is where learners start.

🧹 **After the demo:** right away, put your copies back:
```bash
cp ~/courses/s1-backup/solution-context.md ~/courses/s1-backup/solution-index.yaml .
```
