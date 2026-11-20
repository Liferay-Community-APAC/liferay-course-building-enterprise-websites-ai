---

description: Build search pages with Liferay's search widgets (Search Bar, Search Results, Category Facet, Search Options, Blueprints Options), write facet widget templates, and create Search Blueprints and search elements over the search-experiences REST API, including blueprints used as collection providers on a page. Use when the user asks for a search page, facets, filtering or boosting results, a blueprint, or a list of items driven by a search query.
name: manage-search

---

# Manage Search

🆕 Written for the *Building Enterprise Websites with Liferay and AI* course. Verified live on DXP 2026.q3.10 (2026-11-20).

## Search Widgets in a Page Definition

Place them as `Widget` elements (`rules/site-initializer-format.md`). All widgets on a page share one search.

| Widget | `widgetName` | Useful `widgetConfig` |
| --- | --- | --- |
| Search Bar | `com_liferay_portal_search_web_search_bar_portlet_SearchBarPortlet` | `destination: ""` (search on this page), `searchScope: "this-site"` or `"everything"` |
| Search Results | `com_liferay_portal_search_web_search_results_portlet_SearchResultsPortlet` | — |
| Category Facet | `com_liferay_portal_search_web_category_facet_portlet_CategoryFacetPortlet` | `displayStyle: "ddmTemplate_<KEY>"`, `displayStyleGroupExternalReferenceCode: "<site erc>"`, `frequenciesVisible: "true"`, `maxTerms: "50"`, `groupVocabularyExternalReferenceCodes` (`"<groupERC>&&<vocabularyERC>"`, empty = all) |
| Search Options | `com_liferay_portal_search_web_search_options_portlet_SearchOptionsPortlet` | `allowEmptySearches: "true"` |
| Blueprints Options | `com_liferay_search_experiences_web_internal_blueprint_options_portlet_SXPBlueprintOptionsPortlet` | `sxpBlueprintExternalReferenceCode: "<blueprint ERC>"` (renders nothing for visitors) |

- A widget's minimum width (`fragmentStyle.minWidth: "500px"`) lands in `/o/layout-common-styles/main.css`, not in the page HTML.
- **Content of a Space connected to the site with `searchable: true` is found by a `this-site` search.** Nothing else is needed.
- **A Category Facet shows nothing to visitors** unless Guest has VIEW on the vocabularies and categories (`AssetCategoryPermissionChecker` drops the rest). Vocabularies created over headless are Owner-only: grant Guest VIEW through `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/{id}/permissions` and `/taxonomy-categories/{id}/permissions` (GET, merge, PUT).

### A Facet Template Grouped by Vocabulary

The default category facet display is a flat list. A widget template (`ddm-templates/<dir>/` in the site initializer, `className: com.liferay.portal.search.web.internal.category.facet.portlet.CategoryFacetPortlet`) can group: iterate `assetCategoriesSearchFacetDisplayContext.getVocabularyNames()` and `getBucketDisplayContexts(vocabularyName)`, and wire checkboxes with `Liferay.Search.FacetUtil`. The built-in *Vocabulary Layout* template in the Global site is a starting point.

## Search Blueprints and Elements

Base: `/o/search-experiences-rest/v1.0`.

| Task | Call |
| --- | --- |
| See indexed fields of real hits | `POST /search?query=<q>` (hits carry `documentFields`) |
| Field names | `GET /field-mapping-infos?external=false` (without `external=false`: `500`) |
| Validate a blueprint | `POST /sxp-blueprints/validate` |
| Upsert a blueprint | `PUT /sxp-blueprints/by-external-reference-code/{erc}` |
| Upsert an element | `PUT /sxp-elements/by-external-reference-code/{erc}` (validate it without its ERC: `/sxp-elements/validate` rejects an ERC already in use) |

- **Filter to one CMS structure** with the keyword field `objectDefinitionExternalReferenceCode`, whose indexed value is the structure ERC **lowercased** (e.g. `job_listing_structure`). `entryClassName` carries a random suffix: don't use it.
- **Embed OOTB elements by value** in `elementInstances`: `{"sxpElement": {elementDefinition, externalReferenceCode, title_i18n, …}, "sxpElementId": …, "type": 0, "uiConfigurationValues": {…}}`. Examples: `FILTER_BY_EXACT_TERMS_MATCH` `{field, values}`; `BOOST_ALL_KEYWORDS_MATCH` `{boost, fields: [{field: "localized_title", locale: "${context.language_id}", boost: 1}], keywords: "Associate", type: "best_fields"}`.
- `configuration.generalConfiguration`: `{"clauseContributorsIncludes": ["*"], "emptySearchEnabled": true, "searchableAssetTypes": []}`; `queryConfiguration.applyIndexerClauses: true`.
- **Dates in element JSON:** `${time.current_date|date_format=timestamp}` (the option is `date_format`; `dateFormat` is silently ignored). A range filter on a numeric date field: `{"range": {"<field>": {"gt": "${time.current_date|date_format=timestamp}"}}}`.

### A Blueprint as a Collection Provider

Turn it on in `generalConfiguration`: `"collectionProvider": true`, `"collectionProviderType": "<the item class, e.g. a CMS structure's className or com.liferay.calendar.model.CalendarBooking>"`, plus `searchableAssetTypes` with the same type. Bind a page's `Collection` element with `collectionConfig: {"collectionReference": {"className": "com.liferay.search.experiences.model.SXPBlueprint_[$COMPANY_ID$]_<BLUEPRINT ERC>"}, "collectionType": "CollectionProvider"}`; the token resolves inside the className. Sort with `configuration.sortConfiguration: {"sorts": [{"<field>": "asc"}]}`.

## Calendar

There's no headless API for calendar bookings on this release (only JSON web services, which this workspace doesn't use). The Calendar widget is `com_liferay_calendar_web_portlet_CalendarPortlet`, and the site calendar is created lazily on first view. For lists of dated items that an agent must create, prefer a CMS structure with a Date and Time field.

## CMS Date Fields in the Index (Verified on 2026.q3.10)

A CMS structure's fields are indexed inside **`nestedFieldArray`**, as rows such as `{"fieldName": "startDateTime", "value_date": "20261210100000"}`, not as top-level fields (`field-mapping-infos` doesn't list them by name). Query and sort them as nested:

- **Filter (future only):** `{"nested": {"path": "nestedFieldArray", "query": {"bool": {"must": [{"term": {"nestedFieldArray.fieldName": "startDateTime"}}, {"range": {"nestedFieldArray.value_date": {"gt": "${time.current_date|date_format=yyyyMMddHHmmss}"}}}]}}}}`, plus a term on `objectDefinitionExternalReferenceCode` (the structure ERC, lowercased).
- **Sort:** `{"nestedFieldArray.value_date": {"order": "asc", "nested": {"nested_path": "nestedFieldArray", "nested_filter": {"term": {"nestedFieldArray.fieldName": "startDateTime"}}}}}`. A plain sort on the field is an Elasticsearch error.
- For a CMS structure, `collectionProviderType` and `searchableAssetTypes` are the structure's className (`com.liferay.object.model.ObjectDefinition#XXXX`, read it live).
- **A blueprint collection with `displayAllItems: true` renders an empty container** (no log line). Leave `displayAllItems`/`showAllItems` out.

- **A boost is a `should` clause:** a "boost Associate" element also lifts Associate items in unrelated searches. Combine it with a filter when it should only reorder a known result set.
