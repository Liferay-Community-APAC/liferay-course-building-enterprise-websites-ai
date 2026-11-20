# Object Actions Catalog

> **Before authoring:** Load `manage-object-logic` before authoring an action, notification template, or workflow — this card is the catalog, that skill is the procedure.

Reference for the `manage-object-logic` skill. Covers triggers, conditions, and all action executor types.

## Triggers

Triggers fire automatically based on the lifecycle of an object entry. A `standalone` action fires only when invoked explicitly.

| Trigger Key | When It Fires | Typical Use |
| --- | --- | --- |
| `onAfterAdd` | After an entry is created and committed | Welcome notification, audit log entry |
| `onAfterUpdate` | After an entry is updated and committed | Change notification, recalculation |
| `onAfterDelete` | After an entry is deleted | Cascade cleanup, audit log |
| `standalone` | On demand via the Actions menu or API | Manual approval step, data export |

## Condition Expressions

A condition expression limits when the action runs. Leave the `conditionExpression` field empty to run on every trigger event.

Expression syntax mirrors object validation expressions. Use field references and comparison operators:

```
status == "approved"
amount > 1000
(priority == "high") AND (assigneeId != null)
```

Consult learn.liferay.com for the full expression builder reference (search `object validations expression builder`).

## Action Executor Types

### `notification`

Sends an in app or email notification using a notification template.

Required `parameters`:

```json
{
	"notificationTemplateId": "<template-id>"
}
```

Create the template first via `POST /o/notification/v1.0/notification-templates`. Template body supports field interpolation with `[%OBJECT_FIELD_NAME%]` tokens.

### `add-object-entry`

Creates a new entry in the target object definition.

Required `parameters`:

```json
{
	"objectDefinitionId": "<target-definition-id>",
	"predefinedValues": [
		{
			"name": "<fieldName>",
			"value": "<value>"
		}
	]
}
```

> **`predefinedValues` cannot set a `DateTime` field.** The action's value parser only handles `DBType=Date`, so a DateTime string is silently dropped — the entry is created with the field empty and no error is logged. To timestamp entries created by an action, put a `currentDate` **expression-builder default value** on the DateTime field itself: the service layer stamps it (minute precision) on every create path, and only when the field is absent, so explicit values from imports still win.

### `update-object-entry`

Updates an existing entry in the same or another object definition.

Required `parameters`:

```json
{
	"objectDefinitionId": "<target-definition-id>",
	"objectEntryId": "<expression-resolving-to-id>",
	"predefinedValues": [
		{
			"name": "<fieldName>",
			"value": "<new-value>"
		}
	]
}
```

### `webhook`

POSTs a JSON payload to an external URL.

Required `parameters`:

```json
{
	"secret": "<hmac-secret>",
	"url": "<https://endpoint.example.com/hook>"
}
```

Liferay signs each request with `HMAC-SHA256` using the secret. The `X-Liferay-Webhook-Signature` header carries the hex digest.

**Payload shape (verified by parsing a live webhook):** field values are NOT at the payload root — they sit under `objectEntry.values.<fieldName>` (including relationship FKs like `r_<rel>_c_<parent>Id`), and the acting user's details are under a per-object key `objectEntryDTO<ObjectName>.creator` (`givenName`, `familyName`, `email`). A receiver that reads fields off the root parses nothing and fails silently.

### `groovy`

Executes a Groovy script on the portal JVM.

Required `parameters`:

```json
{
	"script": "<groovy source>"
}
```

**Availability: self hosted is necessary but not sufficient.** Beyond the SaaS exclusion, creating a `groovy` action is gated at runtime by `ScriptManagementConfiguration.isAllowScriptContentToBeExecutedOrIncluded()`, which is **off by default on current DXP**. With it off the definition is rejected outright:

```text
400 ObjectActionExecutorKeyException
Groovy script based object actions are not allowed
```

Verified on a self hosted 2026.Q2 bundle. Treat Groovy as unavailable until proven otherwise: probe by creating a throwaway action before designing a solution around one, because turning the flag on is a portal wide decision to permit arbitrary script execution — surface it to the user rather than enabling it silently. Prefer a scriptless alternative where one exists (an `Aggregation` field replaces a hand maintained counter — see `skills/manage-objects/SKILL.md`). Source: `ObjectActionLocalServiceImpl`.

