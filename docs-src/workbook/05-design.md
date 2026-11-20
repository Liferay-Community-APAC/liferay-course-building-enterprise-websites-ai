# Level 5 — Design: style book, Theme CSS, favicon and logo

📖 Liferay separates **what's on a page** from **how it looks**. A **style book** changes a theme's design tokens (colors, fonts, spacing) without CSS; each style book belongs to the theme it was made for. A **Theme CSS client extension** replaces the theme's CSS entirely and declares its own tokens, which then appear in the page editor's style options (for example *Color Brand Primary*). A **favicon** client extension and a site **logo** complete the brand. Master pages carry the Theme CSS, so every page using them follows.

### 5.1 — A style book for a quick brand check

🎯 A **Clarity Style Book** for the Classic theme with Clarity's primary color, marked as the default.

🧩 `theme-and-design`

📎 R5 — brand without editing each page.

💬 **Prompt:**
```
Using the theme-and-design skill, add a style book named "Clarity Style
Book" for the Classic theme to client-extensions/clarity-site, setting only
the Primary theme color to #187373, and make it the site's default style
book. Deploy and confirm the style book exists and is the default.
```

✅ **Verify:** Site Menu → *Design* → *Style Books*: **Clarity Style Book** is marked *Default*. Open it: under *Color System* → *Theme Colors*, *Primary* is `#187373`, and the preview's buttons are teal. Open **Home**: the *Explore Products* button is teal. Leave the style book editor without publishing.

![Design → Style Books: Clarity Style Book marked as the default.](screenshots/5-1-style-books.png)

### 5.2 — Clarity's Theme CSS and favicon client extensions

🎯 Two frontend client extensions: **Clarity Theme CSS**, carrying Clarity's full brand from section 5 of the brief and declaring its color tokens for the page editor, and **Clarity Favicon**.

🧩 `theme-and-design`, `scaffold-client-extension`, `deploy-and-verify`

📎 R5.

💬 **Prompt:**
```
Using the theme-and-design and scaffold-client-extension skills, create a
frontend client extension project client-extensions/clarity-theme with:

1. A themeCSS client extension "Clarity Theme CSS", built on the Classic
   theme's CSS, applying the brand in section 5 of
   context-source/clarity-brief.md: the brand primary and secondary colors
   with their darker and lighter shades, the neutral colors, Poppins as the
   font, card and button radii. Include a frontend-token-definition.json
   that declares the brand colors (Color Brand Primary, its shades, Color
   Brand Secondary, Color Neutral 0 to 10) so they appear in the page
   editor's style options.
2. A themeFavicon client extension "Clarity Favicon" serving
   context-source/assets/branding/clarity-favicon.svg.

Keep these in their own project: a frontend project can't share one with
the site initializer. Deploy it and confirm both client extensions are
registered and the CSS URL answers 200.
```

✅ **Verify:** Global Menu → *Applications* → *Client Extensions*: **Clarity Theme CSS** and **Clarity Favicon** are listed and *Ready* (don't change them).

![Applications → Client Extensions listing Clarity Theme CSS and Clarity Favicon.](screenshots/5-2-client-extensions.png)

### 5.3 — Apply the brand to the site and its master pages

🎯 Both master pages use Clarity Theme CSS; the site has Clarity's favicon and logo.

🧩 `theme-and-design`, `manage-pages`

💬 **Prompt:**
```
In client-extensions/clarity-site, bind Clarity Theme CSS (the themeCSS
client extension from client-extensions/clarity-theme) to both master pages,
and set the Clarity Favicon and the logo
context-source/assets/branding/clarity-logo-c.png on the site's public
pages. Use the site initializer where it supports a setting and the
headless APIs where it doesn't, and tell me which you used for each.
Redeploy (the Theme CSS must already be registered when the initializer
imports the masters), then fetch the Home page as Guest and show me the
stylesheet link of Clarity Theme CSS and the favicon link in its HTML.
```

✅ **Verify:**
- Open **Home** in a private window: Poppins text, teal buttons, the Clarity favicon in the browser tab.

![Home at the end of Day 1, as a visitor sees it: Clarity's header and menu, Poppins headings and teal pill buttons. The grey boxes are image placeholders you map to real images in Level 7.](screenshots/5-3-home.png)
- Site Menu → *Design* → *Page Templates* → *Masters* → **Primary Master Page** → the *Page Design Options* panel (the brush icon) → *More Page Design Options*: *Theme CSS Client Extension* shows **Clarity Theme CSS**. Leave without saving.
- In the master's editor, select the *Header Announcement Bar* container → *Styles* → *Background*: the color picker offers **Color Brand Primary**. Leave without publishing.

⚠️ Once a Theme CSS client extension replaces the theme's CSS, the Classic theme's style book no longer applies to those pages: 5.1 is a quick check, 5.2 is Clarity's real brand.
