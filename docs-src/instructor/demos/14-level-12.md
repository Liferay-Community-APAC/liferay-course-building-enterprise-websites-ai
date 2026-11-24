# Level 12 — Objects: the Contact Us form and its follow-up

⏱ **60-minute block** · **Slides:** [Day 2, 29–33](slides/day-2.html#29) · **Learners:** [Level 12](../workbook/level-12.html)

**In this block:** Learners build the Contact Us object, its form, a follow-up workflow and the responses dashboard.

**Demos:** D2.11 (8 min)

### D2.11 — An object, its picklist and its form

🕒 **8 minutes** · Day 2, slides 31 and 33 · with *Liferay Objects*, then at the Level 12 challenge

🎯 **Show:** the Contact Us object, its translated picklist, and a submission from form to Data Set.

💡 **Say:** Guest can add entries but never view them; the Distributor Representative sees them through the Data Set.

📋 **Steps:**
1. *Global Menu* → *Control Panel* → *Objects* → **Contact Us** → **expect:** published, scope *Site*, seven fields.
2. *Global Menu* → *Control Panel* → *Picklists* → **Inquiry Types**. Switch the language selector to Spanish → **expect:** *Ventas, Soporte, Asociación, General*.
3. In a private window, submit the **Contact Us** form with test data → **expect:** the form is submitted. This creates a real entry.
4. In a private window, sign in as `daniel.raymond@clarityvisionsolutions.com` and open `/web/clarity/contact-us-responses` → **expect:** the Data Set lists the new submission, pending review.
5. Ask the live prompt below → **expect:** the same entry, through the API.

💬 **Live prompt:** as step 5, ask:
```
List the Contact Us entries of the site clarity-public created today, with
their title, inquiry type and workflow status. Read only.
```

🧹 **After the demo:** after class, delete your test entry.
