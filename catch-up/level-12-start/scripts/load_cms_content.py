"""Level 6.4: load Clarity's content and files into the CMS Spaces (re-runnable, upsert by ERC).

Reads context-source/ (see context-source/README.md) and, per Space:

- Marketing: Files folders "Marketing Images" (every file in assets/marketing/) and "Leadership"
  (the leadership portraits); Contents folders "Articles", "FAQ", "Announcements", "Leadership".
  Articles link their image and carry an Articles category; FAQs carry their FAQ category.
- HR: Contents folder "Job Listings"; each listing carries its Region, Location and Job Position.
- Events: Files folder "Venues Gallery" with the Event Image; Contents folder "Events" with the event.
- Branding, Products: every file of assets/branding/ and assets/products/ in the Space's Files.

Each item is compared with what is stored first and written only when it differs (every write
adds a version). Then Guest gets VIEW on every approved entry, and VIEW + DOWNLOAD_FILE on every
file (Basic Documents and Event Images); every other role's grant is kept as it is.

Finally, each public Space's CMS default permissions (/o/cms/default-permissions, plus the copies
its existing folders took when they were created) give Guest VIEW on new Contents entries and
VIEW + DOWNLOAD_FILE on new Files, so entries created later (and approved through workflow) are
public too. Folders themselves get no Guest grant.

Usage: python3 -I scripts/load_cms_content.py
"""

import base64
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

SRC = os.path.join(ROOT, "context-source")
TAX = "/o/headless-admin-taxonomy/v1.0"
FOLDERS = "/o/headless-object/v1.0"
BASIC_DOCUMENTS = "/o/cms/basic-documents"

STATS = {"created": 0, "updated": 0, "unchanged": 0}


def slug(text):
	return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def load_json(name):
	with open(os.path.join(SRC, "content", name), encoding="utf8") as f:
		return json.load(f)


def html(value):
	"""RichText stores newlines as spaces: send it that way so a re-run compares equal."""

	return re.sub(r"\s*\n\s*", " ", value or "").strip()


def humanize(file_name):
	return re.sub(r"[-_]+", " ", os.path.splitext(file_name)[0]).strip().capitalize()


