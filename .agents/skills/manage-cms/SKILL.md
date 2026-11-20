---

description: Create and manage Liferay CMS Spaces, Content Structures, Content Entries, folders, and Basic Documents over REST or a batch client extension, connect a Space to a Site so its content renders, and decide when editorial content belongs in CMS instead of a plain Object. Use when the user mentions a CMS Space, a content structure, editorial content, or a Collection Display that shows nothing for a depot-scoped structure.
name: manage-cms

---

# Manage CMS

The CMS product is an editorial layer **on top of Objects**, not a separate engine:

| CMS term | Underlying primitive |
| --- | --- |
| Space | An Asset Library (a "depot"), `type: "Space"` |
| Content Structure | An Object Definition with `"scope": "depot"` |
| Content Entry | An Object Entry, scoped to the Space's own group |
| Folder (the CMS left-hand tree) | An Object Entry Folder, via `headless-object` |

Everything below was verified live on 2026.q3.2 (2026-09-29) unless marked otherwise. The CMS module needs no feature flag there.

## When to Invoke

- "Create a Space", "add a content structure", "put news/articles/specs in the CMS"
- A Collection Display, Data Set, or page bound to a depot-scoped structure renders nothing, even for an admin
- Deciding whether a new content type is a CMS structure or a plain object

## Modeling Decision

The choice is authorial intent, not capability — both are Object Definitions:

| Need | Use |
| --- | --- |
| Authored and revised over time, needs draft, versioning, scheduling, reuse across pages | CMS Content Structure (this skill) |
| One record per event or transaction, created by a system or a form | Plain object (`manage-objects`) |
| Transactional records that point at editorial content | A plain object with a normal relationship to the CMS structure (`manage-objects` → "Add Relationships") |

Quick test: if an author would open it in an editor, leave mid-edit, and publish later, it is CMS content.

## Well-Known ERCs

| ERC | What it is |
| --- | --- |
| `L_CMS_CONTENT_STRUCTURES` | Object folder for authored structures. Built-ins in it: `L_CMS_BASIC_WEB_CONTENT`, `L_CMS_BLOG` |
| `L_CMS_FILE_TYPES` | Object folder for file-backed structures. Built-ins in it: `L_CMS_BASIC_DOCUMENT`, `L_CMS_EXTERNAL_VIDEO` |
| `L_CMS_STRUCTURE_REPEATABLE_GROUPS` | Object folder, empty on 2026.q3.2 |
| `L_CONTENTS`, `L_FILES` | The two root **entry** folders of every Space (the "Contents" and "Files" sections) |

## Workflow

### 1. Create the Space

```bash
curl \
	--data '{
		"externalReferenceCode": "<space-erc>",
		"name": "<Space Name>",
		"type": "Space"
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-asset-library/v1.0/asset-libraries" \
	--user "test@liferay.com:test"
```

- **Read `siteId` from the response and keep it.** It is the Space's scope id for entries and folders. It differs from `id` (+1 in every run observed, but read it, never derive it).
- **The ERC works in paths** (`/asset-libraries/<space-erc>`).
- **A repeated POST with the same ERC returns `400 "This external reference code is already in use."`** — it is not an upsert. The list filter `type eq 'Space'` works; a filter on `externalReferenceCode` returns `400 InvalidFilterException`.
- **`PUT /asset-libraries/<erc>` creates a missing Space or classic library** with that ERC and the body's `type` (`Space`, `AssetLibrary`). **But never PUT an existing one.** Without `settings` the repeat PUT is a `500` (NPE at `AssetLibraryResourceImpl:374`: the update path merges `_putUnicodeProperties(null)`). With `"settings": {}` it answers `200` and **rewrites every setting from defaults**, so `useCustomLanguages` flips from `true` to `false`. So a script GETs by ERC, PUTs only on a `404`, and leaves an existing one alone. Verified on 2026.q3.5.
- **`settings` is optional.** Defaults are returned (`logoColor: "outline-0"`, `trashEnabled`, `sharingEnabled`, …), and `logoColor` values such as `outline-3` round trip.

### 2. Connect the Space to Each Site That Renders Its Content

**This is the step that makes content appear.** A Collection Display bound to a depot-scoped structure renders **nothing** — for an admin too — until the Space is connected to the page's Site:

```bash
curl \
	--data '{"searchable": true}' \
	--header "Content-Type: application/json" \
	--request PUT \
	--silent \
	--url "http://localhost:${PORT}/o/headless-asset-library/v1.0/asset-libraries/<space-erc>/connected-sites/<site-erc>" \
	--user "test@liferay.com:test"
```

