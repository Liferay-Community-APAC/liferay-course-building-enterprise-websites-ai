---

description: Create roles, assign permissions on objects and pages, and manage site memberships via Headless Admin User and object collaborators APIs; create test users (personas) with a stored password, account membership, and account, site, or regular roles. Use when the user asks to add a role, grant permissions, make a page private, control who can view or edit an object's entries, or create a test user to log in as. Requires feature flag LPD-17564 for per entry object permissions.
name: manage-roles-permissions

---

# Manage Roles and Permissions

Create roles and assign the minimum required permissions for objects, pages, and sites.

## When to Invoke

- "Create a Reader role", "add a role that can only view Books"
- "Grant edit permissions on this object to Site Members"
- "Make this page visible only to authenticated users"
- "Give the Sales role permission to add and update Orders"
- "Create a test user Sophie in the Novacorp account", "give Marcus the Buyer account role"
- Called by `build-site` during the roles and ACL phase

## Prerequisites

Feature flag `LPD-17564` is required for the object collaborators API (per object definition permissions). Verify via `feature-flags` skill.

## Workflow

### Create a Role

```bash
curl \
	--data '{
		"name": "<RoleName>",
		"roleType": "regular",
		"name_i18n": {"en_US": "<Role Display Name>"}
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-user/v1.0/roles" \
	--user "test@liferay.com:test"
```

`roleType` values:

| Value | Scope |
| --- | --- |
| `regular` | Portal wide; applies across all sites |
| `site` | Site scoped; membership and permissions are site specific |
| `organization` | Organization scoped |

Save the returned `id` as `<role-id>`.

### Assign Users to a Role

```bash
# Assign a user account to a regular role

curl \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-user/v1.0/roles/<role-id>/association/user-account/<user-id>" \
	--user "test@liferay.com:test"
```

For site scoped role assignment, use the role association endpoint scoped to the site (there is **no** `/sites/{id}/site-members` endpoint). The site is addressed by its numeric `<site-id>` here:

```bash
curl \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-user/v1.0/roles/<role-id>/association/user-account/<user-id>/site/<site-id>" \
	--user "test@liferay.com:test"
```

### Grant Permissions on an Object Definition

Object level permissions control which roles can create, view, update, or delete entries for that object definition.

