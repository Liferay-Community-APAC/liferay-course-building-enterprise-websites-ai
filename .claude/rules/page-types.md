# Page Types

> **Before authoring:** Load `manage-pages` before authoring a page, and `scaffold-fragment` before authoring a fragment placed on one.

Reference for the `manage-pages` skill. Covers all page and template types available in Liferay DXP and which APIs handle each.

## Renderable Page Types

These types appear as pages that visitors can navigate to.

| Type | Key | Use Case | API |
| --- | --- | --- | --- |
| Content Page | `content` | Fragment based layout; the default for new pages | headless-admin-site: `POST /sites/{siteExternalReferenceCode}/site-pages` with `"type": "ContentPage"` |
| Widget Page | `portlet` | Legacy portlet layout; compatibility with old portlet apps | headless-admin-site: `POST /sites/{siteExternalReferenceCode}/site-pages` with `"type": "WidgetPage"` |
| Link to URL | `url` | Redirect node in the navigation hierarchy | headless-admin-site: `POST /sites/{siteExternalReferenceCode}/site-pages` with `"type": "LinkToURLPage"` |
| Embedded | `embedded` | Iframe pointing to an external URL | headless-admin-site: `POST /sites/{siteExternalReferenceCode}/site-pages` with `"type": "EmbeddedPage"` |
| Full Page Application | `full_page_application` | Single portlet occupying the entire page | headless-admin-site: `POST /sites/{siteExternalReferenceCode}/site-pages` (no distinct `type` enum value — verify; remaining enum values are `PageSetPage`, `LinkToPagePage`) |

> **Three distinct "type" vocabularies — do not mix them.** The `Key` column above is the internal layout-type key. The **`headless-admin-site` `SitePage.type` enum** is `ContentPage` / `WidgetPage` / `LinkToURLPage` / `EmbeddedPage` / `PageSetPage` / `LinkToPagePage` (shown in the API column). The **site-initializer `page.json` `type`** uses `Content` / `Portlet` / `URL` / `Embedded`. And **`headless-delivery`** uses a separate `pageType` field.

## Reusable Template Types

These are blueprints; they are not directly accessible as URLs.

| Type | Purpose | API |
| --- | --- | --- |
| Page Template | Reusable fragment layout for new pages | headless-admin-site: `POST /sites/{id}/page-templates` |
| Master Page Template | Persistent header/footer wrapping all assigned pages | headless-admin-site: `POST /sites/{id}/master-pages` |
| Display Page Template | Per entry landing page for a content type or object | headless-admin-site: `POST /sites/{id}/display-page-templates` |

## Content Page Structure

A Content Page `pageDefinition` is a tree of `pageElements`. Each element has a `type` and a `definition`.

| Element Type | Description |
| --- | --- |
| `Root` | Top level container; every page has exactly one |
| `Section` | Layout row, sets columns and spacing |
| `Row` | Grid row; `definition` carries `numberOfColumns`, `modulesPerRow`, `gutters`, `verticalAlignment` (+ optional `rowViewports` for responsive collapse) |
| `Column` | Column inside a `Row`; `definition.size` values sum to 12 (+ optional `columnViewports`, e.g. `size: 12` on `landscapeMobile` to stack) |
| `Fragment` | A deployed fragment, referenced by `fragment.key` (its directory name) + `fragment.siteKey` (`[$GROUP_KEY$]`); built in fragments use a combined `key` like `BASIC_COMPONENT-paragraph` with no `siteKey` |
| `Widget` | A portlet embedded in a Content Page |
| `Collection` | A server side collection display. `definition.collectionConfig` holds ONLY `collectionReference` + `collectionType`; for a Liferay Object set `collectionType` to `CollectionProvider` and `collectionReference.className` to `[$OBJECT_DEFINITION_CLASS_NAME:<Name>$]`. The display config — `numberOfItems`, `numberOfItemsPerPage`, `numberOfPages`, `numberOfColumns`, `displayAllItems`, `displayAllPages`, `showAllItems`, `paginationType`, `listStyle`, `listItemStyle` — are **siblings of `collectionConfig` at the `definition` level**, and the importer NPEs (silent template rollback) when they are missing. `gutters` is Row-only — invalid here (see `rules/site-initializer-format.md`) |
| `CollectionItem` | The per entry template nested inside a `Collection` (`definition.collectionItemConfig`). Its child `pageElements` are the fragments rendered once per record. Map a fragment field to an object field with `fragmentFields[].value.text.mapping.fieldKey = "ObjectField_<field>"` and `itemReference.contextSource = "CollectionItem"`. A link maps via `fragmentFields[].value.fragmentLink.value.href.mapping` with `fieldKey = "displayPageURL"` (**bare** — display page URL is not namespaced); content fields in CollectionItem mappings ARE namespaced by the item class simple name (e.g. `CPDefinition_name`) |

