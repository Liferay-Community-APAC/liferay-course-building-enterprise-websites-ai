---

description: Add business logic to Liferay Objects via object actions, workflow definitions, and notification templates. Use when the user asks to send a notification on create, trigger an action on update, wire a workflow, or automate any response to object entry lifecycle events.
name: manage-object-logic

---

# Manage Object Logic

Attach triggers, conditions, and actions to object definitions. The three extension points are object actions (immediate), Kaleo workflows (multistep approval), and notification templates (user facing messages).

## When to Invoke

- "Send a notification when a Book is created"
- "Trigger a webhook on order update"
- "Wire an approval workflow to this object"
- "Run a Groovy script after an entry is deleted"
- Called by `build-site` during the logic phase

## Prerequisites

Object definition must already exist and be published (see `manage-objects`). Client Extension actions require the CET to be deployed first (see `scaffold-client-extension`).

## Workflow

### Choose the Trigger

| Trigger | When It Fires |
| --- | --- |
| `onAfterAdd` | After an entry is created |
| `onAfterUpdate` | After an entry is updated |
| `onAfterDelete` | After an entry is deleted |
| `standalone` | On demand, invoked explicitly by a user or API call |

### Choose the Action Type

Consult `rules/object-actions-catalog.md` for the full catalog. Summary:

| Action Type | Payload | Notes |
| --- | --- | --- |
| Notification | Template ID | Sends in app or email notification |
| `addObjectEntry` | Definition name + field map | Creates an entry in another object |
| `updateObjectEntry` | Entry ID + field map | Updates an entry in the same or another object |
| Webhook | URL + secret | HTTP POST to external endpoint |
| Groovy Script | Script body | Self hosted or PaaS **and** script execution enabled — off by default, see `rules/object-actions-catalog.md`. Probe before designing around it |
| Client Extension | CET `objectAction` or `workflowAction` externalReferenceCode | Calls a deployed microservice |

### Object Action — Notification (Site Initializer, Preferred)

When the object lives in a site initializer, author the template **and** its action in the tree so the whole thing survives delete and redeploy. The REST recipe further down is for one off changes to a running instance.

Three files in one directory, `site-initializer/notification-templates/<name>/`:

```
notification-templates/
  registration-confirmation/
    notification-template.json                  # metadata
    en-US.html                                  # body, one file per locale
    notification-template.object-actions.json   # the action(s) that fire it
```

`notification-template.json` — note there is **no `body` key**; the handler builds `body` from every `*.html` in the directory, keyed by filename (`en-US.html` → `en-US`):

```json
{
	"editorType": "richText",
	"externalReferenceCode": "<TEMPLATE_ERC>",
	"name": "<Template Name>",
	"recipientType": "email",
	"recipients": [
		{
			"from": "noreply@example.com",
			"fromName": {
				"en_US": "<Sender>"
			},
			"singleRecipient": true,
			"to": {
				"en_US": "[%<OBJECTNAME>_<FIELDNAME>%]"
			}
		}
	],
	"subject": {
		"en_US": "<Subject>"
	},
	"type": "email"
}
```

`notification-template.object-actions.json` — a bare array. **Do not set `notificationTemplateId`**; the handler injects the ID of the template it sits beside, which is what makes the pair portable:

```json
[
	{
		"active": true,
		"externalReferenceCode": "<ACTION_ERC>",
		"label": {"en_US": "<Action Label>"},
		"name": "<actionName>",
		"objectActionExecutorKey": "notification",
		"objectActionTriggerKey": "onAfterAdd",
		"objectDefinitionId": "[$OBJECT_DEFINITION_ID:<ObjectName>$]"
	}
]
```

#### Field Tokens

A term is `[%` + the object's **short name** + `_` + the **field name**, all uppercased, + `%]`. For a `Registration` object with fields `attendeeName` and `email`: `[%REGISTRATION_ATTENDEENAME%]` and `[%REGISTRATION_EMAIL%]`. Camel case collapses — there is no separator inside the field name.

Tokens work in `subject`, in the body HTML, and in `recipients[].to`, which is how a confirmation is addressed to the address the visitor just typed.

