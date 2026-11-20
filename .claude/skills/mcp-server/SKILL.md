---

description: Set up the Liferay MCP server, manage CLI session restart ordering, and diagnose MCP specific failure modes (transport version switch, connection lifecycle, auth split, 204 false alarms, token limit exceeded). Use when the user asks to enable or set up MCP, when an MCP tool call returns errors, or before performing content/page/object operations where MCP is preferred over raw REST.
name: mcp-server

---

# MCP Server

**MCP (Model Context Protocol)** is the AI agent integration standard that lets AI tools call Liferay APIs directly without manual REST auth setup.

> Available on recent DXP quarterly releases (gated by feature flag `LPD-63311`, marked `beta`). Verify against your DXP version before relying on it.

## When to Invoke

- "Enable MCP", "set up the MCP server"
- An MCP tool call returns errors
- Before content, page, or object operations where MCP is preferred over raw REST

## Setup

### Enable the Feature Flag

Enable `LPD-63311` in the active configuration. Use `skills/feature-flags/SKILL.md` for the per environment mechanism (Tomcat / Docker prebuilt / Docker custom) and the env var encoding scheme.

### Enable the Instance Setting (2026.Q3+)

On 2026.Q3, where MCP became a release feature, the flag is only the first gate. **Control Panel → Instance Settings → Platform → MCP Server → Enabled** must also be checked and saved. Until it is, `/o/mcp` returns a plain Liferay 404 page, not a JSON-RPC error, with the flag on and the module active. Verified live on 2026.q3.2 (2026-09-04), matching `https://learn.liferay.com/w/dxp/ai/using-liferay-as-an-mcp-server`.

The toggle is a classic session-authenticated admin screen, outside what Basic auth can reach. **But it is an ordinary OSGi configuration, so an agent can switch it on without the UI** (verified on 2026.q3.10, 2026-11-20): the PID is `com.liferay.mcp.server.rest.internal.configuration.MCPServerConfiguration`, with one Boolean attribute, `enabled`. Write it to the running bundle and it applies live, with no restart, within seconds:

```bash
printf 'enabled=B"true"\n' > bundles/osgi/configs/com.liferay.mcp.server.rest.internal.configuration.MCPServerConfiguration.config
```

Write the same file to `configs/local/osgi/configs/` too, so the next `blade server init` keeps it. A `.config` file in `osgi/configs` is a system-scope default, which the instance inherits unless someone saved a different instance value in Instance Settings. None of the flag state sources in `rules/feature-flags-catalog.md` reflect it.

**A `200` elsewhere proves nothing about the transport.** `/o/mcp-server/v1.0/openapi.json` and `/o/mcp/server-profiles` come from the same module and answer whether or not the toggle is on. Only an `initialize` call on `/o/mcp` tests the transport.

### Restart the CLI Session

Most CLI based agents load MCP configuration at startup only and cannot pick up new settings midsession. Prompt the user to exit and restart their agent session **before starting the Liferay server** — so the restart costs nothing while the server is still down.

The CLI session restart kills any running Liferay server. If `blade server start` runs before the restart, the restart will tear the server down — forcing a second cold boot cycle. Liferay cold boot is several minutes. Complete the CLI restart before running `blade server start`.

### Endpoint URL by DXP Version

- DXP 2025.Q4: `http://localhost:${PORT}/o/mcp/sse`
- DXP 2026.Q1 and later: `http://localhost:${PORT}/o/mcp`

### Authentication

Basic auth with base64-encoded credentials, read from `configs/local/admin.properties` (see `CLAUDE.md` → "Authentication"). The skills' curl examples use `test@liferay.com` / `test` as a placeholder only. Build the header in the shell without echoing it, and git-ignore the client config file that holds it.

Client configuration, per agent (verified with Claude Code on 2026.q3.10):

| Agent | File | Entry |
| --- | --- | --- |
| Claude Code | `.mcp.json` | `{"mcpServers": {"liferay": {"type": "http", "url": "http://localhost:<port>/o/mcp", "headers": {"Authorization": "Basic <base64>"}}}}`. Claude Code asks the user to approve a project-scoped server on the next start. |
| GitHub Copilot (VS Code) | `.vscode/mcp.json` | `{"servers": {"liferay": {"type": "http", "url": "…/o/mcp", "headers": {"Authorization": "Basic <base64>"}}}}` |
| Codex | `.codex/config.toml` | `[mcp_servers.liferay]` with `url = "…/o/mcp"` and `http_headers = { Authorization = "Basic <base64>" }` |

### Connection Check

Use your MCP client's built in connection test. If it returns 401/403, stop and ask the user for updated credentials — do not edit these rule files.

To probe from a shell, send a real JSON-RPC `initialize`. A `HEAD` or bare `GET` cannot succeed. With the server up, a request with no credentials returns `401` with `WWW-Authenticate: Bearer realm="mcp", resource_metadata=".../.well-known/oauth-protected-resource/mcp"`, and a `404` page means a gate is still closed (2026.q3.2):

