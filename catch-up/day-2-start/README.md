# Day 2 starting point

Use this if you couldn't finish Day 1 (Setup and Levels 1–6). It gives you everything Level 7 builds on: the personas, both sites, the site initializer and theme from Levels 3–5, and the CMS Spaces, structures, vocabularies and content from Level 6. It takes about ten minutes.

It's the solution from a clean run of the workbook on DXP 2026.Q3.10. Your instructor will tell you whether to use it.

## What's here

| Path | Copy it to | What it is |
| --- | --- | --- |
| `client-extensions/clarity-site/` | `client-extensions/clarity-site/` | The site initializer at the end of Level 5 (pages, master pages, menus, fragments, Home and FAQ layouts, style book, logo, `site-configuration.json` with Open membership) |
| `client-extensions/clarity-theme/` | `client-extensions/clarity-theme/` | The Clarity Theme CSS and favicon client extensions |
| `scripts/` | `scripts/` | Re-runnable scripts that create the personas, sites, permissions, Spaces, structures, vocabularies and content, and the deploy script |
| `solution-context.md`, `solution-index.yaml` | the workspace root | The context files from Setup S.1, with R1 to R6 done |

## Steps

1. Do the Setup chapter's S.2 to S.4 if you haven't: PostgreSQL and DXP running, `configs/local/admin.properties` created, MCP turned on.
2. Copy the files in the table into your workspace (replace what's there).
3. Ask your agent:

```
Bring this Liferay instance to the end of Day 1 using the catch-up kit I
just copied. In order:
1. Run the scripts in scripts/ as catch-up/day-2-start/README.md lists
   them, with the admin credentials from configs/local/admin.properties
   and Liferay's HTTP port (8080, or with the optional Tomcat bundle the
   port in bundles/tomcat/conf/server.xml). Stop at the first error and
   show it to me.
2. Deploy client-extensions/clarity-theme (blade gw clean deploy), then
   client-extensions/clarity-site with bash scripts/deploy_site.sh (it waits
   for the site initializer, then re-applies the site settings each deploy
   resets). Confirm in the log that the initializer ran for clarity-public.
3. Read back and show me: the seven personas, the two sites, the five
   Spaces with their entry and file counts, and Home's rendering as Guest.
```

4. Do the steps in "What you still do by hand" below.
5. Check the result as in the Level 6 verify steps: CMS shows five Spaces; **Home** shows Clarity's header, menus and brand.

## Script order

1. `setup_people.py`: user groups, roles, personas with their groups, regular roles and portraits (Level 1.1)
2. `setup_sites.py`: sites, members and site roles, site settings, accessibility menu, Marketing Coordinator permissions (Levels 2.1 to 2.4). It calls `site_settings.py` for the 2.3 settings.
3. `setup_spaces.py`: Spaces, members, connected site (Level 6.1)
4. `setup_structures.py`: content and file structures with Space-role authoring rights (Level 6.2)
5. `setup_vocabularies.py`: vocabularies and categories, Guest VIEW (Level 6.3; needs the structures from step 4)
6. `load_cms_content.py`: folders, files, entries, Guest access (Level 6.4)

Run each from the workspace root with no arguments, for example `python3 -I scripts/setup_people.py`. Each one needs the ones before it, and stops with a non-zero exit at the first error.

Deploy `clarity-site` with `scripts/deploy_site.sh`, now and later in the course: every deploy of the site initializer resets the site's languages, and the script puts them back by running `scripts/site_settings.py` (description, Open membership, English and Spanish, accessibility menu). You can run `site_settings.py` on its own at any time.

Every script reads `configs/local/admin.properties` and Liferay's port (8080 unless a Tomcat bundle's `server.xml` says otherwise), and upserts by external reference code, so running it twice is safe.

## What you still do by hand

The steps the workbook marks 📋 have no API on this release. Set them in the UI, as the workbook describes:

- The site's virtual host `www.clarityvisionsolutions.com` (Level 2.3): *Site Menu* → *Configuration* → *Site Settings* → *Site Configuration* → *Site URL* → *Pages* → *Virtual Host*.
- The instance's Home URL, Default Landing Page and Default Logout Page, all `/web/clarity` (Level 2.5): *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → *Instance Configuration* → *General*.

The ⭐ bonus exercises of Levels 1–6 aren't in the kit.
