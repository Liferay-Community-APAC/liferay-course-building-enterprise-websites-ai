# Level 10 starting point

Use this if you couldn't finish Levels 1–9. It gives you everything Level 10 builds on: the personas, both sites, the site initializer and theme as Level 9 leaves them, the CMS Spaces and content from Level 6, the mappings, display pages and collections from Level 7, the catalog, products and product pages from Level 8, and the legacy content and data from Level 9. It takes about fifteen minutes.

It's the solution from a clean run of the workbook on DXP 2026.Q3.10. Your instructor will tell you whether to use it.

## What's here

| Path | Copy it to | What it is |
| --- | --- | --- |
| `client-extensions/clarity-site/` | `client-extensions/clarity-site/` | The site initializer at the end of Level 9 (pages, master pages with the announcement bar, menus, fragments, Home and FAQ with their collections, Products and Product List, Blog, display page templates Article, Leadership Profile, Product Details and Blog Post, widget templates, style book, logo, channel settings, `site-configuration.json` with Open membership) |
| `client-extensions/clarity-theme/` | `client-extensions/clarity-theme/` | The Clarity Theme CSS and favicon client extensions |
| `scripts/` | `scripts/` | Re-runnable scripts that create the data of Levels 1–9, the scripts that fit the tree to your instance, and the deploy script |
| `solution-context.md`, `solution-index.yaml` | the workspace root | The context files from Setup S.1, with R1 to R9 done |

## Steps

1. Do the Setup chapter's S.2 to S.4 if you haven't: PostgreSQL and DXP running, `configs/local/admin.properties` created, MCP turned on.
2. Copy the files in the table into your workspace (replace what's there).
3. Ask your agent:

```
Bring this Liferay instance to the end of Level 9 using the catch-up kit I
just copied. In order:
1. Run the scripts in scripts/ as catch-up/level-10-start/README.md lists
   them (steps 1 to 15), with the admin credentials from
   configs/local/admin.properties and Liferay's HTTP port (8080, or with
   the optional Tomcat bundle the port in bundles/tomcat/conf/server.xml).
   Stop at the first error and show it to me.
2. Deploy client-extensions/clarity-theme (blade gw clean deploy), then
   client-extensions/clarity-site with bash scripts/deploy_site.sh (it waits
   for the site initializer, then re-applies the site settings each deploy
   resets). Confirm in the log that the initializer ran for clarity-public.
3. Run step 16 of the README's script order.
4. Read back and show me: the five Spaces with their entry and file counts,
   the products of Clarity Eyewear, and, fetched as Guest, the announcement
   bar and the Helpful Articles cards on Home, the category cards on
   Products, and the cards on Blog.
```

4. Do the steps in "What you still do by hand" below.
5. Check the result as in the Level 9 verify steps: **Home** shows Clarity's brand, the announcement bar and three article cards; **Products** shows four category cards; **Blog** shows the legacy post.

## Script order

Run each from the workspace root with no arguments, for example `python3 -I scripts/setup_people.py`. Each one needs the ones before it, and stops with a non-zero exit at the first error.

Data:

1. `setup_people.py`: user groups, roles, personas with their groups, regular roles and portraits (Level 1.1)
2. `setup_sites.py`: sites, members and site roles, site settings, accessibility menu, Marketing Coordinator permissions (Levels 2.1 to 2.4). It calls `site_settings.py` for the 2.3 settings.
3. `setup_spaces.py`: Spaces, members, connected site (Level 6.1)
4. `setup_structures.py`: content and file structures with Space-role authoring rights (Level 6.2)
5. `setup_vocabularies.py`: vocabularies and categories, Guest VIEW (Level 6.3)
6. `load_cms_content.py`: folders, files, entries, Guest access (Level 6.4)
7. `setup_catalog.py`: the Clarity Eyewear catalog and its specifications (Level 8.1)
8. `load_products.py`: the Clarity Products vocabulary and the three products (Level 8.2)
9. `setup_channel.py`: the Clarity Public channel, and its B2B settings in the tree (Level 8.3)
10. `import_legacy_content.py`: the legacy blog post and articles (Level 9.2)
11. `import_legacy_data.py`: the legacy products and locations, and *Morocco, Casablanca* on *Retail Associate* (Level 9.3)

Fit the tree to this instance. The page definitions refer to files, fields and categories by numeric id, and those ids differ on every instance, so these rewrite the tree. Run them before every deploy to a new instance:

12. `map_cms_images.py`: the Home, FAQ, Product List and master page images, mapped to Space files found by title (Level 7.1)
13. `map_attachment_fields.py`: the image fields of the cards and display page templates (Levels 7.2 to 9.2)
14. `build_collections.py`: `asset-list-entries.json`, the dynamic collections of Levels 7 and 9
15. `setup_category_cards.py`: the Products page's category cards, and Guest VIEW on the Clarity Products categories (Level 8.4)

Deploy `clarity-theme`, then `clarity-site` with `scripts/deploy_site.sh`. Then:

16. `set_category_display_page.py`: Product List as the channel's default category display page (Level 8.5; it needs the page the deploy creates)

Deploy `clarity-site` with `scripts/deploy_site.sh`, now and later in the course: every deploy of the site initializer resets the site's languages, and the script puts them back by running `scripts/site_settings.py` (description, Open membership, English and Spanish, accessibility menu). It also checks that both master pages exist, and deploys once more if one is missing: on a new instance the first run can skip the Primary Master Page, because its announcement bar shows a collection that the same run creates later.

Every script reads `configs/local/admin.properties` and Liferay's port (8080 unless a Tomcat bundle's `server.xml` says otherwise), and upserts by external reference code, so running it twice is safe.

## What you still do by hand

The steps the workbook marks 📋 have no API on this release. Set them in the UI, as the workbook describes:

- The site's virtual host `www.clarityvisionsolutions.com` (Level 2.3): *Site Menu* → *Configuration* → *Site Settings* → *Site Configuration* → *Site URL* → *Pages* → *Virtual Host*.
- The instance's Home URL, Default Landing Page and Default Logout Page, all `/web/clarity` (Level 2.5): *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → *Instance Configuration* → *General*.

The ⭐ bonus exercises of Levels 1–9 (the manual collection Editor's Picks of 7.6 among them) aren't in the kit.
