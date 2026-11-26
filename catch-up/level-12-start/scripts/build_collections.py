"""Write the clarity-site initializer's asset-list-entries.json (dynamic collections of CMS entries).

A collection of CMS entries is scoped to the Space's group id, and a category filter takes the
category's numeric id (manage-pages, "Collections, Images and Display Pages in the Tree"). Both
are environment-specific, so this script resolves them on the target instance and writes the file.
Re-run it before deploying the tree to another instance.

Note: the initializer creates a collection but never updates an existing one beyond its title.
To change one, remove it from the pages, redeploy, delete it, redeploy again (manage-pages).

Usage: python3 -I scripts/build_collections.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

OUT = os.path.join(ROOT, "client-extensions", "clarity-site", "site-initializer", "asset-list-entries.json")
TAX = "/o/headless-admin-taxonomy/v1.0"

FAQ_CATEGORIES = ["Retail Partners", "Products and Services", "Pricing and Ordering", "Returns and Exchanges"]

# erc, title, Space, structure name, optional (vocabulary ERC, category name), order
COLLECTIONS = [
	{
		"erc": "helpful-articles",
		"title": "Helpful Articles",
		"space": "space-marketing",
		"structure": "Article",
		"order": ("createDate", "DESC"),
	},
	{
		"erc": "blog-posts",
		"title": "Blog Posts",
		"space": "space-marketing",
		"structure": "CMSBlog",
		"order": ("createDate", "DESC"),
	},
	{
		"erc": "announcements",
		"title": "Announcements",
		"space": "space-marketing",
		"structure": "Announcement",
		"order": ("createDate", "DESC"),
	},
] + [
	{
		"erc": "faq-" + "-".join(category.lower().split()),
		"title": f"FAQ - {category}",
		"space": "space-marketing",
		"structure": "FAQ",
		"category": ("VOCABULARY_FAQ", category),
		"order": ("createDate", "ASC"),
	}
	for category in FAQ_CATEGORIES
] + [
	# The free-key path of Level 11.3: upcoming events, soonest first. Each event's expiration date
	# is its start (scripts/free_key_search.py). Unused on an instance with Search Blueprints.
	{
		"erc": "upcoming-events",
		"title": "Upcoming Events",
		"space": "space-events",
		"structure": "EventInformation",
		"order": ("expirationDate", "ASC"),
	},
]


def category_id(lr, library_id, vocabulary_erc, name, cache={}):
	key = (library_id, vocabulary_erc)

	if key not in cache:
		vocabulary = lr.get(
			f"{TAX}/asset-libraries/{library_id}/taxonomy-vocabularies/by-external-reference-code/{vocabulary_erc}")
		cache[key] = list(lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories"))

	matches = [c for c in cache[key] if c["name"] == name]

	if len(matches) != 1:
		raise SystemExit(f"{vocabulary_erc}: {len(matches)} categories named {name}")

	return matches[0]["id"]


def main():
	lr = Liferay()
	entries = []

	for collection in COLLECTIONS:
		library = lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{collection['space']}")
		filter_by = [{"key": "groupIds", "value": str(library["siteId"])}]
		resolved = f"group {library['siteId']}"

		if collection.get("category"):
			vocabulary_erc, name = collection["category"]
			cid = category_id(lr, library["id"], vocabulary_erc, name)
			filter_by += [
				{"key": "queryContains0", "value": "true"},
				{"key": "queryAndOperator0", "value": "true"},
				{"key": "queryName0", "value": "assetCategories"},
				{"key": "queryValues0", "value": str(cid)},
			]
			resolved += f", category {name} = {cid}"

		column, direction = collection["order"]
		entries.append({
			"externalReferenceCode": collection["erc"],
			"title": collection["title"],
			"type": "dynamic",
			"unicodeProperties": {
				"classNameIds": f"[$OBJECT_DEFINITION_CLASS_NAME:{collection['structure']}$]",
				"filterBy": filter_by,
				"orderBy": [
					{"key": "orderByColumn1", "value": column},
					{"key": "orderByType1", "value": direction},
				],
			},
		})
		print(f"{collection['erc']}: {collection['structure']} in {collection['space']} ({resolved})")

	with open(OUT, "w", encoding="utf8") as f:
		json.dump(entries, f, ensure_ascii=False, indent="\t")
		f.write("\n")


if __name__ == "__main__":
	main()
