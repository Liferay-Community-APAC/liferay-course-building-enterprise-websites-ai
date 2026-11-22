# Setup — Your workspace, Liferay DXP and the MCP server

⏱ **About 45 minutes**, with the talk · **Builds on:** the prerequisites

**What you'll build:** the course repository open in VS Code, Liferay DXP running on PostgreSQL, your AI agent connected to Liferay's MCP server, and the two context files every later session reads. Do this once, on the first morning.

**Key terms**
- **Workspace root:** the `bewl-ai` folder you open in VS Code. Its terminal opens there, and every command runs there unless a step says otherwise.
- **Context files:** `solution-context.md` (what Clarity is building) and `solution-index.yaml` (what's done and what's left). A new agent session picks the project up from them.
- **Requirements R1 to R13:** Clarity's requirements, listed in section 8 of `context-source/clarity-brief.md`.
- **Blade:** Liferay's command-line tool. You use it to unpack and start Liferay DXP.
- **MCP server:** Liferay's Model Context Protocol server at `/o/mcp`. It lets your agent call Liferay's APIs as tools instead of hand-writing `curl` commands.

ℹ️ **Note:** before you start, finish the [prerequisites](https://liferay-community-apac.github.io/resources/bewl-ai-prerequisites/): Git, JDK 21, Blade, Docker running, the DXP bundle and PostgreSQL image downloaded, VS Code and your AI agent installed and signed in. Have the activation key file from your email at hand.

### S.0 — Get the course repository and open it in VS Code

🎯 **Goal:** the course repository on your computer, open as a folder in VS Code, with a terminal and your agent's chat ready, and your agent reading the course's instructions.

**Skills:** none, you do this yourself

📋 **Before the prompt:**
1. **Pick a short folder for your courses.** Use a path with no spaces, outside any folder synced by OneDrive, iCloud Drive or Dropbox: sync tools lock the files the build writes. We use `~/courses` on macOS and Linux, and `C:\courses` on Windows.
2. **Open a terminal**: the *Terminal* app on macOS or Linux, *PowerShell* on Windows. Create the folder and go into it.

   macOS and Linux:
   ```bash
   mkdir -p ~/courses
   cd ~/courses
   ```

   Windows (PowerShell):
   ```powershell
   New-Item -ItemType Directory -Force C:\courses
   Set-Location C:\courses
   git config --global core.longpaths true
   ```
   The last line lets Git on Windows handle the long paths a Liferay workspace creates.
3. **Clone the repository** into a folder named `bewl-ai`. You don't need a GitHub account:
   ```bash
   git clone https://github.com/Liferay-Community-APAC/liferay-course-building-enterprise-websites-ai.git bewl-ai
   ```
   It takes a minute and ends with `Resolving deltas: 100%` (or `done`).
4. **Open the folder in VS Code.** Start VS Code, choose *File* → *Open Folder…* (on macOS, *File* → *Open…*), select `courses/bewl-ai` and click *Open* (*Select Folder* on Windows). Open the **folder**, not a file inside it: that's how your agent finds the course's instructions and skills.

   If you've installed VS Code's `code` command, `cd bewl-ai` then `code .` does the same.
5. **Trust the folder.** VS Code asks *Do you trust the authors of the files in this folder?* Click **Yes, I trust the authors**. In Restricted Mode, agents and the terminal can't work in the folder.
6. **Look around.** In the *Explorer* (the top icon in the left bar) you see `.agents`, `.claude`, `catch-up`, `client-extensions`, `configs`, `context-source`, `docs`, `AGENTS.md`, `docker-compose.yml` and `gradle.properties`. `client-extensions` is empty: your agent builds the site there.
7. **Open VS Code's terminal**: *Terminal* → *New Terminal*. It opens at the folder's root, which the workbook calls the **workspace root**. Run:
   ```bash
   git status
   ```
   It answers `On branch main` and `nothing to commit, working tree clean`. From now on, run every command in this terminal unless a step says otherwise.
8. **Open your agent's chat**, as you did for the prerequisites check:
   - *Claude Code:* click the Claude icon, or run *Claude Code: Open* from the Command Palette (*View* → *Command Palette…*).
   - *OpenAI Codex:* click the Codex icon in the left bar.
   - *GitHub Copilot:* open the Chat view (*View* → *Chat*) and switch the mode to **Agent**.

   Sign in if it asks.
9. Send the prompt below. When your agent asks for permission to read files or run a command, read what it wants to do, then allow it. By default your agent asks before it changes files or runs commands; keep it that way for this course.

💬 **Prompt:**
```
Read this workspace's instructions (.claude/CLAUDE.md, or AGENTS.md if
that's the file you read) and answer in four short lines, without changing
anything: what this workspace is for, the Liferay DXP version named in
gradle.properties, the folder your skills come from, and the absolute path
of the workspace root.
```

✅ **Verify** (look, don't change anything):
1. The agent's answer: it names a Liferay Workspace for Clarity Vision Solutions, `dxp-2026.q3.10`, and `.claude/skills` (Claude Code) or `.agents/skills` (other agents).
2. The workspace root in the answer: it's the `bewl-ai` folder you opened.
3. VS Code's status bar (bottom left): it shows the branch **main**.

⚠️ **If it doesn't match:**
- The agent says it can't find these files: VS Code has a file open instead of the folder, or a different folder. Repeat step 4.
- The agent offers to start Liferay or install something at this point: say no. You do that yourself in S.2.

### S.1 — Seed the context files

🎯 **Goal:** two files at the workspace root that let any new agent session pick up the project: `solution-context.md` (what Clarity is building) and `solution-index.yaml` (what's done and what's left).

**Skills:** none, the prompt is self-contained

💬 **Prompt:**
```
We're building Clarity Vision Solutions' public enterprise website on Liferay
DXP during a two-day course. Seed two files at the workspace root:
solution-context.md and solution-index.yaml.

First confirm that context-source/clarity-brief.md and context-source/README.md
exist. Stop and tell me if either is missing; don't invent content.

solution-context.md: read the brief and write a short summary (one page, not
a copy): who Clarity is, the site's five goals, the personas with their
responsibilities, the two sites, and where the content lives (CMS Spaces).
Cite context-source files by path instead of copying them.

solution-index.yaml: a top-level "requirements" list with one entry per
requirement R1-R13 in section 8 of the brief, each with: id, title, level
(the number in the brief's "Built in" column), status: todo, and an empty
artifacts list.

Don't create or change anything else. Read both files back to me.
```

✅ **Verify** (look, don't change anything):
1. `solution-context.md` in VS Code: it fits on a screen or two and names the personas.
2. `solution-index.yaml` in VS Code: 13 entries, all `status: todo`.

⚠️ **If it doesn't match:** if `solution-context.md` is much longer than a screen or two, ask the agent to shorten it. Every new session reads it, so a long file costs tokens on every prompt for the rest of the course.

### S.2 — Start PostgreSQL and Liferay DXP

🎯 **Goal:** PostgreSQL running in Docker, and Liferay DXP 2026.Q3.10 running on it at `http://localhost:8080`.

**Skills:** none, you do this yourself

⚠️ **Before you start:** you start and stop Liferay, not the agent. Never ask the agent to run `blade server start`, `stop` or any Tomcat script: a server started inside an agent session stops when that session ends, and a stopped server drops the MCP connection.

📋 **Steps** (there's no prompt in this exercise):
1. Copy the activation key file you received by email into `configs/local/deploy/` (create the `deploy` folder if it doesn't exist: right-click `configs/local` in VS Code's Explorer → *New Folder…*, then drag the key file from your email or Downloads folder onto it). It's git-ignored: it never leaves your computer.
2. Make sure Docker Desktop (or the Docker engine on Linux) is running. Then in VS Code's terminal, at the workspace root, start the database:
   ```bash
   docker compose up -d
   ```
3. Unpack the DXP bundle. It uses the copy you downloaded before the course, in `~/.liferay/bundles`:
   ```bash
   blade server init
   ```
4. Start Liferay and watch the log:
   ```bash
   blade server start --tail
   ```
   The first start creates the database and takes a few minutes. Wait for `Server startup in [...] milliseconds`.

✅ **Verify** (look, don't change anything):
1. Run `docker compose ps` in the terminal: `clarity-postgres` is `running (healthy)`.
2. Open `http://localhost:8080`: the Liferay home page shows.
3. Sign in as `admin@clarityvisionsolutions.com` with password `learn`. The first sign-in shows a *Terms of Use* notice about Liferay Enterprise Search: read it and close it with **Done**.
4. *Global Menu* → *Control Panel* → *Server Administration* → *Properties* → *Portal Properties*: `jdbc.default.url` contains `postgresql`.

⚠️ **If it doesn't match:** if port 8080 or 5432 is already in use, stop the other program first.

### S.3 — Save the admin credentials for the agent

🎯 **Goal:** a credentials file every agent session finds on its own, so you never type a password into a chat.

**Skills:** none

📋 **Before the prompt:**
1. Create `configs/local/admin.properties` yourself in VS Code (right-click `configs/local` in the Explorer → *New File…*, type `admin.properties`, press Enter), with these two lines, then save it (*File* → *Save*):
   ```properties
   ADMIN_EMAIL=admin@clarityvisionsolutions.com
   ADMIN_PASSWORD=learn
   ```

💬 **Prompt:**
```
Confirm configs/local/admin.properties exists and is listed in .gitignore.
Read the admin email and password from it, never printing the password, and
check they work: call GET /o/headless-admin-user/v1.0/my-user-account with
Basic auth on the port Tomcat listens on (read it from
bundles/tomcat/conf/server.xml). Show me the name and emailAddress from the
response.
```

✅ **Verify** (look, don't change anything):
1. The agent's answer: it shows *Clarity Admin* and `admin@clarityvisionsolutions.com`.
2. The agent's messages: none of them contains the password.

### S.4 — Turn on Liferay's MCP server

🎯 **Goal:** your agent connected to Liferay's MCP server at `http://localhost:8080/o/mcp`, so it can call Liferay's APIs as a tool instead of hand-writing `curl` commands.

**Skills:** `mcp-server`

💬 **Prompt:**
```
Using the mcp-server skill, turn on and connect me to the Liferay MCP server
of this workspace's running DXP.

1. Enable the MCP Server instance setting with its OSGi configuration file,
   in both bundles/osgi/configs (applies live) and configs/local/osgi/configs
   (survives the next blade server init). Don't restart Liferay.
2. Probe it: send a JSON-RPC initialize request to /o/mcp on the Tomcat port,
   with Basic auth from configs/local/admin.properties. Show me the
   serverInfo it returns.
3. Register it as an HTTP (Streamable HTTP, not SSE) MCP server named
   "liferay" in the configuration file of the agent I'm using right now:
   .mcp.json for Claude Code, .vscode/mcp.json for GitHub Copilot,
   .codex/config.toml for Codex. Authenticate with a Basic Authorization
   header built from configs/local/admin.properties.
4. Add that configuration file to .gitignore: it contains a credential.
5. Tell me exactly how to restart my session so the server loads.
```

📋 **After the prompt:**
1. **Restart your agent session** (close and reopen the chat, or reload the VS Code window). Agents read their MCP configuration only when a session starts.
2. Approve the project's `liferay` server if your agent asks (Claude Code does, for servers in `.mcp.json`).

✅ **Verify** (look, don't change anything):
1. *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → *MCP Server*: **Enabled** is checked. Don't change it.
2. Your agent's MCP server list (Claude Code: type `/mcp`; Copilot: *MCP: List Servers* in the Command Palette; Codex: its MCP settings): `liferay` is listed as connected.
3. Ask the agent *"Using the liferay MCP server, list the tool sets it offers"*: it answers from the server, not from memory.

⚠️ **If it doesn't match:** if the server shows as connected but lists no tools, Liferay was restarted since your session started. Reconnect or restart the session.

📖 **Why it matters:** Liferay DXP 2026.Q3's MCP server exposes every headless API (sites, pages, CMS, objects, commerce, users…) as tools, which the agent discovers at runtime and calls with the permissions of the user it authenticates as. On 2026.Q3 it has two switches: the feature flag `LPD-63311`, which the workspace already turns on in `configs/local/portal-ext.properties`, and the *MCP Server* instance setting. That setting is an ordinary OSGi configuration, so your agent can switch it on with a configuration file, live, without a restart.

### S.5 — Read the terrain

🎯 **Goal:** the agent confirms the facts every later prompt depends on, before anything is built.

**Skills:** none

💬 **Prompt:**
```
Read .claude/CLAUDE.md (or .agents/ if that's what you use) and tell me,
without changing anything: the workspace root, the DXP version from
gradle.properties, the database Liferay is using, the Tomcat port, how you
authenticate, whether the liferay MCP server is available to you, and which
sites already exist in the instance.
```

✅ **Verify** (look, don't change anything):
1. `gradle.properties` and `configs/local/portal-ext.properties` in VS Code: they match what the agent reported.
2. *Global Menu* → *Control Panel* → *Sites*: the only sites are Liferay's defaults. The Clarity sites don't exist yet.

ℹ️ **Note:** from here on, start a new agent session (or `/clear`) when you move to an exercise that doesn't build directly on the previous one, as the workbook's *Working rules* describe.
