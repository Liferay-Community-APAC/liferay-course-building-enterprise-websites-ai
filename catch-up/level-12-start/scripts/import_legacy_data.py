"""Level 9.3: import Clarity's legacy products and office locations, each in ONE batch request.

1. context-source/legacy-import/legacy-products.json -> products of the Clarity Eyewear catalog,
   POST /o/headless-commerce-admin-catalog/v1.0/products/batch: ERC, Clarity Products category,
   a published SKU with its price, specification values, and as image the Marketing Space file of
   the product's category (eyeglasses.jpg, sunglasses.jpg...), referenced by the file's ERC and
   the Space's ERC instead of being uploaded again (only when the product has no such image yet).
2. context-source/legacy-import/legacy-locations.json -> categories of the HR Space's "Location"
   vocabulary, POST /o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/{id}/taxonomy-categories/batch.
   Only missing locations are sent, so a re-run sends nothing; Guest gets VIEW on each (like the
   other HR categories).
3. The example from the prompt: the job listing "Retail Associate" (HR Space) also gets the new
   location "Morocco, Casablanca". Its other categories are kept; nothing is written when it
   already has it.

Each import task is polled until it finishes (headless-batch-engine).

Usage: python3 -I scripts/import_legacy_data.py
"""

import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay
from setup_vocabularies import erc_part, grant_guest_view

API = "/o/headless-commerce-admin-catalog/v1.0"
TAX = "/o/headless-admin-taxonomy/v1.0"
BATCH = "/o/headless-batch-engine/v1.0/import-task"
LEGACY = os.path.join(ROOT, "context-source", "legacy-import")


def legacy(name):
	with open(os.path.join(LEGACY, name), encoding="utf8") as f:
		return json.load(f)


def poll(lr, task, label):
	while task.get("executeStatus") not in ("COMPLETED", "FAILED"):
		time.sleep(2)
		task = lr.get(f"{BATCH}/{task['id']}")
		print(f"  task {task['id']}: {task['executeStatus']} processed {task.get('processedItemsCount')}/{task.get('totalItemsCount')}")

	print(
		f"  {label} import task {task['id']}: executeStatus={task['executeStatus']}"
		f" processedItemsCount={task.get('processedItemsCount')} totalItemsCount={task.get('totalItemsCount')}"
		f" failedItems={task.get('failedItems')} errorMessage={task.get('errorMessage') or ''}")

	return task


def show(path, items, shorten=()):
	print(f"  POST {path}")
	print("  " + json.dumps(items, indent=1).replace("\n", "\n  "))


