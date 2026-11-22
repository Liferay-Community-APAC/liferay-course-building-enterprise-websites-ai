# Site Initializer Format

> **Before authoring:** Load the skill for whatever you are about to author into this tree — `manage-objects`, `manage-pages`, `scaffold-fragment`, `theme-and-design`, or `manage-roles-permissions`. This card is the file format; the skills hold the failure modes.

Reference for the `scaffold-client-extension` skill when capturing or building a `siteInitializer` CET.

A site initializer is a client extension of type `siteInitializer`. When deployed and triggered, it creates a fully configured site from the directory tree below.

## Provisioning and Iteration

The site-initializer CET tree is the **single source of truth** for the site. Build the site by triggering the initializer, then iterate by editing the source tree and applying each change by the cheapest reliable path. Always edit the source files first; never hand edit the live site as the authoritative copy.

| Change Type | How to Apply It | Delete the Site? |
| --- | --- | --- |
| Theme CSS content (CET already bound to the master) | Deploy the `themeCSS` CET (`blade gw deploy`) — it serves CSS live | No |
| Binding a `themeCSS` CET or style book onto the master | Edit the master `page-definition.json` `settings`, then clean-redeploy the initializer | No |
| Object definition or data | `object-admin` API, or edit `object-definitions/` and clean-redeploy | No |
| Fragment content, new fragment, page composition | Edit the source tree, then **clean-redeploy the initializer** — the re-fired run upserts | No |
| Removing a page, or a broken/ambiguous upsert | Full reprovision: delete the site, recreate from the initializer | Yes |

**Re-firing the initializer UPSERTS onto the existing site.** When the deployed zip changes, `BundleSiteInitializer` re-runs its full task graph create-or-update: `_addOrUpdateLayoutsContent` re-imports each layout's `page-definition.json` onto the **existing** page (log-verified on 2026.q2.7), fragments re-import with `FragmentsImportStrategy.OVERWRITE`, objects and entries upsert by ERC. So the normal iteration loop is edit source → clean redeploy — no site deletion. Two conditions make the redeploy actually re-fire:

1. **The zip content must change.** Gradle's CX plugin does **not** track the `site-initializer/` JSON tree as build inputs, so a bare `deploy`/`assemble` after a content-only edit is "up to date" and re-ships the stale zip — silently deploying old pages. And `SiteInitializerClientExtension._isAlreadyProcessed(bundle.getLastModified())` short-circuits an unchanged bundle. Always `blade gw clean deploy` (as separate steps for stubborn nested zips), or `rm` the deployed zip first.
1. **Deploy order when a fragment AND a page change:** the layout import **snapshots** the fragment's css/html/js into `fragmententrylink` at import time — it does not reference the FragmentEntry live. Deploy the fragment change first (so the FragmentEntry upserts), then re-fire the page-bearing initializer so the re-import copies the updated code into the links. A page-only redeploy keeps stale fragment styling.

A **new master page** added to the tree was **not** created by that re-fire on 2026.q3.2 (create it by a full reprovision, or over `POST …/master-pages`). On **2026.q3.10** a clean redeploy **did** create two new masters on an existing site, and later re-fires updated them in place (verified 2026-11-20). The upsert never **removes** anything: a page deleted from the source tree stays on the site, and layouts are keyed by friendly URL (see "How Layouts Are Matched and Ordered" below), so renames create duplicates. **One handler is not an upsert at all: `segments-experiences/`.** `_addSegmentsExperiences` calls `appendSegmentsExperience` with no lookup, so every re-fire adds another copy of each experience, to the page and to its draft, with its fragment links (verified on 2026.q3.5: a second fire left `/home` with two "Signed-In Experience" rows and 30 links instead of 20). Keep experiences out of a tree that re-fires on every run, or remove the duplicates after each run. One working pattern (2026.q3.5): a second `siteInitializer` CX for the same site holding only `segments-entries.json` and `segments-experiences/`, deployed only when the experience is missing from the page's page specifications (read live **and** draft over `headless-admin-site`; `headless-delivery`'s `/experiences` lists the live page only). **Each experience's content directory needs a `page.json` beside its `page-definition.json`** (only `type: Content` is read; Liferay's own `site-initializer-teaser-showcase` has one). Without it `_addOrUpdateLayoutContent` returns at once, with no log line: the experience is appended to the **draft** layout only, with no content and never published, and from then on `headless-admin-site` `GET …/site-pages/{erc}/page-specifications` answers `400 UnsupportedOperationException` for that page until the experience is deleted (`DELETE /sites/{erc}/page-experiences/{its erc}` works). For removals, or when an upsert leaves the site in a doubtful state, fall back to the full reprovision — **delete the site, then redeploy the initializer CET**. (For an undeletable group — the system Guest site — the upsert is the only path, and it works.)

```bash
# Step 1. Delete the existing site — address it by its EXTERNAL REFERENCE CODE in the path,
#    not its numeric ID (a numeric ID in this path returns 404).

curl \
	--request DELETE \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-site/v1.0/sites/<site-erc>" \
	--user "test@liferay.com:test"

# Step 2. Redeploy the initializer CET. A siteInitializer CET that declares a
#    siteExternalReferenceCode autoprovisions the site on deploy.
#
#    Liferay retriggers the initializer when the file install watcher sees a CHANGED
#    zip in bundles/osgi/client-extensions — not when the Gradle task runs. Gradle's
#    up to date check is content based, so with no source edit `blade gw deploy`
#    prints BUILD SUCCESSFUL / "N up to date", rewrites nothing, and the site stays
#    deleted. Force a new artifact when reprovisioning without a source change:

rm -f bundles/osgi/client-extensions/<name>.zip

cd client-extensions/<name> && blade gw clean deploy
```

Confirm the initializer actually ran — the count must increase, and `BUILD SUCCESSFUL` alone does not prove it did. **Pick the log the bundle actually writes to:** on the 2026.q3.6 course bundle (2026-10-16) the `BundleSiteInitializer` lines (`Invoking …`, `Initialized <Site> for group <id> in N ms`) go to `bundles/logs/liferay.<YYYY-MM-DD>.log` only, and `catalina.out` holds none of them, so a `catalina.out` count stays at 0 and a wait loop on it never ends. Point `LOG` (and the greps below) at that file there; it carries both `Initializing <Site Name>` and `Initialized <Site Name> … in N ms`:

```bash
grep --count "Initializing <Site Name>" bundles/tomcat/logs/catalina.out
```

### Do the Whole Cycle in One Command

Run the steps by hand and you will eventually wait on a counter that already advanced, or read the previous run's log as if it were this one. Both cost minutes and neither announces itself. Capture the count **before** deleting, then block until it exceeds that:

```bash
#!/usr/bin/env bash

#
# reprovision.sh — delete the site, redeploy the initializer, wait, report.
#

set -o errexit
set -o nounset
set -o pipefail

SITE_ERC="${SITE_ERC:?set SITE_ERC}"
SITE_NAME="${SITE_NAME:?set SITE_NAME}"     # The "Initializing <SITE_NAME>" log string
CET="${CET:?set CET}"                       # The client-extensions/<CET> directory
PORT="${PORT:-8080}"
LOG=bundles/tomcat/logs/catalina.out

before=$(grep --count "Initializing ${SITE_NAME}" "${LOG}" || echo 0)

curl \
	--output /dev/null \
	--request DELETE \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-site/v1.0/sites/${SITE_ERC}" \
	--user "test@liferay.com:test"

rm -f "bundles/osgi/client-extensions/${CET}.zip"
(cd "client-extensions/${CET}" && blade gw clean deploy >/dev/null)

for _ in $(seq 1 100); do
	[[ $(grep --count "Initializing ${SITE_NAME}" "${LOG}" || echo 0) -gt ${before} ]] && break
	sleep 3
done

sleep 6   # Let the handlers finish after the "Initializing" line appears

awk -v n=$((before + 1)) '/Initializing '"${SITE_NAME}"'/{c++} c>=n' "${LOG}" \
	| grep --extended-regexp 'Invoking|Initialized|InitializationException|MustNotBeReserved'
```

Two details that are easy to get wrong by hand:

