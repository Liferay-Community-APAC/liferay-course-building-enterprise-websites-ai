# Level 12 — Objects: the Contact Us form and its follow-up

📖 **Liferay Objects** let you define the data you want to store; Liferay generates its storage, its REST APIs, a basic admin UI and permissions. A **picklist** holds reusable, translatable options. A **Form Container** turns a content page section into a form that creates an object entry. A **workflow** routes each new entry to the people who handle it, and a **Data Set** shows entries as a filterable, sortable table or list.

### 12.1 — The Inquiry Types picklist and the Contact Us object

🎯 An **Inquiry Types** picklist in English and Spanish, and a site-scoped **Contact Us** object with seven fields, published.

🧩 `manage-objects`

📎 R12.

💬 **Prompt:**
```
Using the manage-objects skill:

1. Create the picklist "Inquiry Types" (ERC INQUIRY_TYPES) with the items
   Sales, Support, Partnership and General (keys sales, support,
   partnership, general), translated into Spanish (es_ES): Ventas,
   Soporte, Asociación, General.
2. Create and publish the object "Contact Us" (name ContactUs, ERC
   CONTACT_US), site-scoped, shown under Content & Data, with entry history
   in the audit framework, not shown as a widget, and these fields: Full
   Name (fullName, text, required), Email Address (emailAddress, text,
   required), Phone (phone, text, required), Inquiry Type (inquiryType,
   picklist Inquiry Types, required, translatable), State or Province
   (stateOrProvince, text), City (city, text), Comment (comment, long
   text, translatable).
3. Grant the Web Developer role every permission on Contact Us. Grant
   Guest ADD_OBJECT_ENTRY only (visitors submit; they never read
   submissions).

Read the object back with its fields and REST path.
```

✅ **Verify:** *Control Panel* → *Picklists* → **Inquiry Types**: four items; switch the language to Spanish: *Ventas, Soporte, Asociación, General*. *Control Panel* → *Objects* → **Contact Us**: published, scope *Site*, seven fields.

### 12.2 — The Contact Us form

🎯 A styled form on the Contact Us page that creates Contact Us entries, for visitors who aren't signed in.

🧩 `manage-form-containers`, `manage-pages`

📎 R12.

💬 **Prompt:**
```
Using the manage-form-containers skill, add a Form Container for Contact Us
to a "Contact Form" container on the Contact Us page in
client-extensions/clarity-site: padding spacer 4, body background, 15px
radius; a localization selector (small, language label hidden); the fields
in the order Full Name, Email Address, Phone, Inquiry Type, State or
Province, City, Comment, each with bottom padding spacer 3; and a submit
button. Deploy, then submit one test entry as Guest through the form's own
endpoint and show me it was created.
```

✅ **Verify:** open **Contact Us** in a private window: the form shows its seven fields and a submit button. Submit an entry yourself. Then, as the admin, Site Menu → *Content & Data* → **Contact Us**: your entry and the agent's are listed.

![The Contact Us form as a visitor sees it, with the language selector and the seven fields.](screenshots/12-2-contact-us.png)

### 12.3 — A follow-up workflow for new requests

🎯 Each new Contact Us entry creates a **Follow Up** task for the Distributor Representative role, which is notified; approving it approves the entry.

🧩 `manage-object-logic`

📎 R12.

💬 **Prompt:**
```
Using the manage-object-logic skill, create and publish a workflow "Contact
Us Follow Up" (with an ERC): start → a task "Follow Up" (node name
followUp, description "Ask a Distributor Representative to verify a new
Contact Us submission.") assigned to the Distributor Representative role,
with a user notification to that role: "There is a new ${entryType} request
for you to follow up with." → transition "Approve" (approve_contact_us_entry)
→ end, where the end node sets the status to approved. The start → task
transition is "Review" (review_contact_us_entry). Link it to the Contact Us
object on the site clarity-public. Read the link back.
```

✅ **Verify:** *Applications* → *Process Builder*: **Contact Us Follow Up** is published; open it, the *Follow Up* task is assigned to *Distributor Representative*. In the site, Site Menu → *Configuration* → *Workflow*: **Contact Us** uses it.

### 12.4 — The Contact Us Responses dashboard

🎯 A **Contact Us Responses** data set of pending requests (list view, filters, sorting, view and delete actions) on a hidden **Contact Us Responses** page.

🧩 `manage-data-sets`, `manage-pages`

📎 R12.

💬 **Prompt:**
```
Using the manage-data-sets skill, create a data set "Contact Us Responses"
(ERC CONTACT_US_RESPONSES) on the Contact Us object's site-scoped REST
endpoint, showing only entries pending review. List view: title fullName,
description comment. Filters: a date range on dateCreated ("Create Date")
and a selection on inquiryType from the Inquiry Types picklist. Sorts:
Name (fullName, default), Create Date (dateCreated), City (city). Item
actions: View (opens the entry's admin page, built from its ERC, not a
hard-coded URL) and Delete (async DELETE with a confirmation, danger
style, success and error messages).

Access expectations: the Distributor Representative role can view and
delete Contact Us entries (company scope); Guest can still only add them.

Then add a hidden page "Contact Us Responses" (/contact-us-responses) to
client-extensions/clarity-site, viewable by the Distributor Representative
role and site members only, not Guest, holding the Data Set fragment with
this data set. Deploy.
```

✅ **Verify:**
1. As Guest, submit two entries on **Contact Us**.
2. Sign in as **Daniel Raymond** in a private window: a notification (the bell) tells him about each new request. Open `/web/clarity/contact-us-responses`: both entries are listed; sort by Name and filter by Inquiry Type.

![Contact Us Responses as Daniel Raymond: one pending request from Priya Sharma, with filter, sort and row actions.](screenshots/12-4-responses.png)
3. User menu → *My Workflow Tasks* → *Assigned to My Roles*: assign one task to himself and **Approve** it. Back on the page, that entry is gone.

That last step is an action, not a check: it's how you'd accept the workflow in a real project, so do it as Daniel.

### ⭐ 12.5 — Bonus: a two-step form

Enable *Allow Users to Save Entries as Draft* on Contact Us and turn the form into two steps with a Stepper (contact details, then the request), with *Next* on step one and *Previous* and *Submit* on step two. Success: a visitor completes both steps and one entry is created.