- **Detection:** the collection block is simply absent (no "No Results Found" text on 2026.q3.2). Each render logs `Unable to get object entries for object definition <id>`, caused by `com.liferay.account.exception.NoSuchGroupException`, from `DefaultObjectEntryManagerImpl.getObjectEntries`. Check `GET .../asset-libraries/<space-erc>/connected-sites` before suspecting permissions: an admin seeing nothing is not a permission problem.
- **`searchable` accepts `true` or `"true"`** and reads back as a boolean.
- **Deleting the Site deletes the connection.** A reprovision (delete the site, redeploy the initializer) therefore leaves the Space unconnected: repeat the PUT after every reprovision.
- **A Site can be connected to several Spaces.** A Space connected to several Sites was not tested.

### 3. Create the Content Structure

The same `POST /o/object-admin/v1.0/object-definitions` as any object, with `"scope": "depot"`, the CMS object folder, the Space it accepts, and the fields inline:

```json
{
	"enableComments": true,
	"enableFriendlyURLCustomization": true,
	"enableIndexSearch": true,
	"enableLocalization": true,
	"enableObjectEntryDraft": true,
	"enableObjectEntryHistory": true,
	"enableObjectEntrySchedule": true,
	"enableObjectEntryVersioning": true,
	"externalReferenceCode": "<STRUCTURE_ERC>",
	"label": {"en_US": "<Label>"},
	"name": "<Name>",
	"objectDefinitionSettings": [
		{"name": "acceptedGroupExternalReferenceCodes", "value": "<space-erc>"}
	],
	"objectFields": [
		{"DBType": "String", "businessType": "Text", "externalReferenceCode": "<STRUCTURE_ERC>_TITLE", "indexed": true, "label": {"en_US": "Title"}, "localized": true, "name": "title", "required": true, "system": true},
		{"DBType": "Clob", "businessType": "RichText", "externalReferenceCode": "<STRUCTURE_ERC>_SUMMARY", "indexed": true, "label": {"en_US": "Summary"}, "localized": true, "name": "summary", "required": false}
	],
	"objectFolderExternalReferenceCode": "L_CMS_CONTENT_STRUCTURES",
	"pluralLabel": {"en_US": "<Plural Label>"},
	"scope": "depot",
	"status": {"code": 0},
	"titleObjectFieldName": "title"
}
```

- **`status: {"code": 0}` in the body publishes it at once** (`approved`, no publish call).
- **`restContextPath` is `/o/c/<name lowercased + "es">`** (`ZzTestNews` → `/o/c/zztestnewses`). Read it from the response rather than guessing.
- **Name the display-title field literally `title`**, and point `titleObjectFieldName` at it. With any other name, the CMS content browser shows every entry as "Untitled Asset", although the entry, its GET, and its friendly URL are correct (verified 2026.q3.2). `title` is not a reserved name; `system: false` is also accepted.
- **A `system: true` field must carry `DBType`.** The type is not derived from `businessType` for a system field: omitting it fails the whole create with a bare `500` and `NullPointerException ... DynamicObjectDefinitionTableUtil.getSQLType(String) is null` in the log only, and nothing is left behind. Send `DBType` on every field (`String` for `Text`, `Picklist` and `MultiselectPicklist`; `Clob` for `LongText` and `RichText`; `Boolean`), which also covers `indexedLanguageId` (`manage-objects`). Verified on 2026.q3.6.
- **Give every field its own ERC**, so a repeated batch or scripted write can upsert it (`manage-objects`).

#### Custom File Types (Verified on 2026.q3.5)

A file type is a structure in **`L_CMS_FILE_TYPES`** instead of `L_CMS_CONTENT_STRUCTURES`, with a required `file` Attachment field. Model it on the OOTB `CMSBasicDocument` (export it from the Objects admin), with these differences:

- **Drop the `visible` setting.** `visible` is allowed only on modifiable *system* definitions. On a custom one the create fails with `400 ObjectDefinitionSettingNameException.NotAllowedNames "The settings visible are not allowed"` (`ObjectDefinitionLocalServiceImpl:3997–4006`). `domain: space` and `acceptAllGroups: true` are accepted.
- **Leave `title` and `file` as custom fields** (no `system`) with ERCs of your own. `file`: `Attachment`, `required: true`, settings `acceptedFileExtensions: *`, `maximumFileSize: 100`, `fileSource: userComputerToCMSBasicDocument`, `showFilesInLibrary: false`.
- **The CMS offers it** in the Files section's creation menu and in its Type filter, for every Space it accepts, when it is non-system, `active`, `enableObjectEntryDraft`, `scope: depot`, approved and in `L_CMS_FILE_TYPES`. That is `ActionUtil.getFilesCustomDropdownItems` over the finder `C_OFI_A_E_S_S`.
- **Both creation paths work:** `POST /o/object-admin/v1.0/object-definitions` with `status: {"code": 0}`, or a site initializer's `object-definitions/` (no `status`; `publishObjectDefinitions` publishes it, and a re-run updates it in place).
- **Entries** go to `/o/c/<restContextPath>/scopes/<space>` like any structure, with `file: {"externalReferenceCode", "fileBase64", "name"}`. The file keeps the given ERC, and an entry without a folder lands in `L_FILES`.
- **An empty `Integer` field reads `0`, not `null`**, whether omitted or sent as `null`; the column stores `0`.
- **`enableObjectEntryHistory` is always `false` on create.** `ObjectDefinitionLocalServiceImpl.addCustomObjectDefinition` passes a literal `false` for it, whatever the body says, over `object-admin` and from a site initializer alike. An update honors the body, so the next initializer run (a PATCH) turns it on, and a fresh build then differs from a re-run. Write `false` in a definition file unless you also turn it on yourself afterwards. The OOTB file types have it on. Versioning, draft, schedule and comments are kept as sent. Verified on 2026.q3.5.