def import_products(lr):
	print("Products (one batch request)")
	catalog = lr.get(f"{API}/catalog/by-externalReferenceCode/clarity-eyewear")
	vocabulary = lr.get(f"{TAX}/sites/L_GLOBAL/taxonomy-vocabularies/by-external-reference-code/VOCABULARY_CLARITY_PRODUCTS")
	categories = {c["name"]: int(c["id"]) for c in lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories")}
	items = []

	for product in legacy("legacy-products.json"):
		erc = product["externalReferenceCode"]
		image = "marketing-image-" + re.sub(r"[^a-z0-9]+", "-", product["category"].lower()).strip("-") + "-file"
		items.append({
			"active": True,
			"catalogId": catalog["id"],
			"categories": [{"id": categories[product["category"]]}],
			"description": {"en_US": product["description"]},
			"externalReferenceCode": erc,
			"images": [{
				"fileEntryExternalReferenceCode": image,
				"fileEntryGroupExternalReferenceCode": "space-marketing",
				"neverExpire": True,
				"priority": 10,
				"title": {"en_US": product["category"]},
			}],
			"name": {"en_US": product["name"]},
			"productSpecifications": [
				{"externalReferenceCode": f"{erc}-{key}", "specificationKey": key, "value": {"en_US": value}}
				for key, value in product["specifications"].items()],
			"productStatus": 0,
			"productType": "simple",
			"shortDescription": {"en_US": product["shortDescription"]},
			"skus": [{
				"externalReferenceCode": f"{erc}-sku",
				"price": product["price"],
				"published": True,
				"purchasable": True,
				"sku": product["sku"],
			}],
		})

	# An image is attached once: sending it again answers DuplicateCPAttachmentFileEntryException.
	for item in items:
		status, images = lr.request(
			"GET", f"{API}/products/by-externalReferenceCode/{item['externalReferenceCode']}/images", raise_errors=False)

		if status == 200 and any((i.get("title") or {}).get("en_US") == item["images"][0]["title"]["en_US"] for i in images.get("items", [])):
			del item["images"]

	path = f"{API}/products/batch"
	show(path, items)
	task = poll(lr, lr.post(path, items), "products")

	for product in legacy("legacy-products.json"):
		base = f"{API}/products/by-externalReferenceCode/{product['externalReferenceCode']}"
		status, p = lr.request("GET", f"{base}?nestedFields=productSpecifications,skus,images,categories", raise_errors=False)

		if status != 200:
			print(f"  - {product['externalReferenceCode']}: {status}")
			continue

		names = [c["name"] for c in lr.get(f"{base}/categories").get("items", [])]
		images = lr.get(f"{base}/images").get("items", [])
		specs = ", ".join(f"{s['specificationKey']}={s['value'].get('en_US')}" for s in p.get("productSpecifications") or [])
		print(
			f"  - {p['name']['en_US']} (ERC {p['externalReferenceCode']}, productId {p['productId']}, status {p['productStatus']}):"
			f" SKUs {[(s['sku'], s.get('price')) for s in p.get('skus') or []]}; categories {names}; specs [{specs}];"
			f" images {[(i.get('title', {}).get('en_US'), i.get('fileEntryId')) for i in images]}")

	return task


def import_locations(lr):
	print("Locations (one batch request)")
	library = lr.get("/o/headless-asset-library/v1.0/asset-libraries/space-hr")
	vocabulary = lr.get(f"{TAX}/asset-libraries/{library['id']}/taxonomy-vocabularies/by-external-reference-code/VOCABULARY_LOCATION")
	existing = {c["name"] for c in lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories")}
	items = [
		{"externalReferenceCode": f"CATEGORY_LOCATION_{erc_part(name)}", "name": name, "name_i18n": {"en-US": name}}
		for name in legacy("legacy-locations.json") if name not in existing]
	path = f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories/batch"

	if items:
		show(path, items)
		task = poll(lr, lr.post(path, items), "locations")
	else:
		print("  every location already exists: nothing to send")
		task = None

	categories = list(lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories"))
	wanted = set(legacy("legacy-locations.json"))

	for category in categories:
		if category["name"] in wanted:
			grant_guest_view(lr, f"{TAX}/taxonomy-categories/{category['id']}/permissions")

	print(f"  Location vocabulary now has {len(categories)} categories; legacy ones present: "
		f"{sum(c['name'] in wanted for c in categories)}/{len(wanted)}")

	return task


EXAMPLE_JOB = "Retail Associate"
EXAMPLE_LOCATION = "Morocco, Casablanca"


def assign_example_location(lr):
	print(f"{EXAMPLE_JOB}: {EXAMPLE_LOCATION}")
	library = lr.get("/o/headless-asset-library/v1.0/asset-libraries/space-hr")
	vocabulary = lr.get(f"{TAX}/asset-libraries/{library['id']}/taxonomy-vocabularies/by-external-reference-code/VOCABULARY_LOCATION")
	matches = [c for c in lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories") if c["name"] == EXAMPLE_LOCATION]

	if len(matches) != 1:
		raise SystemExit(f"  {len(matches)} Location categories named {EXAMPLE_LOCATION}")

	location_id = int(matches[0]["id"])
	jobs = [j for j in lr.items("/o/c/joblistings/scopes/space-hr") if j.get("title") == EXAMPLE_JOB]

	if len(jobs) != 1:
		raise SystemExit(f"  {len(jobs)} job listings titled {EXAMPLE_JOB}: run scripts/load_cms_content.py first")

	job = jobs[0]
	ids = sorted(int(b["taxonomyCategoryId"]) for b in job.get("taxonomyCategoryBriefs") or [])

	if location_id in ids:
		print("  already assigned")
	else:
		lr.patch(f"/o/c/joblistings/{job['id']}", {"taxonomyCategoryIds": sorted(ids + [location_id])})
		print("  assigned")

	job = lr.get(f"/o/c/joblistings/{job['id']}")
	print("  categories: " + ", ".join(sorted(b["taxonomyCategoryName"] for b in job.get("taxonomyCategoryBriefs") or [])))


def main():
	lr = Liferay()
	import_products(lr)
	import_locations(lr)
	assign_example_location(lr)


if __name__ == "__main__":
	sys.exit(main())
