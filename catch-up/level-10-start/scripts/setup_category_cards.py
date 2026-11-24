"""Level 8.4: the Products page's "Commerce Categories" container.

- Gives the Clarity Products categories a description and grants Guest VIEW on the vocabulary and
  each category (a vocabulary created over headless is Owner-only; commerce-catalogs).
- Looks up the card images in the Marketing Space by title (eyeglasses, sunglasses, contacts,
  lenses) and writes their URLs into the widget's preferences, where the "Clarity Category Cards"
  template reads them (templates can't call /o/cms as Guest). Re-run before deploying elsewhere.
- Writes the Commerce Categories Navigation widget into layouts/02-products/page-definition.json.

Usage: python3 -I scripts/setup_category_cards.py
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

TAX = "/o/headless-admin-taxonomy/v1.0"
VOCABULARY_ERC = "VOCABULARY_CLARITY_PRODUCTS"
PAGE = os.path.join(ROOT, "client-extensions", "clarity-site", "site-initializer", "layouts", "02-products", "page-definition.json")
WIDGET = "com_liferay_commerce_product_asset_categories_navigation_web_internal_portlet_CPAssetCategoriesNavigationPortlet"

CATEGORIES = {
	"Eyeglasses": ("eyeglasses", "Frames for every face and every day, from timeless classics to bold statements."),
	"Sunglasses": ("sunglasses", "UV-protective shades that pair clear vision with effortless style."),
	"Contacts": ("contacts", "Comfortable daily and monthly lenses for freedom from frames."),
	"Lenses": ("lenses", "Precision prescription lenses and coatings for sharp, comfortable sight."),
}


def grant_guest_view(lr, path):
	"""Full-replace PUT: keep every other role's row, set Guest to exactly VIEW."""

	rows = lr.get(path).get("items", [])
	body = [
		{"actionIds": r["actionIds"], "roleExternalReferenceCode": r.get("roleExternalReferenceCode"), "roleName": r["roleName"]}
		for r in rows if r["roleName"] != "Guest" and r["actionIds"]]
	body.append({"actionIds": ["VIEW"], "roleExternalReferenceCode": "L_GUEST", "roleName": "Guest"})
	lr.put(path, body)


def load(path):
	with open(path, encoding="utf8") as f:
		return json.load(f)


def save(path, data):
	with open(path, "w", encoding="utf8") as f:
		json.dump(data, f, ensure_ascii=False, indent="\t")
		f.write("\n")


def normalize(text):
	return "-".join((text or "").lower().replace("_", " ").replace("-", " ").split())


def main():
	lr = Liferay()
	vocabulary = lr.get(f"{TAX}/sites/L_GLOBAL/taxonomy-vocabularies/by-external-reference-code/{VOCABULARY_ERC}")
	grant_guest_view(lr, f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/permissions")
	files = list(lr.items("/o/cms/basic-documents/scopes/space-marketing"))
	config = {
		"assetVocabularyExternalReferenceCode": VOCABULARY_ERC,
		"displayStyle": "ddmTemplate_CLARITY-CATEGORY-CARDS",
		"displayStyleGroupExternalReferenceCode": "clarity-public",
		"useRootCategory": "false",
	}

	for category in lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories"):
		if category["name"] not in CATEGORIES:
			continue

		file_name, description = CATEGORIES[category["name"]]
		lr.patch(
			f"{TAX}/taxonomy-categories/{category['id']}",
			{"description": description, "description_i18n": {"en-US": description}})
		grant_guest_view(lr, f"{TAX}/taxonomy-categories/{category['id']}/permissions")

		matches = [d for d in files if normalize(d.get("title")) == normalize(file_name)]

		if len(matches) != 1:
			raise SystemExit(f"space-marketing: {len(matches)} files titled like {file_name}")

		url = re.sub(r"\?.*", "", matches[0]["file"]["link"]["href"])
		config["categoryImage_" + category["externalReferenceCode"]] = url
		print(f"{category['name']} ({category['externalReferenceCode']}): '{description}' image {url}")

	page = load(PAGE)
	page["pageElement"]["pageElements"] = [
		e for e in page["pageElement"]["pageElements"]
		if e.get("definition", {}).get("name") != "Commerce Categories"
	] + [
		{
			"definition": {
				"layout": {"containerType": "Fixed", "paddingBottom": 6, "paddingTop": 6},
				"name": "Commerce Categories",
			},
			"pageElements": [
				{"definition": {"widgetInstance": {"widgetConfig": config, "widgetName": WIDGET}}, "type": "Widget"},
			],
			"type": "Section",
		},
	]
	save(PAGE, page)


if __name__ == "__main__":
	main()
