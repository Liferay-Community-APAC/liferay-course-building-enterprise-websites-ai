"""Level 11.2: the "Boost Associate Job Listings" Search Blueprint.

1. Filters to Job Listing CMS entries (objectDefinitionExternalReferenceCode = the structure ERC,
   lowercased, as indexed: job_listing_structure).
2. Boosts results whose title matches all the keywords of "Associate".

Validates the blueprint (POST /sxp-blueprints/validate) and previews it (POST /search with the
blueprint as body) before upserting it by ERC. Re-runnable.

Usage: python3 -I scripts/setup_job_blueprint.py
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay, q

API = "/o/search-experiences-rest/v1.0"
ERC = "BOOST_ASSOCIATE_JOB_LISTINGS"
STRUCTURE_ERC = "JOB_LISTING_STRUCTURE"


def element(lr, erc, values):
	ootb = next(
		e for e in lr.items(f"{API}/sxp-elements") if e["externalReferenceCode"] == erc)

	return {
		"sxpElement": {
			"elementDefinition": ootb["elementDefinition"],
			"externalReferenceCode": ootb["externalReferenceCode"],
			"title_i18n": ootb["title_i18n"],
			"description_i18n": ootb.get("description_i18n", {}),
			"type": ootb["type"],
		},
		"sxpElementId": ootb["id"],
		"type": 0,
		"uiConfigurationValues": values,
	}


def wait_for_api(lr):
	# The Search Experiences API registers about 20 seconds after Tomcat's "Server startup":
	# right after a start it answers 404, so wait for it instead of failing.
	for _ in range(30):
		status, _body = lr.request("GET", f"{API}/sxp-elements?pageSize=1", raise_errors=False)
		if status == 200:
			return
		time.sleep(5)
	sys.exit(f"The Search Experiences API ({API}) still answers {status}. Check that Liferay is fully started; "
		"if it is, your DXP activation key may not include Search Experiences (Blueprints).")


def main():
	lr = Liferay()
	wait_for_api(lr)

	blueprint = {
		"configuration": {
			"generalConfiguration": {
				"clauseContributorsIncludes": ["*"],
				"emptySearchEnabled": True,
				"searchableAssetTypes": [],
			},
			"queryConfiguration": {"applyIndexerClauses": True},
		},
		"description_i18n": {"en_US": "Job Listing CMS entries only; titles matching all keywords of \"Associate\" first."},
		"elementInstances": [
			element(lr, "FILTER_BY_EXACT_TERMS_MATCH", {
				"field": "objectDefinitionExternalReferenceCode",
				"values": [STRUCTURE_ERC.lower()],
			}),
			element(lr, "BOOST_ALL_KEYWORDS_MATCH", {
				"boost": 100,
				"fields": [{"boost": 1, "field": "localized_title", "locale": "${context.language_id}"}],
				"keywords": "Associate",
				"type": "best_fields",
			}),
		],
		"externalReferenceCode": ERC,
		"title_i18n": {"en_US": "Boost Associate Job Listings"},
	}

	status, body = lr.request("POST", f"{API}/sxp-blueprints/validate", blueprint, raise_errors=False)
	print("validate:", status, json.dumps(body)[:300] if body else "")

	if status >= 300:
		raise SystemExit("Blueprint does not validate")

	status, preview = lr.request(
		"POST", f"{API}/search?query=Engineer&pageSize=20", blueprint, raise_errors=False)
	print("preview:", status)

	if status != 200:
		raise SystemExit(json.dumps(preview)[:1000])

	for hit in preview["searchHits"]["hits"]:
		fields = hit["documentFields"]
		print("  ", fields.get("objectDefinitionExternalReferenceCode", {}).get("values"), fields.get("assetTitle", {}).get("values"), round(hit.get("score", 0), 2))

	saved = lr.put(f"{API}/sxp-blueprints/by-external-reference-code/{q(ERC)}", blueprint)
	print("saved:", saved["id"], saved["externalReferenceCode"], saved["title"])


if __name__ == "__main__":
	main()
