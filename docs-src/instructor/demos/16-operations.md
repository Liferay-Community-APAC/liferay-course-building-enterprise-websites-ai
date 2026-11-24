# Performance tuning and maintenance

⏱ **15-minute block** · **Slides:** [Day 2, 37–38](slides/day-2.html#37) · **Learners:** no exercise

**In this block:** A talk with no exercise: testing, auditing, monitoring and upgrading.

**Demos:** D2.13 (4 min)

### D2.13 — Page Audit

🕒 **4 minutes** · Day 2, slide 38 · with *Test, audit, monitor, upgrade* (instructor only)

🎯 **Show:** a page audit of accessibility and SEO, run from the page itself.

💡 **Say:** performance and quality checks are ongoing: rerun them after every code or infrastructure change.

🧰 **Prepare** (in the break before):
1. Get a Google PageSpeed Insights API key.
2. Use a demo environment with a public URL: PageSpeed fetches the page from Google's servers, so it can't audit `localhost`. Without one, present the slide only.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Instance Settings* → *Content and Data* → **Pages** → *Google PageSpeed Insights*: enable it with your key → **expect:** Google PageSpeed Insights is enabled.
2. Open the public Home page and the *Page Audit* panel from the top bar. Run the audit → **expect:** the accessibility and SEO findings. Walk through them.

🧹 **After the demo:** remove the PageSpeed API key from *Instance Settings* → *Pages* → *Google PageSpeed Insights* and save.
