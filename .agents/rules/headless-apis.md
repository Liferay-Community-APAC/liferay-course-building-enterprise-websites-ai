# Headless APIs

> **Before authoring:** Load `mcp-server` first when MCP is available; prefer it over raw curl for content, page, and object work.

Key Liferay REST modules, their base URIs, primary resources, and OAuth scopes. All paths resolve relative to `http://localhost:${PORT}`. Use Basic auth (`test@liferay.com:test`) for the curl examples on this page and in the skills. The OAuth scope strings noted per module are for `oAuthApplicationHeadlessServer` blocks when scaffolding microservice CETs — see `rules/oauth-scopes.md` for the full scaffolding reference.

The tables below list the common endpoints per module — they are not exhaustive. To confirm an exact path or find an endpoint not listed here, read the MCP operation schema (see `skills/mcp-server/SKILL.md`), or fetch `GET /o/<module>/v1.0/openapi.json` directly. Base URIs, feature flag gates, and OAuth scopes are *not* discoverable from the specs — rely on this card for those. The per module `Required flag` notes below map each module to its gating flag; see `rules/feature-flags-catalog.md` for each flag's default and status.

## headless-admin-site

**Base URI:** `/o/headless-admin-site/v1.0`

> **Path identifier — this module keys subresources by external reference code, not numeric ID.** Use `{siteExternalReferenceCode}` (the site's ERC) in these paths; passing a numeric site ID returns 404. (By contrast, `headless-admin-content` and `headless-delivery` below use the numeric `{siteId}`.)

| Resource | Method | Path |
| --- | --- | --- |
| List sites | GET | `/sites` |
| Create site | POST | `/sites` |
| Get site | GET | `/sites/{siteExternalReferenceCode}` |
| Create page | POST | `/sites/{siteExternalReferenceCode}/site-pages` |
| List pages | GET | `/sites/{siteExternalReferenceCode}/site-pages` |
| Create navigation menu | POST | `/sites/{siteExternalReferenceCode}/navigation-menus` |
| Create display page template | POST | `/sites/{siteExternalReferenceCode}/display-page-templates` |
| Create master page | POST | `/sites/{siteExternalReferenceCode}/master-pages` |

**Style books have no working REST surface on 2026.q3.2.** `StyleBookResourceImpl` is declared here (`/sites/{siteExternalReferenceCode}/style-books`), but `GET` and `POST` on the collection and `GET` by ERC all return `400 UnsupportedOperationException` (verified live). Create style books in the site-initializer tree (`style-books/`). A page's `settings.styleBookItemExternalReference` pointing at a missing style book is accepted with `200` and only a `WARN [LogUtil]` "Optional reference generated…", the same tolerance as for master pages (see `skills/manage-pages/SKILL.md`).

**Required flag:** `LPD-35443` (off by default) for public layout API; `LPD-38869` (on by default) for private. Page-element / page-specification composition additionally requires `LPD-74328`.

**OAuth scope:** `Liferay.Headless.Admin.Site.everything`

## headless-admin-content

**Base URI:** `/o/headless-admin-content/v1.0`

| Resource | Method | Path |
| --- | --- | --- |
| Create web content | POST | `/sites/{siteId}/structured-contents` |
| List web content | GET | `/sites/{siteId}/structured-contents` |

On 2026.q3.2 this module holds only three resources — `StructuredContent`, `DisplayPageTemplate`, `PageDefinition` (verified against the bundle's `*ResourceImpl` classes). It has **no** content structure, style book, or fragment endpoint:

- **Style books** are declared in `headless-admin-site` but not usable over REST (above); author them in the tree.
- **Fragments** are in `headless-admin-fragment` (below).
- **Content structures** are read only in `headless-delivery` (`GET /sites/{siteId}/content-structures`). Create them through Data Engine: `POST /o/data-engine/v2.0/sites/{siteId}/data-definitions/by-content-type/{contentType}`.

**OAuth scope:** `Liferay.Headless.Admin.Content.everything`

## headless-delivery

**Base URI:** `/o/headless-delivery/v1.0`

| Resource | Method | Path |
| --- | --- | --- |
| List structured contents (site) | GET | `/sites/{siteId}/structured-contents` |
| Create blog post | POST | `/sites/{siteId}/blog-postings` |
| Get document | GET | `/documents/{documentId}` |
| Upload document | POST | `/sites/{siteId}/documents` |
| Get site page content | GET | `/sites/{siteId}/site-pages/{pageFriendlyUrl}/page-contents` |

**OAuth scope:** `Liferay.Headless.Delivery.everything`

## object-admin

**Base URI:** `/o/object-admin/v1.0`

| Resource | Method | Path |
| --- | --- | --- |
| Create object definition | POST | `/object-definitions` |
| List object definitions | GET | `/object-definitions` |
| Publish object definition | POST | `/object-definitions/{id}/publish` |
| Add field | POST | `/object-definitions/{id}/object-fields` |
| Add relationship | POST | `/object-definitions/{id}/object-relationships` |
| Add action | POST | `/object-definitions/{id}/object-actions` |
| Add validation | POST | `/object-definitions/{id}/object-validation-rules` |

Object entries (after publish): `/o/c/<pluralLabel>` — GET, POST, PUT, PATCH, DELETE by ID.

**OAuth scope:** `Liferay.Object.Admin.REST.everything` for the admin endpoints above (definitions, fields, etc.). `Liferay.Headless.Object.everything` for the dynamic `/o/c/<plural>` entry endpoints.

## headless-admin-fragment

**Base URI:** `/o/headless-admin-fragment/v1.0`

Its own module — **not** part of `headless-admin-site`, which is why fragment endpoints look absent when you search the page API's spec.

| Resource | Method | Path |
| --- | --- | --- |
| List / create fragment sets | GET, POST | `/sites/{siteExternalReferenceCode}/fragment-sets` |
| Get / update / delete a set | GET, PUT, DELETE | `/sites/{siteExternalReferenceCode}/fragment-sets/{setExternalReferenceCode}` |
| List / create fragments in a set | GET, POST | `/sites/{siteExternalReferenceCode}/fragment-sets/{setExternalReferenceCode}/fragments` |
| Get / replace / delete a fragment | GET, PUT, DELETE | `/sites/{siteExternalReferenceCode}/fragments/{fragmentExternalReferenceCode}` |

Fragment code is in `fragmentVersions[]` (`html`, `css`, `js`, `configuration`, `status`). Fragments are keyed by **ERC** — a generated UUID for fragments imported by an initializer, not the fragment key — so list the set to resolve it.

**Required flag:** `LPD-39244`.

**OAuth scope:** `Liferay.Headless.Admin.Fragment.everything` — verify against the running instance before relying on it in a CET.

> **Editing a fragment here does not change any page that already places it** — Liferay copies fragment code into each page's fragment instance. Reprovision to apply fragment changes. See `skills/scaffold-fragment/SKILL.md` → "The Live Fragment API", and note that one fragment declaring `"type": "section"` makes the whole set's listing return `400`.

## headless-admin-list-type

**Base URI:** `/o/headless-admin-list-type/v1.0`

| Resource | Method | Path |
| --- | --- | --- |
| Create picklist | POST | `/list-type-definitions` |
| List picklists | GET | `/list-type-definitions` |
| Add picklist entry | POST | `/list-type-definitions/{id}/list-type-entries` |

**OAuth scope:** `Liferay.Headless.Admin.List.Type.everything`

## headless-admin-user

**Base URI:** `/o/headless-admin-user/v1.0`

| Resource | Method | Path |
| --- | --- | --- |
| List accounts | GET | `/accounts` |
| Create account | POST | `/accounts` |
| Create role | POST | `/roles` |
| List roles | GET | `/roles` |
| Assign role to user | POST | `/roles/{roleId}/association/user-account/{userId}` |
| List users | GET | `/user-accounts` |
| Create user | POST | `/user-accounts` |

**OAuth scope:** `Liferay.Headless.Admin.User.everything`

## headless-admin-taxonomy

**Base URI:** `/o/headless-admin-taxonomy/v1.0`

| Resource | Method | Path |
| --- | --- | --- |
| List vocabularies (site) | GET | `/sites/{siteId}/taxonomy-vocabularies` |
| List vocabularies (asset library) | GET | `/asset-libraries/{assetLibraryId}/taxonomy-vocabularies` |
| Upsert vocabulary by ERC | PUT | `/asset-libraries/{id}/taxonomy-vocabularies/by-external-reference-code/{erc}` |
| List categories | GET | `/taxonomy-vocabularies/{vocabularyId}/taxonomy-categories` |
| Upsert category by ERC | PUT | `/taxonomy-vocabularies/{vocabularyId}/taxonomy-categories/by-external-reference-code/{erc}` |

Two verified quirks: `?flatten=true` on the category list returns the **whole hierarchy** (all nesting levels) in one paginated list — far cheaper than recursive parent walks. And the standalone category **by-ERC GET 404s for asset-library-scoped categories** — resolve those by listing the vocabulary's categories and filtering client-side.

**OAuth scope:** `Liferay.Headless.Admin.Taxonomy.everything`

## headless-asset-library and headless-object (CMS)

**Base URIs:** `/o/headless-asset-library/v1.0` — Spaces (`/asset-libraries`, `type: "Space"`) and their `/connected-sites/{siteERC}`, which is what lets a Site render a Space's content. `/o/headless-object/v1.0` — entry folders at `/scopes/{siteId | spaceERC}/object-entry-folders`. CMS entries are depot-scoped `/o/c/<plural>/scopes/{siteId | spaceERC}`, and the unscoped collection returns `409`. The CMS browser's search (`/o/search/v1.0/search`) needs `emptySearch=true` for a filter-only query. No feature flag on 2026.q3.2. Procedure: `skills/manage-cms/SKILL.md`.

**A library's `friendlyURL` cannot be set over REST on 2026.q3.5**, although the DTO has the field and the resource tries. `PUT` (create) and `PATCH` with `friendlyURL` both answer `500 StaleObjectStateException` on the library's `GroupImpl`, and nothing changes (the create rolls back): `_updateFriendlyURL` writes a group that `addDepotEntry`/`updateDepotEntry` has just modified. `PUT /o/headless-admin-site/v1.0/sites/{libraryERC}` does change it, but it rewrites the group's `type_` from `5` (depot) to a site type (`SiteResourceImpl._getType` never returns `TYPE_DEPOT`) and joins the caller to the group, so never use it on a real library. The friendly URL matters because file URLs are `/documents/d/<group friendly URL>/<friendlyUrlPath>`, and a default library's is `/asset-library-<depotEntryId>`, which changes on every rebuild. Once set (any value, including another instance's old `/asset-library-<id>`), the `/documents/d/…` URLs resolve by it and `updateDepotEntry` keeps it. Verified live.

## data-set-admin (Data Sets)

**Base URI:** `/o/data-set-admin` — **no version segment** (`/v1.0/…` returns `404`), and an OpenAPI spec **per resource** (`/o/data-set-admin/data-sets/openapi.json`, …). Children are reachable only nested: `/data-sets/by-external-reference-code/{erc}/dataSetToDataSet<Child>`, while the root child collections return `409`. Flag `LPS-164563`. Procedure: `skills/manage-data-sets/SKILL.md`.

## headless-cmp (CMP — licensed product)

**Base URI:** `/o/headless-cmp/v1.0` — read-only reporting (`/projects/{projectId}/task-statistics`, `/content-coverage`, `/task-assignees`). Projects and Tasks themselves are object entries at custom paths, `/o/cmp/projects` and `/o/cmp/tasks/scopes/{projectScopeId}`, not `/o/c/...`. CMP is gated by a **DXP license, not a feature flag**. This course's skill library has no CMP skill.

## headless-dsr and DSR rooms (Digital Sales Room — licensed product)

**Base URIs:** rooms are entries of the system object `DSRRoom`, at **`/o/digital-sales-room/rooms`** (create = `POST` there; `headless-dsr` has no create). `/o/headless-dsr/v1.0/rooms/{roomId}` holds `duplicate`, `user-accounts` and `invited-members`. A room's `siteTemplateKey` is a Site Template **UUID** (default `L_DSR_LAYOUT_SET_PROTOTYPE`); an empty string answers a bare `404` (verified 2026.q3.6). Gated by a **license, not a flag**. This course's skill library has no DSR skill.

## ai-hub-cell and AI Hub (AI Hub — separate cloud service)

**DXP side:** `/o/ai-hub-cell/v1.0` has one operation, `POST /authorization-tokens`, returning `{accessToken, scope, serviceURL, userToken}` for the calling user. Calls to AI Hub then go to `serviceURL` with `Authorization: Bearer <accessToken>` and `Liferay-AI-Hub-Cell-On-Behalf-Of: <userToken>`. **AI Hub side:** `/o/ai-hub/v1.0` (agent instances, chats, chatbots) and the object endpoint `/o/ai-hub/agent-definitions`, the only one that reads an agent by ERC or filters beyond `active`. Agents are edited in Agent Builder only. Flag `LPD-62272`. This course's skill library has no AI Hub skill.

## headless-admin-workflow

**Base URI:** `/o/headless-admin-workflow/v1.0`

| Resource | Method | Path |
| --- | --- | --- |
| Create workflow definition | POST | `/workflow-definitions` |
| List workflow definitions | GET | `/workflow-definitions` |
| List workflow instances | GET | `/workflow-instances` |
| Transition workflow task | POST | `/workflow-tasks/{id}/change-transition` |

**OAuth scope:** `Liferay.Headless.Admin.Workflow.everything`

## Common Parameters

| Parameter | Values | Notes |
| --- | --- | --- |
| `page` | integer | 1 based page number |
| `pageSize` | integer | Max items per page (default 20, max 200) |
| `filter` | OData expression | e.g. `title eq 'Hello'` |
| `sort` | `fieldName:asc` or `fieldName:desc` | |
| `fields` | comma separated field names | Projection to reduce response size |
| `restrictFields` | comma separated field names | Exclude from response |
| `aggregationTerms` | field name(s) | Facet bucket counts on `/o/c/<plural>`; see the bucket cap below |

**URL-encode ERC path segments.** `by-external-reference-code/{erc}` endpoints do not unquote leniently — an ERC containing anything beyond unreserved characters must be percent-encoded by the caller (in Python, `requests.utils.quote(erc, safe='')`), or the call 404s and reads as "entry missing".

### Pagination Clamps — Never Loop Until Empty

An out-of-range `page` is **clamped to the last valid page** — the response repeats the last page's items instead of returning an empty list (verified: 9 items at `pageSize=5` → `page=999` returns the same 4 items as `page=2`). A `while items: page += 1` loop that expects a terminating empty page **never terminates**. Page by `totalCount` instead: loop `ceil(totalCount / pageSize)` pages, or break when `page * pageSize >= totalCount` or when a page returns fewer than `pageSize` items.

### `aggregationTerms` Buckets Are Capped at `pageSize`

`GET /o/c/<plural>?aggregationTerms=<field>` returns **at most `pageSize` facet buckets** — the facet size is tied to the entry page size, not independent. `pageSize=1` silently yields exactly one bucket: the alphabetically first term (a chart built on it collapses to a single bar with no error; `totalCount` stays correct because it is DB backed while the facet is index backed). Request a generous `pageSize` (e.g. `100`) and add `&fields=id` to keep the entry payload tiny.

### OData Filters on Relationship FK Fields — Quote the Number, or Filter by ERC

Filtering `/o/c/<plural>` on a relationship FK (`r_<relationshipName>_<parentPK>Id`) with an unquoted integer throws `400 InvalidFilterException: Incompatible types` — the FK columns are string typed in the entity model. Single-quote the value (`r_account_accountEntryId eq '37057'`) or, better, filter on the ERC twin (`r_account_accountEntryERC eq '<erc>'`). In a microservice that hand-rolls the filter this surfaces as an unlogged 4xx/502 downstream, so audit any `eq " +` string concatenation on relationship id filters.

## Never Recommend JSONWS

The legacy `/api/jsonws` surface is deprecated and frequently disabled outright (404) on modern bundles — never reach for it, even as a "one-time" workaround. When a headless REST endpoint doesn't cover an operation, the acceptable answers are: a different headless module (check the OpenAPI specs), a documented manual UI step, or an OSGi component — and name the gap explicitly rather than papering over it with JSONWS. The single exception is an authoring-time `classNameId` lookup for display page URLs, which nothing else exposes: `skills/manage-pages/SKILL.md` → "Links, Forms, and Menus in the Tree".

## Error Codes

| HTTP Status | Meaning |
| --- | --- |
| 400 | Validation error; read the `title` field in the problem detail response. Can also signal an ERC collision ("This external reference code is already in use") — recover by GETting the existing entry by ERC instead of retrying the create |
| 401 | Not authenticated; check credentials or OAuth token |
| 403 | Authenticated but forbidden; scope too narrow or permissions missing |
| 404 | Resource not found or feature flag off; check flag state |
| 409 | Conflict; typically duplicate name or ERC |
| 500 | Server error; check `bundles/logs/liferay.<date>.log` |

## References

- `rules/oauth-scopes.md` — full scope string reference for these modules.
- `rules/feature-flags-catalog.md` — defaults for the flags gating these APIs.
- `skills/mcp-server/SKILL.md` — the MCP tool surface (a discovery chain on 2026.Q3) for confirming exact paths and schemas.
- Headless APIs: `https://learn.liferay.com/w/dxp/integration/headless-apis`