Only fields **on that object** resolve. A token reaching across a relationship stays in the output as literal `[%…%]` text.

**The fix is to denormalize.** Add a plain `Text` field to the object holding the related value, populate it when the entry is created, and token that field instead. A registration confirmation that must name the event needs an `eventName` copied onto `Registration` — `[%REGISTRATION_EVENTNAME%]` resolves, a reach through `eventRegistrations` does not. Same pattern as `manage-pages` → "Mapping Limits"; the relationship stays authoritative, the copy is for display.

Verify after sending:

```bash
curl \
	--silent \
	--url "http://localhost:${PORT}/o/notification/v1.0/notification-queue-entries?pageSize=50" \
	--user "test@liferay.com:test" \
	| jq '.items | sort_by(.id) | last
		| {id, recipientsSummary, status, unresolved: (.body | test("\\[%"))}'
```

> **Do not add `sort=` to that URL.** `notification-queue-entries` does not support the common `sort` parameter and **fails silently** — `?sort=id:desc` returns `{"totalCount": null, "items": []}` with a `200`, which reads exactly like "the action never fired". Fetch unsorted and sort in `jq`, as above.

`unresolved: false` with the right `recipientsSummary` means Liferay **built** a correctly addressed message. That is the part this endpoint can actually tell you.

#### `status: 1` Is `STATUS_SENT` and It Lies

The status codes are not a queue depth. From `NotificationQueueEntryConstants`:

| Value | Constant |
| --- | --- |
| `0` | `STATUS_FAILED` |
| `1` | `STATUS_SENT` |
| `2` | `STATUS_UNSENT` |

So `status: 1` is Liferay asserting the mail **was sent** — and it asserts that even when nothing was transmitted. Verified on 2026.Q2 with a local SMTP sink on `127.0.0.1:2525` and the mail session pointed at it: two entries came back `status: 1` with `sent: null`, and the sink received **nothing**. Not a delayed send, not a failure code — a claim of success with no traffic behind it.

Treat this field as worthless for delivery. `sent: null` alongside `status: 1` is the tell that the two are not wired to the same truth, but the only real check is at the receiving end.

#### Localize a Mail Failure Before Blaming the Notification

When the message builds but nothing arrives, the fault is either the notification framework or the mail transport, and the queue entry cannot distinguish them. **Trigger an unrelated portal email and see whether that arrives**, which needs no admin session:

```bash
curl \
	--data-urlencode "emailAddress=test@liferay.com" \
	--data-urlencode "step=2" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/c/portal/forgot_password"
```

If the password reset mail is missing too, the notification wiring is fine and the mail session is the problem — stop debugging object actions. That one call saved a long detour here.

Then check **Control Panel → Server Administration → Mail** before trusting `portal-ext.properties`. Adding `mail.session.mail.smtp.*` to that file and restarting was not sufficient on a bundle in this run; the cause was not isolated (that page needs an admin session), so verify the effective host and port there rather than assuming the properties won.

Report queueing and delivery as separate facts. "Composed and addressed correctly, delivery unverified" is honest; "the confirmation email was sent" is not, no matter what `status` says.

### Object Action — Notification (Live API)

Create a notification template first if one does not exist:

```bash
curl \
	--data '{
		"body": {"en_US": "A new [%OBJECT_FIELD_NAME%] was created."},
		"description": "",
		"editorType": "richText",
		"name": "<TemplateName>",
		"objectDefinitionExternalReferenceCode": "<objectERC>",
		"recipientType": "user",
		"subject": {"en_US": "New entry created"},
		"type": "email"
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/notification/v1.0/notification-templates" \
	--user "test@liferay.com:test"
```

That shape mails a **portal user**. A public form has no user — the address was typed into a field — so `recipientType: "user"` is wrong there and there is no `recipients` block to carry the address.

