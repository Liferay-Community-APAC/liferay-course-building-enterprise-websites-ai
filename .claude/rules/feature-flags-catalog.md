# Feature Flags Catalog

> **Before authoring:** Load `feature-flags` before enabling anything here — it owns the per environment mechanism and the restart.

Liferay feature flags that gate APIs and behavior the skills depend on. The full registry lives in `portal-impl/src/portal.properties` of the portal source. This file is the working set the skills reach for.

Defaults change between quarterly releases. Reverify against the running portal at Control Panel → Instance Settings → Feature Flags. The `feature-flags` skill is the canonical source of truth at runtime.

## Critical Flags for Site, Object, and MCP Workflows

| Key | Default | Status | Unlocks | Used By | Dependent On |
| --- | --- | --- | --- | --- | --- |
| `LPD-63311` | off | beta (release on 2026.Q3+) | MCP server at `/o/mcp` (`/o/mcp/sse` on 2025.Q4 only). On 2026.Q3 the flag alone is **not** enough: Instance Settings → Platform → MCP Server → Enabled must also be saved, or `/o/mcp` returns 404 — see `skills/mcp-server/SKILL.md` | `build-site`, `manage-objects` (when MCP first) | none |
| `LPD-35443` | off | beta | Headless Admin Site public layout REST API | `build-site`, `manage-pages` | none |
| `LPD-38869` | on | deprecation | Private layout REST access | `manage-pages` (private pages) | none |
| `LPD-39244` | off | beta | Headless Admin Fragment / page composition REST API | `manage-pages`, `scaffold-fragment` | none |
| `LPD-74328` | off | beta | Page element / page-specification creation and update (headless-admin-site) | `manage-pages`, `build-site` | `LPD-35443` |
| `LPD-17564` | off | release | Object collaborators API (per entry permissions) | `manage-objects`, `manage-roles-permissions` | none |
| `LPD-52006` | off | beta | Object entry folders (nested folder structure) | `manage-objects` | `LPD-17564` |
| `LPD-32867` | off | beta | Content provider integration for dynamic content sets (headless-delivery) | (informational) | none |
| `LPD-36010` | on | deprecation | Legacy object behavior toggle | (informational) | none |
| `LPD-78863` | on in `portal.properties`, but **off on any database created new** (see the gotcha) | **deprecation** | **DXP Segments** — segment *membership evaluation* (`BaseSegmentsEntryProvider.getSegmentsEntryIds`). While off, role/criteria-keyed segments never match and **every user gets the default Segment Experience** (persona/personalized page experiences silently collapse to default). Lives in the **Deprecation** tab — see the gotcha below | `manage-pages`, `build-site` (persona experiences) | none |
| `LPS-135430` | off | beta | Proxy Objects — **any** non-blank object `storageType` (`salesforce`, an `objectEntryManager` CET key, even `"default"`); without it `POST /object-definitions` returns `400 ObjectDefinitionStorageTypeException` (verified 2026.q3.2). Without it, a site initializer whose tree contains a proxy-storage object definition **aborts entirely** with `ObjectDefinitionStorageTypeException` | `manage-objects` | none |
| `LPD-62272` | off | release | AI Hub — the Cell connection (`/o/ai-hub-cell/v1.0`) and the Kaleo `<ai-hub-agent>` node. Toggled under Instance Settings → Feature Flags → Release; the connection itself is configured in Instance Settings → AI Hub | (not in this course's skill library) | none |
| `LPS-164563` | off (seen on 2026.q1; set explicitly on the q3.2 test bundle, default not re-checked) | beta | Data Sets — the `data-set-admin` API (`/o/data-set-admin/…`) and the Data Set admin app; `404` without it. Note the `LPS` prefix | `manage-data-sets` | none |

## How to Read This Table

- **Default**: the value when no override is set in `portal-ext.properties`. `off` means the flag must be enabled before its features work.
- **Status**: `beta` means experimental and may move; `release` means stable behind the flag for a transition period; `deprecation` means the previous default behavior is being phased out.
- **Unlocks**: the user visible capability the flag controls.
- **Used By**: the skills that probe this flag.
- **Dependent On**: prerequisite flags that must be enabled in tandem.

## Enabling a Flag

The `feature-flags` skill writes one line per flag to the active environment's `portal-ext.properties`:

```properties
feature.flag.LPD-XXXXX=true
```

A Tomcat bounce is required for most flags to take effect. The skill handles the bounce, under the session restart policy in `CLAUDE.md` → "Server Restarts".

### Gotcha — `Deprecation`-scope (system) flags are NOT settable via `portal-ext.properties`

Some flags are **system-scoped and shown under the `Deprecation` (or `Developer`) tab** of the Feature Flags admin. For these, `feature.flag.<KEY>=true` in `portal-ext.properties` is **silently ineffective** — and a Tomcat/container restart does **not** flip them either. They must be toggled **on in the UI**: **System Settings → Feature Flags → Deprecation** (note: **System** Settings, not **Instance** Settings — the tab lives under the system scope). Verify by effect, not by the property file.

**Why a Deprecation flag reads off on a fresh database (verified on 2026.q3.5 source and live).** `CompanyModelListener._processDeprecationFeatureFlags` (feature-flag-web) runs once on a NEW database and stores `false` for **every** Deprecation-type flag, then sets `deprecationProcessed=true` in the same preferences, whatever `portal.properties` says (`feature.flag.LPD-78863=true` is the shipped default). The row is a `portalpreferencevalue` of the system preferences (owner 0, owner type 1), namespace `com.liferay.portal.kernel.feature.flag.FeatureFlag`, key = the flag. A stored preference always wins over the property (`PreferenceAwareFeatureFlag.isEnabled`: `GetterUtil.getBoolean(preference, property)`), which is why the property and a restart do nothing. An LDM seed built on a new database carries these rows; an upgraded database does not, so an old demo upgraded from an earlier release keeps its deprecated features on. **To turn one on without the UI:** delete that one value row while the portal is down or before a restart (`delete from portalpreferencevalue v using portalpreferences p where v.portalpreferencesid = p.portalpreferencesid and p.ownerid = 0 and p.ownertype = 1 and v.namespace = 'com.liferay.portal.kernel.feature.flag.FeatureFlag' and v.key_ = '<flag>'`). After the restart the property decides, and the new-database pass does not run again (`deprecationProcessed` stays). Verified on 2026.q3.5 with `LPD-78863`: `Liferay.FeatureFlags` on a rendered page read `'LPD-78863': true`, and segments then matched.

Observed with **`LPD-78863` (DXP Segments)**: with it off, persona Segment Experiences collapse to the default for every user, and the two symptoms are (a) a role-keyed persona page serves the default composition to everyone and (b) two users with different segments resolve to the *same* `segmentsExperienceId` in the page HTML. The `com-liferay-feature-flag-web` `get-enabled`/`set-enabled` REST endpoints may be absent (404) on a given bundle, so the UI toggle is the reliable path. (Cost ~an hour to diagnose during the CRM dashboard extraction, 2026-09-07.)

## Verifying State

Three sources, in trust order:

1. Runtime configuration at System Settings → Feature Flags (Release / Beta / **Deprecation** / Developer tabs) — and Control Panel → Instance Settings → Feature Flags. **Deprecation/Developer-scope flags appear only under System Settings and can be toggled only there**, not via `portal-ext.properties` (see the gotcha above).

1. `bundles/osgi/configs/com.liferay.portal.feature.flag*.config` for runtime overrides.

1. `<active-env>/portal-ext.properties` for declared overrides.

A flag missing from both files takes the portal default declared by `feature.flag.<KEY>` in the running JVM (built from `portal-impl/src/portal.properties` and downstream property files).

## References

- Configuring feature flags: `https://learn.liferay.com/w/dxp/security-and-administration/administration/configuring-liferay/feature-flags`
- Quarterly default changes:
	- `https://learn.liferay.com/w/dxp/self-hosted-installation-and-upgrades/upgrading-liferay/deprecations-and-breaking-changes-reference/2025-deprecations-and-breaking-changes/2025-q4-default-setting-and-feature-flag-changes`
	- `https://learn.liferay.com/w/dxp/self-hosted-installation-and-upgrades/upgrading-liferay/deprecations-and-breaking-changes-reference/2025-deprecations-and-breaking-changes/2025-q3-default-setting-and-feature-flag-changes`