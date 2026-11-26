"""Level 11.3: the "Future Events" search element and the "Future Events" blueprint, a collection
provider for Event Information entries that keeps only events starting after now, sorted by start
date ascending.

Event Information's fields are indexed inside nestedFieldArray (startDateTime -> value_date,
yyyyMMddHHmmss), so the filter and the sort are nested queries (manage-search). Re-runnable.

On an instance without Search Blueprints (the DXP Free Tier key), it does nothing: run
scripts/free_key_search.py for the free-key path.

Usage: python3 -I scripts/setup_future_events.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay, has_blueprints, q

API = "/o/search-experiences-rest/v1.0"
ELEMENT_ERC = "FUTURE_EVENTS"
BLUEPRINT_ERC = "FUTURE_EVENTS"
STRUCTURE_ERC = "EVENT_INFORMATION_STRUCTURE"

ELEMENT_DEFINITION = {
	"category": "filter",
	"configuration": {
		"queryConfiguration": {
			"queryEntries": [
				{
					"clauses": [
						{
							"context": "query",
							"occur": "filter",
							"query": {
								"term": {"objectDefinitionExternalReferenceCode": STRUCTURE_ERC.lower()}
							},
						},
						{
							"context": "query",
							"occur": "filter",
							"query": {
								"nested": {
									"path": "nestedFieldArray",
									"query": {
										"bool": {
											"must": [
												{"term": {"nestedFieldArray.fieldName": "startDateTime"}},
												{
													"range": {
														"nestedFieldArray.value_date": {
															"gt": "${time.current_date|date_format=yyyyMMddHHmmss}"
														}
													}
												},
											]
										}
									},
								}
							},
						},
					]
				}
			]
		}
	},
	"icon": "filter",
}


def main():
	lr = Liferay()

	if not has_blueprints(lr):
		print("No Search Blueprints on this instance (the DXP Free Tier key doesn't include them): "
			"skipped. scripts/free_key_search.py sets up the free-key path of Level 11.3 instead.")

		return

	element = {
		"description_i18n": {"en_US": "Only Event Information entries whose start date and time is after now."},
		"elementDefinition": ELEMENT_DEFINITION,
		"title_i18n": {"en_US": "Future Events"},
		"type": 0,
	}

	status, body = lr.request("POST", f"{API}/sxp-elements/validate", element, raise_errors=False)
	print("validate element:", status)

	if status >= 300:
		raise SystemExit(json.dumps(body)[:1000])

	saved_element = lr.put(
		f"{API}/sxp-elements/by-external-reference-code/{q(ELEMENT_ERC)}",
		dict(element, externalReferenceCode=ELEMENT_ERC))
	print("element:", saved_element["id"], saved_element["title"])

	class_name = next(
		d["className"] for d in lr.items("/o/object-admin/v1.0/object-definitions")
		if d["externalReferenceCode"] == STRUCTURE_ERC)

	blueprint = {
		"configuration": {
			"generalConfiguration": {
				"clauseContributorsIncludes": ["*"],
				"collectionProvider": True,
				"collectionProviderType": class_name,
				"emptySearchEnabled": True,
				"searchableAssetTypes": [class_name],
			},
			"queryConfiguration": {"applyIndexerClauses": True},
			"sortConfiguration": {
				"sorts": [
					{
						"nestedFieldArray.value_date": {
							"nested": {
								"nested_filter": {"term": {"nestedFieldArray.fieldName": "startDateTime"}},
								"nested_path": "nestedFieldArray",
							},
							"order": "asc",
						}
					}
				]
			},
		},
		"description_i18n": {"en_US": "Upcoming Event Information entries, soonest first."},
		"elementInstances": [
			{
				"sxpElement": {
					"elementDefinition": saved_element["elementDefinition"],
					"externalReferenceCode": ELEMENT_ERC,
					"title_i18n": saved_element["title_i18n"],
					"type": 0,
				},
				"sxpElementId": saved_element["id"],
				"type": 0,
				"uiConfigurationValues": {},
			}
		],
		"externalReferenceCode": BLUEPRINT_ERC,
		"title_i18n": {"en_US": "Future Events"},
	}

	status, body = lr.request("POST", f"{API}/sxp-blueprints/validate", blueprint, raise_errors=False)
	print("validate blueprint:", status)

	if status >= 300:
		raise SystemExit(json.dumps(body)[:1000])

	status, preview = lr.request("POST", f"{API}/search?pageSize=20", blueprint, raise_errors=False)
	print("preview:", status)

	if status != 200:
		raise SystemExit(json.dumps(preview)[:1500])

	for hit in preview["searchHits"]["hits"]:
		fields = hit["documentFields"]
		start = [
			row.get("value_date") for row in fields["nestedFieldArray"]["values"]
			if row.get("fieldName") == ["startDateTime"]]
		print("  ", fields["assetTitle"]["values"], start)

	saved = lr.put(f"{API}/sxp-blueprints/by-external-reference-code/{q(BLUEPRINT_ERC)}", blueprint)
	print("blueprint:", saved["id"], saved["title"], class_name)


if __name__ == "__main__":
	main()