class Loader:

	def __init__(self, lr):
		self.lr = lr
		self.categories = {}
		self.guest_entries = []  # (permissions path, actions)

	# Folders ------------------------------------------------------------------------------------

	def folder(self, space, erc, title, parent):
		status, body = self.lr.request(
			"GET", f"{FOLDERS}/scopes/{space}/object-entry-folder/by-external-reference-code/{erc}", raise_errors=False)

		if status == 404:
			body = self.lr.post(
				f"{FOLDERS}/scopes/{space}/object-entry-folders",
				{"externalReferenceCode": erc, "parentObjectEntryFolderExternalReferenceCode": parent, "title": title})
			print(f"  folder created  {space}/{title} ({erc})")
		elif status != 200:
			raise SystemExit(f"folder {erc}: {status} {body}")

		return body

	# Files --------------------------------------------------------------------------------------

	def stored_size(self, file_value):
		if not file_value or not file_value.get("id"):
			return None

		status, doc = self.lr.request("GET", f"/o/headless-delivery/v1.0/documents/{file_value['id']}", raise_errors=False)

		return doc.get("sizeInBytes") if status == 200 else None

	def upload(self, space, path, erc, folder_erc, rest=BASIC_DOCUMENTS, extra=None, title=None, download_action="DOWNLOAD_FILE"):
		"""Upserts a file-backed entry (Basic Document or a custom file type) with its file ERC = <erc>-file."""

		full = os.path.join(SRC, path)
		name = os.path.basename(full)
		size = os.path.getsize(full)
		title = title or humanize(name)
		extra = extra or {}
		url = f"{rest}/scopes/{space}/by-external-reference-code/{erc}"
		status, current = self.lr.request("GET", url, raise_errors=False)

		same = (
			status == 200
			and current.get("title") == title
			and current.get("objectEntryFolderExternalReferenceCode") == folder_erc
			and (current.get("file") or {}).get("name") == name
			and (current.get("file") or {}).get("externalReferenceCode") == erc + "-file"
			and all((current.get(k) or "") == v for k, v in extra.items())
			and self.stored_size(current.get("file")) == size)

		if same:
			STATS["unchanged"] += 1
			entry = current
		else:
			with open(full, "rb") as f:
				content = base64.b64encode(f.read()).decode()

			body = {
				"externalReferenceCode": erc,
				"file": {"externalReferenceCode": erc + "-file", "fileBase64": content, "name": name},
				"objectEntryFolderExternalReferenceCode": folder_erc,
				"title": title,
			}
			body.update(extra)
			entry = self.lr.put(url, body)
			STATS["created" if status == 404 else "updated"] += 1

		if entry["status"]["code"] == 0:
			self.guest_entries.append((f"{rest}/{entry['id']}/permissions", ["VIEW", download_action]))

		return entry

	# Entries ------------------------------------------------------------------------------------

	def category_ids(self, space, pairs):
		"""pairs: [(vocabulary ERC, category name)] -> category ids (numbers)."""

		ids = []

		for vocabulary_erc, name in pairs:
			key = (space, vocabulary_erc)

			if key not in self.categories:
				library = self.lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{space}")
				vocabulary = self.lr.get(
					f"{TAX}/asset-libraries/{library['id']}/taxonomy-vocabularies/by-external-reference-code/{vocabulary_erc}")
				self.categories[key] = {
					c["name"]: int(c["id"]) for c in self.lr.items(f"{TAX}/taxonomy-vocabularies/{vocabulary['id']}/taxonomy-categories")}

			ids.append(self.categories[key][name])

		return sorted(ids)

	def entry(self, rest, space, erc, folder_erc, fields, category_ids=None, links=None):
		"""Upserts a content entry. links: {field: file ERC} for CMSBasicDocument attachments."""

		url = f"{rest}/scopes/{space}/by-external-reference-code/{erc}"
		status, current = self.lr.request("GET", url, raise_errors=False)

		def normalize(value):
			if isinstance(value, str):
				value = re.sub(r"\.000$", "", value)  # DateTime reads back with milliseconds

			return value

		same = status == 200 and current.get("objectEntryFolderExternalReferenceCode") == folder_erc

		if same:
			for key, value in fields.items():
				stored = normalize(current.get(key))
				wanted = normalize(value.rstrip("Z") if key.endswith("DateTime") else value)

				if (stored or "") != (wanted or ""):
					same = False

			for key, file_erc in (links or {}).items():
				if (current.get(key) or {}).get("externalReferenceCode") != file_erc:
					same = False

			if category_ids is not None:
				stored_ids = sorted(int(b["taxonomyCategoryId"]) for b in current.get("taxonomyCategoryBriefs") or [])

				if stored_ids != category_ids:
					same = False

		if same:
			STATS["unchanged"] += 1
			result = current
		else:
			body = dict(fields)
			body["externalReferenceCode"] = erc
			body["objectEntryFolderExternalReferenceCode"] = folder_erc

			for key, file_erc in (links or {}).items():
				body[key] = {"externalReferenceCode": file_erc, "scope": {"externalReferenceCode": space}}

			if category_ids is not None:
				body["taxonomyCategoryIds"] = category_ids

			result = self.lr.put(url, body)
			STATS["created" if status == 404 else "updated"] += 1

		if result["status"]["code"] == 0:
			self.guest_entries.append((f"{rest}/{result['id']}/permissions", ["VIEW"]))

		return result

	# Guest --------------------------------------------------------------------------------------

	def grant_guest(self):
		changed = 0

		for path, actions in self.guest_entries:
			rows = self.lr.get(path).get("items", [])
			guest = [r for r in rows if r["roleName"] == "Guest"]

			if guest and sorted(guest[0]["actionIds"]) == sorted(actions):
				continue

			body = [
				{"actionIds": r["actionIds"], "roleExternalReferenceCode": r.get("roleExternalReferenceCode"), "roleName": r["roleName"]}
				for r in rows if r["roleName"] != "Guest" and r["actionIds"]]
			body.append({"actionIds": actions, "roleExternalReferenceCode": "L_GUEST", "roleName": "Guest"})
			self.lr.put(path, body)
			changed += 1

		print(f"Guest grants: {len(self.guest_entries)} items checked, {changed} changed")