- **`before` must be read before the delete**, not after the deploy. Reading it late means comparing the new run against itself, and the loop spins until it times out on a build that actually succeeded.
- **The `Initializing` line is not the end of the run.** Handlers keep logging after it, so sampling immediately shows a partial list and a missing handler reads as a failure. The `sleep 6` covers this; for a large tree, assert on the `Initialized <Site> ... in N ms` line instead.

The final `awk` prints only the newest run, which is the comparison that matters — see "Verifying What the Initializer Actually Did" below for reading the timings.

**Sites are addressed by external reference code in the REST path** (`/sites/<erc>`) for these admin operations — passing the numeric site ID returns 404.

> Prefer delete then redeploy over recreating with `POST /sites` + `templateExternalReferenceCode` (or `templateKey`): resolving a site-initializer template through that POST is unreliable. The portable path relies on the CET's `siteExternalReferenceCode` to autoprovision on deploy.

Reprovisioning is always safe because the source tree is current. **Object definitions and entries are company scoped and survive site deletion**, so runtime data (for example, registration entries) persists across a reprovision. The exception is an object whose scope is explicitly set to the site — those entries are deleted with the site.

### Applying a Fragment Change

Fragments live in the initializer tree under `fragments/group/<collection-key>/fragments/<fragment-name>/`. To change a fragment, edit those source files and re-fire the initializer (clean redeploy) — and remember the two-step order from above when the fragment is placed on initializer pages: fragment initializer first (upserts the FragmentEntry), page-bearing initializer second (re-snapshots the code into `fragmententrylink`).

**A fragment whose FreeMarker errored sticks in DRAFT, and the upsert will NOT overwrite it.** When a fragment's FTL fails to compile, Liferay leaves the fragment entry in a Draft/errored state, and subsequent initializer runs do not replace a Draft with the corrected source — the live pages keep rendering the last-good version, which reads exactly like "you deployed a stale build". Fixing the source is necessary but not sufficient: clear the Draft manually (fix-and-publish or delete the entry in the Fragments editor), then re-fire.

The `headless-admin-fragment` API **does** expose per fragment create/update/delete, and it is easy to mistake for a shortcut. It is not one: Liferay copies fragment code into each page's fragment instance at placement time, so a `PUT` updates the library entry and leaves every page already using it unchanged — verified on 2026.Q2. See `skills/scaffold-fragment/SKILL.md` → "The Live Fragment API" for what it is actually useful for.

## How Layouts Are Matched and Ordered

`_addOrUpdateLayout` keys layouts by **friendly URL only** (`fetchLayoutByFriendlyURL`: group + private + URL) — not by name or type. Verified in 2026.q2 source; two consequences:

- **Type mismatch = hard delete.** If a layout exists at that friendly URL with a *different* `type` than the initializer declares, the importer calls `deleteLayout(existing)` then `addLayout` fresh — destroying the old page's portlets and preferences, and re-firing on every redeploy. Same URL + same type is a benign in-place update. So a Content page at `/search` in the tree would DELETE an OOTB Widget `/search` page. Never let an authored layout collide by URL with a different-typed page you want to keep.
- **Ordering has two mechanisms.** New pages are `addLayout`-appended (priority = max+1) in sorted directory order, so on a fresh site the bare `NN-` prefix alone sets order. A `page.json` `"priority"` key fires `updatePriority`, which re-sorts and **renumbers ALL siblings sequentially from 0** — an out-of-range value is normalized to the last slot, not ignored. Rule of thumb: directory numbering orders only pages the initializer *creates*; to reorder a **pre-existing** page (e.g. an OOTB one) you must set an explicit `priority` — the update path skips priority when the key is absent.

## Directory Tree

```
client-extensions/<name>/
  client-extension.yaml
  site-initializer/
    documents/                    # Documents and media
      group/
        <folder-name>/
          <filename>
    fragments/                    # Page fragments
      group/                      # site-scoped collections (referenced with key + siteKey)
        <collection-key>/
          collection.json         # {"name": ..., "description": ...}
          fragments/              # required nesting level
            <fragment-name>/      # dir name becomes the fragment "key"
              fragment.json
              index.html
              index.css
              index.js
              configuration.json  # optional
      company/                    # company-scoped (global) collections — referenced by key ONLY, no siteKey
        <collection-key>/...      # same nesting as group/
    journal-articles/             # Web content (Journal) articles
      <article-name>.xml
      <article-name>.json
    layout-page-templates/        # Page templates and master pages
      display-page-templates/
        <template-name>/
          page-definition.json
          display-page-template.json  # NOT page-template.json, which is the page-template descriptor (LayoutPageTemplateExportImportConstants, 2026.q3.2); a DPT folder carrying the wrong name is silently skipped
                                      # {"contentType": {"className": "[$OBJECT_DEFINITION_CLASS_NAME:<Name>$]"}, "defaultTemplate": <bool>, "name": ...}: the token resolves for a live-created object even in a tree with no object-definitions/ (2026.q3.2); the DPT's friendly URL is its name lowercased and dashed
      master-pages/
        <master-name>/          # dir name is cosmetic; the master "key" is derived from master-page.json "name" (see settings.masterPage.key)
          page-definition.json
          master-page.json       # {"name": ...} — NOT page-template.json
          thumbnail.png          # optional
    layout-utility-page-entries/  # 404, 500, Cookie Policy, Sign In... (verified 2026.q3.5)
      <name>/
        utility-page.json         # {"externalReferenceCode", "name", "type": "ErrorCode404" | "CookiePolicy" | ...}
        page-definition.json      # a css.css beside it becomes settings.css
      default-utility-page-entries.json  # optional {"<type>": "<name>"}: which entry is the site's default
                                  # An entry whose ERC exists on the site (e.g. LFR-404-ERROR) is updated in place,
                                  # no duplicate. "defaultTemplate" in utility-page.json is NOT read: a new entry is
                                  # created non-default unless default-utility-page-entries.json names it.
    layout-set/                   # Site wide navigation and theme settings
      public/
        metadata.json
    layouts/                      # Site pages
      <NN-page-name>/             # NN prefix controls creation order
        page.json                 # Page metadata (type, name, friendlyURL)
        page-definition.json      # Content Page fragment composition
        <NN-child-page>/          # Nested child pages
          page.json
          page-definition.json
    list-type-definitions/        # Picklists; one raw ListTypeDefinition DTO per file
      <name>.json
      <name>.list-type-entries.json   # optional; bare JSON array of entries
    object-definitions/           # One raw ObjectDefinition DTO per file
      <NN-name>.json
    object-relationships/         # One raw ObjectRelationship DTO per file
      <name>.json
    object-fields/                # Fields added to already existing objects
    object-folders/               # Object folders
    object-actions/               # Object actions
    object-entries/               # Seed object entry data
    notification-templates/       # Notification templates (+ optional *.object-actions.json)
    workflow-definitions/         # Kaleo workflow definition XML/JSON
    accounts.json                 # AccountEntry seed (ERC, type, customFields, postalAddresses, hierarchy)
    account-groups.json           # Account groups
    account-group-assignments.json # {accountGroupExternalReferenceCode, accounts:[erc]}
    user-accounts.json            # Users (see "Users and Accounts" below — INACTIVE gotcha)
    plo-entries.json              # Fragment i18n strings: [{key, value:"{\"en_US\": \"...\"}"}]
    resource-permissions.json     # Role grants on objects and other resources
    roles.json                    # Site roles — description/name_i18n MUST be locale-keyed objects
    site-configuration.json       # typeSite (1 open, 2 restricted, 3 private) / manualMembership / membershipRestriction; deploys otherwise reset an existing site to restricted. Languages are reset too, and no file sets them (see manage-sites)
    site-settings.json            # Group-scoped OSGi configs [{pid, properties}]
    site-navigation-menus.json    # Navigation menus (array of menus)
    taxonomy-vocabularies/        # company/ (portal wide, survives site deletion) or group/
      <scope>/
        <vocab>.json              # the vocabulary: {"name": ...}
        <vocab>/                  # SAME-NAMED folder holding its categories — a folder with no sibling <vocab>.json is skipped silently
          <category>.json         # {"name": ...}
    style-books/                  # Style book entries
      <style-book-name>/          # dir name IS the style book "key" (unlike master pages, whose key comes from "name")
        style-book.json
    thumbnail.png                 # Site thumbnail (displayed in Site Admin)
```

