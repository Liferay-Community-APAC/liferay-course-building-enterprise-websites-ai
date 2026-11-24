"""Rewrite the environment-specific Attachment mapping keys in the clarity-site tree.

An Attachment field of a CMS structure maps only as `ObjectField_<numeric field id>#previewURL`
(or #downloadURL / #fileURL): no token resolves the id (manage-cms, "Rendering a Space's Content
From a Site Initializer"). This script reads the field ids from this instance and rewrites every
such key in the listed files. Each listed file maps one Attachment field only.

Usage: python3 -I scripts/map_attachment_fields.py
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

TREE = os.path.join(ROOT, "client-extensions", "clarity-site", "site-initializer")

# file (relative to the tree) -> (structure name, Attachment field name)
FILES = {
	"layouts/01-home/page-definition.json": ("Article", "image"),
	"layouts/05-faq/page-definition.json": ("Article", "image"),
	"layout-page-templates/display-page-templates/article/page-definition.json": ("Article", "image"),
	"layout-page-templates/display-page-templates/leadership-profile/page-definition.json": ("LeadershipProfile", "portrait"),
	"layouts/04-blog/page-definition.json": ("CMSBlog", "coverImage"),
	"layout-page-templates/display-page-templates/blog-post/page-definition.json": ("CMSBlog", "coverImage"),
}

KEY = re.compile(r'"ObjectField_\d+#(previewURL|downloadURL|fileURL)"')


def field_ids(lr):
	ids = {}

	for definition in lr.items("/o/object-admin/v1.0/object-definitions"):
		for field in definition.get("objectFields", []):
			ids[(definition["name"], field["name"])] = field["id"]

	return ids


def main():
	ids = field_ids(Liferay())

	for relative, (structure, field) in FILES.items():
		path = os.path.join(TREE, relative)

		if not os.path.exists(path):
			continue

		field_id = ids[(structure, field)]

		with open(path, encoding="utf8") as f:
			text = f.read()

		new, count = KEY.subn(lambda m: f'"ObjectField_{field_id}#{m.group(1)}"', text)

		with open(path, "w", encoding="utf8") as f:
			f.write(new)

		print(f"{relative}: {count} key(s) -> {structure}.{field} = ObjectField_{field_id}")


if __name__ == "__main__":
	main()
