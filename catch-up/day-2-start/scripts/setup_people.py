"""Level 1.1: Clarity's user groups, roles and personas (re-runnable, upsert by ERC or name).

Reads context-source/data/ and:

1. User groups (user-groups.csv), ERC USERGROUP-<NAME>: created by ERC; one with the same name
   and another ERC is adopted (its ERC set); the description is updated when it differs.
2. Roles (roles.csv), ERC ROLE-<NAME>: "regular" rows as regular roles, "site" rows as site
   roles, the ERC in the body (PUT by ERC ignores the path ERC). An existing role with that name
   keeps its id; its ERC and description are patched when they differ.
3. Personas (personas.csv), ERC PERSONA-<SCREENNAME>: created by ERC (or adopted by email), then
   only the fields that differ are patched. The training password "learn" is set once, when the
   user is created or adopted (a "password is invalid" 400 means it is already set). The
   portrait is uploaded when the user has none.
4. Each persona joins the user group in their row and gets the regular role in their row,
   assigned to the user directly (headless REST can't assign a role to a user group).

Every value is compared with what Liferay returns first, and written only when it differs.
The password is never printed.

Usage: python3 -I scripts/setup_people.py
"""

import csv
import mimetypes
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, ApiError, Liferay, q

API = "/o/headless-admin-user/v1.0"
DATA = os.path.join(ROOT, "context-source", "data")
SOURCE = os.path.join(ROOT, "context-source")

# The course's shared training password (context-source/data/personas.csv, CLAUDE.md).
PERSONA_PASSWORD = "learn"

USER_FIELDS = ("alternateName", "emailAddress", "familyName", "givenName", "jobTitle")


def read_csv(name):
	with open(os.path.join(DATA, name), encoding="utf8") as f:
		return list(csv.DictReader(f))


def erc_of(prefix, name):
	return prefix + "-" + "-".join(name.upper().split())


# User groups ------------------------------------------------------------------------------------

def upsert_user_groups(lr):
	by_name = {g["name"]: g for g in lr.items(f"{API}/user-groups")}
	result = {}

	for row in read_csv("user-groups.csv"):
		erc = erc_of("USERGROUP", row["name"])
		status, group = lr.request("GET", f"{API}/user-groups/by-external-reference-code/{q(erc)}", raise_errors=False)

		if status == 404 and row["name"] in by_name:
			group = by_name[row["name"]]
			group = lr.patch(
				f"{API}/user-groups/{group['id']}",
				{"description": row["description"], "externalReferenceCode": erc, "name": row["name"]})
			print(f"  adopted   user group {row['name']} (ERC set to {erc})")
		elif status == 404:
			group = lr.put(
				f"{API}/user-groups/by-external-reference-code/{q(erc)}",
				{"description": row["description"], "externalReferenceCode": erc, "name": row["name"]})
			print(f"  created   user group {row['name']} ({erc})")
		elif status != 200:
			raise ApiError(status, "GET", f"user group {erc}", str(group))
		elif group.get("name") != row["name"] or (group.get("description") or "") != row["description"]:
			group = lr.put(
				f"{API}/user-groups/by-external-reference-code/{q(erc)}",
				{"description": row["description"], "externalReferenceCode": erc, "name": row["name"]})
			print(f"  updated   user group {row['name']} ({erc})")
		else:
			print(f"  unchanged user group {row['name']} ({erc})")

		result[row["name"]] = group

	return result


# Roles ------------------------------------------------------------------------------------------

def upsert_roles(lr):
	by_name = {r["name"]: r for r in lr.items(f"{API}/roles")}
	result = {}

	for row in read_csv("roles.csv"):
		name, role_type, description = row["name"], row["type"], row["description"]
		erc = erc_of("ROLE", name)
		existing = by_name.get(name)

		if existing is None:
			role = lr.post(
				f"{API}/roles",
				{
					"description": description,
					"description_i18n": {"en_US": description},
					"externalReferenceCode": erc,
					"name": name,
					"name_i18n": {"en_US": name},
					"roleType": role_type,
				})
			print(f"  created   {role_type} role {name} ({erc})")
		else:
			if existing.get("roleType") != role_type:
				raise SystemExit(
					f"Role {name!r} exists as a {existing.get('roleType')} role, but roles.csv says {role_type}. "
					"Delete or rename it in Control Panel -> Roles, then run this script again.")

			changes = {}

			if existing.get("externalReferenceCode") != erc:
				changes["externalReferenceCode"] = erc

			if (existing.get("description") or "") != description:
				changes["description"] = description
				changes["description_i18n"] = {"en_US": description}

			if changes:
				role = lr.patch(f"{API}/roles/{existing['id']}", changes)
				print(f"  updated   {role_type} role {name} ({', '.join(sorted(changes))})")
			else:
				role = existing
				print(f"  unchanged {role_type} role {name} ({erc})")

		result[name] = role

	return result


# Personas ---------------------------------------------------------------------------------------

