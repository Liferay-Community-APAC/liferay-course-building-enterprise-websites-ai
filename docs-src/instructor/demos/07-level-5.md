# Level 5 — Design: style book, Theme CSS, favicon and logo

⏱ **45-minute block** · **Slides:** [Day 1, 35–38](slides/day-1.html#35) · **Learners:** [Level 5](../workbook/level-5.html)

**In this block:** Learners apply Clarity's brand with a style book, a Theme CSS client extension, a favicon and the logo.

**Demos:** D1.12 (3 min)

### D1.12 — Brand tokens in the page editor

🕒 **3 minutes** · Day 1, slide 37 · with *Style book or Theme CSS*

🎯 **Show:** the brand colors offered as named tokens in the page editor.

💡 **Say:** those names come from `frontend-token-definition.json` in the Theme CSS client extension the agent wrote in 5.2.

📋 **Steps:**
1. Open the **Primary Master Page** in its editor (*Site Menu* → *Design* → *Page Templates* → *Masters*).
2. Select the *Header Announcement Bar* container → *Styles* → *Background* → **expect:** the color picker offers **Color Brand Primary** and its shades.
3. Leave without publishing.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block, included in its time · learners answer on their own first, while their last prompt runs ([Level 5, Knowledge check](../workbook/level-5.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** After 5.3, someone changes the Primary color in **Clarity Style Book** to red. What changes on pages that use the Primary Master Page?

✔ **Answer: D.** Nothing: Clarity Theme CSS has replaced what the style book styles. A style book changes the tokens of the theme it was made for. Once a Theme CSS client extension replaces the theme's CSS, the style book's tokens no longer drive those pages. 5.1 was a quick check; 5.2 is the real brand.

- **A:** The Theme CSS sets the colors now.
- **B:** The style book's own preview changes, but the pages don't.
- **C:** All of Clarity's pages use a master page bound to the Theme CSS.

**Ask next:** When is a style book the right tool? (Light brand changes on a stock theme, made by a designer without code.)

**Question 2.** Why do Clarity Theme CSS and Clarity Favicon live in their own project, `client-extensions/clarity-theme`, and not in `clarity-site`?

✔ **Answer: A.** Frontend and site initializer extensions can't share a project. The workspace groups client extensions by kind: frontend (theme, CSS, JavaScript), batch (site initializer, batch), microservice and configuration. Frontend and batch can never share a project, so a real site is several sibling projects.

- **B:** `themes/` holds legacy theme modules; client extensions go under `client-extensions/`.
- **C:** Speed isn't the reason; the build refuses the mix.
- **D:** The favicon is frontend too, so it shares the theme's project.

**Ask next:** How many projects will Clarity end up with by Day 2? (At least the site initializer and the theme, plus any microservice.)

**Question 3.** On a fresh environment, `clarity-site` is deployed before `clarity-theme`. Every page shows Classic's default look. What's the cause, and the fix?

✔ **Answer: C.** The binding was skipped. Deploy the theme, then the site again. The initializer binds the Theme CSS to the masters by its ERC. If that client extension isn't registered yet, the binding is skipped with only a log line, and pages fall back to the base theme. 5.3's prompt warns about this order.

- **A:** A style book can't override a Theme CSS client extension.
- **B:** The CSS is served live; nothing needs a restart.
- **D:** `metadata.json` has no setting for a client extension; the masters carry the binding.

**Ask next:** How would you make the order impossible to get wrong? (A deploy script that deploys the theme first, as `scripts/deploy_site.sh` could.)
