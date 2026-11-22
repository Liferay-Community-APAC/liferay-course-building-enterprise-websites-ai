# Capabilities, deployment options and Liferay Data Platform

⏱ **15-minute block** · **Slides:** [Day 1, 13–15](slides/day-1.html#13) · **Learners:** no exercise

**In this block:** A talk with no exercise: how Liferay runs, building as code, and where visitor analytics and segmentation live.

**Demos:** D1.5 (8 min)

### D1.5 — Liferay Data Platform

🕒 **8 minutes** · Day 1, slide 15 · with *Knowing what visitors actually did* (instructor only)

🎯 **Show:** where visitor analytics and segmentation live now that DXP segments are deprecated.

💡 **Say:** on 2026.Q1 and later, Data Platform is the source of truth for segments. That's why Level 13 targets signed-in users by user group instead.

🧰 **Prepare** (in the break before):
1. Get access to a Liferay Data Platform workspace connected to a DXP instance, for example a Liferay demo environment. If you have none, present the slide and skip the demo.

📋 **Steps:**
1. In the Data Platform workspace, open the site dashboard, then a page and a piece of content → **expect:** views, visitors, engagement.
2. Open one individual's profile → **expect:** its activity.
3. Open the segment builder and a segment → **expect:** the segment's criteria.
4. Back in DXP: *Global Menu* → *Control Panel* → *Instance Settings* → *Platform* → **Analytics Cloud** → **expect:** the connection settings. Don't change them.
