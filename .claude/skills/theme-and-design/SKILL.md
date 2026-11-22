---

description: Customize the visual appearance of a Liferay site using themeCSS client extensions, master pages, and style books. Use when the user asks to change colors or fonts, create a theme, set up a style book, define a master page header/footer, or apply WCAG accessibility guidelines.
name: theme-and-design

---

# Theme and Design

Three layers control a site's look and feel. Apply them in this order: themeCSS (base variables and overrides), style book (token values per site), master page (header/footer layout).

When iterating on a site built from a site initializer, theme changes apply **live** via `blade gw deploy` of the `themeCSS` CET — no site reprovision needed (see `rules/site-initializer-format.md`).

## When to Invoke

- "Change the site colors", "apply a brand theme", "create a custom theme"
- "Set up a style book with our design tokens"
- "Define a header and footer for all pages"
- "Create a dark variant of the site"
- Called by `build-site` when the user specifies visual design requirements

## Workflow

### Layer 1: themeCSS Client Extension

A `themeCSS` CET injects custom CSS that overrides Clay Design System variables. This replaces the legacy Liferay theme WAR.

> **Two constraints to settle before writing any CSS.**
>
> 1. **It needs its own project.** `themeCSS` is classified `frontend`; a `siteInitializer` is `batch`, and the workspace plugin forbids that combination. The theme is always a sibling project — see `rules/client-extension-types.md` → "Which Types May Share a Project".
>
> 1. **It is applied from the initializer tree through the master page, not `metadata.json`.** `layout-set/*/metadata.json` has no key for a client extension, but the master page's `page-definition.json` carries a top level `settings.themeCSSClientExtension` block whose `externalReferenceCode` is `"LXC:" + <config-erc>` (the same `settings` block also binds a style book and `globalCSSClientExtensions`). The render-time resolver walks layout → master layout → layout-set, so one bind on the master cascades to every page using it and **survives reprovision**. See `rules/site-initializer-format.md` → "Binding design to the master via `settings`". Creating or changing the binding is a master composition change (applied on the next initializer re-fire — clean redeploy); redeploying the CET updates the served CSS live once bound. Deploy-order matters: if the CET is not yet registered when the initializer imports the master, the bind is silently skipped (`No CET found for LXC:...`) — retrigger the initializer after the CET is up.
>
> So decide up front where each part of the look lives: style book tokens first, the master-bound themeCSS CET for Clay level overrides that have no style book token (Classic exposes no `headings*` tokens), master page fragment CSS for the rest.

#### Scaffold

```
client-extensions/<name>/
  client-extension.yaml
  package.json         # drives the theme build
  src/
    css/
      _custom.scss     # Clay variable overrides
```

`package.json` is what compiles the SCSS — without it there is no `build/buildTheme` output for the URLs below to point at:

```json
{
	"liferayDesignPack": {
		"baseTheme": "styled"
	},
	"main": "package.json",
	"name": "@liferay/<name>",
	"version": "0.0.0"
}
```

**`client-extension.yaml`:**

```yaml
<workspace-id>-theme-css:
  clayRTLURL: css/clay_rtl.css
  clayURL: css/clay.css
  mainRTLURL: css/main_rtl.css
  mainURL: css/main.css
  name: <WorkspaceId> Theme CSS
  type: themeCSS
```

The keys are `mainURL` and `clayURL` — capital `URL`. All four paths are outputs of the theme build (`build/buildTheme/css/`), not files you author.

**`src/css/_custom.scss`** — Clay variable overrides:

```scss
// Brand colors

$primary: #0B5FFF;
$secondary: #6B7280;
$success: #287D3C;
$danger: #DA1414;

// Typography

$font-size-base: 1rem;
$font-family-base: "Inter", sans-serif;
$headings-font-weight: 700;

// Border radius

$border-radius: 0.5rem;
$border-radius-lg: 1rem;

// Shadows

$box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
```

**`src/css/main.scss`:**

