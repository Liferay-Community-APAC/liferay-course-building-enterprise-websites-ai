"""Level 8.1: the Clarity Eyewear catalog, the Frame Description specification group and its
three specifications. Every write is an upsert by ERC/key (commerce-catalogs), so it re-runs.

Usage: python3 -I scripts/setup_catalog.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay

API = "/o/headless-commerce-admin-catalog/v1.0"

CATALOG = {
	"currencyCode": "USD",
	"defaultLanguageId": "en_US",
	"externalReferenceCode": "clarity-eyewear",
	"name": "Clarity Eyewear",
}

GROUP = {
	"description": {"en_US": "How a frame is built: its material, color and size."},
	"externalReferenceCode": "frame-description",
	"key": "frame-description",
	"priority": 10,
	"title": {"en_US": "Frame Description"},
}

SPECIFICATIONS = [
	{"key": "frame-material", "title": "Frame Material", "facetable": True, "priority": 10,
	 "description": "What the frame is made of, such as metal, acetate or titanium."},
	{"key": "frame-color", "title": "Frame Color", "facetable": True, "priority": 20,
	 "description": "The frame's main color or finish."},
	{"key": "frame-size", "title": "Frame Size", "facetable": False, "priority": 30,
	 "description": "Lens width and bridge width in millimeters, for example 54-20."},
]


def main():
	lr = Liferay()

	catalog = lr.put(f"{API}/catalog/by-externalReferenceCode/{CATALOG['externalReferenceCode']}", CATALOG)
	group = lr.put(f"{API}/optionCategories/by-externalReferenceCode/{GROUP['externalReferenceCode']}", GROUP)

	for spec in SPECIFICATIONS:
		lr.put(
			f"{API}/specifications/by-external-reference-code/{spec['key']}",
			{
				"description": {"en_US": spec["description"]},
				"externalReferenceCode": spec["key"],
				"facetable": spec["facetable"],
				"key": spec["key"],
				"optionCategory": {
					"externalReferenceCode": group["externalReferenceCode"], "id": group["id"], "key": group["key"]},
				"priority": spec["priority"],
				"title": {"en_US": spec["title"]},
				"visible": True,
			})

	# Read back --------------------------------------------------------------------------------
	catalog = lr.get(f"{API}/catalog/by-externalReferenceCode/{CATALOG['externalReferenceCode']}")
	print(f"Catalog {catalog['name']} (ERC {catalog['externalReferenceCode']}, id {catalog['id']}): "
		f"{catalog['currencyCode']}, {catalog['defaultLanguageId']}")
	group = lr.get(f"{API}/optionCategories/by-externalReferenceCode/{GROUP['externalReferenceCode']}")
	print(f"Specification group {group['title']['en_US']} (key {group['key']}, priority {group['priority']}, id {group['id']})")

	for spec in SPECIFICATIONS:
		s = lr.get(f"{API}/specifications/by-external-reference-code/{spec['key']}")
		print(f"  - {s['title']['en_US']} (key {s['key']}, facetable {s['facetable']}, group "
			f"{(s.get('optionCategory') or {}).get('key')}): {s['description']['en_US']}")


if __name__ == "__main__":
	main()