def load_marketing(loader):
	space = "space-marketing"
	print(space)

	loader.folder(space, "folder-marketing-images", "Marketing Images", "L_FILES")
	loader.folder(space, "folder-marketing-files-leadership", "Leadership", "L_FILES")

	for folder_erc, title in (
			("folder-marketing-articles", "Articles"), ("folder-marketing-faq", "FAQ"),
			("folder-marketing-announcements", "Announcements"), ("folder-marketing-leadership", "Leadership")):
		loader.folder(space, folder_erc, title, "L_CONTENTS")

	images = {}

	for name in sorted(os.listdir(os.path.join(SRC, "assets", "marketing"))):
		if name.startswith("."):
			continue

		erc = "marketing-image-" + slug(os.path.splitext(name)[0])
		loader.upload(space, f"assets/marketing/{name}", erc, "folder-marketing-images")
		images[f"assets/marketing/{name}"] = erc + "-file"

	portraits = {}

	for profile in load_json("leadership-profiles.json"):
		erc = "leadership-portrait-" + slug(profile["name"])
		loader.upload(space, profile["image"], erc, "folder-marketing-files-leadership", title=profile["name"])
		portraits[profile["image"]] = erc + "-file"

	for article in load_json("articles.json"):
		loader.entry(
			"/o/c/articles", space, "article-" + slug(article["title"])[:80], "folder-marketing-articles",
			{"content": html(article["content"]), "headline": article["headline"], "title": article["title"]},
			category_ids=loader.category_ids(space, [("VOCABULARY_ARTICLES", article["category"])]),
			links={"image": images[article["image"]]})

	for faq in load_json("faqs.json"):
		loader.entry(
			"/o/c/faqs", space, "faq-" + slug(faq["question"])[:80], "folder-marketing-faq",
			{"answer": html(faq["answer"]), "title": faq["question"]},
			category_ids=loader.category_ids(space, [("VOCABULARY_FAQ", faq["category"])]))

	for announcement in load_json("announcements.json"):
		loader.entry(
			"/o/c/announcements", space, "announcement-" + slug(announcement["title"]), "folder-marketing-announcements",
			{"linkText": announcement["linkText"], "linkURL": announcement["linkPage"], "message": announcement["message"],
			 "title": announcement["title"]})

	for profile in load_json("leadership-profiles.json"):
		loader.entry(
			"/o/c/leadershipprofiles", space, "leadership-profile-" + slug(profile["name"]), "folder-marketing-leadership",
			{"bio": html(profile["bio"]), "jobTitle": profile["title"], "title": profile["name"]},
			links={"portrait": portraits[profile["image"]]})


def load_hr(loader):
	space = "space-hr"
	print(space)
	loader.folder(space, "folder-hr-job-listings", "Job Listings", "L_CONTENTS")

	for job in load_json("job-listings.json"):
		loader.entry(
			"/o/c/joblistings", space, "job-listing-" + slug(job["title"]), "folder-hr-job-listings",
			{"keyResponsibilities": html(job["keyResponsibilities"]),
			 "qualificationsAndSkills": html(job["qualificationsAndSkills"]), "roleOverview": html(job["roleOverview"]),
			 "title": job["title"]},
			category_ids=loader.category_ids(space, [
				("VOCABULARY_REGION", job["region"]), ("VOCABULARY_LOCATION", job["location"]),
				("VOCABULARY_JOB_POSITIONS", job["jobPosition"])]))