> **`sxp-blueprints.json` is a silent no-op on DXP bundles** — only an internal Liferay-hosted module reads it (confirmed independently on two 2026.q2 instances). Seed Search Experiences blueprints over REST post-provision instead, and remember the object class-name short code inside a blueprint's query is random per database — tokenize it (`[$OBJECT_DEFINITION_CLASS_NAME:<Name>$]` style) rather than hardcoding `#XXXX`.

## Objects and Picklists

> **There is no `batch/` directory in a site initializer.** `BundleSiteInitializer` reads a fixed set of directories, and `batch/` is not one of them. Files placed in `site-initializer/batch/*.batch-engine-data.json` are packaged into the deployed zip and then silently ignored: the build succeeds, the site provisions, and no objects appear. The only signal is `Invoking addOrUpdateListTypeDefinitions took 0 ms` in the log. The `*.batch-engine-data.json` envelope with a `configuration.className` block belongs to the separate **`batch` CET type**, not here.

Each file holds a single **raw DTO** — no `configuration` wrapper and no `items` array. Handlers run in a fixed order, so a file may reference anything produced by an earlier handler:

`list-type-definitions` → `object-folders` → `object-definitions` → `object-relationships` → `object-fields` → `publishObjectDefinitions` → account restrictions → `object-actions` → `object-entries`

Because `publishObjectDefinitions` runs after the definitions are created, **omit `status` from an object definition file** — the initializer publishes it. Account restriction is auto-applied post-publish from the definition's own `accountEntryRestricted` + `accountEntryRestrictedObjectFieldName` — no manual PUT needed.

Additional pipeline facts (verified 2026.q2.7):

- **Reserved system fields in a definition file must carry `"system": true`.** A reserved name (`externalReferenceCode`, `status`, `createDate`, …) at `system: false` routes through `addCustomObjectField` → `MustNotBeReserved` → the atomic rollback. This **only surfaces on a fresh DB**: on a populated instance the object already exists, add-or-update skips creation, and the bad field is never hit — the bug hides until the next clean rebuild. Diagnose via `MustNotBeReserved` in the log, not the misleading downstream entry-count symptoms.
- **`friendlyURLSeparator` collisions abort publish.** `ObjectDefinitionFriendlyURLSeparatorException: Other asset types may use this prefix` means the name-derived separator collides with another asset's resolver. Set `"friendlyURLSeparator": "l"` on the definition, which skips that validation. It is not the default: the default is `c_<lowercased name>`, and with `l` entries get no `friendlyUrlPath`, so their display URL becomes `/web/<site>/l/<entryId>` (verified 2026.q3.2).
- **`object-fields/` is how a live object grows.** `patchObjectDefinition` does NOT add new fields to an already-published object, so field additions go in `object-fields/<name>.json`: `{"objectDefinitionId": "[$OBJECT_DEFINITION_ID:<Name>$]", "object-fields": [...]}`. Idempotent; fresh builds create the fields from the definition, existing instances get them from this file.
- **Depot-scoped objects reject entry writes unless they accept the depot.** A scoped POST/PUT to `/o/c/<plural>/scopes/{assetLibraryKey}` returns a bare, unlogged 404 (`_validateGroupId` throws) while scoped GET works — a misleading asymmetry. Add `"objectDefinitionSettings": [{"name": "acceptAllGroups", "value": "true"}]` to the definition (PATCHes live on a published definition, immediate, no republish). Or list the depot by ERC in `acceptedGroupExternalReferenceCodes`; whether that list survives the depot being recreated on a rebuild was not tested. Prefer the list where it holds: `acceptAllGroups` opens the object to **every** depot. Deleting the last listed depot silently rewrites the setting to `acceptAllGroups: true` (verified 2026.q3.2; see `skills/manage-cms/SKILL.md`).
- **`object-entries/` upserts by ERC and never deletes.** Rows absent from the file are left in place, so use stable ERCs that overlap pre-existing rows to update in place instead of orphaning.

### `list-type-definitions/<name>.json`

A raw `ListTypeDefinition`. `listTypeEntries` may be inline (as below), or in a sibling `<name>.list-type-entries.json` holding a bare JSON array — the definition loop skips files ending in `.list-type-entries.json`.

```json
{
	"externalReferenceCode": "REGISTRATION_STATUS",
	"listTypeEntries": [
		{
			"externalReferenceCode": "REGISTRATION_STATUS_PENDING",
			"key": "pending",
			"name": "Pending"
		}
	],
	"name": "Registration Status"
}
```

### `object-definitions/<NN-name>.json`

A raw `ObjectDefinition`. Reference a picklist by **ERC**, via `listTypeDefinitionExternalReferenceCode` on the field:

```json
{
	"externalReferenceCode": "REGISTRATION",
	"label": {
		"en_US": "Registration"
	},
	"name": "Registration",
	"objectFields": [
		{
			"businessType": "Picklist",
			"label": {
				"en_US": "Status"
			},
			"listTypeDefinitionExternalReferenceCode": "REGISTRATION_STATUS",
			"name": "registrationStatus",
			"required": true
		}
	],
	"pluralLabel": {
		"en_US": "Registrations"
	},
	"scope": "company",
	"titleObjectFieldName": "attendeeName"
}
```

Custom field names are validated against a reserved list. `name`, `email`, `location`, and `company` are fine; `status`, `id`, `creator`, `keywords`, and `userId` are rejected. A collision throws `ObjectFieldNameException$MustNotBeReserved`, which **aborts initialization and rolls back the entire site creation transaction**, leaving no site, no objects, and no picklists. See `skills/manage-objects/SKILL.md` for the full list.

A status field is the usual reason to reach for `"state": true`, and that flag makes `defaultValue` and `defaultValueType` **mandatory** on the same field. Omitting them throws `ObjectFieldSettingValueException.MissingRequiredValues` — which rolls the site back exactly like a reserved name does, and reads as "the CET never deployed":

```json
{
	"businessType": "Picklist",
	"label": {
		"en_US": "Status"
	},
	"listTypeDefinitionExternalReferenceCode": "REGISTRATION_STATUS",
	"name": "registrationStatus",
	"objectFieldSettings": [
		{
			"name": "defaultValue",
			"value": "pending"
		},
		{
			"name": "defaultValueType",
			"value": "inputAsValue"
		}
	],
	"required": true,
	"state": true
}
```

`defaultValue` is the picklist **entry key**, and it must match an entry the `list-type-definitions` handler created earlier — a typo here is a rollback, not a warning. Liferay then generates a fully connected `stateFlow` allowing every transition; constrain it explicitly if a state should be terminal. See `skills/manage-objects/SKILL.md` for the live API equivalent.

### `object-relationships/<name>.json`

A raw `ObjectRelationship`. This handler resolves the parent by **numeric ID** (`getObjectDefinitionId1()`), so ERC fields alone do not work here — use `[$OBJECT_DEFINITION_ID:<Name>$]` tokens, keyed on the object definition `name`:

```json
{
	"deletionType": "cascade",
	"externalReferenceCode": "EVENT_REGISTRATIONS",
	"label": {
		"en_US": "Registrations"
	},
	"name": "eventRegistrations",
	"objectDefinitionId1": "[$OBJECT_DEFINITION_ID:Event$]",
	"objectDefinitionId2": "[$OBJECT_DEFINITION_ID:Registration$]",
	"objectDefinitionName2": "Registration",
	"type": "oneToMany"
}
```

`deletionType` is `cascade`, `disassociate`, or `prevent`. Creating the relationship adds an `r_<relationshipName>_c_<parent>Id` field to the child object; set that field when creating a child entry over REST.

The field sits on the child but is named for the **parent**, first letter lowercased — the relationship above puts `r_eventRegistrations_c_eventId` on `Registration`, not `..._c_registrationId`. Getting it wrong is silent: the unknown key is ignored, the child is created with the FK left at `0`, and the POST still returns `200`. There is an ERC twin, `r_eventRegistrations_c_eventERC`, which is what OData relationship filters require (see `skills/manage-objects/SKILL.md`).

Do **not** copy `"system": true` from portal internal initializers (seo-studio, ai-hub) — it makes the object or picklist nonmodifiable.

## `resource-permissions.json`

