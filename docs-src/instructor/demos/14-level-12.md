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

### Knowledge check answers

🕒 **5 minutes** · at the end of the block · learners answer on their own first ([Level 12, Knowledge check](../workbook/level-12.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** Guest has **ADD_OBJECT_ENTRY** on Contact Us, but not VIEW. Why not grant VIEW too?

✔ **Answer: C.** Anyone could read every submission. A public form is write-only: visitors submit, and nobody but staff reads the submissions. VIEW at company scope would publish every person's details through the API.

- **A:** Guest can hold VIEW; Clarity's CMS content relies on it.
- **B:** The form would still work; it would just leak data.
- **D:** VIEW can be granted to any role.

**Ask next:** How does a visitor still see what they submitted? (The submission's own response returns the created entry.)

**Question 2.** Someone removes Guest's ADD_OBJECT_ENTRY on Contact Us. What do visitors see on the Contact Us page?

✔ **Answer: D.** No form at all, and no error anywhere. A Form Container renders nothing for a user who can't add entries to its object: no fields, no button, no message, no log line. The page looks empty, which is why prompts state who may submit.

- **A:** The form isn't even drawn.
- **B:** Nothing redirects to sign-in.
- **C:** There's no read-only mode.

**Ask next:** How do you catch this before launch? (Check the page as Guest after every permission change, as 12.2 does.)

**Question 3.** Daniel approves one request's Follow Up task. It disappears from Contact Us Responses. What happened to the entry?

✔ **Answer: B.** It's approved; the list shows pending ones. The end node sets the entry to approved, and the data set filters on pending entries, so the dashboard is a to-do list. The entry still exists under *Content & Data*.

- **A:** Approval doesn't delete; Delete is a separate action.
- **C:** Entries stay in their site.
- **D:** The filter is the same for everyone.

**Ask next:** How would you show approved requests too? (A second data set or view, filtered on approved.)
