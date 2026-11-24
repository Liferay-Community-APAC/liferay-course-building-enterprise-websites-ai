"""Level 7.1: map the site initializer's images to CMS Space files, resolved by title.

The page-definition format has no ERC form for an image or a background image taken from a
file: it takes `com.liferay.portal.kernel.repository.model.FileEntry` + the file's numeric id
(manage-pages, "Collections, Images and Display Pages in the Tree"). Those ids differ per
environment, so this script is the source of the mapping: it looks every file up in its Space by
title and rewrites the tree. Re-run it before deploying the tree to another instance.

Usage: python3 -I scripts/map_cms_images.py [--check]
  --check  only resolve and print the ids, write nothing
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

TREE = os.path.join(ROOT, "client-extensions", "clarity-site", "site-initializer")
FILE_ENTRY = "com.liferay.portal.kernel.repository.model.FileEntry"
HOME_URL = "/web/clarity/home"

HOME = "layouts/01-home/page-definition.json"
FAQ = "layouts/05-faq/page-definition.json"
PRODUCT_LIST = "layouts/02-products/01-product-list/page-definition.json"
PRIMARY = "layout-page-templates/master-pages/primary-master-page/page-definition.json"
SECONDARY = "layout-page-templates/master-pages/secondary-master-page/page-definition.json"

# kind "image": the first BASIC_COMPONENT-image inside the named container (or, with
# container None, the first one on the page). kind "background": the container's own
# background image.
MAPPINGS = [
	{"file": HOME, "container": "Banner Content", "kind": "image", "space": "space-marketing", "name": "home-banner-narrow-no-background"},
	{"file": HOME, "container": "Clarity Solutions Promo", "kind": "image", "space": "space-marketing", "name": "sunglasses-on-shelves"},
	{"file": HOME, "container": "Content Wrapper", "kind": "background", "space": "space-marketing", "name": "gradient-overlay"},
	{"file": HOME, "container": "Distributor Promo", "kind": "background", "space": "space-marketing", "name": "home-promotion"},
	{"file": PRIMARY, "container": "Header Branding", "kind": "image", "space": "space-branding", "name": "logo-name-vector", "link": HOME_URL, "maxWidth": "200px"},
	{"file": PRIMARY, "container": "Footer Branding", "kind": "image", "space": "space-branding", "name": "logo-full-name-vector", "link": HOME_URL, "maxWidth": "200px"},
	{"file": FAQ, "container": None, "kind": "image", "space": "space-marketing", "name": "glasses-vertical-banner-with-text-lg"},
	{"file": PRODUCT_LIST, "container": "Banner", "kind": "background", "space": "space-marketing", "name": "products-banner"},
	{"file": SECONDARY, "container": "Header Branding", "kind": "image", "space": "space-branding", "name": "logo-name-vector", "link": HOME_URL, "maxWidth": "200px"},
]


def normalize(text):
	return "-".join((text or "").lower().replace("_", " ").replace("-", " ").split())


def space_files(lr, space_erc, cache={}):
	if space_erc not in cache:
		cache[space_erc] = list(lr.items(f"/o/cms/basic-documents/scopes/{space_erc}"))

	return cache[space_erc]


def resolve(lr, space_erc, name):
	matches = [d for d in space_files(lr, space_erc) if normalize(d.get("title")) == normalize(name)]

	if len(matches) != 1:
		raise SystemExit(f"{space_erc}: {len(matches)} files titled like '{name}'")

	return matches[0]


def find_container(element, name):
	if element.get("definition", {}).get("name") == name:
		return element

	for child in element.get("pageElements", []):
		found = find_container(child, name)

		if found:
			return found

	return None


def find_image(element):
	if (element.get("type") == "Fragment" and
			element.get("definition", {}).get("fragment", {}).get("key") == "BASIC_COMPONENT-image"):

		return element

	for child in element.get("pageElements", []):
		found = find_image(child)

		if found:
			return found

	return None


def class_pk_reference(file_id):
	return {"className": FILE_ENTRY, "classPK": file_id}


def apply(page_definition, mapping, document):
	root = page_definition["pageElement"]
	container = find_container(root, mapping["container"]) if mapping["container"] else root

	if container is None:
		raise SystemExit(f"{mapping['file']}: no container named {mapping['container']}")

	file_id = int(document["file"]["id"])

	if mapping["kind"] == "background":
		container["definition"]["backgroundImage"] = {
			"url": {"mapping": {"fieldKey": "fileURL", "itemReference": class_pk_reference(file_id)}}}

		return file_id

	image = find_image(container)

	if image is None:
		raise SystemExit(f"{mapping['file']}: no Image fragment in {mapping['container']}")

	value = {
		"fragmentImage": {
			"description": {"value_i18n": {"en_US": document["title"]}},
			"fragmentImageClassPKReference": {
				"classPKReferences": {"en_US": class_pk_reference(file_id)},
				# Required: without it the whole initialization fails (NPE) and rolls back.
				"fragmentImageConfiguration": {
					"landscapeMobile": "auto", "portraitMobile": "auto", "tablet": "auto"},
			},
		},
	}

	if mapping.get("link"):
		value["fragmentLink"] = {"value": {"href": {"value": mapping["link"]}}}

	definition = image["definition"]
	definition["fragmentFields"] = [{"id": "image-square", "value": value}]

	if mapping.get("maxWidth"):
		definition.setdefault("fragmentStyle", {})["maxWidth"] = mapping["maxWidth"]

	return file_id


def main():
	check = "--check" in sys.argv
	lr = Liferay()
	files = {}

	for mapping in MAPPINGS:
		document = resolve(lr, mapping["space"], mapping["name"])
		path = os.path.join(TREE, mapping["file"])

		if path not in files:
			with open(path, encoding="utf8") as f:
				files[path] = json.load(f)

		file_id = apply(files[path], mapping, document)
		where = mapping["container"] or "page"
		print(
			f"{mapping['file']} :: {where} ({mapping['kind']}) -> {mapping['space']} "
			f"'{document['title']}' (Basic Document {document['externalReferenceCode']}, FileEntry {file_id})")

	if check:
		return

	for path, page_definition in files.items():
		with open(path, "w", encoding="utf8") as f:
			json.dump(page_definition, f, ensure_ascii=False, indent="\t")
			f.write("\n")


if __name__ == "__main__":
	main()