A flat array of grants, applied by the `addOrUpdateResourcePermissions` handler. This is how an object becomes visible to Guest — required before an object backed Collection renders anything on a public page.

```json
[
	{
		"actionIds": [
			"VIEW"
		],
		"primKey": "0",
		"resourceName": "[$OBJECT_DEFINITION_CLASS_NAME:<Name>$]",
		"roleName": "Guest",
		"scope": "1"
	}
]
```

**`scope` is the trap.** It is a `ResourceConstants` integer, and the wrong value fails silently — the handler reports no error and grants nothing useful:

| `scope` | Constant | Grants |
| --- | --- | --- |
| `"1"` | `SCOPE_COMPANY` | The role may act on **all existing and future** entries of that resource. This is the one that makes a public listing work. |
| `"2"` | `SCOPE_GROUP` | The same, limited to the current site. |
| `"3"` | `SCOPE_GROUP_TEMPLATE` | Only the **default permissions applied to newly created** entries. Does nothing for entries that already exist. |
| `"4"` | `SCOPE_INDIVIDUAL` | One specific entry, named by `primKey`. Used by `page.json` permissions. |

Several portal initializers (seo-studio, ai-hub) use `"3"`, so copying from them without checking produces a grant that appears to apply and changes nothing. For scopes `1` and `2` the handler overwrites `primKey` with the company or group ID, so `"0"` is a fine placeholder.

The handler **warns rather than fails** on a bad `resourceName` or an unknown `roleName` — `No resource action found` / `No role found` in the log. A silent 2 ms run with no warning means the grant was applied as written; if behavior did not change, suspect `scope`.

## `roles.json` and `plo-entries.json`

- **`roles.json`**: each role's `name_i18n` and `description` must be **locale-keyed JSON objects** (`{"en_US": "..."}`). A plain string in either field rolls back the entire provisioning transaction.
- **`plo-entries.json`**: fragment i18n strings as `[{"key": "kebab-key", "value": "{\"en_US\": \"...\"}"}]` — note `value` is a *stringified* locale map. Fragments read them with `${languageUtil.get(locale, "kebab-key")}` in `index.html` (see `skills/scaffold-fragment/SKILL.md` for getting strings into JS). Keys are **company-scoped** — identical text across fragments must share one key, and **exclude any key the portal's own `Language.properties` already defines** (a duplicate overrides the portal value instance-wide). Changes take effect when the initializer re-fires.

## Token Substitution

Every file the initializer reads is passed through token replacement before it is parsed as JSON. Delimiters are `[$` and `$]`. This is how a file references an entity whose numeric ID cannot be known at authoring time.

A second form, `"[#KEY#]"`, replaces the token **together with its surrounding JSON quotes**, so the value lands as a raw number: `"classPK": "[#DOCUMENT_FILE_ENTRY_ID:/site-initializer/documents/group/<file>#]"` becomes `"classPK": 12345`. `SiteInitializerUtil.replace` handles `\"[#`…`#]\"` before `[$`…`$]` (2026.q3.2 bytecode). Use it wherever the DTO field is numeric.

Context tokens: `[$COMPANY_ID$]`, `[$GROUP_ID$]`, `[$GROUP_KEY$]`, `[$GROUP_FRIENDLY_URL$]`, `[$PORTAL_URL$]`.

Entity tokens are keyed by the entity's name or ERC, and are registered by the handler that creates the entity — so they generally resolve only for entities created by an **earlier** handler in the order above. **Object definition tokens are the exception**: they are registered company wide for every published object, including ones created outside the tree — see "Object Definition Tokens Are the Exception" below before concluding a token will not resolve.

| Token | Resolves To |
| --- | --- |
| `[$OBJECT_DEFINITION_ID:<Name>$]` | Numeric object definition ID |
| `[$OBJECT_DEFINITION_CLASS_NAME:<Name>$]` | Fully qualified class name |
| `[$OBJECT_DEFINITION_PORTLET_ID:<Name>$]` | Portlet ID |
| `[$LIST_TYPE_DEFINITION_ID:<Name>$]` | Numeric picklist ID |
| `[$ROLE_ID:<Name>$]` | Numeric role ID |
| `[$LAYOUT_ID:<friendly-url>$]` | Numeric layout ID |
| `[$DDM_STRUCTURE_ID:<Name>$]`, `[$DDM_TEMPLATE_ID:<Name>$]` | Structure / template IDs |
| `[$JOURNAL_ARTICLE_ID:<ERC>$]`, `[$BLOG_POSTING_ID:<ERC>$]` | Content IDs |
| `[$DOCUMENT_FILE_ENTRY_ID:<name>$]`, `[$DOCUMENT_URL:<name>$]` | Document ID / URL |
| `[$TAXONOMY_CATEGORY_ID:<resource-path>$]`, `[$TAXONOMY_VOCABULARY_ID:<Name>$]` | Taxonomy IDs. The category token is keyed by the category file's full path, e.g. `/site-initializer/taxonomy-vocabularies/company/<vocab>/<category>.json` (verified 2026.q3.2); an unresolved one stays literal with no error |
| `[$ASSET_LIST_ENTRY_ID:<Name>$]`, `[$SEGMENTS_ENTRY_ID:<Name>$]` | Collection / segment IDs. The segment tokens (`SEGMENTS_ENTRY_ID:`, `SEGMENTS_ENTRY_ERC:`, `SEGMENTS_ENTRY_SCOPE_ERC:`) are keyed by the entry's `segmentsEntryKey` in `segments-entries.json`, and resolve anywhere in a page definition, master or `fragmentConfig`, **including as a JSON key** (verified on 2026.q3.5). Note that `addOrUpdateLayoutsContent` and `addLayoutPageTemplates` do not declare a dependency on `addOrUpdateSegmentsEntries`; it runs before them only because of the handler map's iteration order |
| `[$CLIENT_EXTENSION_ENTRY_ERC:<name>$]` | Client extension entry ERC |

The authoritative list is `stringUtilReplaceValues` in `BundleSiteInitializer`; the delimiters are in `SiteInitializerUtil.replace`.

### Object Definition Tokens Are the Exception — They See the Whole Company

The "registered by the handler that creates the entity" rule holds for most tokens, but **object definitions are exempt**, and assuming otherwise leads to needlessly abandoning the tree. `_addObjectDefinitions` runs a company wide pass *before* it reads a single file:

```java
getObjectDefinitions(companyId, true, WorkflowConstants.STATUS_APPROVED)
	-> _replaceObjectDefinitionValues(className, shortName, id, ...)
```

That registers `[$OBJECT_DEFINITION_ID:<Name>$]` and `[$OBJECT_DEFINITION_CLASS_NAME:<Name>$]` for **every published object definition in the company**, whoever created it, and only then registers them again for the ones it creates from `object-definitions/`.

So a tree may freely reference objects created live over `object-admin` — `resource-permissions.json`, `object-actions/`, `notification-templates/*.object-actions.json`, and `object-relationships/` all resolve against them. Two conditions:

- The object must be **published**. That pass filters on `STATUS_APPROVED`, so a draft definition registers no token.
- The token is keyed on the definition's **short name**, which equals `name` for a custom object.

**Do not generalize this to other entity types.** `[$LIST_TYPE_DEFINITION_ID:<Name>$]` is registered inside the per file loop in `_addOrUpdateListTypeDefinitions`, with no such pass, so it resolves only for picklists in this tree. When in doubt, find where the handler calls `stringUtilReplaceValues.put` — inside the loop means tree only, before the loop means company wide.

The practical upshot is that a **mixed layout is workable**: objects managed live over `object-admin`, their logic and permissions still authored in the tree and version controlled. Object definitions, fields, actions, notification templates, and entries are all company scoped and survive site deletion, so they persist across the reprovisions that page and fragment work require. What is *not* reproducible is the objects themselves — a fresh bundle or a different environment starts without them, so say plainly which half of the data layer the tree actually rebuilds.

## Verifying What the Initializer Actually Did

The handler log lines are the fastest diagnosis — a step reporting `took 0 ms` (or `1 ms`) found no files, which is how a wrong directory name presents. Grep the handler for whatever you just added, not only the object ones:

```bash
grep --extended-regexp 'Initializing|Invoking (addOrUpdateListTypeDefinitions|addObjectDefinitions|addOrUpdateObjectRelationships|addOrUpdateLayouts|addOrUpdateLayoutsContent|addLayoutPageTemplates|addStyleBookEntries|addFragmentEntries|addOrUpdateResourcePermissions)' \
	bundles/tomcat/logs/catalina.out | tail -20
```

**Fragments are `addFragmentEntries`, with no `addOrUpdate` prefix** — verified on 2026.Q2, where the run logged `Invoking addFragmentEntries took 117 ms`. Grepping for `addOrUpdateFragmentEntries` matches nothing, which reads exactly like the fragments directory was never found. There is likewise **no `addOrUpdateSiteNavigationMenus` line at all**, because that handler runs inside `addOrUpdateLayoutsContent` (see the navigation section above) — its absence is normal and proves nothing either way. Verify menus by counting items over REST instead.

When a handler you expected is simply missing from the output, dump every line for the run before concluding it did not fire:

```bash
awk '/Initializing <Site Name>/{n++} n>=1' bundles/tomcat/logs/catalina.out \
	| grep --extended-regexp 'Invoking|Initializing'
```

`n>=1` prints from the first run onward, so raise the threshold to skip earlier runs — `n>=2` means "the second run and everything after it", not the second run alone. Set it to the total number of `Initializing` lines to see only the latest.

The signal is the **jump between runs**, not the absolute number. Observed on a run that added a style book and a master page to an existing tree:

```text
Invoking addStyleBookEntries took 1 ms      <- before: directory absent
Invoking addStyleBookEntries took 21 ms     <- after: files found
Invoking addLayoutPageTemplates took 0 ms   <- before: no master page
Invoking addLayoutPageTemplates took 134 ms <- after: master page imported
```

So keep the previous run's numbers to compare against. A handler that stays at `0`/`1 ms` after you added its directory is a **hint** that the path is wrong — the build still succeeds and the site still provisions.

**Treat a flat timing as a prompt to check the effect, not as proof of failure.** The signal scales with how much work the handler does, so a handler reading one small file can apply it correctly and still round to `1 ms`. Verified on 2026.Q2: adding `layout-set/public/metadata.json` left `updateLayoutSets` at `1 ms` across the runs before and after, yet the settings had plainly taken — Classic's header and "Powered by Liferay" footer were both absent from the rendered page. Reading that `1 ms` as "the path is wrong" would have sent you chasing a bug that did not exist.

The timings are a triage tool for the file heavy handlers (fragments, layouts, objects, style books, page templates), where real work shows up as tens or hundreds of milliseconds. For a single file handler, assert the outcome instead:

| Handler | What to assert rather than the timing |
| --- | --- |
| `updateLayoutSets` | Fetch a page; confirm the chrome you switched off is gone from the HTML |
| `addOrUpdateResourcePermissions` | Make the request as the target role (unauthenticated `curl` for Guest) |
| `addOrUpdateSiteNavigationMenus` | Count `navigationMenuItems` over REST — this one logs no line at all |

`catalina.out` timestamps are UTC while a local shell is typically not, so a line that looks hours ahead may be the current run. When several runs are in the file, the earlier failures stay there — match on timestamp before concluding the newest run failed.

One JVM-level red herring: repeated heavy reprovisions can exhaust the **JIT CodeCache**, after which the portal throws bogus cascading `NoSuchMethodException`/`linkToInterface` errors that read like a broken deployment and can silently kill fragment upserts. The fix is `-XX:ReservedCodeCacheSize=512m` in the JVM options and a restart — and note that regenerated container/compose configs can drop the flag, so re-verify it after environment rebuilds.

A failed initialization rolls the site back, so "the site does not exist" and "the initializer threw" are the same symptom. Search for the cause with:

```bash
grep --extended-regexp 'InitializationException|MustNotBeReserved|Unable to transform' \
	bundles/tomcat/logs/catalina.out | head
```

## `site-navigation-menus.json` Format

A bare JSON array of menus. Each menu needs `externalReferenceCode`, `name`, `typeSite`, and a `menuItems` array. **`auto` is read on update only:** a menu the run creates gets `addSiteNavigationMenu(…, name, typeSite, …)`, which takes no `auto`, so it is stored `false` whatever the file says, and the **next** fire sets the file's value (`_addOrUpdateSiteNavigationMenu`, verified on 2026.q3.5: a fresh build's two `"auto": true` menus read `auto_ = f` until the second run). Expect that one-time difference between a fresh build and a re-run:

```json
[
	{
		"auto": false,
		"externalReferenceCode": "EVENT_SITE_MAIN_MENU",
		"menuItems": [
			{
				"externalReferenceCode": "EVENT_SITE_NAV_HOME",
				"friendlyURL": "/home",
				"privateLayout": false,
				"type": "layout"
			}
		],
		"name": "Main Menu",
		"typeSite": 1
	}
]
```

`typeSite` is a `SiteNavigationConstants` integer: `1` primary, `2` secondary, `3` social.

Item `type` is `layout`, `node`, `url`, or `display-page`. A `layout` item is resolved by **friendly URL**, not by name or ID, and needs `privateLayout` alongside it. A `display-page` item's `key` is the path of a Journal article or document file **of the same tree** (`/site-initializer/journal-articles/<folder>/<file>.json`): only `_addOrUpdateJournalArticles` and `_addOrUpdateDocuments` register them, so it cannot name an object or CMS entry (2026.q3.6 bytecode). A `url` item takes `url` and `useNewTab`. Nest children by giving an item its own `menuItems` array.

**Custom labels come from `name_i18n`, a locale map — a bare `name` is ignored** (`BundleSiteInitializer._getNavigationMenuItemUnicodePropertiesWrapper`, verified 2026.q3.1). To override a `layout` item's page title, set `"useCustomName": true` **and** `"name_i18n": {"en_US": "<label>"}`. A missing `name_i18n` logs `Missing "name_i18n" in {...}`, and the consequence depends on the type:

- `layout` item — **nonfatal**: the item is still created, labeled with the page's own name.
- `node` item — **fatal for the subtree**: the node **and every item nested under it** are silently skipped. A `node` needs **both** `name_i18n` and `title` (set them to the same string).

**Item `externalReferenceCode` must be unique per item, not per target page.** Items upsert by ERC, so two items pointing at the same page (e.g. a "Company" top item and an "About" child both targeting `/company`) must not share an ERC derived from the friendly URL — the second occurrence *updates and re-parents* the first item instead of creating a new one, corrupting the tree.

The handler creates and updates items but **never deletes** — items dropped from the file persist in the live menu. To rebuild a menu cleanly after restructuring it, delete the live menu first (`DELETE /o/headless-delivery/v1.0/navigation-menus/{id}`) and re-fire the initializer; the handler recreates it from scratch by menu ERC.

The handler runs at the **end of** `addOrUpdateLayoutsContent`, so pages already exist by then. A friendly URL that does not match any page is skipped with a warning rather than failing the build:

```text
No layout found with friendly URL /whatever
```

That is a silent gap — the menu is created with fewer items than authored, and the site still provisions. Confirm the item count after provisioning:

```bash
curl \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-site/v1.0/sites/<site-erc>/navigation-menus" \
	--user "test@liferay.com:test" \
	| jq '[.items[] | {name, items: (.navigationMenuItems | length)}]'
```

Note that the Classic theme's site navbar renders the **public page hierarchy** on its own, so non hidden pages appear in navigation whether or not this file exists. There is no key in `layout-set/*/metadata.json` that selects a named menu for the theme — the same limitation the themeCSS note above describes.

Source: `_addOrUpdateSiteNavigationMenus` in `BundleSiteInitializer`.

## `user-accounts.json` and `accounts.json`

Verified against 2026.q2.7 `BundleSiteInitializer` + headless-admin-user resource impls:

