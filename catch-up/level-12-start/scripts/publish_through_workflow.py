"""Levels 10.2 and 10.3: an article and an announcement go through the approval workflow, as the
personas would do it (re-runnable).

For each item below:

1. Christian Carter (Marketing Coordinator) creates it in the Marketing Space, authenticated as
   himself (training password "learn"): a plain POST is the submission, and the entry starts as
   pending because scripts/setup_article_workflow.py linked Clarity Article Approval to Article and
   Announcement in the Space.
2. Clara Murphy (Content Manager) finds its review task among the tasks assigned to her roles,
   assigns it to herself and approves it with the comment from the workbook.

An item that already exists (looked up by title, so an entry you made by hand counts) and is
approved is left as it is. One that is pending goes straight to step 2.

- 10.2: Article "Clarity x Almanac Optics" in the folder "Articles", image: the Space file
  revolutionizing_industry, category: Industry (Articles vocabulary). Comment "Approved for the
  summer campaign."
- 10.3: Announcement "Spring Campaign" in the folder "Announcements". Comment "Go live."

Usage: python3 -I scripts/publish_through_workflow.py
"""

import os
import sys
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ApiError, Liferay

PERSONA_PASSWORD = os.environ.get("CLARITY_PERSONA_PASSWORD", "learn")
CHRISTIAN = "christian.carter@clarityvisionsolutions.com"
CLARA = "clara.murphy@clarityvisionsolutions.com"

SPACE = "space-marketing"
TAX = "/o/headless-admin-taxonomy/v1.0"
WORKFLOW = "/o/headless-admin-workflow/v1.0"

ITEMS = [
	{
		"category": ("VOCABULARY_ARTICLES", "Industry"),
		"comment": "Approved for the summer campaign.",
		"fields": {
			"content": "Eyewear enthusiasts rejoice! Fan favorites Clarity and Almanac Optics have joined forces "
				"for a collaborative collection.",
			"headline": "Summer 2027 Collaboration",
			"title": "Clarity x Almanac Optics",
		},
		"folder": "folder-marketing-articles",
		"image": ("image", "revolutionizing_industry"),
		"level": "10.2",
		"rest": "/o/c/articles",
	},
	{
		"comment": "Go live.",
		"fields": {
			"linkText": "Shop the collection",
			"linkURL": "/web/clarity/products",
			"message": "Spring into Style with Clarity: new frames have arrived!",
			"title": "Spring Campaign",
		},
		"folder": "folder-marketing-announcements",
		"level": "10.3",
		"rest": "/o/c/announcements",
	},
]


def normalize(text):
	return "-".join((text or "").lower().replace("_", " ").replace("-", " ").split())


def find(lr, rest, title):
	query = urllib.parse.quote(f"title eq '{title}'", safe="")
	matches = list(lr.items(f"{rest}/scopes/{SPACE}?filter={query}"))

	if len(matches) > 1:
		raise SystemExit(f"  {len(matches)} entries titled {title!r}: delete the extra ones first")

	return matches[0] if matches else None


def category_id(admin, vocabulary_erc, name):
	library = admin.get(f"/o/headless-asset-library/v1.0/asset-libraries/{SPACE}")
	vocabulary = admin.get(
		f"{TAX}/asset-libraries/{library['id']}/taxonomy-vocabularies/by-external-reference-code/{vocabulary_erc}")
	matches = [c for c in admin.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories") if c["name"] == name]

	if len(matches) != 1:
		raise SystemExit(f"  {vocabulary_erc}: {len(matches)} categories named {name}")

	return int(matches[0]["id"])


def file_erc(admin, title):
	"""The ERC of the file inside the Space's Basic Document: an Attachment field links that one."""

	matches = [d for d in admin.items(f"/o/cms/basic-documents/scopes/{SPACE}") if normalize(d.get("title")) == normalize(title)]

	if len(matches) != 1:
		raise SystemExit(f"  {SPACE}: {len(matches)} files titled like {title}")

	return matches[0]["file"]["externalReferenceCode"]


def submit(admin, christian, item):
	body = dict(item["fields"])
	body["objectEntryFolderExternalReferenceCode"] = item["folder"]

	if item.get("category"):
		body["taxonomyCategoryIds"] = [category_id(admin, *item["category"])]

	if item.get("image"):
		field, title = item["image"]
		body[field] = {"externalReferenceCode": file_erc(admin, title), "scope": {"externalReferenceCode": SPACE}}

	entry = christian.post(f"{item['rest']}/scopes/{SPACE}", body)
	print(f"  submitted by Christian Carter: status {entry['status']['label']} (id {entry['id']})")

	return entry


def review_task(clara, entry_id):
	for _ in range(20):
		for task in clara.items(f"{WORKFLOW}/workflow-tasks/assigned-to-my-roles"):
			if (task.get("objectReviewed") or {}).get("id") == entry_id and not task.get("completed"):
				return task

		for task in clara.items(f"{WORKFLOW}/workflow-tasks/assigned-to-me"):
			if (task.get("objectReviewed") or {}).get("id") == entry_id and not task.get("completed"):
				return task

		time.sleep(3)

	raise SystemExit("  no open review task for Clara Murphy: is the workflow linked (setup_article_workflow.py)?")


def approve(clara, entry, comment):
	task = review_task(clara, entry["id"])

	if (task.get("assigneePerson") or {}).get("emailAddress") != CLARA:
		clara.post(f"{WORKFLOW}/workflow-tasks/{task['id']}/assign-to-me", {"workflowTaskId": task["id"]})

	clara.post(
		f"{WORKFLOW}/workflow-tasks/{task['id']}/change-transition",
		{"comment": comment, "transitionName": "approve", "workflowTaskId": task["id"]})
	print(f"  approved by Clara Murphy: task {task['name']} ({task['id']}), comment {comment!r}")


def main():
	admin = Liferay()
	christian = None
	clara = None
	print(f"Liferay at {admin.base_url}")

	for item in ITEMS:
		title = item["fields"]["title"]
		print(f"{item['level']} {title}")
		entry = find(admin, item["rest"], title)

		if entry and entry["status"]["code"] == 0:
			print(f"  already approved (created by {entry['creator']['name']}): nothing to do")
			continue

		if entry is None:
			christian = christian or Liferay(CHRISTIAN, PERSONA_PASSWORD)
			entry = submit(admin, christian, item)
		elif entry["status"]["code"] != 1:
			raise SystemExit(
				f"  exists with status {entry['status']['label']}: submit it for workflow in the CMS, then run this again")
		else:
			print(f"  already pending (created by {entry['creator']['name']})")

		if entry["status"]["code"] == 0:
			print("  approved on creation: no workflow is linked. Run scripts/setup_article_workflow.py first.")
			continue

		clara = clara or Liferay(CLARA, PERSONA_PASSWORD)
		approve(clara, entry, item["comment"])

		for _ in range(20):
			# Read it back from the Space's list, as the CMS shows it (GET by id reports the last
			# person who acted on the entry as its creator).
			entry = find(admin, item["rest"], title)

			if entry["status"]["code"] == 0:
				break

			time.sleep(2)

		print(f"  now: status {entry['status']['label']}, created by {entry['creator']['name']}")

		if entry["status"]["code"] != 0:
			raise SystemExit("  the entry isn't approved after the transition")


if __name__ == "__main__":
	try:
		sys.exit(main())
	except ApiError as e:
		print(f"\nFAILED: {e}", file=sys.stderr)
		sys.exit(1)
