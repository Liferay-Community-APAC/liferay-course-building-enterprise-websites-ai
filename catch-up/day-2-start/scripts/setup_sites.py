"""Level 2: Clarity's two sites, their members, the public site's settings, and the Marketing
Coordinator role's permissions (re-runnable; everything compared before it is written).

1. Sites (2.1): clarity-public (/clarity) and clarity-distributor-portal (/distributor-portal),
   blank, created with POST /sites when their ERC answers 404. An existing site is left as is.
2. Members (2.2) of clarity-public: Walter Douglas Site Administrator; Christian Carter and Harper
   Roberts Site Content Contributor; Ian Miller and Clara Murphy Site Member (L_SITE_MEMBER).
   Each association also makes the user a direct site member. Nobody is removed.
3. Site settings (2.3) over PUT /sites/clarity-public (full replacement of the GET body):
   description from context-source/clarity-brief.md, open membership, locales en_US + es_ES
   with en_US the default. The virtual host has no API: set it in the UI (see the README).
4. Accessibility menu (2.3) for clarity-public only: a group-scoped OSGi .config with the
   instance's companyWebId and the site's numeric groupId (both resolved at run time), written
   to bundles/osgi/configs (applies live) and configs/local/osgi/configs.
5. Marketing Coordinator (2.4): company-scope (scope 1) Collections and Categories permissions,
   added to the role's existing rows (nothing is removed; PATCH /roles only adds).

Usage: python3 -I scripts/setup_sites.py
"""

import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, ApiError, Liferay, q

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

LOCALES = ["en_US", "es_ES"]
DEFAULT_LOCALE = "en_US"

