# OAuth Scopes (CET Scaffolding Reference)

> **Before authoring:** Load `setup-oauth` when a CET needs a companion OAuth entry, or `scaffold-client-extension` when generating the whole project.

This card lists the `Liferay.*` scope strings used in OAuth companion entries in `client-extension.yaml`. Two OAuth CET types carry scopes, and which to use depends on the direction of the call:

- **`oAuthApplicationHeadlessServer`** — used by `siteInitializer` and `batch` CETs, where the CET calls into Liferay's Headless APIs using a service account token. Also used by a microservice that needs its own identity, typically an `objectAction` triggered by an anonymous visitor, whose inbound token is Guest's (`setup-oauth` → "A Microservice With Its Own Identity").
- **`oAuthApplicationUserAgent`** — used by microservice CETs (`objectAction`, `objectValidationRule`, `objectEntryManager`, `notificationType`, `workflowAction`, etc.), where Liferay calls the microservice and passes a user delegated token that the microservice can use to call back into Liferay.

The scope strings in the table below apply to both types — only the companion CET type differs.

**Not needed for:**
- Curl examples using Basic auth (`test@liferay.com:test`). Basic auth as the test user has full admin perms; scopes are not evaluated.
- MCP server calls using the default `Basic` header. Same path.
- Custom elements using `Liferay.Util.fetch` (in browser, session cookie based).

Each scope grants access to all operations in the module. There are no per endpoint granular scopes in the standard Liferay OAuth implementation.

## Object Modules: Admin vs Entry

Liferay's object work spans two distinct REST modules with distinct scopes:

- `Liferay.Object.Admin.REST.everything` — **admin surface**. Object **definition** CRUD: create/update/publish definitions, fields, relationships, validations, actions. Endpoints under `/o/object-admin/v1.0/`.
- `Liferay.Headless.Object.everything` — **entry surface**. Object **entry** CRUD on published objects. Endpoints under `/o/c/<pluralLabel>/`.

A microservice CET that only reads/writes object entries (most `objectAction`, `objectValidationRule`, `objectEntryManager` cases) needs the per-object scope `c_<objectname>.everything` for each object it touches (next section). `Liferay.Headless.Object.everything` alone returns `403` on `/o/c/*` (verified again on 2026.q3.2 + hotfix-1 with a headless-server token). A site initializer that also defines new objects additionally needs `Liferay.Object.Admin.REST.everything`.

### The Dynamic `/o/c/<object>` Endpoints Need a PER-OBJECT Scope

Each custom object's dynamic `/o/c/<object>` endpoint is its **own JAX-RS application** (`ObjectDefinitionImpl.getOSGiJaxRsName()` — the object name lowercased). An OAuth token calling it therefore needs the per-object scope **`c_<objectname>.everything`** (e.g. `c_invoice.everything`, `c_payment.everything` — the object **name** lowercased, not the plural REST path). `Liferay.Headless.Object.everything` alone is a **different namespace** and does not cover it.

**Diagnostic:** with the per-object scope missing, the scope filter returns a **bare 403** — no `WWW-Authenticate` header, empty body — for every operation on that object, including plain reads the user's role has VIEW on, and it fires **before** the permission / account-restriction layer. A permission-layer 403 instead has a JSON `{"status":"FORBIDDEN"}` body; that difference tells you which layer rejected you. Verified 2026.q2.7: adding `c_<object>.everything` per object to the OAuth app's `scopes:` flipped the same calls to 200 (and an Administrator-role service account then bypasses account restriction as expected — it never reached that layer before).

Applies to both `oAuthApplicationHeadlessServer` (client_credentials) and `oAuthApplicationUserAgent` apps. Fragments using `Liferay.Util.fetch` (session cookie auth) are unaffected — session auth carries full permissions with no OAuth scope check. Note: a scope list change lands only after the CX redeploys (which rotates the client id and secret, as every deploy does — read them from the `routes` files: `skills/setup-oauth/SKILL.md` → "Token Acquisition"). The same holds when the object is **newer than the CX**: a `c_<object>.everything` listed before the object existed is dropped silently at deploy, and tokens lack it until the next redeploy (verified 2026.q3.2).

## Scope Table

| Module | Scope String | Grants Access To |
| --- | --- | --- |
| headless-admin-site | `Liferay.Headless.Admin.Site.everything` | Site pages, navigation menus, display page templates, master pages |
| headless-admin-content | `Liferay.Headless.Admin.Content.everything` | Structured contents, style books, fragment collections, web content |
| headless-delivery | `Liferay.Headless.Delivery.everything` | Blog posts, documents, structured content (delivery / nonadmin) |
| object-admin-rest | `Liferay.Object.Admin.REST.everything` | Object **definitions**, fields, relationships, actions, validations (admin) |
| object-rest (dynamic `/o/c/<plural>`) | `Liferay.Headless.Object.everything` | The static object API surface — NOT sufficient for `/o/c/<object>` calls by itself |
| per-object JAX-RS app | `c_<objectname>.everything` (object name lowercased) | Object **entries** of that one object at `/o/c/<object>` — required per object (see "Per-Object Scope" above) |
| headless-admin-list-type | `Liferay.Headless.Admin.List.Type.everything` | Picklist (list type) definitions and entries |
| headless-admin-user | `Liferay.Headless.Admin.User.everything` | Accounts, users, roles, organizations |
| headless-admin-workflow | `Liferay.Headless.Admin.Workflow.everything` | Workflow definitions, instances, tasks |
| batch-engine | `Liferay.Headless.Batch.Engine.everything` | Batch data import and export task execution |

