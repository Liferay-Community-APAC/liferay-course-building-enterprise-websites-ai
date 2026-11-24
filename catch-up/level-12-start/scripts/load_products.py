"""Level 8.2: the products of context-source/data/products.csv in the Clarity Eyewear catalog.

- The "Clarity Products" vocabulary (Eyeglasses, Sunglasses, Contacts, Lenses) is upserted by ERC in
  the instance's Global site (commerce-catalogs: a product vocabulary lives there).
- Each product is a simple product with an ERC and a default SKU, upserted by ERC: created with
  POST when missing, PATCHed otherwise. Its specification values carry ERCs so a re-run updates
  them instead of adding rows.
- Categories are set before tags (PATCH .../categories clears a product's tags).
- The image (priority 10, titled like the product) is uploaded only when no image has that title.
- Products are published (productStatus 0, active).

Usage: python3 -I scripts/load_products.py
"""

import base64
import csv
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

API = "/o/headless-commerce-admin-catalog/v1.0"
TAX = "/o/headless-admin-taxonomy/v1.0"
CATALOG_ERC = "clarity-eyewear"
VOCABULARY = "Clarity Products"
CATEGORIES = ["Eyeglasses", "Sunglasses", "Contacts", "Lenses"]
SPECS = {"frameMaterial": "frame-material", "frameColor": "frame-color", "frameSize": "frame-size"}

DESCRIPTIONS = {
	"Classic Aviator Sunglasses": (
		"<p>Say hello to your new favorite pair for bright days! Our Classic Aviator Sunglasses pair a "
		"lightweight gold metal frame with the teardrop shape that has never gone out of style. The "
		"54-20 fit sits comfortably on most faces, and adjustable nose pads keep everything steady "
		"whether you are driving to the coast, strolling through the city or relaxing on a patio. The "
		"lenses block harmful UV rays and cut glare, so your eyes stay relaxed from morning to sunset. "
		"Slim temples slip easily under a hat or into a shirt pocket, and every pair is checked by hand "
		"before it leaves our workshop. Pop them on, look up, and enjoy the sunshine with a little extra "
		"confidence and a lot of timeless style.</p>"),
	"AquaComfort Plus Dailies": (
		"<p>Fresh, comfortable vision every single day: that is the promise of AquaComfort Plus Dailies. "
		"These daily disposable contact lenses are designed to feel soft from the moment you put them in "
		"until you take them out at night. Moisture is released with every blink, so your eyes stay "
		"refreshed even through long days at the screen, busy commutes or an evening out with friends. "
		"Because you start each morning with a brand new pair, there is no cleaning, no cases and no "
		"solutions to remember. Simply wear them, toss them, and enjoy clear sight. They are a great "
		"choice for first-time wearers, part-time wearers who want freedom from glasses for sports, and "
		"anyone who simply loves easy, hygienic, everyday comfort.</p>"),
	"Single Vision Lenses": (
		"<p>See the world clearly with our Single Vision Lenses, crafted with precision for one viewing "
		"distance, whether you need help seeing far away or up close. Each lens is cut to your exact "
		"prescription and carefully centered on your pupils, so your vision feels natural and sharp from "
		"edge to edge. They are thin, light and comfortable enough to wear all day, and they fit almost any "
		"of our frames, from bold acetate designs to delicate metal styles. Add an anti-reflective, "
		"scratch-resistant or blue light coating to make them work even harder for you. Our opticians "
		"inspect every pair before it ships, so you can simply put on your glasses, smile and enjoy a "
		"crisp, comfortable view of everything you love.</p>"),
}


def slug(text):
	return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def erc_part(text):
	return re.sub(r"[^A-Z0-9]+", "_", text.upper()).strip("_")


def upsert_vocabulary(lr):
	v_erc = "VOCABULARY_" + erc_part(VOCABULARY)
	vocabulary = lr.put(
		f"{TAX}/sites/L_GLOBAL/taxonomy-vocabularies/by-external-reference-code/{v_erc}",
		{"externalReferenceCode": v_erc, "name": VOCABULARY, "name_i18n": {"en-US": VOCABULARY}})
	ids = {}

	for name in CATEGORIES:
		c_erc = f"CATEGORY_{erc_part(VOCABULARY)}_{erc_part(name)}"
		category = lr.put(
			f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories/by-external-reference-code/{c_erc}",
			{"externalReferenceCode": c_erc, "name": name, "name_i18n": {"en-US": name}})
		ids[name] = int(category["id"])

	return vocabulary, ids


