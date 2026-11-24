"""Level 2.3: the public site's settings, re-applied after every deploy of clarity-site.

1. Description: the text in section 3 of context-source/clarity-brief.md.
2. Membership type: Open.
3. Languages: only English (United States), the default, and Spanish (Spain).
4. The accessibility menu, for clarity-public only: a group-scoped OSGi .config with the
   instance's companyWebId and the site's numeric groupId (both resolved at run time), written
   to bundles/osgi/configs (applies live) and configs/local/osgi/configs.

1 to 3 go through PUT /o/headless-admin-site/v1.0/sites/clarity-public (a full replacement of
the GET body), and only when something differs. Every deploy of the site initializer resets the
languages (and, without site-configuration.json, the membership type): scripts/deploy_site.sh
runs this script after each one. The virtual host has no API: set it in the UI (Level 2.3).

Usage: python3 -I scripts/site_settings.py
"""

import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, ApiError, Liferay

SITE_API = "/o/headless-admin-site/v1.0/sites"

PUBLIC = "clarity-public"
OTHER_SITES = ["clarity-distributor-portal"]

LOCALES = ["en_US", "es_ES"]
DEFAULT_LOCALE = "en_US"

ACCESSIBILITY_PID = "com.liferay.accessibility.menu.web.internal.configuration.AccessibilityMenuConfiguration"
CONFIG_DIRS = [
	os.path.join(ROOT, "bundles", "osgi", "configs"),
	os.path.join(ROOT, "configs", "local", "osgi", "configs"),
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


def apply(lr, sites=None):
	"""Applies settings 1 to 4. sites: {erc: site} from the caller, or read here."""

	if sites is None:
		sites = {}

		for erc in [PUBLIC] + OTHER_SITES:
			status, site = lr.request("GET", f"{SITE_API}/{erc}", raise_errors=False)

			if status == 404:
				if erc == PUBLIC:
					raise SystemExit(f"No site {PUBLIC}: run scripts/setup_sites.py first.")

				continue

			if status != 200:
				raise ApiError(status, "GET", f"{SITE_API}/{erc}", str(site))

			sites[erc] = site

	sites[PUBLIC] = ensure_settings(lr)
	ensure_accessibility_menu(lr, sites)

	return sites


def main():
	lr = Liferay()
	print(f"Liferay at {lr.base_url}")
	apply(lr)
	print()
	print(f"Done: {PUBLIC}'s description, Open membership, languages and accessibility menu are set.")


if __name__ == "__main__":
	try:
		sys.exit(main())
	except (ApiError, OSError) as e:
		print(f"\nFAILED: {e}", file=sys.stderr)
		sys.exit(1)