#### Which Spaces a Structure Accepts

| `objectDefinitionSettings` | Scoped entry write in an accepted Space | …in any other Space |
| --- | --- | --- |
| `acceptedGroupExternalReferenceCodes: <space-erc>[,…]` | `200` | `404` |
| `acceptAllGroups: true` | `200` | `200` |
| neither | `404` | `404` |

- **Only Asset Library ERCs are valid** in `acceptedGroupExternalReferenceCodes`. Adding a Site's ERC returns `400 "The value <groupId> of setting \"acceptedGroupIds\" is invalid for object definition …"`. This setting is **not** how content reaches a Site — `connected-sites` is (step 2).
- **Deleting the last accepted Space silently rewrites the setting to `acceptAllGroups: true`.** From then on the structure accepts entries in **any** Space, including ones never authorized. Deleting one of several accepted Spaces just shrinks the list. After deleting a Space, re-read and re-restrict every structure it accepted. Prefer an explicit `acceptedGroupExternalReferenceCodes` list over `acceptAllGroups` wherever the Spaces are known.

### 4. Create Folders

```bash
curl \
	--data '{
		"externalReferenceCode": "<folder-erc>",
		"parentObjectEntryFolderExternalReferenceCode": "L_CONTENTS",
		"title": "<Folder Title>"
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-object/v1.0/scopes/<space-siteId-or-erc>/object-entry-folders" \
	--user "test@liferay.com:test"
```

- **Parents.** Use `L_FILES` for the Files section, or another folder's ERC to nest.
- **Scope.** The scope segment takes the Space's `siteId` or its ERC. Its `id` returns `404`.
- **Reading one by ERC uses a singular path:** `GET /o/headless-object/v1.0/scopes/<scope>/object-entry-folder/by-external-reference-code/<erc>`. The plural `object-entry-folders/by-external-reference-code/<erc>` answers `404` for an existing folder, so an upsert built on it re-POSTs and gets `400 "This external reference code is already in use."` (verified on 2026.q3.6).
- **Counts.** Read them with `GET /o/headless-object/v1.0/object-entry-folders/<id>?nestedFields=numberOfObjectEntries,numberOfObjectEntryFolders`.
- **Permissions.** Folders carry their own permissions, which matter for Guest search (`rules/guest-access.md`).

### 5. Create and Update Entries — Always Scoped

| Call | Result |
| --- | --- |
| `GET` / `POST /o/c/<plural>` (unscoped collection) | `409 "Conflict with getObjectEntriesPage"` / `"Conflict with postObjectEntry"` |
| `GET` / `POST /o/c/<plural>/scopes/<space-siteId-or-erc>` | `200` |
| `/o/c/<plural>/scopes/<space id>` (the `id`, not `siteId`) | `404` |
| `GET /o/c/<plural>/<entryId>` | `200` — reading by numeric id needs no scope |
| `GET /o/c/<plural>/by-external-reference-code/<erc>` | `409 "Conflict with getByExternalReferenceCode"` — scope it: `/scopes/<siteId>/by-external-reference-code/<erc>` |

Placement and files:

- **Folder:** set `objectEntryFolderId` or `objectEntryFolderExternalReferenceCode` (prefer the ERC, which is portable). Without either, the entry goes to `L_CONTENTS`.
- **Linking a Basic Document from a structure's Attachment field needs `fileSource: CMSBasicDocument`.** Write `{"<field>": {"externalReferenceCode": "<file ERC>", "scope": {"externalReferenceCode": "<space-erc>"}}}`. The field then reads back that file's `id` and ERC, shared with the Basic Document. With `userComputerToCMSBasicDocument` (what the OOTB `CMSBlog.coverImage` uses), the same body answers `200` but **copies** the file into a hidden repository of the entry: a new ERC, and repeated copies renamed `name (1).mp4`, `name (2).mp4`. Deleting or re-pointing the entry leaves those copies behind. `CMSBasicDocument` rejects `showFilesInLibrary` (`400 ObjectFieldSettingNameException.NotAllowedNames`); keep only `acceptedFileExtensions`, `fileSource` and `maximumFileSize`. A live field switches with `PUT /o/object-admin/v1.0/object-fields/{id}` and the full field body. Verified on 2026.q3.6.
- **A deleted entry goes to the Space's Recycle Bin and keeps its ERC.** A `PUT …/scopes/<space>/by-external-reference-code/<erc>` then answers a bare `404`, so a re-import fails. Either `PUT …/by-external-reference-code/<erc>/restore` (no body) and let the next PUT overwrite it, or `DELETE /o/c/<plural>/<id>` a **second** time, which purges it for good. Verified on 2026.q3.6.
- **Category ids come back as strings** from `headless-admin-taxonomy` (`"id": "43991"`), while an entry's `taxonomyCategoryIds` and `taxonomyCategoryBriefs[].taxonomyCategoryId` are numbers. Cast before comparing. A Space's vocabulary and categories upsert by ERC with `PUT /o/headless-admin-taxonomy/v1.0/asset-libraries/{space id}/taxonomy-vocabularies/by-external-reference-code/{erc}`, then `PUT /taxonomy-vocabularies/{id}/taxonomy-categories/by-external-reference-code/{erc}`; the structure needs `enableCategorization: true`.
- **Attachment by URL:** `"<field>": {"fileURL": "https://…", "name": "x.png"}` creates the file on the entry. It is **not** a Basic Document, even with `fileSource: "userComputerToCMSBasicDocument"`, and the `fileURL` read back is only the portal root; use `link.href`.

**Writing localized fields.** On a CMS structure, `PATCH` ignores the flat form of **every** localized field (`{"title": …}`, `{"summary": …}`): it returns `200` and writes nothing. Always `PATCH` `<field>_i18n`. `POST` and `PUT` accept the flat form. Two more differences:

- `PATCH` does **not** re-derive `friendlyUrlPath`; `PUT` does.
- `PUT` is a full replacement: it clears omitted fields and moves the entry back to the root folder when no folder is given.

**Comparing before a re-write.** Every PUT adds a version, so an import script compares the stored entry with what it would send first, and two read-back shapes make a naive comparison report every entry as changed:

- **A `RichText` field stores newlines as spaces.** `<p>a</p>\n<ul>` reads back as `<p>a</p> <ul>`. Send HTML with newlines already replaced by spaces, or normalize both sides.
- **A `MultiselectPicklist` is written as a list of keys and read back as a list of objects.** `["solar", "pulse"]` reads back as `[{"key": "solar", "name": "Solar Energy"}, …]`. Compare the sorted keys. A single `Picklist` reads back as one `{key, name}`.

Verified on 2026.q3.2 (2026-10-05): with both fixes, a second run of a 28-entry import wrote nothing.

### 6. Basic Documents (Files)

```bash
curl \
	--data '{
		"externalReferenceCode": "<doc-erc>",
		"file": {"fileURL": "https://…/image.jpg", "name": "image.jpg"},
		"title": "<Title>"
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/cms/basic-documents/scopes/<space-siteId>" \
	--user "test@liferay.com:test"
```

- **`file` is the only required field.** `{}` returns `400 "No value was provided for required object field \"file\""`. The document lands in `L_FILES`.
- **Moving.** `POST /o/cms/basic-documents/<id>/by-object-entry-folder-id/<folderId>/move` takes no body.
- **Actions.** Basic Documents and user-authored structures expose the same HATEOAS set: `get`, `update`, `replace`, `delete`, `move`, `move-replace`, `copy`, `copy-replace`, `duplicate`, `versions`, `expire`, `permissions`, `share`, `get-by-scope`. Only `move` was exercised.
- **Guest downloads.** A Guest also needs `DOWNLOAD_FILE` to get a usable `file.link.href` (`rules/guest-access.md`).
- **The file can carry a chosen ERC:** `"file": {"externalReferenceCode": "<file-erc>", "fileBase64": …, "name": …}` gives the file's `DLFileEntry` that ERC, in the Space's group. It sits in a hidden repository of the structure's portlet. An object field with `fileSource: CMSBasicDocument` can then link it by that ERC (`manage-objects`). Verified on 2026.q3.5.
- **An identical re-PUT adds a version** of the entry (`objectentry.version` 1 → 2, a second `objectentryversion`), though the file is untouched. Compare before you write.
- **An entry's `file.size` is a display string** (`"588 KB"`), not bytes. To compare a stored file, read `GET /o/headless-delivery/v1.0/documents/{file.id}?nestedFields=contentValue` as an administrator: it serves the file in the structure's hidden repository too, with `sizeInBytes` and the base64 content. `file.mimeType` can differ from the uploaded type (a `.srt` sent as `text/plain` is stored as `application/x-subrip`), so do not compare it. Verified on 2026.q3.5.
- **Unknown properties are dropped silently.** For example, a `description` on an External Video, which has only `title` and `videoURL`, answers `200` and reads back `null`. Verify a written field by reading it back.

