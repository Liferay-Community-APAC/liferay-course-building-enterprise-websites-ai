"""Level 6.2: Clarity's CMS structures, each accepted only in its Space, and the Space-role access.

What it does (re-runnable, everything by ERC):

1. Creates each structure (depot-scoped Object Definition, published with status 0) when its
   ERC answers 404; on a re-run, adds any field missing by name and re-applies the accepted Space.
2. Space roles (depot roles, scope 3 = "in every Space where the user holds the role"):
   Asset Library Member gets ADD_OBJECT_ENTRY on each structure and on Basic Documents,
   VIEW + UPDATE on their entries, and VIEW + ADD_ENTRY on entry folders. No DELETE.
3. Each Space's CMS default permissions (applied to every new entry and folder): Owner and
   Content Reviewer lose DELETE, so only Space Administrators can delete. Members get UPDATE.
4. Reads every structure back (fields and REST path).

Usage: python3 -I scripts/setup_structures.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay, q

OBJ = "/o/object-admin/v1.0/object-definitions"
ROLES = "/o/headless-admin-user/v1.0/roles"

IMAGE_EXTENSIONS = "jpeg, jpg, png, gif, svg, webp"


def text(name, label, required=False):
	return {"businessType": "Text", "DBType": "String", "label": label, "localized": True, "name": name, "required": required}


def long_text(name, label, required=False):
	return {"businessType": "LongText", "DBType": "Clob", "label": label, "localized": True, "name": name, "required": required}


def rich_text(name, label, required=False):
	return {"businessType": "RichText", "DBType": "Clob", "label": label, "localized": True, "name": name, "required": required}


def date_time(name, label, required=False):
	return {
		"businessType": "DateTime", "DBType": "DateTime", "label": label, "localized": False, "name": name,
		"objectFieldSettings": [{"name": "timeStorage", "value": "useInputAsEntered"}], "required": required}


def space_file(name, label, extensions=IMAGE_EXTENSIONS):
	"""An Attachment that links an existing Basic Document of the Space (no copy)."""

	return {
		"businessType": "Attachment", "DBType": "Long", "label": label, "localized": False, "name": name,
		"objectFieldSettings": [
			{"name": "acceptedFileExtensions", "value": extensions},
			{"name": "fileSource", "value": "CMSBasicDocument"},
			{"name": "maximumFileSize", "value": 100},
		],
		"required": False}


def uploaded_file(name, label, extensions):
	"""The file of a file type (uploaded with the entry), like CMSBasicDocument.file."""

	return {
		"businessType": "Attachment", "DBType": "Long", "label": label, "localized": False, "name": name,
		"objectFieldSettings": [
			{"name": "acceptedFileExtensions", "value": extensions},
			{"name": "fileSource", "value": "userComputerToCMSBasicDocument"},
			{"name": "maximumFileSize", "value": 100},
			{"name": "showFilesInLibrary", "value": False},
		],
		"required": True}


STRUCTURES = [
	{
		"erc": "ARTICLE_STRUCTURE", "name": "Article", "label": "Article", "plural": "Articles", "space": "space-marketing",
		"fields": [
			text("title", "Title", True), text("headline", "Headline"), rich_text("content", "Content"),
			space_file("image", "Image")],
	},
	{
		"erc": "FAQ_STRUCTURE", "name": "FAQ", "label": "FAQ", "plural": "FAQs", "space": "space-marketing",
		"fields": [text("title", "Question", True), rich_text("answer", "Answer")],
	},
	{
		"erc": "ANNOUNCEMENT_STRUCTURE", "name": "Announcement", "label": "Announcement", "plural": "Announcements",
		"space": "space-marketing",
		"fields": [
			text("title", "Title", True), text("message", "Message", True), text("linkText", "Link Text", True),
			text("linkURL", "Link URL")],
	},
	{
		"erc": "LEADERSHIP_PROFILE_STRUCTURE", "name": "LeadershipProfile", "label": "Leadership Profile",
		"plural": "Leadership Profiles", "space": "space-marketing",
		"fields": [
			text("title", "Name", True), text("jobTitle", "Job Title"), rich_text("bio", "Bio"),
			space_file("portrait", "Portrait")],
	},
	{
		"erc": "JOB_LISTING_STRUCTURE", "name": "JobListing", "label": "Job Listing", "plural": "Job Listings",
		"space": "space-hr",
		"fields": [
			text("title", "Title", True), rich_text("roleOverview", "Role Overview"),
			rich_text("keyResponsibilities", "Key Responsibilities"),
			rich_text("qualificationsAndSkills", "Qualifications and Skills")],
	},
	{
		"erc": "EVENT_INFORMATION_STRUCTURE", "name": "EventInformation", "label": "Event Information",
		"plural": "Event Information", "space": "space-events",
		"fields": [
			text("title", "Title", True), rich_text("subtitleDescription", "Subtitle Description"),
			long_text("location", "Location"), date_time("startDateTime", "Start Date and Time"),
			date_time("endDateTime", "End Date and Time"), text("ctaLink", "CTA Link")],
	},
	{
		"erc": "EVENT_IMAGE_STRUCTURE", "name": "EventImage", "label": "Event Image", "plural": "Event Images",
		"space": "space-events", "fileType": True,
		"fields": [
			text("title", "Title"), uploaded_file("file", "File", "jpeg, jpg, png"),
			long_text("descriptionContext", "Description Context")],
	},
]


def snake(name):
	"""linkURL -> LINK_URL, qualificationsAndSkills -> QUALIFICATIONS_AND_SKILLS."""

	out = ""

	for i, ch in enumerate(name):
		if ch.isupper() and out and (name[i - 1].islower() or (i + 1 < len(name) and name[i + 1].islower())):
			out += "_"

		out += ch.upper()

	return out


def field_body(structure, field):
	body = dict(field)
	body["externalReferenceCode"] = f"{structure['erc']}_{snake(field['name'])}"
	body["indexed"] = True
	body["label"] = {"en_US": field["label"]}

	if field["businessType"] in ("Text", "LongText", "RichText"):
		body["indexedAsKeyword"] = False

	return body


def definition_body(structure):
	file_type = structure.get("fileType", False)

	return {
		"active": True,
		"enableCategorization": True,
		"enableComments": not file_type,
		"enableFriendlyURLCustomization": True,
		"enableIndexSearch": True,
		"enableLocalization": True,
		"enableObjectEntryDraft": True,
		"enableObjectEntryHistory": False,
		"enableObjectEntrySchedule": True,
		"enableObjectEntryVersioning": True,
		"externalReferenceCode": structure["erc"],
		"label": {"en_US": structure["label"]},
		"name": structure["name"],
		"objectDefinitionSettings": [
			{"name": "acceptedGroupExternalReferenceCodes", "value": structure["space"]},
		] + ([{"name": "domain", "value": "space"}] if file_type else []),
		"objectFields": [field_body(structure, f) for f in structure["fields"]],
		"objectFolderExternalReferenceCode": "L_CMS_FILE_TYPES" if file_type else "L_CMS_CONTENT_STRUCTURES",
		"pluralLabel": {"en_US": structure["plural"]},
		"scope": "depot",
		"status": {"code": 0},
		"titleObjectFieldName": "title",
	}


def upsert_structure(lr, structure):
	status, existing = lr.request("GET", f"{OBJ}/by-external-reference-code/{structure['erc']}", raise_errors=False)

	if status == 404:
		created = lr.post(OBJ, definition_body(structure))
		print(f"created  {structure['erc']} (id {created['id']}, {created['restContextPath']})")

		return created

	if status != 200:
		raise SystemExit(f"GET {structure['erc']} -> {status} {existing}")

	fields = {f["name"]: f for f in existing["objectFields"]}

	for field in structure["fields"]:
		erc = f"{structure['erc']}_{snake(field['name'])}"

		if field["name"] in fields and fields[field["name"]]["externalReferenceCode"] != erc:
			lr.patch(f"/o/object-admin/v1.0/object-fields/{fields[field['name']]['id']}", {"externalReferenceCode": erc})
			print(f"  field {field['name']} of {structure['erc']}: ERC set to {erc}")

		if field["name"] not in fields:
			lr.post(f"{OBJ}/{existing['id']}/object-fields", field_body(structure, field))
			print(f"  added field {field['name']} to {structure['erc']}")

	settings = [s for s in existing.get("objectDefinitionSettings", [])
		if s["name"] not in ("acceptAllGroups", "acceptedGroupExternalReferenceCodes")]
	settings.append({"name": "acceptedGroupExternalReferenceCodes", "value": structure["space"]})
	lr.patch(f"{OBJ}/{existing['id']}", {"enableCategorization": True, "objectDefinitionSettings": settings})
	print(f"exists   {structure['erc']} (id {existing['id']}, {existing['restContextPath']})")

	return lr.get(f"{OBJ}/{existing['id']}")


def merge_role_permissions(lr, role_erc, grants):
	"""Adds scope-3 grants to a Space role, re-sending every existing row (the PATCH replaces the list)."""

	role = lr.get(f"{ROLES}/by-external-reference-code/{role_erc}")
	rows = {}

	for p in role.get("rolePermissions", []):
		rows[(p["resourceName"], p["scope"], str(p["primaryKey"]))] = set(p["actionIds"])

	for resource, actions in grants:
		rows.setdefault((resource, 3, "0"), set()).update(actions)

	body = [
		{"actionIds": sorted(actions), "primaryKey": key[2], "resourceName": key[0], "scope": key[1]}
		for key, actions in rows.items()]
	lr.patch(f"{ROLES}/{role['id']}", {"rolePermissions": body})


def update_default_permissions(lr, space_ercs):
	"""Per Space: only Space Administrators (and CMS Administrators) keep DELETE on new entries and folders."""

	spaces = {lr.get(f"/o/headless-asset-library/v1.0/asset-libraries/{erc}")["siteId"]: erc for erc in space_ercs}

	for item in lr.items("/o/cms/default-permissions"):
		if item.get("depotGroupId") not in spaces:
			continue

		perms = json.loads(item["defaultPermissions"])
		before = json.dumps(perms, sort_keys=True)

		for section, roles in perms.items():
			for role in ("Owner", "Asset Library Content Reviewer"):
				if role in roles:
					roles[role] = [a for a in roles[role] if a != "DELETE"]

			member = roles.setdefault("Asset Library Member", [])

			for action in (["ADD_ENTRY"] if section == "OBJECT_ENTRY_FOLDERS" else ["UPDATE"]):
				if action not in member:
					member.append(action)

		if json.dumps(perms, sort_keys=True) != before:
			lr.patch(f"/o/cms/default-permissions/{item['id']}", {"defaultPermissions": json.dumps(perms)})
			print(f"default permissions updated for {spaces[item['depotGroupId']]}")
		else:
			print(f"default permissions already set for {spaces[item['depotGroupId']]}")


def main():
	lr = Liferay()
	definitions = [upsert_structure(lr, s) for s in STRUCTURES]

	basic_document = lr.get(f"{OBJ}/by-external-reference-code/L_CMS_BASIC_DOCUMENT")
	grants = [("com.liferay.object.model.ObjectEntryFolder", ["ADD_ENTRY", "VIEW"])]

	for definition in definitions + [basic_document]:
		grants.append((f"com.liferay.object#{definition['id']}", ["ADD_OBJECT_ENTRY"]))
		grants.append((definition["className"], ["UPDATE", "VIEW"]))

	merge_role_permissions(lr, "L_ASSET_LIBRARY_MEMBER", grants)
	print("Space Member role: ADD_OBJECT_ENTRY, VIEW, UPDATE on the structures and Basic Documents; ADD_ENTRY on folders")

	update_default_permissions(lr, sorted({s["space"] for s in STRUCTURES} | {"space-branding", "space-products"}))

	print()

	for definition in definitions:
		d = lr.get(f"{OBJ}/by-external-reference-code/{definition['externalReferenceCode']}")
		settings = {s["name"]: s["value"] for s in d.get("objectDefinitionSettings", [])}
		print(
			f"{d['externalReferenceCode']}: {d['label']['en_US']} | {d['status']['label']} | REST {d['restContextPath']}"
			f"/scopes/{settings.get('acceptedGroupExternalReferenceCodes')} | folder {d['objectFolderExternalReferenceCode']}"
			f" | title field {d['titleObjectFieldName']} | categorization {d['enableCategorization']}")

		for f in d["objectFields"]:
			if f.get("system") and f["name"] != "title":
				continue

			fs = {s["name"]: s["value"] for s in f.get("objectFieldSettings", [])}
			extra = ""

			if f["businessType"] == "Attachment":
				extra = f" fileSource={fs.get('fileSource')} ext={fs.get('acceptedFileExtensions')}"
			elif f["businessType"] == "DateTime":
				extra = f" timeStorage={fs.get('timeStorage')}"

			print(
				f"    {f['name']:24} {f['businessType']:10} required={str(f['required']).lower():5}"
				f" erc={f['externalReferenceCode']}{extra}")


if __name__ == "__main__":
	sys.exit(main())
