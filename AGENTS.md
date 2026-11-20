<!-- Entry point for agents that read AGENTS.md (Codex, Copilot and others). A copy of .claude/CLAUDE.md: edit that file and copy it here. -->

> In this file, `skills/<name>/SKILL.md` and `rules/<card>.md` mean `.agents/skills/…` and `.agents/rules/…` (Claude Code reads the same files from `.claude/`).

---

alwaysApply: true
description: General Liferay standards, architectural principles, and rule routing for AI agents in a Liferay Workspace

---

# Liferay Workspace Rules

This file is the entry point for any AI agent operating inside this workspace. It establishes the runtime context every skill below depends on.

## Establish Context First

Before answering, identify four things:

1. **Workspace root**: the directory containing `gradle.properties` and `settings.gradle`. If neither exists, the user has not initialized a workspace; invoke the `workspace-init` skill.

1. **DXP version**: read `liferay.workspace.product` from `gradle.properties`. Quarterly releases (`-Qx`) and 7.4 lines use the modern path (Client Extensions, Objects, Fragments). Versions below 7.4 use legacy OSGi modules.

1. **Bundle state**: `bundles/` exists when `blade server init` has run. The Tomcat install lives at `bundles/tomcat*/`. The active HTTP port is the `port` attribute on the `<Connector protocol="HTTP/1.1">` element in `bundles/tomcat*/conf/server.xml`. Default is 8080.

1. **Authentication**: look first for `configs/local/admin.properties` (git-ignored; `ADMIN_EMAIL=...` / `ADMIN_PASSWORD=...`), then the `LIFERAY_ADMIN_EMAIL` / `LIFERAY_ADMIN_PASSWORD` environment variables. Use them for Basic Auth without ever printing, logging, or echoing the password into the conversation or any generated file. If neither exists, ask the user once for the admin account to use, then — with their explicit confirmation — write it to `configs/local/admin.properties` so no future session has to ask again. Never accept a password typed inline as part of a task description.

## Course Conventions

- **Workspace id:** `clarity`. Prefix client extension keys with it (`clarity-site-init`, `clarity-theme-css`).
- **Sites:** `clarity-public` (Clarity Public Enterprise Website, `/clarity`) and `clarity-distributor-portal`. Address them by these ERCs.
- **The site lives in code:** `client-extensions/clarity-site` is the site initializer for `clarity-public`. Change pages, masters, menus, fragments, collections and style books there, then clean-redeploy.
- **Training passwords:** every persona's password is `learn` (`context-source/data/personas.csv`).
- **Don't build on deprecated or maintenance-mode features** (Liferay's 2026 deprecation pages): no Web Content, Blogs, Documents and Media or Asset Libraries (use Liferay CMS Spaces, structures and files), no Publications (use workflow), no DXP segments or experiences (target signed-in users by user group or role; anonymous personalization belongs to Liferay Data Platform), no Custom Fields (use Object fields on system objects), no Widget Pages or Dialect theme (content pages, Classic). If a task seems to need one, say so and propose the supported alternative.

## Project Paths

| Purpose | Path |
| --- | --- |
| Client extensions | `client-extensions` |
| OSGi modules | `modules` |
| Themes | `themes` |
| Per environment properties | `configs/{common,local,dev,uat,prod,docker}` |
| Runtime OSGi configs | `bundles/osgi/configs` |
| Logs | `bundles/tomcat*/logs/catalina.out` and `bundles/logs/liferay.<YYYY-MM-DD>.log` |
| Deployed bundles | `bundles/osgi/modules` and `bundles/osgi/client-extensions` |

`configs/common` holds shared settings. `configs/local` is the default for development. Promotion order is `local` to `dev` to `uat` to `prod`.

## Tooling

Use Blade as the primary CLI. Prefer `blade gw <task>` over invoking Gradle directly; this guarantees the workspace Gradle wrapper. Key commands:

- `blade init` to scaffold a workspace
- `blade server init` to download the bundle
- `blade server start --tail` to start Tomcat and tail the log
- `blade gw deploy` to package and deploy a module or client extension
- `blade gw tasks` to list available Gradle tasks

## AI Agent Guidelines

- **Parallel execution**: when tailing logs during deployment, run the deploy command as a nonblocking background process so log watching can happen concurrently. Use whatever background execution mechanism your tool provides.
- **Verification**: success is defined by runtime activation (`STARTED` log status), not just a successful command exit code.
- **CLI capability check**: before using a CLI tool to scaffold or initialize a project, verify what it supports (e.g., `blade --help`, `blade <command> --help`) rather than assuming. Do not assume a command supports a given task without checking first.

## Server Restarts — Ask Once per Session

Stopping a running Liferay server interrupts the user: sessions end, open editors lose work, and the MCP connection drops without reconnecting. So the **user** decides how restarts are handled, once per session.

**Covered:** any stop, restart, or kill of a running Tomcat or Liferay container — `shutdown.sh`/`startup.sh`, `blade server stop`, `docker compose down`/`restart`. It also covers anything that requires one, such as clearing `bundles/osgi/state/`. **Not covered:** starting a server that is not running, when the user asked for it or a setup skill calls for it.

**The first time a restart is needed in a session**, stop and ask which behavior the user wants for the rest of the session:

1. **Confirm each time.** Before every restart, say what changed and why, then wait for a yes.
2. **Permission to restart.** Restart when needed without asking again, but still say what is being restarted and why, before doing it.

Keep the answer for the current session only. Do not write it to a file or to memory unless the user asks. A new session asks again.

Whatever the choice:

- **Check that a restart is really needed first.** Many changes take effect live (the runtime flag toggle, OSGi `.config` files, CET redeploys). A change that "didn't work" is more often the wrong endpoint or a stale zip than a missing restart, and Deprecation-tab flags ignore restarts entirely (`rules/feature-flags-catalog.md`).
- **Never stop a process this session did not start** — another workspace holding port 8080, for example — without asking, even under permission 2.
- **Non-local environments always need confirmation** (dev, UAT, prod, Liferay Cloud), whatever was chosen; see `production-standards`.
- **After any restart,** wait for the server to answer, then prompt the user to reconnect MCP if it is in use (`skills/mcp-server/SKILL.md`).

Skills that restart the server (`feature-flags`, `deploy-and-verify`, `build-site`, `workspace-init`) apply this policy instead of restarting on their own.

## Preflight Rule for New Code Generation

Before writing the **first line** of any artifact below, load its skill. Always, and before authoring — not after something fails. Glob based autoloading does not fire on an empty workspace, so nothing else will surface these.

| About to author | Load first |
| --- | --- |
| Object definition, field, picklist, relationship | `manage-objects` |
| Object action, notification template, workflow | `manage-object-logic` |
| Page, `page-definition.json`, navigation menu | `manage-pages` |
| Fragment (`fragment.json`, `index.html`) | `scaffold-fragment` |
| Theme, style book, master page | `theme-and-design` |
| Any `client-extension.yaml` | `scaffold-client-extension` |
| Role, or any `resource-permissions.json` grant | `manage-roles-permissions` |
| Commerce product or SKU | `commerce-catalogs` |
| CMS Space, Content Structure, or folder | `manage-cms` |
| Form Container, or a form that saves to an object | `manage-form-containers` |
| Data Set definition or Data Set fragment | `manage-data-sets` |

Most real tasks match two or more rows — load all of them. Skipping one is not the smaller risk: much of what these skills document are failures that are **silent**, where the build succeeds and the defect only shows later, and the skill is the only place that behavior is written down. Reading portal source instead is not a substitute — the source shows what the code does, not which of its behaviors have already cost someone a day.

If a skill turns out to be wrong or to omit the answer, fix the skill as part of the task rather than working around it locally.

## MCP Server