For an in app (bell) notification to a fixed user, the verified shape on 2026.q3.2 is `"type": "userNotification"`, `"recipientType": "user"`, `"recipients": [{"userScreenName": "<screenName>"}]`; confirm delivery with `GET /o/headless-user-notification/v1.0/my-user-notifications` as the recipient. On 2026.q3.6 the bell (`message`) shows the template's **`subject`**, not its `body` (verified 2026-10-16: a body carrying the status token never appeared in the bell, the same token moved into `subject` did), so put everything the recipient must read in `subject`; keep `body` in step with it. A template can be changed live with `PATCH /o/notification/v1.0/notification-templates/{id}`. A Picklist token such as `[%LEAD_QUALIFICATIONSTATUS%]` renders the entry's **label** ("Qualified"), not its key. A condition on a Picklist compares the **key**: `qualificationStatus == "qualified"`. It can be set or cleared later with `PATCH /o/object-admin/v1.0/object-actions/{id}` `{"conditionExpression": "..."}`, which keeps `parameters`. Verified on 2026.q3.2 (2026-10-05).

#### Mailing an Address Held in a Field (Public Forms)

Combine the live create with the tree format's `recipients` array. This is the shape a registration or enquiry confirmation needs:

```bash
curl \
	--data '{
		"body": {"en_US": "<p>Hi [%REGISTRATION_ATTENDEENAME%], we received your registration for [%REGISTRATION_EVENTNAME%].</p>"},
		"editorType": "richText",
		"externalReferenceCode": "REGISTRATION_CONFIRMATION",
		"name": "Registration Confirmation",
		"objectDefinitionExternalReferenceCode": "REGISTRATION",
		"recipientType": "email",
		"recipients": [
			{
				"from": "noreply@example.com",
				"fromName": {"en_US": "DevCon Registration"},
				"singleRecipient": true,
				"to": {"en_US": "[%REGISTRATION_EMAIL%]"}
			}
		],
		"subject": {"en_US": "We received your registration"},
		"type": "email"
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/notification/v1.0/notification-templates" \
	--user "test@liferay.com:test"
```

`recipients[].to` takes a token, which is what addresses the mail to whatever the visitor typed.

`recipientType` `"email"` and `"emailAddress"` behaved identically for a fixed address on 2026.q3.2: both resolve `to` and queue the message with `toType: "email"`. The action's own status (`never-ran` for one, `success` for the other) was no guide, so judge by the queue entry.

**On a local HSQLDB bundle, keep one action per trigger while testing.** Two `notification` actions on the same `onAfterAdd` deadlocked the portal on the first entry created (2026.q3.2). The action-status update takes a lock in a new transaction that waits on the original one, page rendering blocked behind it, and only a Tomcat restart recovered. With one action per trigger there was no hang. The link to the number of actions is inferred from that contrast alone.

**`from` persists on the template; it is the queue entry that reports `null`.** Verified on 2026.Q2 — a fresh `GET /notification-templates/<id>` read back `"from": "noreply@devcon.example"` exactly as posted, alongside `fromName`. The `null` turns up one layer down, on the `notification-queue-entries` record, so a check there is what makes `from` look dropped. Set it on the template as documented, and confirm the actual sender on the received message rather than on the queue entry.

The `NotificationTemplate` schema exposes no enums for `type` or `recipientType` and publishes no nested `Recipient` schema, so the OpenAPI spec will not confirm this shape — it is verified by creating one and reading the queue entry.

Save the returned `id` as `<template-id>`. Then create the action:

```bash
curl \
	--data '{
		"active": true,
		"label": {"en_US": "<ActionLabel>"},
		"name": "<actionName>",
		"objectActionExecutorKey": "notification",
		"objectActionTriggerKey": "onAfterAdd",
		"parameters": {
			"notificationTemplateId": <template-id>
		}
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/object-admin/v1.0/object-definitions/<definition-id>/object-actions" \
	--user "test@liferay.com:test"
```

### Object Action — Webhook

```bash
curl \
	--data '{
		"active": true,
		"label": {"en_US": "<ActionLabel>"},
		"name": "<actionName>",
		"objectActionExecutorKey": "webhook",
		"objectActionTriggerKey": "onAfterAdd",
		"parameters": {
			"secret": "<hmac-secret>",
			"url": "<https://endpoint.example.com/hook>"
		}
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/object-admin/v1.0/object-definitions/<definition-id>/object-actions" \
	--user "test@liferay.com:test"
```