- **Created users are set INACTIVE.** `_addUserAccounts` unconditionally ends every user with `setStatus(INACTIVE)` — they land hidden from Users and Organizations (which defaults to active-only) and cannot log in. Reactivate post-init: `PATCH /o/headless-admin-user/v1.0/user-accounts/{id}` with `{"status": "Active"}` — the value is **case-sensitive** (`"Active"`/`"Inactive"` per the enum; lowercase or numeric forms fail `400 "Unable to map JSON path: status"`, which misleadingly reads as unwritable).
- **Do NOT set `imageId` in `user-accounts.json`.** It triggers `updatePortrait` on the just-created (stale) User in the same transaction → `StaleObjectStateException` that **aborts the entire site init**. Apply portraits post-init over REST.
- **`accountBriefs[].roleBriefs` get wiped.** The initializer assigns the account roles, then its final status PATCH round-trips a role-less DTO that deletes and re-adds the memberships — memberships survive, account roles don't (0 `usergrouprole` rows after init). Re-grant post-init: `POST /o/headless-admin-user/v1.0/accounts/{accountId}/account-roles/{accountRoleId}/user-accounts/{userId}` (204/409, idempotent).
- `roleBriefs` entries are role **names**, silently skipped if the role doesn't exist. `organizationBriefs`/`userGroupBriefs` match by `name`.
- **Password:** honored on create (`password` field); the initializer itself sets none. An admin can set one later via `PATCH /user-accounts/{id} {"password": "X"}` (no current-password needed for another user; re-PATCHing the same value returns `400 "password is invalid"` — treat as idempotent).
- **A siteInitializer that re-fires on restart re-stamps its users INACTIVE** (re-deactivation clobbers manual reactivation; fingerprint: an inactive user with a recent `lastLoginDate`). Re-run the reactivation script after restarts, or keep sign-in users out of `user-accounts.json`.
- `accounts.json` parity: `customFields:[{name, customValue:{data}}]`, `parentAccountExternalReferenceCode` (hierarchy), `status: 5` deactivates, `postalAddresses` (give each a `type` — billing/shipping — or the account admin Addresses tab hides it), `defaultBillingAddressExternalReferenceCode`/`defaultShippingAddressExternalReferenceCode`.

## `site-settings.json` — Group-Scoped OSGi Configs

`_addSiteSettings` reads a JSON array of `{"pid": "...", "properties": {...}}` and calls `ConfigurationProvider.saveGroupConfiguration` with the current site's IDs auto-injected — the initializer-native way to ship a group-scoped OSGi config without hardcoding companyId/groupId. Re-applies idempotently on redeploy. Example — redirect unauthenticated visitors to sign-in: pid `com.liferay.login.web.internal.configuration.AuthLoginConfiguration`, properties `{"promptEnabled": true}` (the page must also be un-viewable by Guest for the redirect to fire). Company-wide OSGi configs still belong in `configs/<env>/osgi/configs/*.config`.

## `page.json` Format

```json
{
	"friendlyURL": "/home",
	"hidden": false,
	"name": "Home",
	"name_i18n": {
		"en_US": "Home"
	},
	"permissions": [
		{
			"actionIds": [
				"VIEW"
			],
			"roleName": "Guest",
			"scope": 4
		}
	],
	"private": false,
	"system": false,
	"type": "Content"
}
```

`type` passes straight through (lowercased, `widget`→`portlet`) to `LayoutLocalService.addLayout`, so any `LayoutConstants.TYPE_*` string works — not just the common four. Verified values: `"Content"`, `"Portlet"`/`"Widget"`, `"URL"`, `"Embedded"`, `"link_to_layout"`, and **`"node"` = a Page Set** — a non-browsable container parent (redirects to its first child) that needs **only `page.json`, no `page-definition.json`** (`_addOrUpdateLayoutContent` early-returns for non-content types). `"hidden": true` hides a page from navigation. A `content` child page still needs a minimal `page-definition.json` with `settings.masterPage.key` to pick up the master.

Two `page.json` facts that are easy to get wrong:

- **Every layout is auto-granted Guest VIEW** (`setAddGuestPermissions(true)` at addLayout), and the `permissions` array only **sets** the roles you list — omitting Guest does NOT remove the auto-grant. To make a page members-only, list Guest with an **empty `actionIds`** array (an empty set deletes the resource-permission row); this runs after addLayout each time, so it is idempotent on redeploy:

  ```json
  "permissions": [
  	{"actionIds": ["VIEW"], "roleName": "Site Member", "scope": 4},
  	{"actionIds": [], "roleName": "Guest", "scope": 4}
  ]
  ```

  Page-level access belongs here, not in fragment FreeMarker role checks — a fragment has no ACL and gating it couples visibility to one placement. Liferay auto-hides nav links to pages the user cannot view.
- **`friendlyURL` has reserved tokens that abort the entire run** (`LayoutFriendlyURLException` KEYWORD_CONFLICT): any single segment equal to a **locale code** (all ~67 available locales — `/cs` is Czech, also `/de /fr /es /it /ja /pt` and the `en-us` forms), a `layout.friendly.url.keywords` reserved word (`api`, `c`, `combo`, `group`, `image`, `language`, `o`, `osgi`, `page`, `rest`, `web`, `webdav`, `widget`, …), or a portlet friendly-URL-mapper name (`search`, `blogs`, `asset_publisher`, …). Single-letter pages such as `/a` and `/b` fail the same way (`LayoutImpl.validateFriendlyURLKeyword`, verified 2026.q3.2). Prefer descriptive multi-word slugs (`/customer-service`, never `/cs`), especially when preserving legacy slugs in a migration.

## `page-definition.json` Format

Mirrors the `pageDefinition` field of the Headless Admin Site page API. Minimum shape for an empty content page:

```json
{
	"pageElement": {
		"pageElements": [
		],
		"type": "Root"
	},
	"version": "1.0"
}
```