ACCESSIBILITY_PID = "com.liferay.accessibility.menu.web.internal.configuration.AccessibilityMenuConfiguration"
CONFIG_DIRS = [
	os.path.join(ROOT, "bundles", "osgi", "configs"),
	os.path.join(ROOT, "configs", "local", "osgi", "configs"),
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

# Read-only fields of the Site DTO, left out of the PUT body (as in the proven draft).
SITE_READ_ONLY = ("actions", "descriptiveName", "descriptiveName_i18n", "id", "key", "logo")


def locale(value):
	return (value or "").replace("-", "_")


def brief_description():
	"""The public site's description: the italic quote in section 3 of clarity-brief.md."""

	with open(os.path.join(ROOT, "context-source", "clarity-brief.md"), encoding="utf8") as f:
		for line in f:
			if "Clarity Public Enterprise Website" in line and "Description:" in line:
				match = re.search(r'Description:\s*\*"(.+?)"\*', line)

				if match:
					return match.group(1)

	raise SystemExit("No site description found in section 3 of context-source/clarity-brief.md")


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


# 3. Site settings -------------------------------------------------------------------------------

def ensure_settings(lr):
	print(f"Settings of {PUBLIC}:")
	description = brief_description()
	site = lr.get(f"{SITE_API}/{PUBLIC}")

	differences = []

	if (site.get("description") or "") != description:
		differences.append("description")

	if (site.get("membershipType") or "").lower() != "open":
		differences.append("membershipType")

	if site.get("inheritLocales") is not False or sorted(locale(x) for x in site.get("locales") or []) != sorted(LOCALES):
		differences.append("locales")

	if locale(site.get("defaultLanguageId")) != DEFAULT_LOCALE:
		differences.append("defaultLanguageId")

	if differences:
		body = {k: v for k, v in site.items() if k not in SITE_READ_ONLY}
		body.update({
			"defaultLanguageId": DEFAULT_LOCALE,
			"description": description,
			"description_i18n": {"en-US": description},
			"inheritLocales": False,
			"locales": LOCALES,
			"membershipType": "open",
		})
		lr.put(f"{SITE_API}/{PUBLIC}", body)
		print(f"  updated   {', '.join(differences)}")
	else:
		print("  unchanged description, membership type, locales")

	site = lr.get(f"{SITE_API}/{PUBLIC}")
	print(f"  description:     {site.get('description')}")
	print(f"  membershipType:  {site.get('membershipType')}")
	print(f"  locales:         {site.get('locales')} (inheritLocales {site.get('inheritLocales')}, default {site.get('defaultLanguageId')})")
	print(f"  friendlyUrlPath: {site.get('friendlyUrlPath')}")

	return site


# 4. Accessibility menu (group-scoped OSGi configuration) ----------------------------------------

def read_properties(path):
	props = {}

	if os.path.exists(path):
		with open(path, encoding="utf8") as f:
			for line in f:
				line = line.strip()

				if line and not line.startswith("#") and "=" in line:
					key, value = line.split("=", 1)
					props[key.strip()] = value.strip()

	return props


def company_web_id(lr):
	"""The instance's web id: the Portal Instances API first, then company.default.web.id."""

	status, body = lr.request("GET", "/o/headless-portal-instances/v1.0/portal-instances", raise_errors=False)

	if status == 200:
		instances = (body or {}).get("items") or []

		if len(instances) == 1:
			return instances[0]["portalInstanceId"], "Portal Instances API"

		for instance in instances:
			if instance.get("virtualHost") == "localhost":
				return instance["portalInstanceId"], "Portal Instances API (virtual host localhost)"

	for relative in (
			("bundles", "portal-ext.properties"), ("bundles", "portal-setup-wizard.properties"),
			("configs", "local", "portal-ext.properties"), ("configs", "common", "portal-ext.properties"),
			("configs", "common", "portal-setup-wizard.properties")):
		value = read_properties(os.path.join(ROOT, *relative)).get("company.default.web.id")

		if value:
			return value, "/".join(relative)

	raise SystemExit(
		"Couldn't resolve the instance's web id (Portal Instances API answered "
		f"{status}, and no company.default.web.id in the portal properties).")


def ensure_accessibility_menu(lr, sites):
	print("Accessibility menu:")
	web_id, source = company_web_id(lr)
	group_id = sites[PUBLIC]["id"]
	print(f"  companyWebId {web_id} (from {source}), groupId {group_id} ({PUBLIC})")

	wanted = {
		"companyWebId": f'"{web_id}"',
		"enableAccessibilityMenu": 'B"true"',
		"groupId": f'L"{group_id}"',
	}
	file_name = f"{ACCESSIBILITY_PID}.scoped~{PUBLIC}.config"
	content = "".join(f"{k}={v}\n" for k, v in wanted.items())

	if not os.path.isdir(os.path.join(ROOT, "bundles", "osgi")):
		raise SystemExit("No bundles/osgi folder: run this from a workspace whose bundle is initialized.")

	for directory in CONFIG_DIRS:
		path = os.path.join(directory, file_name)
		current = read_properties(path)

		# DXP rewrites the file in bundles/osgi/configs with companyId in place of companyWebId
		if all(current.get(k) == v for k, v in wanted.items() if k != "companyWebId") and (
				current.get("companyWebId") == wanted["companyWebId"] or current.get("companyId")):
			print(f"  unchanged {os.path.relpath(path, ROOT)}")
			continue

		os.makedirs(directory, exist_ok=True)

		with open(path, "w", encoding="utf8") as f:
			f.write(content)

		print(f"  wrote     {os.path.relpath(path, ROOT)}")

	# Nothing else may turn the menu on: another site's scoped file, or a company-wide file.
	other_site_ids = {str(s["id"]) for erc, s in sites.items() if erc != PUBLIC}

	for directory in CONFIG_DIRS:
		for path in glob.glob(os.path.join(directory, ACCESSIBILITY_PID + "*.config")):
			if os.path.basename(path) == file_name:
				continue

			values = read_properties(path)
			enabled = values.get("enableAccessibilityMenu", "").strip('B"').lower() == "true"
			group = values.get("groupId", "").strip('L"')

			if enabled and (group in other_site_ids or not group):
				print(f"  WARNING   {os.path.relpath(path, ROOT)} also turns the menu on "
					f"({'company-wide' if not group else 'group ' + group}); the workbook wants it on {PUBLIC} only")


# 5. Marketing Coordinator permissions ------------------------------------------------------------

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
	sites[PUBLIC] = ensure_settings(lr)
	ensure_accessibility_menu(lr, sites)
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