```scss
@import "custom";
```

Build the SCSS to CSS: `blade gw buildClientExtension` or configure the Sass build in `build.gradle`. Then run `deploy-and-verify`.

#### The Stock Theme Build Compiles Clay STATIC — Style Book Tokens Apply to Nothing

**The scaffold above produces a theme whose Style Book typography (and Clay-level color) tokens silently do nothing.** The `liferayDesignPack` build compiles Clay with plain Sass values: the resulting `clay.css`/`main.css` contain **zero `var(--…)` references** (verified on 2026.Q3.1 — `grep -c 'var(--' clay.css` → 0), so a style book token like `fontFamilyBase` sets a CSS variable that **no rule reads**. The failure is perfectly silent: the page's inline `:root` shows the token value (e.g. `--font-family-base: YourFont, …`), the style book editor looks right, and the rendered font never changes — it reads as a font-loading problem, not a compilation one. Classic does not have this problem because its Clay is compiled against the **custom-properties variable set** (`body { font-family: var(--body-font-family) }` → `:root` chain → `var(--font-family-base)`).

The fix is one file, `src/css/_clay_variables.scss` — the hook `clay/base.scss` imports before Clay's own variables (this is the mechanism Classic's own `_clay_variables.scss` comment documents):

```scss
@import 'clay/atlas-custom-properties/_variables';
```

