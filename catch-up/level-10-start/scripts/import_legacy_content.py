"""Level 9.2: import Clarity's legacy blog post and articles into the Marketing Space (re-runnable).

1. context-source/legacy-import/legacy-blog-post.json -> one entry of Liferay CMS's built-in Blog
   structure (CMSBlog, /o/cms/blogs) in the Contents folder "Blog". Its image is uploaded once as a
   Basic Document in the Files folder "Blog Images" and linked as the cover image (coverImage uses
   fileSource userComputerToCMSBasicDocument, so Liferay keeps a copy on the entry: manage-cms).
   It is categorized with the "Blog Topics" vocabulary (Innovation, Industry, Style, Fashion),
   created here if missing, limited to the Blog structure, Guest VIEW.
2. context-source/legacy-import/legacy-articles.json -> Article entries in the "Articles" folder,
   in ONE batch-engine import task (CMS structures have no /batch of their own), categorized with
   the Articles vocabulary and linking the image file already in the Space. The task is polled
   until it finishes.

Guest gets VIEW on the approved entries and VIEW + DOWNLOAD_FILE on the uploaded file.

Usage: python3 -I scripts/import_legacy_content.py
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay, q
from load_cms_content import SRC, STATS, TAX, Loader, html, slug
from setup_vocabularies import erc_part, grant_guest_view

SPACE = "space-marketing"
BLOG_TOPICS = ["Innovation", "Industry", "Style", "Fashion"]
BATCH = "/o/headless-batch-engine/v1.0/import-task"


def legacy(name):
	with open(os.path.join(SRC, "legacy-import", name), encoding="utf8") as f:
		return json.load(f)


def blog_topics_vocabulary(lr):
	library = lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{SPACE}")
	v_erc = "VOCABULARY_BLOG_TOPICS"
	path = f"{TAX}/asset-libraries/{library['id']}/taxonomy-vocabularies/by-external-reference-code/{v_erc}"
	status, vocabulary = lr.request("GET", path, raise_errors=False)

	if status == 404:
		vocabulary = lr.put(path, {
			"assetTypes": [{"required": False, "subtype": "AllAssetSubtypes", "type": "Blog"}],
			"externalReferenceCode": v_erc,
			"name": "Blog Topics",
			"name_i18n": {"en-US": "Blog Topics"},
			"viewableBy": "Anyone",
		})
		print(f"  vocabulary created: Blog Topics ({v_erc})")

	grant_guest_view(lr, f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/permissions")
	existing = {c["name"] for c in lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories")}

	for name in BLOG_TOPICS:
		c_erc = f"CATEGORY_BLOG_TOPICS_{erc_part(name)}"
		category = lr.put(
			f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories/by-external-reference-code/{c_erc}",
			{"externalReferenceCode": c_erc, "name": name, "name_i18n": {"en-US": name}})
		grant_guest_view(lr, f"{TAX}/taxonomy-categories/{category['id']}/permissions")

		if name not in existing:
			print(f"  category created: {name}")


def import_blog_post(lr, loader):
	post = legacy("legacy-blog-post.json")
	print("Blog post")

	loader.folder(SPACE, "folder-marketing-blog-images", "Blog Images", "L_FILES")
	loader.folder(SPACE, "folder-marketing-blog", "Blog", "L_CONTENTS")

	image_erc = "blog-image-" + slug(os.path.splitext(os.path.basename(post["image"]))[0])
	document = loader.upload(SPACE, post["image"], image_erc, "folder-marketing-blog-images")
	blog_topics_vocabulary(lr)

	erc = "blog-" + slug(post["headline"])[:80]
	url = f"/o/cms/blogs/scopes/{SPACE}/by-external-reference-code/{erc}"
	category_ids = loader.category_ids(SPACE, [("VOCABULARY_BLOG_TOPICS", post["category"])])
	fields = {"content": html(post["articleBody"]), "title": post["headline"]}
	status, current = lr.request("GET", url, raise_errors=False)

	# coverImage copies the linked file into the entry (new ERC), so compare the copy's file name.
	same = (
		status == 200
		and current.get("objectEntryFolderExternalReferenceCode") == "folder-marketing-blog"
		and all((current.get(k) or "") == v for k, v in fields.items())
		and (current.get("coverImage") or {}).get("name") == document["file"]["name"]
		and sorted(int(b["taxonomyCategoryId"]) for b in current.get("taxonomyCategoryBriefs") or []) == category_ids)

	if same:
		STATS["unchanged"] += 1
		entry = current
	else:
		body = dict(fields)
		body.update({
			"coverImage": {"externalReferenceCode": document["file"]["externalReferenceCode"], "scope": {"externalReferenceCode": SPACE}},
			"externalReferenceCode": erc,
			"objectEntryFolderExternalReferenceCode": "folder-marketing-blog",
			"taxonomyCategoryIds": category_ids,
		})
		entry = lr.put(url, body)
		STATS["created" if status == 404 else "updated"] += 1

	if entry["status"]["code"] == 0:
		loader.guest_entries.append((f"/o/cms/blogs/{entry['id']}/permissions", ["VIEW"]))

	print(f"  blog entry {erc}: id {entry['id']}, status {entry['status']['label']}, cover {entry['coverImage']['name']}")

	return entry


def import_articles(lr, loader):
	print("Articles (one batch import task)")
	items = []

	for article in legacy("legacy-articles.json"):
		image_erc = "marketing-image-" + slug(os.path.splitext(os.path.basename(article["image"]))[0]) + "-file"
		items.append({
			"externalReferenceCode": "article-" + slug(article["title"])[:80],
			"objectEntryFolderExternalReferenceCode": "folder-marketing-articles",
			"properties": {
				"content": html(article["content"]),
				"headline": article["headline"],
				"image": {"externalReferenceCode": image_erc, "scope": {"externalReferenceCode": SPACE}},
				"title": article["title"],
			},
			"taxonomyCategoryIds": loader.category_ids(SPACE, [("VOCABULARY_ARTICLES", article["category"])]),
		})

	path = (
		f"{BATCH}/com.liferay.object.rest.dto.v1_0.ObjectEntry?taskItemDelegateName=C_Article"
		f"&scopeKey={q(SPACE)}&createStrategy=UPSERT&importStrategy=ON_ERROR_CONTINUE")
	shown = [dict(i, properties=dict(i["properties"], content=i["properties"]["content"][:60] + "…")) for i in items]
	print(f"  POST {path}")
	print("  " + json.dumps(shown, indent=1).replace("\n", "\n  "))

	task = lr.post(path, items)

	while task.get("executeStatus") not in ("COMPLETED", "FAILED"):
		time.sleep(2)
		task = lr.get(f"{BATCH}/{task['id']}")
		print(f"  task {task['id']}: {task['executeStatus']} processed {task.get('processedItemsCount')}/{task.get('totalItemsCount')}")

	print(
		f"  import task {task['id']}: executeStatus={task['executeStatus']} processedItemsCount={task.get('processedItemsCount')}"
		f" totalItemsCount={task.get('totalItemsCount')} failedItems={task.get('failedItems')} errorMessage={task.get('errorMessage')}")

	for item in items:
		entry = lr.get(f"/o/c/articles/scopes/{SPACE}/by-external-reference-code/{q(item['externalReferenceCode'])}")
		categories = [b["taxonomyCategoryName"] for b in entry.get("taxonomyCategoryBriefs") or []]
		print(
			f"  article id {entry['id']} {entry['title'][:50]!r} status={entry['status']['label']}"
			f" folder={entry['objectEntryFolderExternalReferenceCode']} image={entry['image']['externalReferenceCode']} categories={categories}")

		if entry["status"]["code"] == 0:
			loader.guest_entries.append((f"/o/c/articles/{entry['id']}/permissions", ["VIEW"]))

	return task


def main():
	lr = Liferay()
	loader = Loader(lr)

	import_blog_post(lr, loader)
	import_articles(lr, loader)

	print(f"Blog items: {STATS['created']} created, {STATS['updated']} updated, {STATS['unchanged']} unchanged")
	loader.grant_guest()


if __name__ == "__main__":
	sys.exit(main())