> **There is no REST endpoint for this on 2026.q3.2.** `BaseObjectDefinitionResourceImpl` in `object-admin` exposes no `/permissions` method at all (verified in the bundle's bytecode), so `PUT /o/object-admin/v1.0/object-definitions/<id>/permissions` cannot work. Grant object level permissions in the initializer tree with `resource-permissions.json` (the next section and `rules/site-initializer-format.md`), or in Control Panel → Objects → [Object] → Permissions.

Common `actionIds` for object definitions:

| Action ID | Meaning |
| --- | --- |
| `ADD_OBJECT_ENTRY` | Create entries |
| `VIEW` | View the object in site and admin UI |
| `PERMISSIONS` | Manage permissions on this object |

### Public Form: Let Guest Create Without Reading

An object registers **two** resource names and the action decides which to grant on — `ADD_OBJECT_ENTRY` is **not** on the `[$OBJECT_DEFINITION_CLASS_NAME:…$]` resource, and granting it there silently does nothing. `rules/guest-access.md` has the table and the `guest-unsupported` set; it is always loaded, so read it there rather than guessing here.

For an anonymous registration, enquiry, or application form, grant creation on the private object and viewing only on the public one. In the initializer tree (`resource-permissions.json`, see `rules/site-initializer-format.md` for the `scope` integers):

```json
[
	{
		"actionIds": ["ADD_OBJECT_ENTRY"],
		"primKey": "0",
		"resourceName": "com.liferay.object#[$OBJECT_DEFINITION_ID:<PrivateObject>$]",
		"roleName": "Guest",
		"scope": "1"
	},
	{
		"actionIds": ["VIEW"],
		"primKey": "0",
		"resourceName": "[$OBJECT_DEFINITION_CLASS_NAME:<PublicObject>$]",
		"roleName": "Guest",
		"scope": "1"
	}
]
```

Do **not** add `VIEW` on the object that receives submissions. Those rows hold whatever the visitor typed — names, emails, addresses — and `VIEW` at company scope publishes all of them to anonymous users. Write only is the correct posture for a public form, and it is why any count or aggregate over that object has to be denormalized onto the public object rather than computed in the browser (see `manage-pages` → "Mapping Limits").

### Grant Permissions on Object Entries (Requires LPD-17564)

Per entry permissions are managed via the object collaborators API. Ensure `LPD-17564` is enabled before calling.

The entry `/permissions` PUT — like the Vulcan `/permissions` PUTs generally — takes a **bare JSON array** of Vulcan `Permission` items — `actionIds`, `roleExternalReferenceCode`, `roleName`, `roleType`. The DTO has **no `roleId`** field, and a `{"permissions": [...]}` wrapper returns `400 "Unable to map JSON path"` (verified live on 2026.q3.2, and the `Permission` class in the bundle carries exactly those four fields). Copy the field values from a `GET` on the same endpoint.

The PUT is a **full replace**: read the current grants first and re-send every role that should keep access — Owner and administrator roles included — or they are silently dropped.

```bash
curl \
	--data '[
		{
			"actionIds": ["VIEW", "UPDATE"],
			"roleExternalReferenceCode": "<role-erc>",
			"roleName": "<role-name>",
			"roleType": "regular"
		}
	]' \
	--header "Content-Type: application/json" \
	--request PUT \
	--silent \
	--url "http://localhost:${PORT}/o/c/<pluralLabel>/<entry-id>/permissions" \
	--user "test@liferay.com:test"
```

Common `actionIds` for object entries:

| Action ID | Meaning |
| --- | --- |
| `VIEW` | Read the entry |
| `UPDATE` | Edit the entry |
| `DELETE` | Delete the entry |
| `PERMISSIONS` | Manage permissions on this entry |

### Depot Roles (Spaces and Asset Libraries)

A Space or asset library has its own role type, `roleType: depot` (`role_.type_` 5). Two of these roles are given implicitly by `DepotRoleContributor` (verified on 2026.q3.5):

| Role | ERC | Who gets it |
| --- | --- | --- |
| Asset Library Member | `L_ASSET_LIBRARY_MEMBER` | Members of the library or Space itself |
| Asset Library Connected Site Member | `L_ASSET_LIBRARY_CONNECTED_SITE_MEMBER` | Members of any Site the library is connected to, **including members only through a user group** (the user bag counts inherited groups) |

Grant the second one on items and folders to say "whoever belongs to the connected Site", with the same bare `Permission[]` body (`"roleType": "depot"`). Space entries also start with a `User` VIEW grant, which opens them to every signed-in user, so a restricted audience means a full replace without it (`manage-cms`, "Permissions on Entries, Folders and Files").

### Grant Permissions on a Site Page

Page level permissions control visibility and edit access.

Same body shape as for object entries: a bare `Permission[]` array, which is what `putSiteSitePagePermissionsPage` declares in the 2026.q3.2 bytecode. Same full replace semantics.

```bash
curl \
	--data '[
		{
			"actionIds": ["VIEW"],
			"roleExternalReferenceCode": "<guest-role-erc>",
			"roleName": "Guest",
			"roleType": "regular"
		},
		{
			"actionIds": ["VIEW", "UPDATE"],
			"roleExternalReferenceCode": "<role-erc>",
			"roleName": "<role-name>",
			"roleType": "regular"
		}
	]' \
	--header "Content-Type: application/json" \
	--request PUT \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-site/v1.0/sites/<site-erc>/site-pages/<page-erc>/permissions" \
	--user "test@liferay.com:test"
```

To make a page visible only to authenticated users, remove the VIEW permission from the Guest role. To make it fully private, also remove it from the User role and grant VIEW only to the target role.

### Verify Roles and Permissions

```bash
# List roles

curl \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-user/v1.0/roles" \
	--user "test@liferay.com:test" \
	| jq '[.items[] | {id, name, roleType}]'

# Check permissions on an object entry (object definitions have no /permissions endpoint)

curl \
	--silent \
	--url "http://localhost:${PORT}/o/c/<pluralLabel>/<entry-id>/permissions" \
	--user "test@liferay.com:test" \
	| jq '.items'
```

**Checking a user's roles client-side: they are scoped, not flat.** `GET /o/headless-admin-user/v1.0/my-user-account` returns roles split across `roleBriefs` (regular), `accountBriefs[].roleBriefs`, `organizationBriefs[].roleBriefs`, `siteBriefs[].roleBriefs`, and `userGroupBriefs[].roleBriefs`. Code that checks only the top-level `roleBriefs` misses every account/site/org role — flatten all five before testing for a role name. Also note a plain account **member** shows an empty `accountBriefs[].roleBriefs` (membership is implicit, not a role).

## Permission Design Principles

- Assign the minimum set of `actionIds` that satisfies the workflow requirement.
- Use site roles (not regular roles) for permissions that should vary per site.
- The Guest role represents unauthenticated visitors. Remove VIEW from Guest to require login.
- The User role represents any authenticated user. Remove VIEW from User and grant to a specific role to restrict access.

## Headless Facts for Users, User Groups and Roles (Verified on 2026.q3.10)

- **`PUT /roles/by-external-reference-code/{erc}` ignores the ERC in the path** on create and stores a random UUID. Put `externalReferenceCode` in the body too (or `PATCH` it afterwards). `PUT /user-groups/by-external-reference-code/{erc}` keeps the path ERC.
- **A regular role cannot be assigned to a user group over headless REST.** There is no endpoint for it. Assign the role to each user instead (`POST /roles/{roleId}/association/user-account/{userId}`), or have the user do the group assignment in Control Panel → Roles → *Assignees* → *User Groups*. Don't fall back to JSON WS (`rules/headless-apis.md`).
- **User group membership:** `POST /user-groups/{userGroupId}/user-group-users` with a body `[<userId>, …]`.
- **`userGroupBriefs[].id` is the user group's Group id**, not the userGroupId. Match user groups by name.
- **`roleBriefs` includes roles inherited through user groups.**
- **Portrait:** `POST /user-accounts/{id}/image`, multipart, part named `image`.
- **`PATCH /roles/{id}` with `rolePermissions` stores company (scope 1) and group (scope 2) grants but silently drops individual (scope 4) entries.** Keep regular-role permission designs to company scope, or grant individual resources from the resource's own `/permissions` endpoint where it has one.
- **First sign-in password change:** whether it's asked depends on the default password policy's *Change Required*, stored when the database is created. With `passwords.default.policy.change.required=false` in `portal-ext.properties` before the first start (the course workspace does this), no persona is asked. On a database created without it, see "Set the Password Without Printing It" below.

- **`PATCH` and `PUT /roles/{id}` only add permissions**; neither removes a grant. To remove one, the user does it in Control Panel → Roles → the role → *Define Permissions* (there's no headless API). Plan grants before applying them.
- **Collections and Categories** resource names: `com_liferay_asset_list_web_portlet_AssetListPortlet` (ACCESS_IN_CONTROL_PANEL, VIEW), `com.liferay.asset.list` (ADD_ASSET_LIST_ENTRY), `com.liferay.asset.list.model.AssetListEntry` (VIEW, UPDATE), `com_liferay_asset_categories_admin_web_portlet_AssetCategoriesAdminPortlet` (ACCESS_IN_CONTROL_PANEL, VIEW), `com.liferay.asset.categories` (ADD_CATEGORY, ADD_VOCABULARY), `com.liferay.asset.kernel.model.AssetCategory` (VIEW, UPDATE).

## Who Sees Liferay CMS (2026.q3.10)

The **CMS** application appears for a user who is a member of at least one Space, holds the CMS Administrator role, or has VIEW on the CMS group. Inside a Space, the Space's own roles (Space Member, Space Administrator…) decide what they can do. Prefer Space membership and Space roles over regular-role grants for CMS authoring: a regular role grants at company scope, so it applies in **every** Space, and the CMS pages also need per-page VIEW that `PATCH /roles` can't store (above).

## Test Users and Personas

Exercises verify restrictions **as a real user**, never as admin, so they need users with a known password, the right account and the right roles. Every call below was verified on 2026.q3.6 (2026-10-16). All are `headless-admin-user` (`/o/headless-admin-user/v1.0`), called as admin with Basic auth.

### 1. Create or Update the User (Idempotent)

`PUT /user-accounts/by-external-reference-code/{erc}` creates the user on the first call and replaces it on the next (same `id`, verified), so a script can be replayed safely. Give every test user an ERC you choose:

```bash
curl 	--data '{
		"alternateName": "sophie.martin",
		"emailAddress": "sophie.martin@novacorp.example",
		"externalReferenceCode": "PERSONA-SOPHIE",
		"familyName": "Martin",
		"givenName": "Sophie"
	}' 	--header "Content-Type: application/json" 	--request PUT 	--silent 	--url "http://localhost:${PORT}/o/headless-admin-user/v1.0/user-accounts/by-external-reference-code/PERSONA-SOPHIE" 	--user "${ADMIN_EMAIL}:${ADMIN_PASSWORD}"
```

- The user is created **`Active`**. A user from a site initializer's `user-accounts.json` is not: it lands INACTIVE, and `PATCH /user-accounts/{id}` with `{"status": "Active"}` (case-sensitive) fixes it (`rules/site-initializer-format.md` → "Users and Accounts").
- `POST /user-accounts` works too, but is not idempotent.
- Look a user up with `GET /user-accounts/by-email-address/{email}` (URL-encode the `@`) or by ERC.
- The DTO has **no** `passwordReset` or `agreedToTermsOfUse` field: sending them answers `400 "The properties [...] are unknown"` (2026.q3.2).

### 2. Set the Password Without Printing It

Generate it, send it with `PATCH /user-accounts/{id}` `{"password": "..."}` (or in the create body), and write it straight to `configs/local/test-users.properties` (git-ignored), the personas file `browser-verify` reads. Never echo it. Re-sending the same value answers `400 "The user account password is invalid"`: treat that as already set.

```python
import secrets, string

password = "Av-" + "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(14)) + "9!"

# PATCH /user-accounts/{id} {"password": password}, then:

with open("configs/local/test-users.properties", "a", encoding="utf8") as f:
	f.write(f"sophie.email=sophie.martin@novacorp.example
sophie.password={password}
")
```

**The first login will ask for a new password**, whatever was done over REST. With the default password policy's *Change Required* on, every user who gets a password (in the create body or by a later `PATCH`) has the reset flag, the `PATCH` does not clear it, and no DTO field does. `passwords.default.policy.change.required=false` in `portal-ext.properties` did **not** change an existing database's stored policy (verified 2026.q3.6). Two ways through:

- **Per user (no portal change):** `browser-verify` with `--complete-password-change` completes the screen as the user would and stores the new password in the personas file.
- **For every user:** turn off Change Required in Control Panel → Security → Password Policies → Default Password Policy. It is a portal-wide security setting: ask before changing it.

### 3. Account Membership and Account Roles

What Account Restriction filters on (exercises 7.1, 7.3). Add the user to the account, then give an account role if the scenario needs one:

| Action | Call | Answer |
| --- | --- | --- |
| Add member by email | `POST /accounts/{accountId}/user-accounts/by-email-address/{email}` (or `/accounts/by-external-reference-code/{accountERC}/user-accounts/by-email-address/{email}`) | `200`, idempotent |
| List an account's roles | `GET /accounts/{accountId}/account-roles` | Includes the shared ones (`accountId: 0`): `L_ACCOUNT_ADMINISTRATOR`, `L_ACCOUNT_MEMBER`, `L_BUYER`, `L_ORDER_MANAGER`, `L_ACCOUNT_SUPPLIER` |
| Give an account role, by ids | `POST /accounts/{accountId}/account-roles/{accountRoleId}/user-accounts/{userId}` | `204`, idempotent |
| Give an account role, by ERC and email | `POST /accounts/by-external-reference-code/{accountERC}/account-roles/by-external-reference-code/{roleERC}/user-accounts/by-email-address/{email}` | `204` |
| Read a user's account roles | `GET /accounts/by-external-reference-code/{accountERC}/user-accounts/by-external-reference-code/{userERC}/account-roles` | |

**The `by-email-address` role form exists only under the account's ERC path.** `POST /accounts/{accountId}/account-roles/{roleId}/user-accounts/by-email-address/{email}` (numeric account id) is not in the spec and answers `404`, which reads like a missing role or user. Mix the forms that exist, never a numeric id with `by-email-address` for roles.

### 4. Regular and Site Roles

Use the association calls in "Assign Users to a Role" above (`204`). A site role association with the numeric site `id` (from `GET /o/headless-admin-site/v1.0/sites/{siteERC}`) **also makes the user a site member**: they then appear in `GET /sites/{siteId}/user-accounts`. There is no other membership endpoint in `headless-admin-user`.

### 5. Verify, Then Sign In as the Persona

1. As admin: `GET /user-accounts/by-external-reference-code/{erc}` and check `status`, `roleBriefs`, `accountBriefs[].roleBriefs` and `siteBriefs[].roleBriefs`.
1. As the persona: load `browser-verify`, sign in (`login.mjs <alias> --complete-password-change` the first time), and read `my-user-account` from the page with `Liferay.Util.fetch`. A plain `fetch` without `x-csrf-token` gets a bare `403`.

Observed on 2026.q3.6: the user's **own** `my-user-account` listed the regular and account roles but an **empty** `siteBriefs[].roleBriefs`, while the admin read of the same user showed the site role. Do not test a site role from the client through that field; prove it by its effect on the page instead.

## Success Signal

TODO / inferred — verify against a running bundle. The Verify Roles and Permissions step above (role listed; granted `actionIds` present; a user holding only that role is allowed the granted actions and denied the rest) is the observable completion check; confirm on a live bundle.