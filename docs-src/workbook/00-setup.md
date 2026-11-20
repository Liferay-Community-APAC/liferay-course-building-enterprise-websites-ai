# Setup — Your workspace, Liferay DXP and the MCP server

Do this chapter once, on the first morning. It gets Liferay DXP running on PostgreSQL, connects your AI agent to Liferay's MCP server, and seeds the two files every later session reads.

### S.1 — Open the workspace and seed the context files

🎯 The course repository open in VS Code, your agent able to read its skills, and two files at the workspace root that let any new agent session pick up the project: `solution-context.md` (what Clarity is building) and `solution-index.yaml` (what's done and what's left).

🧩 None — the prompt below is self-contained.

📋 **Steps:**
1. Clone the repository the instructor shares, then open its folder in VS Code (*File* → *Open Folder*). Open the **folder**, not a file: that's how your agent finds `.claude/` (Claude Code) or `.agents/` (other agents) and their skills.
2. Open your agent's chat in agent mode, then send the prompt.

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

✅ **Verify:** open both files in VS Code. `solution-context.md` fits on a screen or two and names the personas; `solution-index.yaml` has 13 entries, all `status: todo`.

⚠️ Keep `solution-context.md` short. Every new session reads it, so a long file costs tokens on every prompt for the rest of the course.

### S.2 — Start PostgreSQL and Liferay DXP

🎯 PostgreSQL running in Docker, and Liferay DXP 2026.Q3.10 running on it at `http://localhost:8080`.

🧩 None — you run these commands yourself, in your own terminal.

📋 **Steps:**
1. Copy the activation key file you received by email into `configs/local/deploy/` (create the folder if it doesn't exist). It's git-ignored: it never leaves your computer.
2. In VS Code's terminal (*Terminal* → *New Terminal*), at the workspace root, start the database:
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

✅ **Verify:**
- `docker compose ps` shows `clarity-postgres` as `running (healthy)`.
- `http://localhost:8080` shows the Liferay home page. Sign in as `admin@clarityvisionsolutions.com` with password `learn`. The first sign-in shows a *Terms of Use* notice about Liferay Enterprise Search: read it and close it with **Done**.
- In the Global Menu (the grid icon, top right) → *Control Panel* → *Server Administration*, the *Properties* → *Portal Properties* tab lists `jdbc.default.url` with `postgresql`.

⚠️ **You start and stop Liferay, not the agent.** Never ask the agent to run `blade server start`, `stop` or any Tomcat script: a server started inside an agent session stops when that session ends, and a stopped server drops the MCP connection. If port 8080 or 5432 is already in use, stop the other program first.

### S.3 — Save the admin credentials for the agent

🎯 A credentials file every agent session finds on its own, so you never type a password into a chat.

🧩 None.

📋 **Steps:**
1. Create `configs/local/admin.properties` yourself in VS Code, with these two lines:
   ```properties
   ADMIN_EMAIL=admin@clarityvisionsolutions.com
   ADMIN_PASSWORD=learn
   ```
2. Send the prompt.

💬 **Prompt:**
```
Confirm configs/local/admin.properties exists and is listed in .gitignore.
Read the admin email and password from it, never printing the password, and
check they work: call GET /o/headless-admin-user/v1.0/my-user-account with
Basic auth on the port Tomcat listens on (read it from
bundles/tomcat/conf/server.xml). Show me the name and emailAddress from the
response.
```

✅ **Verify:** the agent shows *Clarity Admin* and `admin@clarityvisionsolutions.com`, and its messages never contain the password.

### S.4 — Turn on Liferay's MCP server

🎯 Your agent connected to Liferay's MCP server at `http://localhost:8080/o/mcp`, so it can call Liferay's APIs as a tool instead of hand-writing `curl` commands.

🧩 `mcp-server`

📖 **What is MCP?** The Model Context Protocol is a standard way for an AI agent to use tools. Liferay DXP 2026.Q3 ships an MCP server that exposes every headless API (sites, pages, CMS, objects, commerce, users…) as tools. The agent discovers them at runtime, reads each operation's schema, then calls it, all with the permissions of the user it authenticates as.

On 2026.Q3 the MCP server has two switches. The workspace already turns on the first one, the feature flag `LPD-63311`, in `configs/local/portal-ext.properties`. The second is the *MCP Server* instance setting. It's an ordinary OSGi configuration, so your agent can switch it on with a configuration file, live, without a restart.

📋 **Steps:**
1. Send the prompt below. It turns the MCP server on and registers it in your agent's own configuration file.
2. **Restart your agent session** (close and reopen the chat, or reload the VS Code window). Agents read their MCP configuration only when a session starts.

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

✅ **Verify:**
- In Liferay, open the Global Menu → *Control Panel* → *Instance Settings* → *Platform* → *MCP Server*: **Enabled** is checked. Don't change it.
- After the restart, approve the project's `liferay` server if your agent asks (Claude Code does, for servers in `.mcp.json`), then open your agent's MCP server list (Claude Code: type `/mcp`; Copilot: *MCP: List Servers* in the Command Palette; Codex: its MCP settings). `liferay` is listed as connected.
- Ask the agent *"Using the liferay MCP server, list the tool sets it offers"*, and check it answers from the server, not from memory.

⚠️ If the server shows as connected but lists no tools, Liferay was restarted since your session started: reconnect or restart the session.

### S.5 — Read the terrain

🎯 The agent confirms the facts every later prompt depends on, before anything is built.

💬 **Prompt:**
```
Read .claude/CLAUDE.md (or .agents/ if that's what you use) and tell me,
without changing anything: the workspace root, the DXP version from
gradle.properties, the database Liferay is using, the Tomcat port, how you
authenticate, whether the liferay MCP server is available to you, and which
sites already exist in the instance.
```

✅ **Verify:** compare the answer with `gradle.properties`, `configs/local/portal-ext.properties` and *Control Panel* → *Sites*. The only sites are Liferay's defaults: the Clarity sites don't exist yet.

**From here on, work in short agent sessions.** Start a new session (or `/clear`) when you move to an exercise that doesn't build directly on the previous one. A fresh session costs fewer tokens and stays focused, and nothing is lost: it picks the project up from `solution-context.md` and `solution-index.yaml`.
