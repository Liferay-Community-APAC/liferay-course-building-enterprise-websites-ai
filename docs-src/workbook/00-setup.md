# Setup — Your workspace, Liferay DXP and the MCP server

⏱ **About 60 minutes**, with the talk · **Builds on:** the prerequisites

**What you'll build:** the course repository open in VS Code, Liferay DXP running on PostgreSQL, your AI agent connected to Liferay's MCP server, and the two context files every later session reads. Do this once, on the first morning.

**Key terms**
- **Workspace root:** the `bewl-ai` folder you open in VS Code. Its terminal opens there, and every command runs there unless a step says otherwise.
- **Context files:** `solution-context.md` (what Clarity is building) and `solution-index.yaml` (what's done and what's left). A new agent session picks the project up from them.
- **Requirements R1 to R13:** Clarity's requirements, listed in section 8 of `context-source/clarity-brief.md`.
- **Docker Compose:** runs PostgreSQL and Liferay DXP as containers, from `docker-compose.yml`. You start and stop them yourself.
- **Blade:** Liferay's command-line tool. Your agent uses it to build and deploy client extensions.
- **MCP server:** Liferay's Model Context Protocol server at `/o/mcp`. It lets your agent call Liferay's APIs as tools instead of hand-writing `curl` commands.

ℹ️ **Note:** before you start, finish the [prerequisites](https://liferay-community-apac.github.io/resources/bewl-ai-prerequisites/): Git, JDK 21 and Blade (they build your client extensions), Docker running, Docker given 8 GB of memory, the Liferay DXP and PostgreSQL images pulled, VS Code and your AI agent installed and signed in. Have the activation key file from your email at hand.

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

🎯 **Goal:** PostgreSQL and Liferay DXP 2026.Q3.10 running in Docker, with Liferay at `http://localhost:8080`.

**Skills:** none, you do this yourself

⚠️ **Before you start:** you start and stop Liferay, not the agent. Never ask the agent to run `docker compose up`, `stop`, `restart` or `down`: restarting Liferay drops the agent's MCP connection and interrupts your work.

📋 **Steps** (there's no prompt in this exercise):
1. **Copy the activation key** file you received by email into `configs/local/deploy/`: drag it from your email or Downloads folder onto that folder in VS Code's Explorer. It's git-ignored: it never leaves your computer.
2. **Check that Docker has at least 8 GB of memory.** Liferay and its search engine need about 6 GB, and PostgreSQL needs some too. You set it in the prerequisites; check it:
   ```bash
   docker info --format "{{.MemTotal}}"
   ```
   About 8 GB or more (a number like `8307101696`) is right. If it's less, fix it for the Docker you installed in the prerequisites:

   **macOS, option A (Colima):** restart Colima with 8 GB:
   ```bash
   colima stop
   colima start --cpu 4 --memory 8 --vm-type vz --mount-type virtiofs
   ```

   **macOS, option B (Docker Desktop):** *Settings* (the gear icon) → *Resources* → *Advanced*, set **Memory** to 8 GB or more, then click **Apply & restart**.

   **Windows (Rancher Desktop or Docker Desktop):** both run their containers in WSL 2, which sets the limit. In PowerShell, write it to `.wslconfig` in your user folder, then restart WSL:
   ```powershell
   Set-Content -Path "$env:USERPROFILE\.wslconfig" -Value "[wsl2]`nmemory=8GB"
   wsl --shutdown
   ```
   If you already have a `.wslconfig`, open it in VS Code instead and set `memory=8GB` under `[wsl2]`. Then quit and start Rancher Desktop or Docker Desktop again.

   **Linux (Docker Engine):** Docker uses your computer's memory directly, so this only fails if the computer has less than 8 GB. Make sure your user can run `docker` without `sudo` (`docker ps` works). If it can't, run `sudo usermod -aG docker $USER`, then log out and back in.
3. **Start PostgreSQL and Liferay.** Make sure Docker is running (Colima: `colima start`; Rancher Desktop or Docker Desktop: the app is open), then in VS Code's terminal, at the workspace root:
   ```bash
   docker compose up -d
   ```
   It creates three containers: `clarity-postgres`, `clarity-liferay-init` (it prepares the `bundles/` folders, then exits) and `clarity-liferay`. If you didn't pull the images before the course, the first run downloads them (a few GB).
4. **Watch Liferay start:**
   ```bash
   docker compose logs -f liferay
   ```
   The first start creates the database and takes several minutes. Wait for `Server startup in [...] milliseconds`, then press `Ctrl+C`: that stops following the log, not Liferay.

✅ **Verify** (look, don't change anything):
1. Run `docker compose ps` in the terminal: `clarity-postgres` and `clarity-liferay` are `running (healthy)`. Liferay reads `health: starting` until it answers.
2. Open `http://localhost:8080`: the Liferay home page shows.
3. Sign in as `admin@clarityvisionsolutions.com` with password `learn`. The first sign-in shows a *Terms of Use* notice about Liferay Enterprise Search: read it and close it with **Done**.
4. *Global Menu* → *Control Panel* → *Server Administration* → *Properties* → *Portal Properties*: `jdbc.default.url` contains `postgresql`.

⚠️ **If it doesn't match:**
- **Liferay restarts in a loop, or stops with exit code 137:** Docker doesn't have enough memory. Redo step 2.
- **Port 8080 or 5432 is already in use:** stop the other program first.
- **Linux only:** Liferay's container runs as user ID 1000 and writes its log files readable by that user only. If `id -u` doesn't print `1000` (it does for the first user on most Linux installs), your agent can't read `bundles/logs`: use the Tomcat bundle below (download it as the prerequisites page says).

📖 **Why it matters:** both run as Docker containers, defined in `docker-compose.yml`, so the steps are the same on macOS, Windows and Linux. Only Docker's memory setting differs. Liferay's container shares a few folders with your workspace, under `bundles/` (created on the first start): your agent deploys client extensions into `bundles/osgi/client-extensions` and reads the log in `bundles/logs`, as it would with a Liferay bundle installed on your computer. Your data stays in Docker volumes when you stop the containers (`docker compose stop`) or restart your computer; only `docker compose down -v` deletes it.

ℹ️ **Note: optional Tomcat bundle instead of a container.** Use this only if your instructor asks you to, or Docker can't give Liferay enough memory. You need the DXP bundle downloaded to `~/.liferay/bundles` before the course. Start PostgreSQL alone, then unpack and start the bundle:

```bash
docker compose up -d postgres
blade server init
blade server start --tail
```

Wait for `Server startup in [...] milliseconds`. Stop it with `blade server stop`. Never run the bundle and the `clarity-liferay` container at the same time: both use port 8080 and the same database. Never ask the agent to run `blade server start` or `stop`: a server started inside an agent session stops when that session ends.

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
Basic auth on Liferay's HTTP port (CLAUDE.md says how to find it). Show me the name and emailAddress from the
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
   (copied in again at every Liferay start). Don't restart Liferay.
2. Probe it: send a JSON-RPC initialize request to /o/mcp on Liferay's port,
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
gradle.properties, the database Liferay is using, whether Liferay runs in Docker or as a
Tomcat bundle and on which port, how you
authenticate, whether the liferay MCP server is available to you, and which
sites already exist in the instance.
```

✅ **Verify** (look, don't change anything):
1. `gradle.properties` and `configs/local/portal-ext.properties` in VS Code: they match what the agent reported.
2. *Global Menu* → *Control Panel* → *Sites*: the only sites are Liferay's defaults. The Clarity sites don't exist yet.

ℹ️ **Note:** from here on, start a new agent session (or `/clear`) when you move to an exercise that doesn't build directly on the previous one, as the workbook's *Working rules* describe.