**Script bindings are the entry's fields as top level variables — there is no `objectEntry` object.** `GroovyObjectActionExecutorImpl` passes `ObjectEntryVariablesUtil.getVariables(...).get("baseModel")` as the binding, which spreads `objectEntry.values` directly. So a `Registration` field is referenced as bare `attendeeName`, and a relationship foreign key as bare `r_eventRegistrations_c_eventId`.

Also bound: `creator`, `currentDate`, `currentUserId`, `currentUserExternalReferenceCode`, `groupId`, `id` (the entry ID), and `entryDTO`. Guard optional fields with `binding.hasVariable("<name>")` — referencing an absent one throws `MissingPropertyException`. Source: `ObjectEntryVariablesUtil`.

### `function#<cet-key>` (Client Extension)

Calls a deployed `objectAction` CET microservice. There is no `objectAction` executor key: each deployed CET registers its own executor, keyed **`function#<cet-key>`**, where `<cet-key>` is the entry's top level key in `client-extension.yaml`. The target lives in the key, so `parameters` stays empty:

```json
{
	"objectActionExecutorKey": "function#<cet-key>",
	"parameters": {}
}
```

Verified in 2026.q3.2 bytecode: `FunctionObjectActionExecutorImpl.activate` builds its key as `"function#" + ConfigurationFactoryUtil.getExternalReferenceCode(...)`, which is the factory PID suffix — the yaml key. **Only that form runs.** `function#LXC:<key>`, and the old `objectAction` key with `clientExtensionEntryExternalReferenceCode`, are both accepted on create (`200`) and then fail every run with `No object action executor found with company ID … and key …`, the action status reading `failed` (verified live on 2026.q3.2). The executor only exists once the CET is deployed, so deploy it before creating the action.

The microservice receives a POST with the object entry payload and a Bearer token. Implement via `scaffold-client-extension` with type `objectAction`. Three facts about that payload:

- **The entry id is top level `classPK`.** `id` appears only nested.
- **Field values are under `objectEntryDTO<ObjectName>.properties`**, a key named per object (`objectEntryDTOBook`), mirrored raw in `objectEntry.values`. Nothing is flattened to the root.
- **The inbound Bearer token can call back into Liferay** when the OAuth app's `scopes` include the object's per-object scope `c_<objectname>.everything` (`rules/oauth-scopes.md`). It is an authorization-code (PKCE) token for the user who triggered the entry. **The scopes are resolved when the CET deploys:** a `c_<object>.everything` scope for an object that did not exist yet is dropped silently, and the callback gets `403` until the CET is redeployed after the object is created.
- **When the trigger is anonymous, the inbound token is Guest's** and every callback gets `403`, whatever the scopes. The microservice then needs its own `oAuthApplicationHeadlessServer` identity (`client_credentials`). Procedure: `setup-oauth` → "A Microservice With Its Own Identity"; payload routing, `allowedObjectDefinitionNames` and trigger behavior: `manage-object-logic` → "Calling Back Into Liferay From the CX".
- **A system object sends a different payload.** `AccountEntry` sends `modelDTOAccount`/`modelAccountEntry` (and their `original*` twins) plus `extendedProperties`, with no `objectEntryDTO*` key. Route by the top-level `objectDefinitionId`.

Verified live on 2026.q3.2 (the last two points with hotfix-1, 2026-10-05).

## REST Payload Shape

Object action definition body:

```json
{
	"active": true,
	"conditionExpression": "<expression or empty string>",
	"description": "<optional description>",
	"label": {"en_US": "<Display Label>"},
	"name": "<camelCaseName>",
	"objectActionExecutorKey": "<executor-type>",
	"objectActionTriggerKey": "<trigger>",
	"parameters": { ... }
}
```

## References

- `skills/manage-object-logic/SKILL.md` — the primary consumer of this card.
- `rules/client-extension-types.md` — the `objectAction` CET type.
- `rules/oauth-scopes.md` — scopes for CET backed actions.
- Objects: `https://learn.liferay.com/w/dxp/low-code/objects`