Liferay provides an MCP server for AI agent integration, gated by a feature flag and available in specific DXP versions. When present and enabled, prefer MCP over raw `curl` for content, page, and object operations. See `skills/mcp-server/SKILL.md` for setup, transport details, version requirements, and quirks.

## Skill Router

Every skill lives under `skills/` and owns one workflow. Match the user's intent to a skill below and load it on demand — even in an empty workspace (see the Preflight Rule above).

| User Intent | Skill |
| --- | --- |
| Set up, initialize, or repair a workspace and bundle | `workspace-init` |
| Check, prompt for, or enable a required feature flag | `feature-flags` |
| Deploy a target and confirm it started | `deploy-and-verify` |
| Set up the MCP server or diagnose an MCP call | `mcp-server` |
| Enforce production readiness on code bound for a nonlocal environment | `production-standards` |
| Create or change an object definition, field, relationship, picklist, or validation | `manage-objects` |
| Add object business logic — actions, workflows, notifications | `manage-object-logic` |
| Create the OAuth application a client extension needs, or call a CET from browser code | `setup-oauth` |
| Build a page fragment or reusable page component | `scaffold-fragment` |
| Build a form field fragment that binds to an object field | `scaffold-form-fragment` |
| Create a site, set its members, site roles, languages or other site and instance settings, or enable and publish Publications | `manage-sites` |
| Build a search page, facets, a Search Blueprint or element, or a list driven by a blueprint | `manage-search` |
| Create pages, navigation, SEO, or page and display templates | `manage-pages` |
| Change the theme, colors, fonts, master page, or style book | `theme-and-design` |
| Scaffold any client extension type | `scaffold-client-extension` |
| Create roles or grant permissions on objects, pages, or sites | `manage-roles-permissions` |
| Manage Commerce catalogs, products, SKUs, or B2B accounts | `commerce-catalogs` |
| Create CMS Spaces, content structures, entries, or files, or connect a Space to a Site | `manage-cms` |
| Build a form that creates or edits an object entry, or fix one that renders nothing | `manage-form-containers` |
| Show object entries as a table, list, or cards with filters, sort, and row actions | `manage-data-sets` |
| Verify a page or journey in a real browser as a specific test user or as Guest, or take a screenshot of what they see | `browser-verify` |
| Build an entire site experience from one prompt (orchestrator; calls the others) | `build-site` |

Site building is **site initializer first**: the `siteInitializer` CET tree is the single source of truth. Build by triggering the initializer, then iterate by editing the source tree and applying each change live (theme, objects, fragments) or by reprovisioning (pages). See `rules/site-initializer-format.md`.

## Reference Cards

Reference cards under `rules/` hold the data skills look up. Skills cite the card path explicitly. Every card is loaded in every session, so a card states the **fact** and routes to the skill that holds the **procedure** — read the card, then load the skill it names.

- `rules/client-extension-types.md` — client extension types, their yaml, and which types may share a project
- `rules/guest-access.md` — what an anonymous visitor can and cannot read; read before building anything public
- `rules/headless-apis.md` — REST modules, base URIs, OAuth scopes
- `rules/feature-flags-catalog.md` — flag table with defaults and dependencies
- `rules/site-initializer-format.md` — site initializer directory tree and per entity file formats
- `rules/object-actions-catalog.md` — triggers, conditions, action types
- `rules/oauth-scopes.md` — `Liferay.*` scope strings for `oAuthApplicationHeadlessServer` blocks in CET scaffolding
- `rules/page-types.md` — page types and their applicable APIs

## Information Sources

The authoritative documentation is [learn.liferay.com](https://learn.liferay.com); search `site:learn.liferay.com <topic>` to find a topic.

The Liferay Portal source code at [github.com/liferay/liferay-portal](https://github.com/liferay/liferay-portal) is canonical for architectural patterns and code samples; working client extension examples live at `workspaces/liferay-sample-workspace/client-extensions/`.