> **`ColumnDefinition` is NOT a valid element type — it aborts the whole import.** It is internal layout *export* vocabulary. The importer deserializes into `com.liferay.headless.delivery.dto.v1_0.PageElement$Type`, whose complete, source-verified enum (2026.q2.7) is: `Collection`, `CollectionItem`, `Column`, `DropZone`, `Form`, `FormRelationship`, `FormStep`, `FormStepContainer`, `Fragment`, `FragmentDropZone`, `Root`, `Row`, `Section`, `Widget`. Any other value throws Jackson `ValueInstantiationException: Invalid enum value` in `LayoutsImporterImpl._importPageElement`, which aborts the **entire site initialization** (the CET still logs STARTED, but the site is not built). Multi-column layout is `Section → Row → Column → (inner Section) → Fragment`.

Minimal `pageDefinition` for an empty content page:

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

## Display Page Template Binding

The content type determines which entity type the template renders. (On the current `headless-admin-site` API these values are carried inside a `contentTypeReference` object on the `DisplayPageTemplate` DTO rather than as flat `contentType`/`contentSubtype` fields — verify against the OpenAPI spec (the MCP operation schema from `mcp-server`, or `GET /o/headless-admin-site/v1.0/openapi.json`). The class name and subtype values below are unchanged.)

| Entity | `contentType` | `contentSubtype` |
| --- | --- | --- |
| Blog Post | `com.liferay.blogs.model.BlogsEntry` | (empty) |
| Web Content | `com.liferay.journal.model.JournalArticle` | content structure ERC |
| Document | `com.liferay.portal.kernel.repository.model.FileEntry` | (empty) |
| Liferay Object entry | the definition's **suffixed** class name, `com.liferay.object.model.ObjectDefinition#<code>`, as `contentTypeReference.className` | (none) — this is what the site-initializer importer produces and what renders entries (verified 2026.q3.2). `ObjectEntry` plus a `subTypeExternalReference` is stored verbatim by the API but was never shown to bind |

Only one display page template per `contentType` + `contentSubtype` combination can be marked default. The default template is used when a content item's URL is visited without an explicit template in the path.

Two scope facts (verified 2026.q2.7):

- **OOTB `AccountEntry` has no display page support** — only custom Objects (and the content types above) can back a DPT. Build an account landing page as a regular Content Page reading `/o/headless-admin-user` from fragment JS instead.
- **A company-scoped Object CAN back a site DPT.** The entry page renders for authenticated users holding VIEW; an unauthenticated visitor gets 404. Note `curl --user` against `/web/...` friendly URLs still renders as guest — verify DPT visibility in a real browser session, not curl.

### Object Display Page URL Scheme

An object entry's display page URL is `/web/<site-friendly-url>/<separator>/[asset-library-<groupId>/]<entryFriendlyUrl>`:

- `<separator>` comes from the object definition's `friendlyURLSeparator` — by default `c_<lowercased object name>` (`/web/<site>/c_<name>/<slug>`, verified 2026.q3.2); set to `l`, entries carry no friendly URL path and resolve as `/web/<site>/l/<entryId>`. Resolve it at runtime from `GET /o/object-admin/v1.0/object-definitions` rather than hardcoding — likewise the site path from `GET /o/headless-admin-site/v1.0/sites/{id}` (`friendlyUrlPath`).
- The `asset-library-…` segment appears only for **depot-scoped** entries, and it is the library group's **friendly URL** without its slash, `asset-library-<depotEntryId>` by default (the library's `id` in `headless-asset-library`, not its `siteId`, which is the group id). Verified on 2026.q3.5 with a CMS External Video: `/web/guest/cmsexternalvideo/asset-library-37161/<slug>` rendered and `asset-library-37162` (the group id) answered `404`. Once the library's friendly URL is pinned to another value, that value is the segment.
- Prefer the entry's friendly URL path (`entryFriendlyUrl`/`friendlyUrlPath`) and fall back to the numeric id only when it is empty — the id form works but is not SEO-stable.

### Rendering Related Child Entries on a DPT

A `Collection` element on a DPT can bind to the relationship-scoped provider, which auto-filters to the current entry (the DPT passes it as `relatedItem` — no manual filter). Set `collectionConfig.collectionReference.className` to the provider **key**:

```
com.liferay.object.internal.info.collection.provider.OneToManyObjectRelationshipRelatedInfoCollectionProvider_[$OBJECT_DEFINITION_CLASS_NAME:<ParentName>$]_<relationshipName>
```

- The middle segment is the PARENT object's className, which for a custom object is the **random** form `com.liferay.object.model.ObjectDefinition#<4charId>` — always use the `[$OBJECT_DEFINITION_CLASS_NAME:<Name>$]` token; a hardcoded `#XXXX` id breaks on the next install.
- `<relationshipName>` is the ObjectRelationship `name`, not its ERC. `collectionType` stays `"CollectionProvider"`.
- The provider auto-registers only when **neither side is an unmodifiable system object** — custom→custom works, custom→OOTB `User` gets no provider. However, mapping the FK scalar itself (`ObjectField_r_<rel>_<pk>`) renders the related entry's **title** server-side, including a `User`'s name.
- CollectionItem field-key prefixes: custom field → `ObjectField_<name>` (picklists render their label); built-in entry field → `ObjectEntry_<name>` (e.g. `ObjectEntry_createDate`).
- **Attachment-field DPT mappings are not portable.** A mapped `#downloadURL`/`#previewURL` of an Attachment field hardcodes the numeric `objectFieldId`, and no site-initializer token resolves it — the mapping must be re-pointed per instance after provisioning (or the field read client-side instead).

## Feature Flags for Page APIs

| Flag | Default | Unlocks |
| --- | --- | --- |
| `LPD-35443` | off | Public layout (page) REST API via headless-admin-site |
| `LPD-38869` | on | Private layout REST access |
| `LPD-39244` | off | Fragment and page composition REST API |
| `LPD-74328` | off | Page element / page-specification creation and update |

This table is the page-API subset; `rules/feature-flags-catalog.md` is canonical for each flag's default and status. Enable required flags via `feature-flags` skill before calling the page APIs.

## Navigation Menu Item Types

| `type` | What It Links To |
| --- | --- |
| `layout` | A page in the current site (by UUID or friendly URL) |
| `url` | An arbitrary absolute URL |
| `node` | A nonclickable label grouping child items |
| `asset-publisher` | Dynamic list from Asset Publisher portlet |

## References

- `skills/manage-pages/SKILL.md` — the primary consumer of this card.
- `rules/headless-apis.md` — headless-admin-site paths for these page types.
- `rules/feature-flags-catalog.md` — defaults for the page-API flags.
- `rules/site-initializer-format.md` — `page.json` and `page-definition.json` formats.
- Site building: `https://learn.liferay.com/w/dxp/sites`