def upload_portrait(lr, user_id, path):
	boundary = "----clarity" + uuid.uuid4().hex
	content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"

	with open(path, "rb") as f:
		data = f.read()

	body = (
		f"--{boundary}\r\n"
		f'Content-Disposition: form-data; name="image"; filename="{os.path.basename(path)}"\r\n'
		f"Content-Type: {content_type}\r\n\r\n").encode() + data + f"\r\n--{boundary}--\r\n".encode()

	lr.request(
		"POST", f"{API}/user-accounts/{user_id}/image", raw_body=body,
		headers={"Content-Type": "multipart/form-data; boundary=" + boundary})


def set_password(lr, user, erc):
	status, body = lr.request(
		"PATCH", f"{API}/user-accounts/{user['id']}", {"password": PERSONA_PASSWORD}, raise_errors=False)

	if status < 300:
		print(f"            password set for {erc}")
	elif status == 400 and "password is invalid" in str(body).lower():
		print(f"            password already set for {erc}")
	else:
		# Never echo the request body: it holds the password.
		raise ApiError(status, "PATCH", f"{API}/user-accounts/{user['id']} (password)", str(body))


def upsert_persona(lr, row, groups, roles):
	erc = "PERSONA-" + row["screenName"].upper()
	wanted = {
		"alternateName": row["screenName"],
		"emailAddress": row["emailAddress"],
		"familyName": row["familyName"],
		"givenName": row["givenName"],
		"jobTitle": row["jobTitle"],
	}
	new_password = False

	status, user = lr.request("GET", f"{API}/user-accounts/by-external-reference-code/{q(erc)}", raise_errors=False)

	if status == 404:
		by_email, found = lr.request(
			"GET", f"{API}/user-accounts/by-email-address/{q(row['emailAddress'])}", raise_errors=False)

		if by_email == 200:
			user = lr.patch(f"{API}/user-accounts/{found['id']}", dict(wanted, externalReferenceCode=erc))
			print(f"  adopted   {erc} (existing user {row['emailAddress']}, ERC set)")
		else:
			user = lr.put(
				f"{API}/user-accounts/by-external-reference-code/{q(erc)}", dict(wanted, externalReferenceCode=erc))
			print(f"  created   {erc} (id {user['id']})")

		new_password = True
	elif status != 200:
		raise ApiError(status, "GET", f"user {erc}", str(user))
	else:
		changes = {k: v for k, v in wanted.items() if (user.get(k) or "") != v}

		if changes:
			user = lr.patch(f"{API}/user-accounts/{user['id']}", changes)
			print(f"  updated   {erc} ({', '.join(sorted(changes))})")
		else:
			print(f"  unchanged {erc} (id {user['id']})")

	if user.get("status") and user["status"] != "Active":
		user = lr.patch(f"{API}/user-accounts/{user['id']}", {"status": "Active"})
		print(f"            reactivated {erc}")

	if new_password:
		set_password(lr, user, erc)

	if row["portrait"]:
		if user.get("image"):
			print(f"            portrait already set")
		else:
			upload_portrait(lr, user["id"], os.path.join(SOURCE, row["portrait"]))
			print(f"            portrait uploaded ({row['portrait']})")

	group_name = row["userGroups"]

	if group_name:
		if group_name in [g.get("name") for g in user.get("userGroupBriefs") or []]:
			print(f"            already in user group {group_name}")
		else:
			lr.post(f"{API}/user-groups/{groups[group_name]['id']}/user-group-users", [user["id"]])
			print(f"            added to user group {group_name}")

	role_name = row["regularRoles"]

	if role_name:
		if role_name in [r.get("name") for r in user.get("roleBriefs") or []]:
			print(f"            already has role {role_name}")
		else:
			lr.request("POST", f"{API}/roles/{roles[role_name]['id']}/association/user-account/{user['id']}")
			print(f"            assigned role {role_name}")


def read_back(lr, rows):
	print()
	print("Read-back (as Liferay returns it):")
	print(f"  {'ERC':26} {'Screen name':18} {'Status':8} {'Portrait':8} {'User groups':18} Roles")

	for row in rows:
		erc = "PERSONA-" + row["screenName"].upper()
		user = lr.get(f"{API}/user-accounts/by-external-reference-code/{q(erc)}")
		groups = ", ".join(g.get("name", "") for g in user.get("userGroupBriefs") or [])
		roles = ", ".join(r.get("name", "") for r in user.get("roleBriefs") or [])
		print(
			f"  {erc:26} {user.get('alternateName', ''):18} {user.get('status', ''):8}"
			f" {'yes' if user.get('image') else 'no':8} {groups:18} {roles}")


def main():
	lr = Liferay()
	print(f"Liferay at {lr.base_url}")

	print("User groups:")
	groups = upsert_user_groups(lr)

	print("Roles:")
	roles = upsert_roles(lr)

	print("Personas:")
	rows = read_csv("personas.csv")

	for row in rows:
		upsert_persona(lr, row, groups, roles)

	read_back(lr, rows)
	print()
	print("Done: Level 1.1 people are in place.")


if __name__ == "__main__":
	try:
		sys.exit(main())
	except (ApiError, OSError) as e:
		print(f"\nFAILED: {e}", file=sys.stderr)
		sys.exit(1)