def upsert_product(lr, catalog, row):
	erc = "product-" + slug(row["name"])
	specs = [
		{
			"externalReferenceCode": f"{erc}-{key}",
			"specificationKey": key,
			"value": {"en_US": row[column]},
		}
		for column, key in SPECS.items() if row[column].strip()
	]
	body = {
		"active": True,
		"catalogId": catalog["id"],
		"description": {"en_US": DESCRIPTIONS[row["name"]]},
		"externalReferenceCode": erc,
		"name": {"en_US": row["name"]},
		"productSpecifications": specs,
		"productStatus": 0,
		"productType": "simple",
		"shortDescription": {"en_US": row["shortDescription"]},
	}
	status, existing = lr.request("GET", f"{API}/products/by-externalReferenceCode/{erc}", raise_errors=False)

	if status == 404:
		body["defaultSku"] = erc_part(row["name"]).replace("_", "-")
		lr.post(f"{API}/products", body)
	else:
		lr.patch(f"{API}/products/by-externalReferenceCode/{erc}", body)

	return erc


def main():
	lr = Liferay()
	catalog = lr.get(f"{API}/catalog/by-externalReferenceCode/{CATALOG_ERC}")
	vocabulary, category_ids = upsert_vocabulary(lr)

	with open(os.path.join(ROOT, "context-source", "data", "products.csv"), encoding="utf8") as f:
		rows = list(csv.DictReader(f))

	for row in rows:
		erc = upsert_product(lr, catalog, row)
		base = f"{API}/products/by-externalReferenceCode/{erc}"

		# Categories first: this PATCH clears the product's tags.
		lr.patch(f"{base}/categories", [{"id": category_ids[row["category"]]}])
		tags = [t.strip() for t in row["tags"].split(";") if t.strip()]
		lr.patch(base, {"tags": tags})

		images = lr.get(f"{base}/images").get("items", [])

		if not any((i.get("title") or {}).get("en_US") == row["name"] for i in images):
			with open(os.path.join(ROOT, "context-source", row["image"]), "rb") as f:
				attachment = base64.b64encode(f.read()).decode()

			lr.post(f"{base}/images/by-base64", {
				"attachment": attachment,
				"neverExpire": True,
				"priority": 10,
				"title": {"en_US": row["name"]},
			})

	# Read back ------------------------------------------------------------------------------------
	print(f"Vocabulary {vocabulary['name']} ({vocabulary['externalReferenceCode']}, id {vocabulary['id']}, "
		f"Global): {', '.join(f'{n}={i}' for n, i in category_ids.items())}")

	for row in rows:
		erc = "product-" + slug(row["name"])
		base = f"{API}/products/by-externalReferenceCode/{erc}"
		p = lr.get(f"{base}?nestedFields=productSpecifications,skus,images")
		categories = [c["name"] for c in lr.get(f"{base}/categories").get("items", [])]
		specs = ", ".join(
			f"{s['specificationKey']}={s['value'].get('en_US')}" for s in p.get("productSpecifications") or [])
		images = lr.get(f"{base}/images").get("items", [])
		words = len(re.sub(r"<[^>]+>", " ", p["description"]["en_US"]).split())
		print(
			f"- {p['name']['en_US']} (ERC {erc}, productId {p['productId']}, {p['productType']}, "
			f"status {p['productStatus']}, active {p['active']}, SKU {[s['sku'] for s in p.get('skus') or []]})\n"
			f"    categories {categories}; tags {p.get('tags')}; specs [{specs}]; images {len(images)} "
			f"{[(i['title'].get('en_US'), i['priority']) for i in images]}; short '{p['shortDescription']['en_US']}'; "
			f"description {words} words")


if __name__ == "__main__":
	main()