### Object Action — Client Extension

First deploy the `objectAction` CET via `scaffold-client-extension`. Then reference it through the executor key itself, `function#<cet-key>`, where `<cet-key>` is the entry's top level key in `client-extension.yaml`:

```bash
curl \
	--data '{
		"active": true,
		"label": {"en_US": "<ActionLabel>"},
		"name": "<actionName>",
		"objectActionExecutorKey": "function#<cet-key>",
		"objectActionTriggerKey": "onAfterAdd",
		"parameters": {}
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/object-admin/v1.0/object-definitions/<definition-id>/object-actions" \
	--user "test@liferay.com:test"
```

There is no `"objectAction"` executor key: each deployed CET registers its own executor as `function#<cet-key>`, and `parameters` stays empty. `function#LXC:<key>` and the old `objectAction` form are accepted on create but fail at every run with `No object action executor found` (verified live on 2026.q3.2). Create the object before deploying the CET, or redeploy the CET afterwards, so its `c_<object>.everything` scope is registered. See `rules/object-actions-catalog.md`.

#### Calling Back Into Liferay From the CX

Verified on 2026.q3.2 + hotfix-1, gradle-plugins-workspace 17.1.5 (2026-10-05):

- **The inbound token acts as whoever triggered the action.** For an entry created by an anonymous visitor (a public form), that is **Guest** (`default@liferay.com`, `grant_type` `AUTHORIZATION_CODE_PKCE`, 600 s, the user-agent app's scopes). With it, reading the triggering entry, reading Accounts and PATCHing anything all return `403`. Propagating the inbound token only works when the trigger comes from a user who has the rights.
- **When the trigger can be anonymous, give the CX its own identity:** an `oAuthApplicationHeadlessServer` entry used with `grant_type=client_credentials`, next to the `oAuthApplicationUserAgent` that the `objectAction` entry still requires. Credentials, rotation on redeploy and scopes: `setup-oauth` → "A Microservice With Its Own Identity".
- **One CX can serve several objects.** The same `function#<cet-key>` can be attached to actions on several custom objects and on a system object such as `AccountEntry`, with no extra YAML. Tell the callers apart by the payload's top-level `objectDefinitionId`, not by the DTO key: a custom object sends `objectEntryDTO<ShortName>`, but `AccountEntry` sends `modelDTOAccount`, `originalDTOAccount`, `modelAccountEntry`, `originalAccountEntry` and `extendedProperties`, with no `objectEntryDTO*` key.
- **`allowedObjectDefinitionNames` (optional, on the `objectAction` entry) takes internal names only:** `C_<ShortName>` for a custom object, the system name (`AccountEntry`) for a system object. A short name (`Lead`) blocks every object, including the listed one. The restriction is checked only when the action runs: creating an action on an object outside the list still returns `200`, the run fails with `ObjectActionExecutorKeyException ... is not allowed for object definition C_<Name>` in `liferay.<date>.log`, and the action's status can still read "success". Leave the key out unless you need it, and check the log rather than the status.
- **When `onAfterAdd` reaches the CX, the entry is already committed:** a GET with a separate token returned `200` every time (20–99 ms).
- **Setting a child's relationship field fires the child's `onAfterUpdate`**, but nothing on the parent (even though the parent's Aggregation count changes) nor on the parent's other children. Recompute derived values from the child's own action.

### Kaleo Workflow

Deploy a workflow definition when the object requires multistep review or approval.

```bash
curl \
	--data '{
		"active": true,
		"name": "<WorkflowName>",
		"title": {"en_US": "<Workflow Title>"},
		"content": "<escaped XML or JSON workflow definition>"
	}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/headless-admin-workflow/v1.0/workflow-definitions" \
	--user "test@liferay.com:test"
```

After creating, associate the workflow with the object definition — and put the link in the **right place**, because there are two link surfaces and only one of them engages (verified live on 2026.q2.7):

- **What works:** set the link on the **object definition itself**, in its `workflowDefinitionLinks` array. UI: Control Panel → Objects → \<Definition\> → Details → workflow. Headless: read-modify-write **full PUT** of `/o/object-admin/v1.0/object-definitions/by-external-reference-code/<ERC>` with `"workflowDefinitionLinks": [{"workflowDefinitionName": "<WF name>"}]`. A plain **PATCH is silently ignored** — returns 200 and the field stays `[]`. Once set, a fresh `/o/c` POST lands `status: pending` with a real review task.
- **What does NOT engage:** writing the link through the headless-admin-workflow `workflow-definition-links` resource (`POST /workflow-definitions/<id>/workflow-definition-links`). The object entry-create handler does not read that table — the workflow deploys and looks "linked" but entries land `status: approved` and no task is created. This is the classic "object workflow won't auto-engage" misdiagnosis.

**From a site initializer, the same link works on a create only.** Ship the definition as `workflow-definitions/<dir>/workflow-definition.json` (`name`, `title`, `title_i18n`, `active`) beside `workflow-definition.xml`, and put the `workflowDefinitionLinks` array in the object's `object-definitions/<Name>.json`. A fresh install creates the object already bound. On an object that **already exists**, the initializer's update copies only scalar properties onto the stored definition, so the array is silently dropped and the object stays unbound, with no log line: the same limitation as new fields. Verified on 2026.q2.7, both ways. Two more conditions:

- The array is honoured only while `LPD-17564` is on (`_addOrUpdateWorkflowDefinitionLinks` returns early otherwise).
- A link written any other way should survive later initializer runs, because the update starts from the stored definition, links included. This was read from source, not re-measured.

Whether an entry ends `approved` or `denied` is the definition's choice, not the engine's. A terminal state with an `onEntry` `<status>` action (`0` approved, `4` denied) sets the entry's system `status`. This was measured on 2026.q2.7, so give every terminal state such an action. Single Approver's own reject path does **not** end denied: it goes to an `update` task assigned back to the submitter, which sets `4` and then `1`, so the entry ends **pending**.

**Copying Single Approver: four traps.**

- **The review notice fires twice.** Its `execution-type` is `onAssignment`, which also fires when a reviewer claims a pooled task (`assign-to-me`) just before deciding, so every decision re-sends "awaiting your review". Use `onEntry`: one notice, on entering the task (measured).
- **A guest submitter breaks the copy.** The `update` task and the completion notice go to `<user />`, the submitter, and for entries added as the guest user that is nobody. Drop them, and end reject in a denied state.
- **A guest's entry starts no workflow, silently.** DXP starts it in a transaction-commit callback, after the add's service call has unwound. The Service Access Policy, which only checks service depth 1, then judges `KaleoInstanceLocalService#addKaleoInstance` as the request's first call and refuses it for a guest. The log shows `WorkflowException: java.lang.SecurityException` from `AccessControlAdvisorImpl`, and the entry stays `pending` with no instance and no task. This hits a guest `POST /o/c/...` and any guest JAX-RS endpoint that adds entries alike; a signed-in caller is admitted by `SYSTEM_USER_PASSWORD`, so an admin test passes. In a module that adds the entry for a guest, wrap the add in `AccessControlThreadLocal.setRemoteAccess(false)` and restore the old value in a `finally`. Measured on 2026.q2.7.
- **Per-entry routing needs code, and the script gate refuses `java`.** A definition whose `<scripted-assignment>` (or any script) uses `java` or `groovy` is refused at deploy (`400 NotAllowedScriptLanguage`) unless script management is on, and that setting is off by default and system-wide. A language name in the `function#<name>` form passes the validator and carries no script. Register a `com.liferay.portal.workflow.kaleo.runtime.assignment.ScriptingAssigneeSelector` with `scripting.language=function#<name>`. `getAssignees` returns `{"users": List<User>}` or `{"roles": List<Role>}`; roles win when both are present, and a map with neither key NPEs. The entry is `workflowContext.get("entryClassPK")`. Measured on 2026.q2.7 at deploy and at runtime. It is not a documented extension point, so re-check it on an upgrade. A company-scoped entry's instance belongs to the Global group, where a site role resolves to nobody: route to regular roles or users.

**Finding a guest's task over REST.** `GET /o/headless-admin-workflow/v1.0/workflow-instances?assetClassName=&assetPrimaryKey=` lists only the instances **the caller started**, so an administrator finds their own entries and never a guest's. Find the task through `/workflow-tasks/assigned-to-my-roles`, `/workflow-tasks/assigned-to-user?assigneeId=` or `/workflow-tasks/assigned-to-me`, matching `objectReviewed.id`. A user assignee needs no `VIEW` on the entry to see their task, but the task shows only the entry's title, never its fields.

### Verify Object Actions

```bash
curl \
	--silent \
	--url "http://localhost:${PORT}/o/object-admin/v1.0/object-definitions/<definition-id>/object-actions" \
	--user "test@liferay.com:test" \
	| jq '[.items[] | {name, objectActionTriggerKey, objectActionExecutorKey, active}]'
```

Confirm each action is `"active": true`.

### Seeding Without Firing an Action

To load data without firing an `onAfterAdd` action (setup data that should send no notifications), switch the action off around the creates and back on in a `finally`: `PATCH /o/object-admin/v1.0/object-actions/{id}` with `{"active": false}`, then `{"active": true}`. The PATCH keeps `parameters` (a notification action's `notificationTemplateId` survived both, verified on 2026.q3.5). Two cautions:

- The response's `actions` hrefs carry the object **definition** id, not the action id (`/object-actions/<definitionId>`). Address the action by the `id` you read from `GET …/object-definitions/{id}/object-actions`, never by those hrefs.
- An update fires no `onAfterAdd`, so toggle only when there is something to create. If the script dies between the two PATCHes, the action stays off: have a check (or the site initializer's next run, which re-applies `"active": true` from the tree) catch it.

A user-notification (bell) action sends each created entry's bell within about a second. The recipient sees it in `GET /o/headless-user-notification/v1.0/my-user-notifications`, and that API has no DELETE, so a test entry's bell stays in the recipient's list.

### Test the Trigger

Create a test entry and check the expected side effect (email received, webhook payload, other entry created):

```bash
curl \
	--data '{"<fieldName>": "test value"}' \
	--header "Content-Type: application/json" \
	--request POST \
	--silent \
	--url "http://localhost:${PORT}/o/c/<pluralLabel>" \
	--user "test@liferay.com:test"
```

## Patterns and Gotchas

### Object Action Refire Loop

`onAfterUpdate` fires on **every** REST PATCH — including PATCHes made by the action itself. If your action writes back to the same record via REST, it will loop.

**Safe path**: call `ObjectEntryLocalServiceUtil.updateObjectEntry` directly from within the Object Action. Direct service layer calls do **not** retrigger the Object Action — only REST API calls do. Use this pattern for any script that needs to update the same record it is acting on.

**From a Client Extension**, which can only write over REST, guard the write-back instead: compute the target value, compare it with the entry's current value, and PATCH only if they differ. The re-triggered call then sees the value unchanged and stops. Verified on 2026.q3.2 + hotfix-1: one write-back, then the loop ended.

### Groovy Output Binding

Object Action Groovy scripts have no `out` binding. Use bare `println` to write to `catalina.out`. Using `out.println` throws `No such property: out`.

### Diagnostic Action Hygiene

Stale diagnostic Object Actions are a silent data hazard: they continue firing on every matching event after a session ends and can revert data changes at unexpected times — often with no error, just a wrong value in the database. Secondary concern: they accumulate output in `catalina.out` and interleave with real logs.

Rules:

- Prefix all diagnostic actions with `diag-` (e.g., `diag-check-balance`).
- Delete all `diag-` actions before shipping — they are not safe to leave running in any persistent environment.
- Bulk delete when done: filter by name prefix in Control Panel → Objects → [Object] → Actions, or via the Object Admin REST API.

### Type Safety in Groovy

Never pass interpolated strings (`"${var}"`) to Liferay Service APIs. Groovy `GStringImpl` causes cast exceptions. Always use explicit string concatenation: `"" + var`.

## Success Signal

TODO / inferred — verify against a running bundle. The Verify Object Actions and Test the Trigger steps above (each action `"active": true`; a test entry fires the expected side effect) are the observable completion checks; confirm on a live bundle.