```bash
curl \
	--data '{"id": 1, "jsonrpc": "2.0", "method": "initialize", "params": {"capabilities": {}, "clientInfo": {"name": "probe", "version": "0"}, "protocolVersion": "2025-06-18"}}' \
	--header "Accept: application/json, text/event-stream" \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/mcp" \
	--user "test@liferay.com:test" \
	--write-out '\n%{http_code}\n'
```

A `serverInfo` block in the response means the transport is up (verified 2026.q3.2: `"Java SDK MCP Server"` 0.15.0, protocol `2025-06-18`).

Behind a proxy or tunnel, the `401`'s `resource_metadata` URL is built from `web.server.host` **plus the local port** (e.g. `https://<tunnel-host>:8080/o/.well-known/…`). An OAuth-capable MCP client that follows it cannot reach it, so configure such clients with Basic auth or an explicit token.

## MCP First Workflow

When MCP is available, always attempt operations via MCP before reaching for headless REST. MCP bypasses the complex auth dance (session cookies, `p_auth`, SAP policies, Basic Auth verifier).

**Fallback policy**: only fall back to REST APIs if MCP has been configured correctly and is still returning errors. "Not yet configured" is not a valid fallback condition — configure it first. When falling back, document why before pivoting to REST — this prevents silently sliding into REST auth debugging.

## Patterns and Gotchas

### The Tool Surface: a Discovery Chain on 2026.Q3 — Run `tools/list` First

**Never assume a tool name.** Run `tools/list` once per session and use what it returns. Two surfaces exist:

| Surface | Releases | Tools |
| --- | --- | --- |
| **Discovery chain** | 2026.Q3 (verified on 2026.q3.2) | `getToolSetsPage`, `getToolSetToolSetNameToolSummariesPage`, `getToolSetToolSetNameTool`, `postToolSetToolSetNameToolInvoke` |
| **Flat** | Earlier releases | `call-http-endpoint`, `get-openapi` |

On 2026.Q3 there is **no `call-http-endpoint` and no `get-openapi`**. A call is a walk down the chain:

1. `getToolSetsPage` lists the tool sets, one per Headless module (e.g. `object-admin-v1.0`).
2. `getToolSetToolSetNameToolSummariesPage` lists a set's operations, named after the REST operation (e.g. `getObjectDefinitionsPage`).
3. `getToolSetToolSetNameTool` returns one operation's schema: its parameters and request body. This replaces `get-openapi`.
4. `postToolSetToolSetNameToolInvoke` invokes it. This replaces `call-http-endpoint`.

Steps 1–3 are discovery. Once a set's and an operation's names are known in the session, go straight to the invoke step instead of walking the chain again.

Verified live on 2026.q3.2: walking the chain to `getObjectDefinitionsPage` returned the same definitions as the direct REST call. The server is stateless Streamable HTTP (no `Mcp-Session-Id` carried between calls) and accepts Basic auth or an OAuth 2.0 Bearer token.

Other skills and rules in this pack say "the MCP invoke tool" and "the MCP operation schema" for steps 4 and 3. Read them as `call-http-endpoint` and `get-openapi` on a flat release. The gotchas below name the surface they were observed on; on the other surface, revalidate before relying on them.

### DXP 2026.Q1+: Streamable HTTP Transport Required

The Liferay MCP server on DXP 2026.Q1 and later requires the **Streamable HTTP** transport. MCP clients configured to use SSE will show "Disconnected" even when the server is running and the endpoint URL is correct. Check your MCP client configuration and ensure it is using Streamable HTTP, not SSE.

### Session Restart Required After Any Config Change

CLI sessions load MCP server config once at startup. Any change — including initial setup, endpoint URL updates, or auth credential changes — will not be visible until you exit and restart the session. This applies whether the change was made before or during the session.

After restarting, verify the MCP server entry appears in your client's server list before starting Liferay. A disconnected or failed status is expected and acceptable at this point — the server is not running yet. If the entry is absent entirely, recheck the MCP configuration before proceeding.

If the server shows as connected but lists zero tools, check whether your agent provides a reconnect or refresh option for MCP servers — this can recover a dropped midsession connection without a full restart. This does **not** apply to newly added or changed server config — those always require a full restart.

### 204 No Content Responses Are False Alarms (Flat Surface)

On the flat surface, the MCP `call-http-endpoint` tool throws `MCP error -32603: text must not be null` when an endpoint returns 204 No Content. This is a tool limitation, not an API failure — the operation most likely succeeded.

**Affected operations include**: publishing a page specification, checking out a CT collection, and any other endpoint that intentionally returns no response body.

**Workaround**: after a 204 MCP error, follow up with a GET to confirm the operation succeeded before assuming failure or retrying. Not yet observed on the discovery chain; apply the same GET check if its invoke step errors on an endpoint that returns no body.

### Endpoint Discovery: the Operation Schema