Add fragment elements under `pageElements` to compose the layout. Each fragment element references its fragment by `key` (the fragment's directory name under `fragments/group/<collection-key>/fragments/`) and `siteKey` (the `[$GROUP_KEY$]` token, which resolves to the current site):

```json
{
	"definition": {
		"fragment": {
			"key": "<fragment-name>",
			"siteKey": "[$GROUP_KEY$]"
		}
	},
	"type": "Fragment"
}
```

Built in fragments instead use a combined `key` with no `siteKey` (e.g. `"key": "BASIC_COMPONENT-paragraph"`). The importer reads `key`/`siteKey` only — a fragment element written with `collectionExternalReferenceCode`/`fragmentEntryKey` is silently dropped and the page renders blank.

**Company-scoped fragments (`fragments/company/...`): reference them by `key` alone, or with `"siteKey": "[$COMPANY_ID$]"`.** The importer looks `siteKey` up as a group key. The company (Global) group's key is the company id, so `[$COMPANY_ID$]` resolves to it; a bare `key` with no `siteKey` falls back to Global (`FragmentLayoutStructureItemImporter._getFragmentEntry`, `useGlobalAsFallback`). Any other `siteKey` that names no group — typically **another instance's company id**, which is what a page definition exported from an older demo carries — skips the fragment silently: no log line, and the page imports with that element missing (verified on 2026.q3.5: a page whose company fragments kept the old company id imported with 0 `fragmententrylink` rows). Two more company-fragment behaviors worth knowing: they **survive site deletion** (they're company scoped), and an edit deployed through a delete+redeploy reprovision can land as a **Draft** in the fragment library (needing a UI publish) — whereas a plain redeploy with no site delete upserts straight to the live version.

More import traps, verified on 2026.q2.7 unless a later release is named:

- **`pageElements` must be a FLAT array of PageElement objects.** A nested array (array-of-arrays, e.g. a generator emitting `[[card, card], [card, card]]` instead of two `Section` objects each holding cards) throws Jackson `MismatchedInputException: Cannot deserialize ... PageElement from Array value` in `LayoutsImporterImpl._importPageElement` — and **silently leaves the page blank** (layout row created, zero `fragmententrylink` rows). Diagnose an empty page by counting `fragmententrylink where classpk = <plid>`; if 0, grep the log for `MismatchedInputException`.
- **Multi-column layout is `Section → Row → Column → (inner Section) → Fragment`** — `Column.size` values sum to 12. `ColumnDefinition` is NOT a valid type and aborts the entire site init; the full valid enum is in `rules/page-types.md`.
- **`settings.css` is imported, but a page that has a master never renders its own.** The importer stores it in `layout.css`, and the page's `<style>` comes from `Layout.getCssText()` (2026.q3.5): a layout that inherits look and feel gets the **layout set's** CSS; otherwise, if it has a master, it gets **the master's** `getCssText()`; only a master-less layout uses its own. So the CSS that reaches every page is the **master's** `settings.css`, and only when the master does not inherit look and feel, which means its `settings.themeName` must name a **deployed** theme. An unresolved `themeName` (for example `"Dialect"` on a bundle without it) sets `themeId` null, the master inherits, and the layout set's (usually empty) CSS is emitted instead, with no error. Verified on 2026.q3.5: with the master's `themeName` `"Dialect"` no page emitted the master's CSS; with `"Classic"` every page using the master did, including pages with no `settings.css` of their own. A page's own `settings.css` stays in `layout.css` unrendered. For CSS that belongs to one page only, use a `globalCSS` CX or a fragment's CSS.
- **A `colorPalette` value in `fragmentConfig` must be an object, `{"cssClass": "success"}`, never a bare string.** The importer wraps a string as `{"color": "success"}` (`FragmentLayoutStructureItemImporter._toFreeMarkerFragmentEntryProcessorJSONObject`) and keeps a map as given. A fragment that reads `configuration.<field>.cssClass` then fails FreeMarker at import, which rolls back the **entire** site. `headless-delivery`'s page-definition GET returns these values flattened to a string, so a page definition exported over REST hits this (verified on 2026.q3.5).
- **A custom `FragmentRenderer` placed by an import gets a link with an EMPTY `html`.** The importer creates links through `FragmentEntryLinkLocalService`; a renderer whose markup is set by a `FragmentEntryLinkService` wrapper (the page editor's path) never gets it, so a renderer that delegates to the fragment entry renderer renders nothing, and its drop zone's children never show, while the link rows and counts look right (verified on 2026.q3.5 with a personalized drop zone). Set the markup in a `ModelListener<FragmentEntryLink>` (`onBeforeCreate`/`onBeforeUpdate`, when `rendererKey` is yours and `html` is blank), which covers every path. Check `length(html)` of the links, not only their count.
- **A fragment element whose `key` matches neither a fragment nor a registered renderer is dropped together with every element nested in it**, with no log line (the importer collects a warning message that nothing prints). A missing custom `FragmentRenderer` that wraps a drop zone therefore takes its whole subtree with it. Count `fragmententrylink` rows per plid against the source.
- **A `Collection` element needs its full display config at the `definition` level, or the import NPEs and silently rolls back.** `collectionConfig` holds ONLY `collectionReference` + `collectionType`; `numberOfItems`, `numberOfItemsPerPage`, `numberOfPages`, `numberOfColumns`, `displayAllItems`, `displayAllPages`, `showAllItems`, `paginationType`, `listStyle`, `listItemStyle`, `templateKey`, `collectionViewports` are all **siblings of `collectionConfig`** — the importer reads them straight off `definition`. Only `numberOfColumns` and `numberOfItems` are unboxed without a null check (`CollectionLayoutStructureItemImporter`, 2026.q3.2 bytecode), so those two are the hard requirement; a missing one throws an NPE that rolls back the **entire** template/page import, logged only as a bare WARN. `collectionViewports[].id` is lowerCamel (`landscapeMobile`). When a composition change "won't take" despite a correct artifact, enable DEBUG on `com.liferay.layout.internal.importer` to surface the swallowed stack.
- **A property the page-definition schema doesn't allow crashes the import with a bare `StackOverflowError`** (the everit validator recurses through the self-referential schema instead of reporting "additionalProperties"). Every definition in `page_definition_json_schema.json` is `additionalProperties: false`, and properties are per-type — e.g. `gutters` is valid on a `Row` but NOT on a `Collection`. Validate each element's `definition` against the schema def for its type before shipping.
- **`fragmentStyle.backgroundImage` (and `backgroundFragmentImage`) as a string aborts the whole init** with `ClassCastException: String cannot be cast to Map` — they are the only style keys cast without a type check. A Map shape imports but does not render. For a per-instance background, declare an editable `<img data-lfr-editable-type="image">` in the fragment, place it behind the content with CSS, and set it through `fragmentFields` like any image. Verified on 2026.q3.2.
- **A `Widget` element embeds a classic portlet:** `{"definition": {"widgetInstance": {"widgetConfig": {}, "widgetName": "com_liferay_login_web_portlet_LoginPortlet"}}, "type": "Widget"}`. `widgetConfig` holds flat portlet preferences. Verified on 2026.q3.2 with the Login portlet.
- **A fragment's `<lfr-drop-zone>` does not render from an initializer import by itself** — the importer builds the layout structure from the page-definition tree, not the fragment HTML. Declare an explicit `{"definition": {}, "pageElements": [...], "type": "FragmentDropZone"}` child on the Fragment element, and nest the dropped fragments inside it. (Manually re-adding the fragment in the editor works — the editor parses the HTML — which makes this easy to misdiagnose.)

## Master Pages

A master page lives under `layout-page-templates/master-pages/<master-name>/` with two files: `master-page.json` (just `{"name": "<Display Name>"}`) and `page-definition.json`.

> **The master's key is derived from its `name`, NOT its directory name.** The importer lowercases the `master-page.json` `name` and replaces spaces with dashes (`LayoutPageTemplateEntryLocalServiceImpl._generateLayoutPageTemplateEntryKey`). So `"name": "Site Master"` → key `site-master`, regardless of the `<master-name>` folder. A `settings.masterPage.key` that points at the folder name instead of the normalized name resolves to nothing and the importer **silently leaves the page master-less** on provision. Name the folder to match the normalized name (`site-master`) to keep the tree self-documenting. (Note: **style books are the opposite** — their key IS the directory name, per `StyleBookEntryZipProcessorImpl._getKey`.)

The master `page-definition.json` holds the persistent header/footer fragments plus a **DropZone** marking where each page's own content is injected. The DropZone must carry a `definition.fragmentSettings` block — a bare `{"type": "DropZone"}` does not render. Use the numeric `version` `1.1`:

```json
{
	"pageElement": {
		"pageElements": [
			{
				"definition": {
					"fragment": {
						"key": "<header-fragment-name>",
						"siteKey": "[$GROUP_KEY$]"
					}
				},
				"type": "Fragment"
			},
			{
				"definition": {
					"fragmentSettings": {
						"unallowedFragments": [
						]
					}
				},
				"type": "DropZone"
			}
		],
		"type": "Root"
	},
	"version": 1.1
}
```

### Binding design to the master via `settings`

The master `page-definition.json` also carries a top level `settings` block (a sibling of `pageElement`) that wires the site's design onto every page the master wraps. This is the **portable way to apply a `themeCSS` CET, a style book, and global CSS/JS from the initializer tree** — `layout-set/public/metadata.json` has **no** key for a client extension, so a `themeCSS` CET is never applied there:

```json
{
	"pageElement": {
		"pageElements": [
		],
		"type": "Root"
	},
	"settings": {
		"globalCSSClientExtensions": [
			{
				"clientExtensionConfig": {
					"loadType": "default",
					"scriptLocation": "head"
				},
				"externalReferenceCode": "LXC:<config-erc>",
				"name": "<CET Name>"
			}
		],
		"styleBook": {
			"key": "<style-book-key>",
			"name": "<Style Book Name>"
		},
		"themeCSSClientExtension": {
			"externalReferenceCode": "LXC:<config-erc>",
			"name": "<CET Name>"
		},
		"themeName": "Classic",
		"themeSettings": {
			"lfr-theme:regular:show-footer": "false",
			"lfr-theme:regular:show-header": "false"
		}
	},
	"version": 1.1
}
```

- The CET external reference code is **`"LXC:" + <config-erc>`** (`CETConfigurationFactory._getExternalReferenceCode`) — a CET whose config ERC is `my-theme-css` is referenced as `"LXC:my-theme-css"`.
- **Give every `globalCSSClientExtensions` / `globalJSClientExtensions` entry a `clientExtensionConfig`.** Without it, a globalCSS entry still loads, but a globalJS entry renders **no** `<script>`, with no error and no log line, and the binding reads back fine (verified 2026.q3.2). On that master-bound tag, the CET's `scriptElementAttributes` (`defer`) did not appear either.
- **These `settings` keys work on a master only.** On a page's own `layouts/*/page-definition.json`, `settings.globalJSClientExtensions` is ignored without error. Bind a CET to a single page with the live whole-page PUT instead (`skills/manage-pages/SKILL.md`).
- The render-time resolver (`ClientExtensionsServicePreAction`) walks **layout → master layout → layout-set**, so a single bind on the master cascades to every page that uses it.
- Because this is a master page-composition change, it takes effect only when the **initializer re-fires** (clean redeploy; delete + redeploy as the fallback). A bare `themeCSS` CET redeploy updates the served CSS of an already-bound CET but never creates the binding.
- **Deploy-order race:** the `themeCSS` CET must already be registered when the initializer imports the master. If it is not, the importer logs `No CET found for LXC:<config-erc>` and silently skips the binding — pages fall back to the base theme site-wide. Fix by retriggering the initializer (clean + redeploy) after the CET is up.

A page selects its master through its **own** `page-definition.json`, in a top level `settings.masterPage.key` — the only selector that works. A `masterPage` key beside `pageElement` (some shipped examples carry both) is inert on its own: the page imports without error and renders without the master (verified 2026.q3.2). The value is the master's **normalized-name key** (lowercased, spaces→dashes — e.g. `site-master` for name `"Site Master"`), not the folder name:

```json
{
	"pageElement": {
		"pageElements": [
		],
		"type": "Root"
	},
	"settings": {
		"masterPage": {
			"key": "<normalized-master-name>"
		}
	},
	"version": 1.1
}
```

## `layout-set/public/metadata.json`

Controls theme assignment and theme settings for the public (nonprivate) layout set. The theme is named by its **display name**, in `themeName`:

```json
{
	"settings": {
		"lfr-theme:regular:show-footer": false,
		"lfr-theme:regular:show-header": false,
		"lfr-theme:regular:show-header-search": false
	},
	"themeName": "Classic"
}
```

**`themeName` is the only theme key read.** `_updateLayoutSet` passes it to `_getThemeId`, which looks the theme up by `Theme.getName()` among the company's themes. `themeId` and `colorSchemeId` are never read: the color scheme stays the layout set's, and a `themeId` alone, or a `themeName` matching no deployed theme, sets the theme to blank, which renders the portal default, Classic. So an old `"themeId": "classic_WAR_classictheme"` appears to work only because Classic is the default (`BundleSiteInitializer`, 2026.q3.5 source). Beside `metadata.json`, the same directory may hold `css.css` (the layout set's CSS), `js.js` (stored as the `javascript` setting) and `logo.png` (the site logo).

**Dialect is not shipped on 2026.q3.5.** Its module is still in the source (`frontend-theme-dialect`), but without the `.lfrbuild-portal` marker, so the bundle has no `dialect-theme.war` and `/o/dialect-theme/css/main.css` answers `404`. A tree from an older demo that names `"Dialect"` (here, in each page definition's `settings.themeName`, or a style book's `themeId: dialect_WAR_dialecttheme`) silently falls back: the layout set to the default theme, each page and master to an inherited (null) `themeId`, which also stops the master's `settings.css` from rendering (see `page-definition.json` above). Dialect's style-book tokens and its CSS variables (`--color-brand-primary`, `--color-neutral-*`, …) mostly have no Classic name, so moving to Classic means re-mapping them. `_dialectThemeDetected`, which imports the extender's own 5 `dialect-*` group fragments, never fires.

Use the `settings` block to switch off the stock theme chrome when a master page supplies a branded header and footer — otherwise both render, one above the other. Prefer this over hiding `#banner` / `#footer` with CSS: the setting is scoped to this layout set, whereas a `globalCSS` CET is injected instance wide and there is no site specific `body` class to scope such a rule to.

> **A `themeCSS` CET is not applied through this file** — `metadata.json` has no key for a client extension. `themeName` selects the base **WAR theme** (Classic), nothing more. The tree-expressible binding lives in the **master page's `page-definition.json`** `settings.themeCSSClientExtension` block (ERC `"LXC:" + <config-erc>`) — see "Binding design to the master via `settings`" under Master Pages above. The render-time resolver walks layout → master layout → layout-set, so the master bind cascades to every page using it and **survives reprovision**.
>
> So leave `themeName` as `"Classic"` and let the style book (`defaultStyleBookEntry: true`) plus the master-bound `themeCSS` CET drive appearance. Reach for the themeCSS CET for Clay level overrides that have no token — Classic exposes no `headings*` style book tokens, for instance.

## `client-extension.yaml` for the Initializer

```yaml
<workspace-id>-site-init:
    name: <WorkspaceId> Site Initializer
    oAuthApplicationHeadlessServer: <workspace-id>-site-oauth
    siteExternalReferenceCode: <workspace-id>
    siteName: <WorkspaceId> Site
    type: siteInitializer

<workspace-id>-site-oauth:
    .serviceAddress: localhost:8080
    .serviceScheme: http
    name: <WorkspaceId> Site OAuth
    scopes:
        - Liferay.Headless.Admin.Site.everything
        - Liferay.Headless.Admin.Content.everything
        - Liferay.Object.Admin.REST.everything
        - Liferay.Headless.Object.everything
        - Liferay.Headless.Admin.User.everything
        - Liferay.Headless.Batch.Engine.everything
    type: oAuthApplicationHeadlessServer
```

## Triggering the Initializer

After deploying, open Control Panel → Sites → Add and select the site initializer from the template list. The name matches the `name` field in `client-extension.yaml`.

Alternatively, via the REST API (the **discouraged** path — see the Provisioning warning above; the CET's `siteExternalReferenceCode` autoprovision + delete then redeploy is the portable route):

```bash
curl \
	--data '{
		"membershipType": "open",
		"name": "<Site Name>",
		"templateType": "site-initializer",
		"templateKey": "<workspace-id>-site-init"
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-site/v1.0/sites" \
	--user "test@liferay.com:test"
```

The current `Site` DTO uses `templateKey` (not `templateExternalReferenceCode`); resolving a site-initializer template through this POST is unreliable regardless.

## References

- Sample site initializer: `workspaces/liferay-sample-workspace/client-extensions/liferay-sample-site-initializer`
- Production site initializer: `modules/apps/site-initializer/site-initializer-cms`
- CET type details: `rules/client-extension-types.md`
- OAuth scopes: `rules/oauth-scopes.md`

## `segments-entries.json` and `segments-experiences/` (Verified on 2026.q3.10)

DXP segments are **deprecated** since 2026.Q1 (Liferay Data Platform segmentation replaces them). Don't use them for new work; the facts below are for existing sites.

- **Segment:** `segments-entries.json` = `[{"segmentsEntryKey": "DISTRIBUTORS", "name_i18n": {"en_US": "Distributors"}, "active": true, "criteria": {"criteria": {"user": {"conjunction": "and", "filterString": "(userGroupIds eq '<userGroupId>')", "typeValue": "model"}}, "filterStrings": {"user": "(userGroupIds eq '<userGroupId>')"}}}]`. The user group id has no token: resolve it at build time.
- **Experience:** `segments-experiences/<NN-name>/segments-experiences.json` = `{"friendlyURL": "/home", "name_i18n": {…}, "active": true, "segmentsEntryERC": "[$SEGMENTS_ENTRY_ERC:DISTRIBUTORS$]", "segmentsEntryScopeERC": "[$SEGMENTS_ENTRY_SCOPE_ERC:DISTRIBUTORS$]"}`, with its content in a subfolder holding `page.json` and `page-definition.json` (a copy of the page with the experience's changes).
- **Hide a container in an experience** with `fragmentStyle.hidden: true`; a `display: none` style is ignored.
- **Not an upsert** (see "Provisioning and Iteration"): every deploy appends another copy. A published experience can't be deleted over headless (`400 UnsupportedOperationException`). Guard the build: leave out of the zip any experience folder whose experience already exists on its page (read the page's experiences first), e.g. a wrapper script around `blade gw clean deploy`.
- **Segments only match when the Deprecation flag `LPD-78863` is on** (`rules/feature-flags-catalog.md`): System Settings → Feature Flags → Deprecation. Until then every user gets the Default experience.

## Navigation Menus on a Re-Fire

A menu item added to an existing menu in the tree is **appended at the end** of the live menu, whatever its position in the file. Don't reorder over `PUT /headless-delivery/v1.0/navigation-menus/{id}`: it rewrites every item's `typeSettings` and can blank the menu. Delete the live menu and redeploy to rebuild it in tree order.
