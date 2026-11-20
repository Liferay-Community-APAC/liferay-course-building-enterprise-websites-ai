"""Level 6.3: the Marketing and HR Space vocabularies and categories, upserted by ERC.

- Marketing: "FAQ" (categories from context-source/content/faqs.json) limited to the FAQ structure,
  "Articles" (Innovation, Industry, Style) limited to the Article structure.
- HR: "Region", "Location", "Job Positions" from context-source/data/job-taxonomy.csv.
- Guest gets VIEW (and nothing else) on every vocabulary and category; the other role rows are kept.

Usage: python3 -I scripts/setup_vocabularies.py
"""

import csv
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

TAX = "/o/headless-admin-taxonomy/v1.0"


def erc_part(name):
	return re.sub(r"[^A-Z0-9]+", "_", name.upper()).strip("_")


def vocabularies():
	with open(os.path.join(ROOT, "context-source", "content", "faqs.json"), encoding="utf8") as f:
		faq_categories = []

		for faq in json.load(f):
			if faq["category"] not in faq_categories:
				faq_categories.append(faq["category"])

	result = [
		{"space": "space-marketing", "name": "FAQ", "assetType": "FAQ", "categories": faq_categories},
		{"space": "space-marketing", "name": "Articles", "assetType": "Article", "categories": ["Innovation", "Industry", "Style"]},
	]

	hr = {}

	with open(os.path.join(ROOT, "context-source", "data", "job-taxonomy.csv"), encoding="utf8") as f:
		for row in csv.DictReader(f):
			hr.setdefault(row["vocabulary"], []).append(row["category"])

	for name in ("Region", "Location", "Job Positions"):
		result.append({"space": "space-hr", "name": name, "assetType": None, "categories": hr[name]})

	return result


def grant_guest_view(lr, path):
	"""Full-replace PUT: keep every other role's row, set Guest to exactly VIEW."""

	rows = lr.get(path).get("items", [])
	body = [
		{"actionIds": r["actionIds"], "roleExternalReferenceCode": r.get("roleExternalReferenceCode"), "roleName": r["roleName"]}
		for r in rows if r["roleName"] != "Guest" and r["actionIds"]]
	body.append({"actionIds": ["VIEW"], "roleExternalReferenceCode": "L_GUEST", "roleName": "Guest"})
	lr.put(path, body)


def main():
	lr = Liferay()

	for vocabulary in vocabularies():
		library = lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{vocabulary['space']}")
		v_erc = "VOCABULARY_" + erc_part(vocabulary["name"])
		body = {
			"externalReferenceCode": v_erc,
			"name": vocabulary["name"],
			"name_i18n": {"en-US": vocabulary["name"]},
			"viewableBy": "Anyone",
		}

		if vocabulary["assetType"]:
			# assetTypes[].type must be the structure's label (manage-cms).
			body["assetTypes"] = [{"required": False, "subtype": "AllAssetSubtypes", "type": vocabulary["assetType"]}]

		v = lr.put(f"{TAX}/asset-libraries/{library['id']}/taxonomy-vocabularies/by-external-reference-code/{v_erc}", body)
		grant_guest_view(lr, f"{TAX}/taxonomy-vocabularies/{v['id']}/permissions")

		for name in vocabulary["categories"]:
			c_erc = f"CATEGORY_{erc_part(vocabulary['name'])}_{erc_part(name)}"
			c = lr.put(
				f"{TAX}/taxonomy-vocabularies/{v['id']}/taxonomy-categories/by-external-reference-code/{c_erc}",
				{"externalReferenceCode": c_erc, "name": name, "name_i18n": {"en-US": name}})
			grant_guest_view(lr, f"{TAX}/taxonomy-categories/{c['id']}/permissions")

	print("Read-back:")

	for space in ("space-marketing", "space-hr"):
		library = lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{space}")

		for v in lr.items(f"{TAX}/asset-libraries/{library['id']}/taxonomy-vocabularies"):
			if not v.get("externalReferenceCode", "").startswith("VOCABULARY_"):
				continue

			categories = list(lr.items(f"{TAX}/taxonomy-vocabularies/{v['id']}/taxonomy-categories"))
			guest = [r["actionIds"] for r in lr.get(f"{TAX}/taxonomy-vocabularies/{v['id']}/permissions")["items"]
				if r["roleName"] == "Guest"]
			guest_categories = {
				json.dumps(r["actionIds"]) for c in categories
				for r in lr.get(f"{TAX}/taxonomy-categories/{c['id']}/permissions")["items"] if r["roleName"] == "Guest"}
			types = [t.get("type") for t in v.get("assetTypes", [])]
			print(
				f"  {space:16} {v['name']:14} {v['externalReferenceCode']:26} categories={len(categories):2}"
				f" assetTypes={types} guest(vocabulary)={guest} guest(categories)={sorted(guest_categories)}")
			print("      " + ", ".join(c["name"] for c in categories))


if __name__ == "__main__":
	sys.exit(main())