That variable set defines every Clay Sass variable as `var(--token, fallback)` (`$font-family-base: var(--font-family-base) !default;` in `clay/atlas-custom-properties/variables/_globals.scss`), so the whole compiled output consumes the style book's variables — verified: ~2,300 distinct `var(--…)` names after the switch, and `getComputedStyle(document.body).fontFamily` returns the token value. Diagnose with `grep -c 'var(--font-family-base' <served clay.css>`: `0` means static build, tokens dead.

**Or start from Classic's own sources (verified on 2026.q3.5).** Classic is itself `baseTheme: styled` plus its own `src/css` (`modules/apps/frontend-theme/frontend-theme-classic/src/css`, byte-identical to the `.scss` files inside the deployed `classic-theme.war`). Copy that directory into the CX's `src/css` and add your rules at the end of `_custom.scss`. The build then matches Classic: its `clay.css` and `main.css` had exactly Classic's 2,021 and 67 `var(--…)` references, and style book tokens apply. Leave out Classic's two `*-atlas-custom-properties.scss` entry files: Classic's pages load `clay.css` and `main.css`, not those variants, and against the workspace build's `styled` base their `@import 'clay/atlas-custom-properties'` fails with Dart Sass "It's not clear which file to import" (the base ships both the partial and the file). To add tokens of your own (values Classic has no token for), copy Classic's `frontend-token-definition.json` from the WAR, append a token set, declare the same custom properties with defaults in `:root` in `_custom.scss`, and point the style book's `themeId` at `LXC:<config-erc>` (the pattern of liferay-crm's `crm-theme-css`).

Corollary: without this import, a `:root { --primary: … !important }` block only affects rules that *explicitly* write `var(--primary)` (your own custom SCSS, fragment CSS) — Clay buttons, alerts, and body text keep Clay's baked-in defaults regardless of what the style book or `:root` says.

#### Webfonts: Register in the themeCSS, Apply via the Style Book

A brand webfont splits across the two layers: `@font-face` (registration) lives in the themeCSS CET — font binaries under `assets/fonts/`, shipped by an `assemble` block `{from: assets, include: fonts/**, into: static}` (do **not** `hashify` them; the CSS references them by stable relative URL `../fonts/<file>` from `css/main.css`) — and the **family is applied only by the style book's `fontFamilyBase` token** (`YourFont, <fallbacks>`). No `font-family` rule in the CSS. Both halves are dead without the `_clay_variables.scss` import above. `@font-face` family-name matching is case-insensitive. Ship `woff2` + `woff`; skip `.eot`.

#### Apply to Site

The portable path is the master page binding: set `settings.themeCSSClientExtension.externalReferenceCode` to `"LXC:" + <config-erc>` in the master's `page-definition.json` and re-fire the initializer with a clean redeploy (see the constraint note at the top of this skill). For a quick manual check on a live site, Site Administration → Design → Theme → Configure also selects it — but that selection is lost on reprovision, so never treat it as the durable copy.

### Layer 2: Style Book

A style book maps Clay token names to site specific values. Unlike a themeCSS CET's compiled output, a style book **can** be applied from the initializer tree, which makes it the reproducible half of the theme layer.

> **A stock-built themeCSS CET bypasses the style book — unless it compiles Clay against the custom-properties variables.** By default the SCSS build emits **literal values**, not `var(--token)` references, so style book tokens never reach any rule the CET's compiled CSS sets — a token edit "succeeds" (and a reprovision succeeds) with zero visible change. The `src/css/_clay_variables.scss` import above ("The Stock Theme Build Compiles Clay STATIC") removes the bypass: with it, the compiled Clay consumes `var(--token)` throughout and the style book drives typography and Clay colors as designed. Either way, put brand values that should be marketer-tunable in the **style book**, and keep the themeCSS CET for what tokens can't express. To make a style book drive tokens on a themeCSS-bound site, the CET must also ship its own `frontend-token-definition.json` declaring the tokens **and** the style book must be bound alongside the CET (same master `settings` block, style book by key, CET by full `LXC:` ERC). Two related facts: a themeCSS CET selected as the site theme **without** a token definition makes the page editor NPE, and the CET's `getThemeId()` is its **ERC** — so a `style-book.json` targeting a themeCSS-themed site sets `themeId` to that ERC, not `classic_WAR_classictheme`. Also note a style book's `themeId` is **write-once**: it is set only when the book is created, and the initializer upsert (`updateStyleBookEntry`) takes no `themeId`, so a book first created against the wrong theme keeps it on every redeploy. Re-bind it by deleting the book, then re-firing the initializer — plan the theme before first provision.

#### Author It in the Tree

`site-initializer/style-books/<name>/style-book.json` — `defaultStyleBookEntry` is what applies it to the site with no manual step:

```json
{
	"defaultStyleBookEntry": true,
	"frontendTokensValuesPath": "frontend-tokens-values.json",
	"name": "<Style Book Name>",
	"themeId": "classic_WAR_classictheme"
}
```

`classic_WAR_classictheme` is right **only when no themeCSS CET is bound**. When the master binds one, `themeId` must be that CET's full ERC, `"LXC:<config-erc>"`; a Classic-bound book is then silently orphaned, so the tokens never emit and the Style Books list shows it against the wrong theme (verified on 2026.q2, `_isStyleBookEntryApplicable`).

`frontend-tokens-values.json` beside it, one entry per token — and **the key must be namespaced with the token definition id** (the book's `themeId` — `LXC:<config-erc>:primaryColor` on a themeCSS-bound site), or the value applies but never shows in the Style Book editor:

```json
{
	"classic_WAR_classictheme:primaryColor": {
		"cssVariableMapping": "primary",
		"value": "#14284b"
	}
}
```

**The initializer upsert leaves the book in a "Draft" state — benign.** The style book handler writes through Liferay's versioned-entity service, which updates the published head AND an identical draft row together; the editor shows a "Draft" badge whenever a draft row exists. Verified on q3.1: head and draft byte-identical after an upsert, live pages serve the head. Publish (a content no-op that clears the badge) or ignore it; it reappears after every reprovision that touches the book.

**Why the namespace (verified on q3.1, root-caused in `style-book-web` source):** the runtime CSS-variable provider (`StyleBookScopedCSSVariablesProvider`) iterates all entries reading only `cssVariableMapping`/`value` — key-agnostic, so a plain key like `"primaryColor"` renders fine. But the editor's sidebar (`Sidebar.js` → `FrontendTokenCategories`) rewrites every token's `name` to `` `${definitionId}:${token.name}` `` and looks values up by that namespaced key — a plain key is simply not found, so the editor shows the theme **default** while the page renders your value. The failure is doubly deceptive: everything looks right on the site, wrong in the admin UI, and if an admin then edits and publishes from that editor state, the UI saves namespaced keys **alongside** your plain ones and the defaults it displayed overwrite your values wherever they touched a field. Use namespaced keys from the start — that is the format the UI itself saves.

#### Token Names Must Exist in the Theme — Unknown Ones Are Dropped Silently

A token only takes effect if its name is declared in the active theme's `frontend-token-definition.json`. An invented name is discarded with **no error**: the initializer logs `addStyleBookEntries took N ms`, nothing warns, and the page keeps the default value. Do not guess — enumerate first:

Each entry needs **two** things — the token `name` (the JSON key) and its `cssVariableMapping`. The mapping is not derivable from the name (`primaryD1Color` → `primary-d1`, `btnPrimaryBackgroundColor` → `btn-primary-background-color`, `fontFamilyBase` → `font-family-base`), so dump both at once rather than guessing the kebab-case form:

Read it from the **deployed theme in the bundle**, not from portal source. A Liferay Workspace is not a portal checkout — `modules/apps/frontend-theme/...` does not exist there, and reaching for it sends you looking for a repository you may not have. The definition ships inside the theme WAR:

```bash
unzip -p bundles/osgi/portal-war/classic-theme.war WEB-INF/frontend-token-definition.json > /tmp/tokens.json

# This course's Docker container doesn't mount osgi/portal-war: copy the WAR out first
docker compose cp liferay:/opt/liferay/osgi/portal-war/classic-theme.war /tmp/classic-theme.war
unzip -p /tmp/classic-theme.war WEB-INF/frontend-token-definition.json > /tmp/tokens.json

python3 -c "
import json
d = json.load(open('/tmp/tokens.json'))
for c in d['frontendTokenCategories']:
    for s in c.get('frontendTokenSets', []):
        for ft in s.get('frontendTokens', []):
            for m in ft.get('mappings', []):
                print(f\"{ft['name']:36s} -> {m.get('value')}\")" | sort -u
```

This has the added benefit of describing the theme **actually running**, so the list matches the release under test rather than whatever branch is checked out. Verified on a 2026.Q2 bundle: 252 tokens, and no `headings*` among them.

Filter that list to what you need (`grep --extended-regexp '^(primary|btnPrimary|body|font|h[1-6])'`) rather than reading all 252. For a non Classic theme, substitute its WAR under `bundles/osgi/portal-war/` (or `bundles/osgi/war/` for a deployed custom theme).

Classic declares 252 tokens. Useful ones: `bodyBgColor`, `bodyColor`, `primaryColor`, `primaryD1Color`, `primaryD2Color`, `primaryL1Color`…`primaryL3Color`, `secondaryColor`, `warningColor`, `warningD1Color`, `fontFamilyBase`, `fontSizeBase`, `fontWeightBold`, `fontWeightBolder`, `h1FontSize`…`h6FontSize`, and the full `btnPrimary*` / `btnSecondary*` sets (`BackgroundColor`, `BorderColor`, `Color`, and their `Hover` variants).

Recoloring buttons takes the whole `btnPrimary*` set, not just the background — leaving `btnPrimaryColor` alone gives white label text on a light accent.

##### Never Trust a `var()` Fallback for Contrast

`var(--some-token, #safe-color)` in fragment CSS is a WCAG trap: the fallback only applies when the variable is **unset**, and a Clay/theme default counts as set. Example: `var(--text-muted, #6b7280)` — no style book defines `text-muted`, so Clay's built-in `#a7a9bc` (~2.3:1 on white, an AA fail) wins and the compliant fallback is dead code. Reference a token the style book actually defines (a `--gray-*` ramp value), or measure the resolved color in the browser (`getComputedStyle`) — never assume the fallback is what renders.

**Classic has no `headings*` tokens at all** — `headingsColor`, `headingsFontFamily`, and `headingsFontWeight` are all plausible and all ignored. Only the *sizes* are tokenized (`h1FontSize`…`h6FontSize`); heading **family** and **weight** have no token.

##### Site Wide CSS With No Token — Put It in a Master Page Fragment

This is the gap for values that have no style book token and do not belong in the Clay variable layer of the themeCSS CET. A reproducible answer is the **master page's header fragment**.

A fragment's `index.css` is a stylesheet on the page, so its rules can target anything — they are not confined to the fragment's markup. A fragment placed in the master page loads on **every page using that master**, which makes it the one place site wide CSS can live and still survive delete and redeploy:

```css
/* site-header/index.css — deliberately NOT scoped to the fragment wrapper */

#wrapper h1,
#wrapper h2,
#wrapper h3 {
	font-family: 'Your Face', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
	font-weight: 800;
	letter-spacing: -0.022em;
}
```

This is a deliberate exception to "Fragment Scoping" in `scaffold-fragment` — that rule exists to stop *accidental* cascade leakage between sibling fragments on one page. Keep the exception narrow (headings and brand chrome), keep it in the master's fragment rather than a content fragment, and comment why, or the next reader will "fix" it back into scope.

##### Tag Selectors Alone Miss Every Overridden Heading

A `fragmentFields` literal in `page-definition.json` replaces the editable region's **inner markup**, so a title authored as `<div class="…__title"><h2>…</h2></div>` renders as that `div` with bare text — no `<h2>` survives (see `skills/manage-pages/SKILL.md` → "A Literal Override Replaces the Editable's Inner Markup").

The rule above therefore matches the fragment's *default* heading and skips every placement that sets its own text — which, on a real site, is most of them. Name the title wrapper classes alongside the tags:

```css
#wrapper h1,
#wrapper h2,
#wrapper h3,
#wrapper .conference-hero__title,
#wrapper .section-heading__title {
	/* family, weight, tracking */
}
```

Verified on 2026.Q2: with tags only, `getComputedStyle` on an overridden hero title returned the body font at weight `700`, while the untouched default beside it rendered correctly — so the page looked *mostly* branded and the failure read as a font loading problem rather than a selector one.

##### Every Content Fragment Outranks This Rule — Strip Their Heading Weights

The selector above is one ID plus a **type**, so any fragment styling its own heading through a class beats it. `scaffold-fragment` requires exactly that form (`#wrapper .<wrapper-class>`), so the collision is the default outcome, not an edge case:

```css
#wrapper h1                        /* master rule   — 1 id, 0 classes, 1 type */
#wrapper .conference-hero__title   /* fragment rule — 1 id, 1 class          */
```

The fragment wins. The failure is quiet because it is partial: family and tracking still apply (the fragment did not set those), so headings look *almost* right while `font-weight` silently stays at whatever the fragment declared. Verified on 2026.Q2 — a site wide rule asking for `800` computed to `700` on every heading whose fragment set `font-weight: 700`, and reads as "the heavy font did not take".

Fix it at the fragments, not by escalating the master selector. **Delete `font-weight` from every heading rule in every content fragment** so the master rule is the single source of truth:

```bash
grep --before-context=3 --line-number 'font-weight' */index.css | grep --extended-regexp '__title|__heading'
```

Then confirm the computed value in the browser rather than trusting the stylesheet, because the cascade is the whole question:

```javascript
getComputedStyle(document.querySelector('.my-fragment__title')).fontWeight;
```

Leave explicit weights on non headings (`<p>` date stamps, buttons, uppercase micro labels) — those are not governed by the rule and often want a different weight on purpose.

**Set family, weight, and tracking here — never `color`.** Headings must inherit color from their section, or the same rule that styles dark text on the light content areas also paints the hero `h1` and footer `h2` in that color, on their own dark background. The snippet above omits `color` for this reason; adding it is invisible on a light only site and renders headings unreadable the moment a navy hero or footer exists.

Weigh it against the alternatives before reaching for it:

| Need | Put it in |
| --- | --- |
| Value has a style book token | Style book — always first choice |
| Site wide, no token, plain CSS | Master page fragment CSS (above) |
| Site wide Clay variable overrides, no token | `themeCSS` CET bound in the master's `settings.themeCSSClientExtension` (survives reprovision) |
| Truly instance wide, every site | `globalCSS` CET (no per site scoping available) |
| One section's look | That fragment's own scoped CSS |

A webfont still needs a file served from a CET; a system font stack at weight 800/900 gets a heavy sans with no external dependency.

Verify the book landed by fetching a page and checking the override lands *after* the theme default — two declarations, e.g. `--primary: #0b5fff;` from Classic then `--primary: #14284b;` from the book. One declaration means the tokens were dropped.

> **There is no working style book REST API on 2026.q3.2.** `headless-admin-content` has no style book resource, and the one declared in `headless-admin-site` (`/sites/{siteERC}/style-books`) answers `GET` and `POST` with `400 UnsupportedOperationException` (verified live, with `frontendTokensValues` as a string and as an object). Author style books in the site initializer tree as above, or in Site Administration → Design → Style Books.

Consult learn.liferay.com for the full style book token reference (search `style book tokens`).

### Layer 3: Master Page

Master pages define the persistent header and footer that surround all Content Pages assigned to that master.

#### Create via API

```bash
curl \
	--data '{
		"name": "<Master Page Name>",
		"pageDefinition": {
			"pageElement": {
				"pageElements": [
					{
						"definition": {
							"fragment": {
								"key": "<header-fragment-name>",
								"siteKey": "[$GROUP_KEY$]"
							}
						},
						"type": "Fragment"
					},
					{
						"definition": {
							"fragmentSettings": {
								"unallowedFragments": []
							}
						},
						"type": "DropZone"
					}
				],
				"type": "Root"
			},
			"version": 1.1
		}
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-site/v1.0/sites/<site-erc>/master-pages" \
	--user "test@liferay.com:test"
```

The `DropZone` element must carry a `definition.fragmentSettings` block — a **bare** `{"type": "DropZone"}` does not render, and the master shows an empty body. Use `{"definition": {"fragmentSettings": {"unallowedFragments": []}}, "type": "DropZone"}` so page specific content can be placed inside the master. Note `version` is the **number** `1.1` (not the string `"1.0"`) for a master with a working drop zone. Custom header/footer fragments are referenced by `key` (the fragment's directory name) + `siteKey` (`[$GROUP_KEY$]`), exactly as in a page `page-definition.json` (see `manage-pages`); the content area is a `DropZone` element, **not** a `LAYOUT_DROP_ZONE` fragment. Master pages are typically authored in the initializer tree under `layout-page-templates/master-pages/<name>/page-definition.json` (where `pageDefinition`/`page-definition.json` is the correct importer format). Note: the **live** `headless-admin-site` `MasterPage` DTO uses `pageSpecifications`, not `pageDefinition` — prefer the initializer path, or verify the live write shape against the OpenAPI spec (the MCP operation schema from `mcp-server`, or `GET /o/headless-admin-site/v1.0/openapi.json`).

Consult learn.liferay.com for the full master page template reference (search `master page templates`).

## Accessibility

Follow WCAG 2.1 AA as the baseline:

- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text (18pt+). Use a contrast checker before finalizing the `$primary` color.
- Focus indicators: ensure Clay's default focus ring is not overridden to `outline: none` without a replacement.
- Skip link: include a `<a href="#main-content" class="skip-link">Skip to main content</a>` in the master page header.
- Image alt text: enforce via `data-lfr-editable-type="image"` regions, which prompt editors to provide alt text.

## Favicon and Spritemap

To replace the Liferay favicon or icon spritemap, use the companion CET types:

```yaml
<workspace-id>-favicon:
  url: "images/favicon.ico"
  type: themeFavicon

<workspace-id>-spritemap:
  url: "images/icons.svg"
  type: themeSpritemap
```

Deploy alongside the `themeCSS` CET.

## globalCSS Versus themeCSS

A `themeCSS` CET overrides Clay Design System variables and is applied per site — durably via the master's `settings.themeCSSClientExtension` binding, or manually under Design → Theme. A `globalCSS` CET is different: it injects a plain CSS file on **every page** automatically as soon as it is deployed — there is no per site selection and **no Instance Settings or manual enablement step**. Scope is controlled on the CET itself (`scope: company` injects instance wide; omitting `scope` uses the default):

```yaml
<workspace-id>-global-css:
  assemble:
    - from: assets
      hashify: global.css
      into: static
  name: <WorkspaceId> Global CSS
  scope: company
  type: globalCSS
  url: global.*.css
```

Use `globalCSS` for site agnostic CSS that must always load; use `themeCSS` for brand tokens applied per site through the master binding or theme picker.

## Success Signal

After deploying and assigning:

1. Open the site home page in the browser.

1. Confirm the CET is actually taking effect by its **rendered result**, not by a URL string. A `themeCSS` CET **replaces the theme's compiled CSS** (its `main.css` carries the Clay variable overrides and any custom rules) — it does **not** add a `<link>` whose href contains the config ERC. So verify the *effect*: `getComputedStyle(document.documentElement).getPropertyValue('--some-token')` returns the CET's value, or a rule the CET sets is measurably in force (e.g. a brand color on a primary button). The master's `settings.themeCSSClientExtension` binding (or Design → Theme showing the CET) is itself ground truth that the bind exists.

   > **Do not verify by grepping stylesheet hrefs for the CET name.** Because the CET replaces the theme CSS rather than adding a separately-named file, its config ERC never appears in a `<link>` href — and the base `classic-theme` `clay.css`/`main.css` URLs can still be present. Concluding "the theme CSS is not applied" from the absence of a `<CET-name>`-named stylesheet is a **false negative**. Trust the computed style or the master binding, not the href.

1. Confirm brand colors appear in primary buttons and headings.

1. Run a browser contrast audit (DevTools → Accessibility) to validate WCAG compliance.
## Binding the Brand From the Site Initializer (Verified on 2026.q3.10)

- **Theme CSS** on each master: `settings.themeCSSClientExtension: {"externalReferenceCode": "LXC:<cet-key>", "name": "<name>"}`.
- **Favicon** on each master: `settings.favIcon: {"externalReferenceCode": "LXC:<favicon-cet-key>", "name": "<name>"}`. Keep `name`: it makes the value match the client-extension branch of the schema (without it, it's read as a document).
- **Site logo:** `layout-set/public/logo.png` beside `layout-set/public/metadata.json` (`{"themeName": "Classic"}`); `_updateLayoutSet` sets it as the layout set's logo.
- **A `frontend-token-definition.json` copied from Classic overrides your CSS.** Liferay writes every token's default inline after `main.css`, so Classic's `--primary: #0b5fff` beats your `:root` value. Set the defaults of the tokens you restyle (primary, secondary, brand colors, body, fonts…) to your values or to `var(--color-brand-…)` in the token definition itself.
- **A style book belongs to one theme.** A Classic style book stops applying on pages whose master binds a Theme CSS client extension. A style book for the client extension needs `themeId: "LXC:<cet-key>"` and its own token keys; `themeId` can't change on an existing style book.
- `WARN No theme found for … _WAR_…` when the Theme CSS is requested is harmless.
- **The token definition is wired in `client-extension.yaml`** with the key `frontendTokenDefinitionJSON: src/frontend-token-definition.json` on the `themeCSS` entry (next to `clayURL`, `mainURL`); the build inlines it into the client extension's configuration.
