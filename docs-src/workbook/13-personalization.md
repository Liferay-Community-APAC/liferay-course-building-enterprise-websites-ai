# Level 13 — Personalization: a Home page for distributors

⏱ **About 30 minutes**, with the talk · **Builds on:** Levels 1 and 4

**What you'll build:** a reusable **Clarity Audience Container** fragment, and a Home page that welcomes signed-in distributors back instead of asking them to become distributors. It tailors the page by **who the visitor is**, using only non-deprecated features.

**Key terms**
- **Audience Container:** the fragment you build here. It reads the signed-in user's user groups and decides whether to render what's dropped inside it.
- **FreeMarker:** the template language a fragment's HTML can use. It runs on the server, before the page reaches the browser.
- **Fragment configuration:** the settings a fragment exposes in the page editor's *Configuration* tab, such as *userGroup* and *mode* here.
- **DXP segments and experiences:** Liferay's classic way to show a page differently to groups of visitors. Deprecated on 2026.Q1 and later.
- **Liferay Data Platform:** where segmentation moves after DXP segments. It needs a Data Platform workspace connected to your instance.

ℹ️ **Note:** this level doesn't use DXP segments, because they're deprecated. Your instructor shows Liferay Data Platform segmentation in the slides.

### 13.1 — The Clarity Audience Container fragment

🎯 **Goal:** a fragment with a drop zone that renders its content only for members of a chosen user group, or only for everyone else.

**Requirement:** R13 · **Skills:** `scaffold-fragment`

💬 **Prompt:**
```
Using the scaffold-fragment skill, add a "Clarity Audience Container"
fragment to the Clarity Components set in client-extensions/clarity-site:
a drop zone whose content renders only when the configured audience
matches. Configuration: userGroup (text: a user group name, e.g.
"Distributors") and mode (select: "members" = show only to signed-in
members of that user group, "others" = show to everyone else, Guest
included). Decide in FreeMarker on the server, not with JavaScript, so
hidden content never reaches the browser. In the page editor, always show
the content, with a small label saying who it's for. Deploy, then check the
fragment compiled.
```

✅ **Verify** (look, don't change anything):
1. *Site Menu* → *Design* → *Fragments* → **Clarity Components**: **Clarity Audience Container** is listed.
2. Open it: the *Configuration* tab shows *userGroup* and *mode*. Close without publishing.

### 13.2 — A distributor variant of Home

🎯 **Goal:** signed-in distributors see *Welcome Back! Elevate Your Inventory with Premium Eyewear.* and no distributor promotion; everyone else sees the usual Home.

**Requirement:** R13 · **Skills:** `manage-pages`, `scaffold-fragment`

💬 **Prompt:**
```
In client-extensions/clarity-site, on the Home page:
- wrap the Banner in a Clarity Audience Container (userGroup
  "Distributors", mode "others"), and add a copy of the Banner in a second
  Audience Container (userGroup "Distributors", mode "members") whose
  heading reads "Welcome Back! Elevate Your Inventory with Premium
  Eyewear.";
- wrap the Distributor Promo container in an Audience Container
  (userGroup "Distributors", mode "others").
Deploy, then fetch Home as Guest and as Terrence Wheatley (training
password "learn", a member of Distributors) in a real browser session, and
show me the banner heading and whether the Distributor Promo is present
for each.
```

✅ **Verify** (look, don't change anything):
1. In a private window, sign in as **Terrence Wheatley**: Home says *Welcome Back!…*.
2. On the same page, there's no *Become a Clarity Distributor* section.
3. Sign out: the default Home is back, with the promotion.
4. As the admin, open **Home** in edit mode: both banners show, each labeled with its audience. Leave without publishing.

![Home as Terrence Wheatley, a distributor: the banner reads "Welcome Back! Elevate Your Inventory with Premium Eyewear." and Terrence's avatar replaces the Sign In button.](screenshots/13-2-terrence-home.png)

📖 **Why it matters:** this works for signed-in users and user groups. For anonymous visitors (by behavior, location or campaign), you need Liferay Data Platform segments, which is the supported path for that kind of personalization.
