# Level 4 starting point

Use this if you couldn't finish Levels 1–3. It gives you everything Level 4 builds on: the personas, both sites with their members and settings, and the site initializer from Level 3 (pages, master pages and menus). It takes about five minutes.

It's the solution from a clean run of the workbook on DXP 2026.Q3.10. Your instructor will tell you whether to use it.

## What's here

| Path | Copy it to | What it is |
| --- | --- | --- |
| `client-extensions/clarity-site/` | `client-extensions/clarity-site/` | The site initializer at the end of Level 3 (pages, Primary and Secondary master pages wireframed with built-in fragments, the four menus, `site-configuration.json` with Open membership) |
| `scripts/` | `scripts/` | Re-runnable scripts that create the personas, the sites, their members and settings, and the Marketing Coordinator permissions, and the deploy script |
| `solution-context.md`, `solution-index.yaml` | the workspace root | The context files from Setup S.1, with R1 to R3 done |

## Steps

1. Do the Setup chapter's S.2 to S.4 if you haven't: PostgreSQL and DXP running, `configs/local/admin.properties` created, MCP turned on.
2. Copy the files in the table into your workspace (replace what's there).
3. Ask your agent:

```
Bring this Liferay instance to the end of Level 3 using the catch-up kit I
just copied. In order:
1. Run the scripts in scripts/ as catch-up/level-4-start/README.md lists
   them, with the admin credentials from configs/local/admin.properties
   and Liferay's HTTP port (8080, or with the optional Tomcat bundle the
   port in bundles/tomcat/conf/server.xml). Stop at the first error and
   show it to me.
2. Deploy client-extensions/clarity-site with bash scripts/deploy_site.sh
   (it waits for the site initializer, then re-applies the site settings
   each deploy resets). Confirm in the log that the initializer ran for
   clarity-public.
3. Read back and show me: the seven personas, the two sites, clarity-public's
   members, membership type and languages, its page tree, and the item
   count of each navigation menu.
```

4. Do the steps in "What you still do by hand" below.
5. Check the result as in the Level 3 verify steps: the pages in order, both master pages, and **Home** with the header menu and the footer text *© Clarity Vision Solutions*.

## Script order

1. `setup_people.py`: user groups, roles, personas with their groups, regular roles and portraits (Level 1.1)
2. `setup_sites.py`: sites, members and site roles, site settings, accessibility menu, Marketing Coordinator permissions (Levels 2.1 to 2.4). It calls `site_settings.py` for the 2.3 settings.

Then deploy `clarity-site` with `bash scripts/deploy_site.sh`.

Run each from the workspace root with no arguments, for example `python3 -I scripts/setup_people.py`. Each one needs the ones before it, and stops with a non-zero exit at the first error.

Deploy `clarity-site` with `scripts/deploy_site.sh`, now and later in the course: every deploy of the site initializer resets the site's languages, and the script puts them back by running `scripts/site_settings.py` (description, Open membership, English and Spanish, accessibility menu). You can run `site_settings.py` on its own at any time.

Every script reads `configs/local/admin.properties` and Liferay's port (8080 unless a Tomcat bundle's `server.xml` says otherwise), and upserts by external reference code or name, so running it twice is safe.

## What you still do by hand

The steps the workbook marks 📋 have no API on this release. Set them in the UI, as the workbook describes:

- The site's virtual host `www.clarityvisionsolutions.com` (Level 2.3): *Site Menu* → *Configuration* → *Site Settings* → *Site Configuration* → *Site URL* → *Pages* → *Virtual Host*.
- The instance's Home URL, Default Landing Page and Default Logout Page, all `/web/clarity` (Level 2.5): *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → *Instance Configuration* → *General*.

The ⭐ bonus exercises of Levels 1–3 (the Marketing manager, the Sign In utility page, your own Playwright tests) aren't in the kit.