## Scope Selection by CET Type

| CET Type | Minimum Scopes |
| --- | --- |
| `objectAction` | `c_<objectname>.everything` per object it calls back into (add `Liferay.Object.Admin.REST.everything` if the action mutates the definition). If the trigger can be anonymous, put these on a separate `oAuthApplicationHeadlessServer` entry, plus `Liferay.Headless.Admin.User.everything.read` to read Accounts |
| `objectValidationRule` | `Liferay.Headless.Object.everything` |
| `objectEntryManager` | `Liferay.Headless.Object.everything` |
| `notificationType` | `Liferay.Headless.Object.everything` |
| `workflowAction` | `Liferay.Headless.Admin.Workflow.everything`, `Liferay.Headless.Object.everything` |
| `batchEngineDataImportTaskExecutor` | `Liferay.Headless.Batch.Engine.everything`, `Liferay.Headless.Object.everything` |
| `siteInitializer` | `Liferay.Headless.Admin.Site.everything`, `Liferay.Headless.Admin.Content.everything`, `Liferay.Object.Admin.REST.everything`, `Liferay.Headless.Object.everything`, `Liferay.Headless.Admin.User.everything` |
| Commerce CETs | Granular per Commerce subdomain — e.g. `Liferay.Headless.Commerce.Admin.Channel.everything`, `Liferay.Headless.Commerce.Admin.Order.everything`, `Liferay.Headless.Commerce.Admin.Catalog.everything`. Verify the exact subdomain against the relevant `headless-commerce-admin-*` module's `rest-config.yaml`. |

## How Scopes Appear in `client-extension.yaml`

```yaml
# The siteInitializer / batch CET calls INTO Liferay using a service account token

<workspace-id>-site-oauth:
    .serviceAddress: localhost:8080
    .serviceScheme: http
    name: <WorkspaceId> Site OAuth
    scopes:
        - Liferay.Headless.Admin.Site.everything
        - Liferay.Object.Admin.REST.everything
    type: oAuthApplicationHeadlessServer

# The objectAction / workflowAction / notificationType CETs — Liferay calls the microservice
# and passes a user delegated token; the microservice uses it to call back into Liferay

<workspace-id>-action-oauth:
    .serviceAddress: localhost:8081
    .serviceScheme: http
    name: <WorkspaceId> Action OAuth
    scopes:
        - Liferay.Headless.Object.everything
    type: oAuthApplicationUserAgent
```

Each scope string is one list entry. Liferay validates the list on deploy; unknown scope strings cause deployment to fail with a configuration error.

## Verifying Scope Coverage

If an API call returns 403 (Forbidden), the token's scopes do not cover the endpoint:

1. Check the exact endpoint against the module table above. A **bare 403** (empty body, no `WWW-Authenticate`) on `/o/c/<object>` almost always means the per-object `c_<objectname>.everything` scope is missing — see "Per-Object Scope" above. A 403 with a JSON `{"status":"FORBIDDEN"}` body is the permission layer, not the scope filter.

1. Add the missing scope to the `oAuthApplicationHeadlessServer` entry in `client-extension.yaml`.

1. Redeploy via `deploy-and-verify`.

A 401 (Unauthorized) means the token itself is not valid — check the OAuth application registration and credentials, not the scopes.

### CREATE_TOKEN on User-Agent Apps

A CX-provisioned OAuth2 application gets **no role permissions** at creation (`resource-actions/default.xml` role defaults for `OAuth2Application` are empty). The token endpoint requires the requesting user to hold `CREATE_TOKEN` on that specific app — or be its owner. For `oAuthApplicationHeadlessServer` (client_credentials) the service-account user IS the owner, so it passes with no grant. For `oAuthApplicationUserAgent` apps the **end user** mints the token, so without an explicit `CREATE_TOKEN` grant no signed-in user can obtain one — grant VIEW + CREATE_TOKEN on the app resource to a **regular (company-scoped) role** the users hold (an organization/site-scoped role fails: the token check runs with `groupId = null`, where group-scoped grants don't apply). A pre-login flow needs the grant on the built-in `Guest` role.

## References

- OAuth 2 application management: Control Panel → OAuth 2 Administration
- `setup-oauth` skill: companion OAuth application generation
- CET type requirements: `rules/client-extension-types.md`