def load_events(loader):
	space = "space-events"
	print(space)
	loader.folder(space, "folder-events-venues-gallery", "Venues Gallery", "L_FILES")
	loader.folder(space, "folder-events-events", "Events", "L_CONTENTS")

	for event in load_json("events.json"):
		image = event["image"]
		loader.upload(
			space, image["file"], "event-image-" + slug(image["title"]), "folder-events-venues-gallery",
			rest="/o/c/eventimages", title=image["title"], extra={"descriptionContext": image["descriptionContext"]})
		loader.entry(
			"/o/c/eventinformations", space, "event-" + slug(event["title"]), "folder-events-events",
			{"ctaLink": event["ctaLink"], "endDateTime": event["endDateTime"] + ":00Z", "location": event["location"],
			 "startDateTime": event["startDateTime"] + ":00Z", "subtitleDescription": html(event["subtitleDescription"]),
			 "title": event["title"]})


def load_files_only(loader, space, directory):
	print(space)

	for name in sorted(os.listdir(os.path.join(SRC, "assets", directory))):
		if not name.startswith("."):
			loader.upload(space, f"assets/{directory}/{name}", f"{directory}-" + slug(os.path.splitext(name)[0]), "L_FILES")


PUBLIC_SPACES = ("space-marketing", "space-hr", "space-events", "space-branding", "space-products")
GUEST_DEFAULTS = {"L_CONTENTS": ["VIEW"], "L_FILES": ["DOWNLOAD_FILE", "VIEW"]}


def set_default_permissions(lr):
	"""Adds Guest to each public Space's CMS default permissions (and its folders' copies)."""

	group_ids = {lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{space}")["siteId"] for space in PUBLIC_SPACES}
	checked = changed = 0

	for item in lr.items("/o/cms/default-permissions"):
		is_space = item.get("className") == "com.liferay.depot.model.DepotEntry" and item.get(
			"classExternalReferenceCode") in PUBLIC_SPACES
		is_folder = item.get("className") == "com.liferay.object.model.ObjectEntryFolder" and item.get(
			"depotGroupId") in group_ids

		if not (is_space or is_folder):
			continue

		checked += 1
		permissions = json.loads(item["defaultPermissions"])
		dirty = False

		for section, actions in GUEST_DEFAULTS.items():
			roles = permissions.setdefault(section, {})

			if sorted(roles.get("Guest", [])) != actions:
				roles["Guest"] = actions
				dirty = True

		if dirty:
			lr.patch(f"/o/cms/default-permissions/{item['id']}", {"defaultPermissions": json.dumps(permissions)})
			changed += 1

	print(f"Default permissions: {checked} Space/folder defaults checked, {changed} changed")


def count(lr):
	print()
	print("Entries and files per Space and folder:")

	for space in ("space-marketing", "space-branding", "space-hr", "space-events", "space-products"):
		library = lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{space}")

		folders = list(lr.items(f"{FOLDERS}/scopes/{space}/object-entry-folders"))

		def walk(folder, path):
			detail = lr.get(
				f"{FOLDERS}/object-entry-folders/{folder['id']}?nestedFields=numberOfObjectEntries,numberOfObjectEntryFolders")
			print(f"  {library['name']:10} {path:34} {detail.get('numberOfObjectEntries', 0):3} items")

			for child in folders:
				if child.get("parentObjectEntryFolderId") == folder["id"]:
					walk(child, f"{path}/{child['title']}")

		for root_erc, label in (("L_CONTENTS", "Contents"), ("L_FILES", "Files")):
			walk(next(f for f in folders if f["externalReferenceCode"] == root_erc), label)


def main():
	lr = Liferay()
	loader = Loader(lr)

	load_marketing(loader)
	load_hr(loader)
	load_events(loader)
	load_files_only(loader, "space-branding", "branding")
	load_files_only(loader, "space-products", "products")

	print(f"Items: {STATS['created']} created, {STATS['updated']} updated, {STATS['unchanged']} unchanged")
	loader.grant_guest()
	set_default_permissions(lr)
	count(lr)


if __name__ == "__main__":
	sys.exit(main())
