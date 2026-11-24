"""Level 2: Clarity's two sites, their members, the public site's settings, and the Marketing
Coordinator role's permissions (re-runnable; everything compared before it is written).

1. Sites (2.1): clarity-public (/clarity) and clarity-distributor-portal (/distributor-portal),
   blank, created with POST /sites when their ERC answers 404. An existing site is left as is.
2. Members (2.2) of clarity-public: Walter Douglas Site Administrator; Christian Carter and Harper
   Roberts Site Content Contributor; Ian Miller and Clara Murphy Site Member (L_SITE_MEMBER).
   Each association also makes the user a direct site member. Nobody is removed.
3. Site settings (2.3): description, open membership, English and Spanish only, and the
   accessibility menu, through scripts/site_settings.py (deploy_site.sh re-runs it after each
   deploy). The virtual host has no API: set it in the UI (see the README).
4. Marketing Coordinator (2.4): company-scope (scope 1) Collections and Categories permissions,
   added to the role's existing rows (nothing is removed; PATCH /roles only adds).

Usage: python3 -I scripts/setup_sites.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ApiError, Liferay, q
import site_settings

SITE_API = "/o/headless-admin-site/v1.0/sites"
USER_API = "/o/headless-admin-user/v1.0"

PUBLIC = "clarity-public"
SITES = [
	(PUBLIC, "Clarity Public Enterprise Website", "/clarity"),
	("clarity-distributor-portal", "Clarity Distributor Portal", "/distributor-portal"),
]

# (persona ERC, built-in role ERC, or None for the Site Content Contributor role, looked up by name)
CONTRIBUTOR = "Site Content Contributor"
MEMBERS = [
	("PERSONA-WALTERDOUGLAS", "L_SITE_ADMINISTRATOR"),
	("PERSONA-CHRISTIANCARTER", None),
	("PERSONA-HARPERROBERTS", None),
	("PERSONA-IANMILLER", "L_SITE_MEMBER"),
	("PERSONA-CLARAMURPHY", "L_SITE_MEMBER"),
]

MARKETING_COORDINATOR = "Marketing Coordinator"
MARKETING_COORDINATOR_GRANTS = [
	# Collections
	("com_liferay_asset_list_web_portlet_AssetListPortlet", ["ACCESS_IN_CONTROL_PANEL", "VIEW"]),
	("com.liferay.asset.list", ["ADD_ASSET_LIST_ENTRY"]),
	("com.liferay.asset.list.model.AssetListEntry", ["UPDATE", "VIEW"]),
	# Categories
	("com_liferay_asset_categories_admin_web_portlet_AssetCategoriesAdminPortlet", ["ACCESS_IN_CONTROL_PANEL", "VIEW"]),
	("com.liferay.asset.categories", ["ADD_CATEGORY", "ADD_VOCABULARY"]),
	("com.liferay.asset.kernel.model.AssetCategory", ["UPDATE", "VIEW"]),
]


# 1. Sites ---------------------------------------------------------------------------------------

def ensure_sites(lr):
	print("Sites:")
	result = {}

	for erc, name, url in SITES:
		status, site = lr.request("GET", f"{SITE_API}/{erc}", raise_errors=False)

		if status == 404:
			site = lr.post(SITE_API, {"externalReferenceCode": erc, "friendlyUrlPath": url, "name": name})
			print(f"  created   {erc}: {name} {url} (id {site['id']})")
		elif status == 200:
			print(f"  exists    {erc}: {site.get('name')} {site.get('friendlyUrlPath')} (id {site['id']}), left as is")

			if site.get("friendlyUrlPath") != url:
				print(f"  WARNING   {erc} has friendly URL {site.get('friendlyUrlPath')}, the workbook expects {url}")
		else:
			raise ApiError(status, "GET", f"{SITE_API}/{erc}", str(site))

		result[erc] = site

	return result


# 2. Members and site roles ----------------------------------------------------------------------

def site_roles_of(user, site_id):
	for brief in user.get("siteBriefs") or []:
		if str(brief.get("id")) == str(site_id):
			return [r.get("name") for r in brief.get("roleBriefs") or []]

	return None


def ensure_members(lr, site):
	print(f"Members of {PUBLIC}:")
	roles = list(lr.items(f"{USER_API}/roles"))
	by_erc = {r.get("externalReferenceCode"): r for r in roles}
	by_name = {r["name"]: r for r in roles}

	if CONTRIBUTOR not in by_name:
		raise SystemExit(f"No role named {CONTRIBUTOR!r}: run scripts/setup_people.py first.")

	for user_erc, role_erc in MEMBERS:
		role = by_erc.get(role_erc) if role_erc else by_name[CONTRIBUTOR]

		if role is None:
			raise SystemExit(f"No role with ERC {role_erc} on this instance.")

		status, user = lr.request(
			"GET", f"{USER_API}/user-accounts/by-external-reference-code/{q(user_erc)}", raise_errors=False)

		if status == 404:
			raise SystemExit(f"No user {user_erc}: run scripts/setup_people.py first.")
		elif status != 200:
			raise ApiError(status, "GET", f"user {user_erc}", str(user))

		current = site_roles_of(user, site["id"])

		if current is not None and role["name"] in current:
			print(f"  unchanged {user_erc}: {role['name']}")
			continue

		lr.request(
			"POST",
			f"{USER_API}/roles/by-external-reference-code/{q(role['externalReferenceCode'])}"
			f"/association/user-account/{user['id']}/site/{site['id']}")
		print(f"  assigned  {user_erc}: {role['name']}")


# 4. Marketing Coordinator permissions ------------------------------------------------------------

def ensure_marketing_coordinator(lr):
	print(f"{MARKETING_COORDINATOR} permissions (company scope):")
	match = [r for r in lr.items(f"{USER_API}/roles") if r["name"] == MARKETING_COORDINATOR]

	if not match:
		raise SystemExit(f"No role named {MARKETING_COORDINATOR!r}: run scripts/setup_people.py first.")

	role = lr.get(f"{USER_API}/roles/{match[0]['id']}")
	rows = {}

	for p in role.get("rolePermissions") or []:
		rows[(p["resourceName"], p["scope"], str(p.get("primaryKey")))] = set(p.get("actionIds") or [])

	def company_row(resource):
		for key in rows:
			if key[0] == resource and key[1] == 1:
				return key

		return None

	missing = []

	for resource, actions in MARKETING_COORDINATOR_GRANTS:
		key = company_row(resource)
		have = rows.get(key, set())
		absent = [a for a in actions if a not in have]

		if absent:
			missing.append((resource, absent))

			if key is None:
				key = (resource, 1, "0")

			rows.setdefault(key, set()).update(absent)

	if not missing:
		print("  unchanged (every grant already present)")
	else:
		for resource, absent in missing:
			print(f"  adding    {resource}: {', '.join(absent)}")

		body = [
			{"actionIds": sorted(actions), "primaryKey": key[2], "resourceName": key[0], "scope": key[1]}
			for key, actions in rows.items()]
		lr.patch(f"{USER_API}/roles/{role['id']}", {"rolePermissions": body})

	role = lr.get(f"{USER_API}/roles/{role['id']}")
	stored = {
		p["resourceName"]: set(p.get("actionIds") or [])
		for p in role.get("rolePermissions") or [] if p["scope"] == 1}

	for resource, actions in MARKETING_COORDINATOR_GRANTS:
		lacking = [a for a in actions if a not in stored.get(resource, set())]

		if lacking:
			raise SystemExit(f"  read-back: {resource} still lacks {', '.join(lacking)}")

		print(f"  read-back {resource}: {', '.join(sorted(stored[resource]))}")


# Read-back --------------------------------------------------------------------------------------

def read_back(lr, sites):
	print()
	print("Read-back:")

	for erc, _, _ in SITES:
		site = lr.get(f"{SITE_API}/{erc}")
		print(f"  site {site['id']:>8} {site.get('externalReferenceCode')}: {site.get('name')} {site.get('friendlyUrlPath')}")

	site_id = sites[PUBLIC]["id"]
	expected = {user_erc for user_erc, _ in MEMBERS}
	print(f"  members of {PUBLIC}:")

	for item in lr.items(f"{USER_API}/sites/{site_id}/user-accounts"):
		user = lr.get(f"{USER_API}/user-accounts/{item['id']}")
		roles = site_roles_of(user, site_id) or []
		groups = ", ".join(g.get("name", "") for g in user.get("userGroupBriefs") or [])
		note = "" if user.get("externalReferenceCode") in expected else "  (not one of the five personas; the site's creator is expected)"
		print(f"    {user.get('emailAddress', ''):45} groups: {groups:18} site roles: {', '.join(roles)}{note}")


def main():
	lr = Liferay()
	print(f"Liferay at {lr.base_url}")

	sites = ensure_sites(lr)
	ensure_members(lr, sites[PUBLIC])
	site_settings.apply(lr, sites)
	ensure_marketing_coordinator(lr)
	read_back(lr, sites)

	print()
	print("Done: Level 2 sites are in place. Still by hand: the virtual host (Level 2.3).")


if __name__ == "__main__":
	try:
		sys.exit(main())
	except (ApiError, OSError) as e:
		print(f"\nFAILED: {e}", file=sys.stderr)
		sys.exit(1)