#### Permissions on Entries, Folders and Files (Verified on 2026.q3.5)

- **The defaults are open to every signed-in user.** A new entry and folder in a Space grant **`User` VIEW**, besides Owner, Asset Library Administrator, Content Reviewer, Member, and a "CMS Administrator" role. To restrict an audience, replace the grants (`GET`, then `PUT` the full list) **without `User`**. Entries: `PUT /o/cms/basic-documents/{id}/permissions`, or `/o/c/<plural>/{id}/permissions`. Folders: `PUT /o/headless-object/v1.0/object-entry-folders/{id}/permissions`.
- **For the members of the Sites the Space is connected to**, grant the depot role **Asset Library Connected Site Member** (`L_ASSET_LIBRARY_CONNECTED_SITE_MEMBER`, `roleType: depot`): VIEW on the folder, and VIEW + `DOWNLOAD_FILE` on the entry. Users who belong to the Site only through a user group get it too (`DepotRoleContributor`; `UserBagFactoryUtil` counts inherited groups). Non-members then get `404`.
- **Access to the file follows the entry, not the `DLFileEntry`.** The file's own D&M rows (Guest and User with VIEW + DOWNLOAD) stay as they are and do not decide: `ObjectDLFileEntryModelResourcePermissionConfigurator` delegates `DOWNLOAD` to the entry. With the entry restricted, a non-member gets `401` on every `/documents/…` URL and `404` from `headless-delivery /documents/{id}`.
- **A signed-in user also holds Guest's permissions**, so a Guest grant on an entry opens it to every user as well.
- **Guest** with VIEW + `DOWNLOAD_FILE` can `GET /o/cms/basic-documents/{id}` and download. The by-ERC GET, the scoped list and the folder answer `403` with an empty body, which is the Service Access Policy (`rules/guest-access.md`).
- **Guest needs no VIEW on the entry's folder** to read the entry by id and download its file: verified on 2026.q3.5 with 8 entries whose folders grant only Asset Library Connected Site Member.
- **The Space's root folders `L_CONTENTS` and `L_FILES` keep their default `User` VIEW** (+ `SUBSCRIBE`). Restricting the folders you create leaves them open, so every signed-in user can open the empty root. They are portal-made: decide on purpose whether to restrict them too.
- **External Video has no `DOWNLOAD_FILE` action**, because it has no Attachment field (`resourceaction`: VIEW, UPDATE, DELETE, PERMISSIONS, history and discussion only). A Basic Document's grant copied onto a video must drop it. The download action of a file type is `DOWNLOAD_` plus its Attachment field's name (`ObjectFieldImpl.getAttachmentDownloadActionKey`).

#### Scripting a Bulk Upload (Verified on 2026.q3.5)