The live instance's OpenAPI specs describe the headless API surface. On the discovery chain, read them one operation at a time with `getToolSetToolSetNameTool` (after locating the operation with the first two steps). On a flat release, `get-openapi` returns a whole module's spec. Without MCP, `GET /o/<module>/v1.0/openapi.json` gives the same spec. Read the schema before answering "is there an endpoint for X?" questions, before debugging a call whose expected behavior is uncertain, or before composing any POST/PATCH payload. The live specs are the source of truth — Liferay's hosted documentation is known to lag, and GET response structure does not equal POST/PATCH request structure.

The spec has known gaps: several fields required at runtime are marked optional (see `manage-pages` → "`headless-admin-site` Schema Gotchas" for the documented exceptions in that API). Treat the spec as the discovery surface, not the final word, and cross check against the per skill gotchas when working with `headless-admin-site`, `headless-delivery`, or `object-admin`.

### Large OpenAPI Specs Exceed the Token Limit (Flat Surface)

`get-openapi` on large APIs (e.g., `headless-delivery`, `headless-admin-site`) exceeds the MCP tool's token limit. The tool saves the output to a temp file rather than returning it inline.

**Workaround**: use a targeted `grep` on the saved temp file to extract only the relevant schema sections rather than attempting to read the full output. The discovery chain avoids this by returning one operation's schema at a time.

### `object-admin` Write Responses Are Unfiltered and Very Large

The MCP invoke tool returns the response verbatim — there is no `fields` projection and no way to trim it from the call. On `object-admin`, every definition create, update, and **publish** echoes the complete `ObjectDefinition`: all six system fields (`creator`, `createDate`, `externalReferenceCode`, `id`, `modifiedDate`, `status`), every custom field with its full settings, plus `actions`, `objectRelationships`, and the embedded relationship `objectField`. A single publish on a modest object runs several hundred lines, and a build of two related objects can spend more context on echoed responses than on the actual work.

The `fields` query parameter helps on **GET** (`?fields=id,name,status`) but is ignored on POST bodies.

**Prefer MCP for reads and discovery; drop to `curl | jq` for `object-admin` writes**, projecting just the confirmation you need:

```bash
curl \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/object-admin/v1.0/object-definitions/<id>/publish" \
	--user "test@liferay.com:test" \
	| jq '{id, name, active, status: .status.label, restContextPath}'
```

This is a context budget concern, not a correctness one — the MCP path works. It matters most in long multiobject builds, where the flood arrives early and crowds out later steps.

### MCP Connection Lifecycle (Server Restart Drops the Connection)

The MCP client connection drops when the Liferay server stops, restarts, or crashes and does NOT autoreconnect. Recovery requires the user to manually trigger reconnect in their agent — the agent cannot trigger reconnection via Bash, MCP, or any other tool. After any Liferay restart cycle completes, prompt the user to reconnect the MCP server in their agent (each agent has its own reconnect command; e.g., a slash command, a UI button, or a settings refresh) and wait for their reply before making MCP tool calls.

### Claude Code on Windows: Every Call Runs as Guest

If every MCP call returns 403 as anonymous Guest while the credentials, the flag, and a raw curl `initialize` all check out, check `~/.claude.json` before suspecting Liferay. Its `projects` map can hold **two entries for the same folder**, differing only in drive letter case (`C:/...` vs `c:/...`). Only one entry's cached `mcpServers` block carries the `Authorization` header; the other is a stale snapshot without `headers`. Editing `.mcp.json`, `/mcp` reconnect, and remove/re-add touch only the entry the current session resolved to.

Find every `projects` key matching the folder case-insensitively, and diff their `mcpServers`. Fix or delete the stale sibling, then fully restart the CLI. Observed with Claude Code 2.1.226 on Windows (2026-08-24). "It works in another workspace" is a strong hint.

### MCP/REST Auth Split — Handshake Succeeds Without BasicAuth Verifier

The MCP connection handshake succeeds without `BasicAuthHeaderAuthVerifier` configured. Tools appear in the agent's tool list and the connection looks healthy. But the MCP invoke tool calls the same `/o/*` endpoints as direct REST and is subject to the same verifier rules — without it, every tool call returns 403. If first login bootstrap is confirmed complete and 403s persist, add the BasicAuth verifier (dev only) per `skills/workspace-init/SKILL.md` → "Tomcat" setup.

### First Login 403 Trap (Fresh Liferay Instances)

If MCP connects and tools appear but every invoke call returns 403, the default admin has not completed first login bootstrap. On a fresh instance, `headless-delivery` endpoints return JSON 404 while admin APIs return XML 403 — both are auth failures, not routing or SAP issues. Complete first login bootstrap per `skills/workspace-init/SKILL.md` → "First Login Bootstrap" before retrying. If the bundle has already booted, syncing `portal-ext.properties` now will not help — the flags are in the database and only the manual login clears them.

## Success Signal

The MCP server appears in the client's tool list, `tools/list` returns the surface described above, and an invoke call returns a non-403 response: `postToolSetToolSetNameToolInvoke` on 2026.Q3 (verified on 2026.q3.2 with `getObjectDefinitionsPage`), `call-http-endpoint` on a flat release.