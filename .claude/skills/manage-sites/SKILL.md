---

description: Create sites, set their members and site roles, and configure site and instance settings (description, membership type, languages, accessibility menu, virtual host, home and landing pages) over headless REST and OSGi configuration files, and know which settings have no API. Use when the user asks to create a site, add site members, change a site's languages or membership, enable a site setting, or change instance-wide navigation settings.
name: manage-sites

---

# Manage Sites

🆕 Written for the *Building Enterprise Websites with Liferay and AI* course. Everything below was verified live on DXP 2026.q3.10 (2026-11-20) unless marked otherwise.

## When to Invoke

- "Create a site", "add members to the site", "assign a site role"
- "Change the site's languages", "make the site open", "turn on the accessibility menu"
- "Set the virtual host", "make localhost:8080 open the site", "set the landing page"

## Find the Endpoint First

`GET /o/openapi` lists every REST application's OpenAPI spec. Read the relevant spec before writing a body. With the Liferay MCP server, use its discovery chain instead (`mcp-server`).

## Create a Site

`POST /o/headless-admin-site/v1.0/sites` with `externalReferenceCode`, `name` and `friendlyUrlPath` creates a **blank** site (no template, no initializer). Check first with `GET /sites/{erc}` (404 when missing).

- A new site's `membershipType` is **restricted**, whatever the spec's description says. Set it afterwards (below).
- The calling admin is added as a member with the **Site Owner** role.
- `/sites/{erc}` supports `GET`, `PUT` and `DELETE` only: **no `PATCH`**. `PUT` is a full replacement, so send back the body you `GET`, changed.
- A site initializer client extension whose `siteExternalReferenceCode` equals an existing site's ERC **updates that site** instead of creating one (verified 2026.q3.10). So: create the site here, build its pages in a site initializer later.

## Site Settings Over `PUT /sites/{erc}`

| Setting | Field |
| --- | --- |
| Description | `description`, `description_i18n` |
| Membership type | `membershipType`: `open`, `restricted`, `private` |
| Languages | `inheritLocales: false`, `locales: ["en_US", "es_ES"]`, `defaultLanguageId: "en_US"`. Locales go in as `en_US` and read back as `en-US`. |

## Members and Site Roles

- **Assign a site role to a user:** `POST /o/headless-admin-user/v1.0/roles/by-external-reference-code/{roleErc}/association/user-account/{userId}/site/{siteId}` → `204`. It also makes the user a **direct** site member. Built-in site roles have ERCs such as `L_SITE_ADMINISTRATOR`, `L_SITE_MEMBER`.
- **Read members:** `GET /o/headless-admin-user/v1.0/sites/{siteId}/user-accounts`, and each user's `siteBriefs`.
- **A user group can't be made a site member over headless REST**, and its site membership can't be read back. If the requirement is "the whole department", either add each user, or give the user the UI steps: Site Menu → *People* → *Memberships* → *User Groups* → *Add*.

## Group-Scoped OSGi Configuration (Site Settings Without an API)

Some site settings are group-scoped OSGi configurations, for example the **accessibility menu**: PID `com.liferay.accessibility.menu.web.internal.configuration.AccessibilityMenuConfiguration`, attribute `enableAccessibilityMenu`. Write a scoped factory file to `bundles/osgi/configs/` (applies live) and `configs/local/osgi/configs/`:

```properties
# com.liferay.accessibility.menu.web.internal.configuration.AccessibilityMenuConfiguration.scoped~clarity-public.config
companyWebId="clarityvisionsolutions.com"
enableAccessibilityMenu=B"true"
groupId=L"<site id>"
```

- **Only `companyWebId` + a numeric `groupId` resolved.** `groupKey="<site name>"` and `siteExternalReferenceCode="<erc>"` were stored and then **ignored**, and with `groupKey` unresolved the setting applied **company-wide** (every site showed it) until reverted. Always read the site id at run time, never hard-code it, and check another site afterwards.
- Without `companyId`/`companyWebId`, file install rejects GROUP scope: `required property companyId is missing`.
- **Inside a site initializer, prefer `site-settings.json`** (`[{"pid": "…", "properties": {…}}]`): it injects the site's own ids, so it's portable (`rules/site-initializer-format.md`).
- Check it in the UI: Site Settings → the setting's screen, or `/group/<site>/~/control_panel/manage?p_p_id=com_liferay_site_admin_web_portlet_SiteSettingsPortlet&_com_liferay_site_admin_web_portlet_SiteSettingsPortlet_mvcRenderCommandName=/configuration_admin/edit_configuration&_com_liferay_site_admin_web_portlet_SiteSettingsPortlet_factoryPid=<PID>`.

`headless-admin-configuration` (`/sites/{erc}/site-configurations`, `instance-configurations`, `system-configurations`) answered `400 UnsupportedOperationException` for list and get on 2026.q3.10.

## Settings With No API: Give the User the Screen

Don't reach for JSON web services (`rules/headless-apis.md`). Say plainly there's no API and give exact UI steps:

| Setting | Where |
| --- | --- |
| Site virtual host | Site Menu → *Configuration* → *Site Settings* → *Site Configuration* → *Site URL* → *Public Pages* → *Virtual Host* |
| Instance Home URL, Default Landing Page, Default Logout Page | Control Panel → *Instance Settings* → *Platform* → *Instance Configuration* → *General* → *Navigation* |
| A user group as site member | Site Menu → *People* → *Memberships* → *User Groups* → *Add* |

The instance navigation values also exist as portal properties (`company.default.home.url`, `default.landing.page.path`, `default.logout.page.path`) in `portal-ext.properties`. They need a restart (`CLAUDE.md` → "Server Restarts") and only apply where the instance has no saved value.

## Verify as a Real User

To prove a permission, act as that user, not as admin:

- **Headless:** Basic auth with the persona's email and password (`configs/local/test-users.properties`, or the course's training password).
- **A browser session over curl:** fetch `/c/portal/login`, scrape the form's `action` (its action parameter is `jakarta.portlet.action` on this release, so a hand-built `javax.portlet.action` URL fails), post the credentials with a cookie jar, then send headless calls with the `x-csrf-token` read from the page's `Liferay.authToken`.
- **In a real browser:** `browser-verify`.

A regular role's permissions apply at **company** scope: in every site the user can reach, not only the sites they're a member of.