- **Sign in once instead of sending Basic auth.** Basic auth checks the password on every request, about 1.4 s each, against 5 ms for a signed-in session. Several hundred calls (compare, write, read back, and grant, per item) take minutes instead of seconds. Sign in with `POST /c/portal/login` (`login`, `password`, `p_auth` from the page's `authToken`), re-read the token, and send it as `x-csrf-token`. Note that each sign-in updates the user's `logindate`.
- **Dozens of PDFs at once can get the container OOM-killed.** Each PDF uploaded queues a PDF preview (`PDFPreviewableDLProcessor`, PDFBox). Uploading 33 PDFs into a portal whose Docker VM was shared with three other portals ended in an OOM kill (`docker inspect` → `OOMKilled=true`, exit 0, no restart). Nothing was lost, and a re-run of the compare-first script finished the upload. Check `docker stats` before a large upload.

## Rendering a Space's Content From a Site Initializer (Verified on 2026.q3.6)

What a site initializer's page definitions need to show CMS entries. Migrating Liferay's Masterclass initializer from Journal to a Space produced the same rendered pages as the Journal site, field for field:

- **Collections.** A `Collection` with `collectionConfig: {"collectionReference": {"className": "[$OBJECT_DEFINITION_CLASS_NAME:<Structure>$]"}, "collectionType": "CollectionProvider"}` lists the Space's entries once the Space is connected to the site (step 2). The token resolves for a structure created outside the tree.
- **Text fields** map as `ObjectField_<name>`, in a `CollectionItem` and on a display page.
- **An Attachment field has no portable mapping key.** The plain `ObjectField_<name>` renders the file's **numeric id** (`<img src="44583">`). The usable values are `ObjectField_<objectFieldId>#previewURL` (an image, for an image editable) and `#downloadURL` / `#fileURL` (a URL, for a link or an HTML editable). `<objectFieldId>` is the field's numeric id (`ObjectEntryInfoItemFormProviderUtil` concatenates `getObjectFieldId()`), and no site initializer token resolves it. Generate these keys from the target environment after the structures exist, and say that the tree is environment-specific.
- **A fixed image taken from a Space file** imports from `fragmentImageClassPKReference` with `className: com.liferay.portal.kernel.repository.model.FileEntry` and the Basic Document's numeric `file.id` as `classPK`: also environment-specific. A mapping whose `itemReference` names the Basic Document by `className` (`[$OBJECT_DEFINITION_CLASS_NAME:CMSBasicDocument$]`) and `fields: [{"fieldName": "externalReferenceCode", …}]` imports without error and renders the editable's placeholder.
- **A vocabulary of the Space** maps by its name (`"fieldKey": "<vocabulary name>"`) in a `CollectionItem`, but on a display page the same key renders the placeholder. Map `AssetCategory_categories` (every category of the entry) there instead.
- **Display page URLs** are `/web/<site>/c_<structure name lowercased>/asset-library-<depotEntryId>/<friendlyUrlPath>`. A site initializer menu item of type `display-page` resolves only the tree's own Journal articles and documents, so it cannot point at a CMS entry.
- **Guest** gets empty collections, a `404` on the display page and a `404` on every file until it holds VIEW on the entries and VIEW + `DOWNLOAD_FILE` on the Basic Documents (see "Permissions on Entries, Folders and Files" above). An Attachment field's image or video is served under its Basic Document's permissions.
- **A Space's `friendlyURL` still cannot be set over REST on 2026.q3.6** (`PATCH` → `500`, as on q3.5), so `/documents/d/<space>/…` URLs keep the generated `asset-library-<id>` segment and are no portable alternative.

## Browsing and Searching Content

The CMS content browser uses the generic `GET /o/search/v1.0/search`, not a CMS endpoint. **A filter-only query needs `emptySearch=true`** — without it, `totalCount` is `0` under Basic auth and session alike:

```text
filter=cmsRoot eq true and cmsSection eq 'contents' and groupIds/any(g:g in (<siteId>)) and status in (0,2,3,1,7)
filter=folderId eq <folderId> and status in (0,2,3,1,7)
emptySearch=true
nestedFields=embedded,systemProperties.objectDefinitionBrief,file.previewURL,file.thumbnailURL,numberOfObjectEntries,numberOfObjectEntryFolders
```

Each item carries `entryClassName` (the structure's suffixed class name), and `embedded.systemProperties.scope` = `{"externalReferenceCode": "<space-erc>", "type": "AssetLibrary"}`. Folders come back with `entryClassName: com.liferay.object.model.ObjectEntryFolder`.

`GET /o/cms/bulk-action-tasks/` lists the CMS background jobs (bulk move, copy, delete). The body that creates one is unverified.

## Batch CET Path (Verified on 2026.q3.1)

To make a whole Space reproducible, use one `batch` CET (`manage-objects` → "Initialize in Bulk via a Batch Client Extension" for the project layout, the top-level `assemble`, and the entry file shape). CMS specifics, in file order:

```text
00-00-space.batch-engine-data.json        className com.liferay.headless.asset.library.dto.v1_0.AssetLibrary — {name, type: "Space"} is enough
00-NN-picklist-<name>.batch-engine-data.json   className com.liferay.headless.admin.list.type.dto.v1_0.ListTypeDefinition
01-00-folders.batch-engine-data.json      className com.liferay.headless.object.dto.v1_0.ObjectEntryFolder — parameters.scopeKey = <space-erc>
02-NN-struct-<name>.batch-engine-data.json     className com.liferay.object.admin.rest.dto.v1_0.ObjectDefinition — as in step 3
03-NN-entries-<name>.batch-engine-data.json    className com.liferay.object.rest.dto.v1_0.ObjectEntry — parameters.scopeKey = <space-erc>
```

- **Folders and entries need `scopeKey`** (the Space's ERC) in `parameters`. Without it: `"No scope key was provided for the ... entry"`.
- **Entries.** Place them by `objectEntryFolderExternalReferenceCode`, and put custom fields under `properties`.
- **Scopes.** The OAuth companion needs `Liferay.Headless.Batch.Engine.everything`, `Liferay.Object.Admin.REST.everything` and `Liferay.Headless.Object.everything`, plus `Liferay.Headless.Admin.List.Type.everything` if a field is a picklist.
- **One file failing stops every later file.** Check for one `Successfully deployed batch engine file` log line per file, then re-read the records. Redeploying twice with no `Duplicate name` proves the field ERCs are in place.
- **The connection to a Site is not in the batch.** Do step 2 after deploying.

## Deleting

- **Deleting a Space** (`DELETE .../asset-libraries/<space-erc>` → `204`) removes its entries, Basic Documents, folders, and Site connections, but **not** its structures, which are company-scoped definitions. Delete them explicitly, and re-check the `acceptAllGroups` rewrite above for any you keep.
- **On the HSQLDB development database, deleting a CMS structure can hang forever** (2026.q3.2, twice). The chain is `ObjectDefinitionModelListener.onBeforeRemove` (in `com.liferay.site.cms.site.initializer`) → `PortalImpl.getClassNameId` → `ClassNameLocalServiceImpl.addClassName`. It needs a Tomcat restart, and leaves the definition half-deleted: every read then returns `400 "Someone may be trying to circumvent the permission checker…"`. Avoid deleting CMS structures on HSQLDB. Behavior on a production database was not tested.

## Not Verified

- The Control Panel path and label of the CMS app.
- One Space connected to several Sites.
- Request bodies for `copy`, `duplicate`, `expire`, `versions` and bulk tasks.
- Whether a Data Set or Form Container targets a CMS structure exactly like a plain object. It should, since it is one, but this was not exercised.

## Success Signal

- The Space exists, with its `siteId` recorded.
- Every structure is `approved` and accepts exactly the intended Spaces.
- Entries and folders read back in the right place.
- `connected-sites` lists every Site that renders the content.
- A page bound to a structure shows its entries to an admin, and to the intended audience once permissions are granted (`manage-roles-permissions`).

## More Verified Facts (2026.q3.10, 2026-11-20)

### Space Roles and Membership

- **Space roles** (`GET /o/headless-asset-library/v1.0/asset-libraries/{erc}/roles`, roleType 5) are labeled "Space …" in the UI and named *Asset Library …* in the API, with ERCs `L_ASSET_LIBRARY_*`: Administrator, Member (implicit for every member), Content Reviewer, Connected Site Member, Owner. The admin who creates a Space becomes its Owner.
- **Add a user group:** `PUT /asset-libraries/{erc}/user-groups/{userGroupErc}` (no body). **Add a user:** `PUT /asset-libraries/{erc}/user-accounts/{userErc}` (no body).
- **Give a member a Space role:** `PUT /asset-libraries/{erc}/user-accounts/{userErc}/roles` with `[{"name": "Asset Library Administrator"}]`. Roles are matched by **`name`**: a body with only the role's ERC or id answers `404`.
- **Read back** with `?nestedFields=roles` on the members lists.
- **A Space connected to a Site is visible to every member of that Site** (they hold *Connected Site Member*): they can browse it and read its entries in CMS, but get no authoring actions. Don't connect a Space whose content the Site's members mustn't read.
- **Every signed-in user can list entries** of a Space through the API by default (`User` VIEW on entries). Restrict it per structure if needed.

### Fields

- **A `DateTime` field needs the setting `timeStorage`** (`convertToUTC` or `useInputAsEntered`), or the create fails with `400 ObjectFieldSettingValueException.MissingRequiredValues`.
- **DateTime values need a zone on write:** `2027-05-06T09:00:00Z`. Without it: `500 DateTimeParseException`. They read back as `2027-05-06T09:00:00.000`.

### Vocabularies Limited to a Structure

`assetTypes[].type` in a vocabulary body must be the structure's **label** (e.g. `"FAQ"`, `"Job Listing"`), plus `subtype: "AllAssetSubtypes"`. A className (`com.liferay.object.model.ObjectDefinition#C4G9`) or a numeric type id is silently stored as *All Asset Types* (`TaxonomyVocabularyResourceImpl._getClassNameId` matches on the model resource label). Each new Space also gets *Topic*, *Audience* and *Stage* vocabularies automatically.

### Categories on Entries

Write `taxonomyCategoryIds` (numbers). It reads back **`null`**: compare `taxonomyCategoryBriefs[].taxonomyCategoryId` instead, or every re-run rewrites the entry and adds a version.

### Files

`PUT /o/cms/basic-documents/scopes/{spaceErc}/by-external-reference-code/{fileErc}` with `{"file": {"externalReferenceCode", "fileBase64", "name"}, "objectEntryFolderExternalReferenceCode", "title"}` upserts a Basic Document into a Files folder.

### Guest Access

Published CMS content is **not** readable by Guest by default: `/o/c/<plural>/{id}` answers `404` and the scoped list `403` (Service Access Policy) for Guest. Pages that show CMS content (display pages, Collection Displays) render it server-side and need Guest **VIEW** on the entries, and **DOWNLOAD_FILE** on the files they link (`rules/guest-access.md`). Grant them per structure when the content is public.

### Granting Guest Access to Entries and Files (Verified 2026.q3.10)

- Per entry: `GET {restContextPath}/{id}/permissions`, then `PUT` the full list back with every other role row unchanged (`actionIds`, `roleExternalReferenceCode`, `roleName`) plus `{"actionIds": ["VIEW"], "roleExternalReferenceCode": "L_GUEST", "roleName": "Guest"}`. File entries (`/o/cms/basic-documents/{id}`, custom file types) take `["VIEW", "DOWNLOAD_FILE"]`. The GET omits `roleType`; the PUT doesn't need it. Grant only approved entries.
- With that, the default Service Access Policy already admits Guest **get-by-id** (`GET /o/c/<plural>/{id}` → `200`) and the file download (`link.href`, `/documents/<groupId>/<folderId>/<name>/<uuid>`, `/documents/d/asset-library-<depot id>/<friendly name>`). Scoped lists, by-ERC reads, `/permissions` and folders stay `403` for Guest: leave them closed.
- **Server-side renders (Collection Display, display pages) need entry VIEW only**: no folder VIEW, no SAP change.
- **A file linked from a content field (`fileSource: CMSBasicDocument`, e.g. an Article's `image`) has an empty `link.href` for Guest**, because the content structure has no `DOWNLOAD_*` action. Link the **Basic Document's** own URL (or `/documents/…`) on public pages, not the field's structure-param URL, which answers `404` for Guest.

### Batch Import Into a Space

CMS structures have no `/batch` of their own. Use the batch engine: `POST /o/headless-batch-engine/v1.0/import-task/com.liferay.object.rest.dto.v1_0.ObjectEntry?taskItemDelegateName=C_<ObjectName>&scopeKey=<space erc>` with a JSON array of items `{"externalReferenceCode", "objectEntryFolderExternalReferenceCode", "taxonomyCategoryIds", "properties": {…fields…}}`, then poll `GET /o/headless-batch-engine/v1.0/import-task/{id}` until `executeStatus` is `COMPLETED` (`processedItemsCount`, `failedItems`). The task's `taskItemDelegateName` reads back `null`; that's harmless.

### Authoring Rights

Creating entries of a structure needs `ADD_OBJECT_ENTRY` on `com.liferay.object#<object definition id>` (plus `ADD_ENTRY` on the target folder). Give it to Space members through the Space roles (depot role permissions), not a regular role, so it applies in that Space only.

### Space Roles and Default Permissions (Verified on 2026.q3.10)

- **Grant a Space role permissions** (e.g. *Asset Library Member*) with `PATCH /o/headless-admin-user/v1.0/roles/{roleId}` and the **full** `rolePermissions` list (read it first; omitted rows are kept only if you send them back), at `scope: 3`. Resource names: `com.liferay.object#<object definition id>` for `ADD_OBJECT_ENTRY`; the definition's `className` (`com.liferay.object.model.ObjectDefinition#XXXX`) for `VIEW`/`UPDATE`/`DELETE` on entries; `com.liferay.object.model.ObjectEntryFolder` for `ADD_ENTRY` on folders.
- **Each Space has CMS default permissions** that new entries receive: `GET`/`PUT /o/cms/default-permissions` (one `L_CMS_DEFAULT_PERMISSION` entry per Space). **By default they give the entry's Owner `DELETE`, and Members no `UPDATE`.** So "only administrators delete" needs DELETE removed from Owner (and Content Reviewer) there too, or the creator can delete their own entry.
- **Folders:** `scopes/{space}/object-entry-folders?filter=parentObjectEntryFolderId eq …` answers `400 InvalidFilterException`; filter the list on the client (items carry `parentObjectEntryFolderId`).
- The *Topic*, *Audience* and *Stage* vocabularies a Space lists belong to the Global group (they're shared), not to the Space.
- **New entries get only signed-in VIEW by default.** For a public Space, add Guest `VIEW` (and `DOWNLOAD_FILE` for files) to the Space's `/o/cms/default-permissions` entry too, or every entry created later (and approved through workflow) stays invisible to visitors until someone grants it by hand.

### Built-in Blog Structure (Verified on 2026.q3.10)

Liferay CMS's Blog: name `CMSBlog`, ERC `L_CMS_BLOG`, REST `/o/cms/blogs` (scoped to a Space like any structure). Fields: `title`, `subtitle`, `content` (RichText), `coverImage` (Attachment, `fileSource: userComputerToCMSBasicDocument`, so linking a Space file **copies** it into the entry). A vocabulary limited to it uses `assetTypes[].type: "Blog"`. Its display page URL is `/web/<site>/cmsblog/asset-library-<depot id>/<slug>` (no `c_` prefix for this system structure).
- **The default-permissions body:** `PATCH /o/cms/default-permissions/{id}` with `defaultPermissions` as a **JSON string** keyed `OBJECT_ENTRY_FOLDERS`, `L_CONTENTS` and `L_FILES`, each mapping role names to action lists (e.g. Guest `["VIEW"]` under `L_CONTENTS`, `["VIEW", "DOWNLOAD_FILE"]` under `L_FILES`). **Each existing folder keeps its own copy** of the Space defaults, taken when it was created: update the folders' entries too, or entries created in existing folders miss the change.
- **The CMS OpenAPI is per structure:** `/o/cms/<plural>/openapi.json` (e.g. `/o/cms/blogs/openapi.json`); `/o/cms/openapi.json` is `404`.
- **Re-importing entries under workflow** sends them back to *pending* and adds a version each time: compare before writing.
