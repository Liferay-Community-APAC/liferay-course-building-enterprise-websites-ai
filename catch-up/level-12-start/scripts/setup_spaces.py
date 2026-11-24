"""Level 6.1: Clarity's five CMS Spaces, their connection to clarity-public, and their members.

Re-runnable: a Space is created only when its ERC answers 404 (an existing Space is never PUT,
see manage-cms), and membership/role calls are idempotent PUTs.

Usage: python3 -I scripts/setup_spaces.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay

API = "/o/headless-asset-library/v1.0/asset-libraries"
SITE_ERC = "clarity-public"

ADMIN_ROLE = "Asset Library Administrator"  # "Space Administrator" in the UI

SPACES = [
	{
		"description": "Clarity's marketing content: articles, FAQs, announcements, leadership profiles and marketing images.",
		"name": "Marketing",
		"userGroups": ["USERGROUP-MARKETING"],
		"admins": ["PERSONA-CLARAMURPHY"],
		"members": [],
	},
	{
		"description": "Clarity's logos and brand images.",
		"name": "Branding",
		"userGroups": ["USERGROUP-IT"],
		"admins": ["PERSONA-WALTERDOUGLAS"],
		"members": [],
	},
	{
		"description": "Human Resources content: job listings and their images.",
		"name": "HR",
		"userGroups": ["USERGROUP-HUMAN-RESOURCES"],
		"admins": ["PERSONA-HARPERROBERTS"],
		"members": [],
	},
	{
		"description": "Clarity's events and event images.",
		"name": "Events",
		"userGroups": [],
		"admins": ["PERSONA-CLARAMURPHY"],
		"members": ["PERSONA-CHRISTIANCARTER"],
	},
	{
		"description": "Product images used by the Clarity catalog.",
		"name": "Products",
		"userGroups": ["USERGROUP-IT"],
		"admins": ["PERSONA-WALTERDOUGLAS"],
		"members": [],
	},
]


def erc_of(space):
	return "space-" + space["name"].lower()


def upsert_space(lr, space):
	erc = erc_of(space)
	status, body = lr.request("GET", f"{API}/{erc}", raise_errors=False)

	if status == 404:
		body = lr.put(
			f"{API}/{erc}",
			{
				"description": space["description"],
				"externalReferenceCode": erc,
				"name": space["name"],
				"type": "Space",
			})
		print(f"created  {erc} (id {body['id']}, siteId {body['siteId']})")
	elif status == 200:
		print(f"exists   {erc} (id {body['id']}, siteId {body['siteId']})")
	else:
		raise SystemExit(f"GET {erc} -> {status} {body}")

	return body


def main():
	lr = Liferay()

	print("Space roles on this release:")

	for space in SPACES:
		upsert_space(lr, space)

	for role in lr.get(f"{API}/space-marketing/roles").get("items", []):
		print(f"  {role['name']:40} {role['name_i18n'].get('en-US', ''):32} {role['externalReferenceCode']}")

	for space in SPACES:
		erc = erc_of(space)

		lr.put(f"{API}/{erc}/connected-sites/{SITE_ERC}", {"searchable": True})

		for group_erc in space["userGroups"]:
			lr.request("PUT", f"{API}/{erc}/user-groups/{group_erc}")

		for user_erc in space["admins"] + space["members"]:
			lr.request("PUT", f"{API}/{erc}/user-accounts/{user_erc}")

		for user_erc in space["admins"]:
			lr.put(f"{API}/{erc}/user-accounts/{user_erc}/roles", [{"name": ADMIN_ROLE}])

	print()
	print("Read-back:")

	for space in SPACES:
		erc = erc_of(space)
		library = lr.get(f"{API}/{erc}")
		sites = lr.get(f"{API}/{erc}/connected-sites").get("items", [])
		groups = lr.get(f"{API}/{erc}/user-groups?nestedFields=roles").get("items", [])
		users = lr.get(f"{API}/{erc}/user-accounts?nestedFields=roles").get("items", [])

		print(f"- {library['name']} ({erc}, id {library['id']}, siteId {library['siteId']}): {library.get('description')}")
		print("    connected sites: " + json.dumps(
			[{"site": s.get("externalReferenceCode") or s.get("name"), "searchable": s.get("searchable")} for s in sites]))
		print("    user groups:     " + json.dumps(
			[{"name": g.get("name"), "roles": [r.get("name") for r in g.get("roles") or []]} for g in groups]))
		print("    users:           " + json.dumps(
			[{"name": u.get("name") or u.get("alternateName"), "roles": [r.get("name") for r in u.get("roles") or []]} for u in users]))


if __name__ == "__main__":
	sys.exit(main())
