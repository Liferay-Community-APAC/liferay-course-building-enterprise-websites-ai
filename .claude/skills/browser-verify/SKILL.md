---

description: Verify a Liferay page or user journey in a real headless Chrome (Playwright), signed in as a specific test user or as Guest — log in through /c/portal/login once per persona, reuse the saved session, assert on the rendered DOM after JavaScript ran, compare personas side by side, take screenshots. Use when an exercise or task says "log in as", "verify as a real test account, not admin", "as Guest", when a restriction (account, role, tier, segment) must be proven, when a chatbot or fragment must be checked as the visitor, or when the user asks for a browser test or screenshot.
name: browser-verify

---

# Browser Verify

Prove what a **given user** sees, in a real browser. Basic Auth and the admin session prove nothing about restrictions: Basic Auth requests get the `SYSTEM_USER_PASSWORD` Service Access Policy (`rules/guest-access.md`), `curl --user` on a `/web/...` page still renders as Guest, and `curl` runs no JavaScript, so fragments, custom elements and chatbots stay unverified.

Playwright (`playwright-core`, driving the Chrome already installed) is the tool because of three features this work depends on:

- **`storageState`**: sign in once per persona, save the cookies to a file, start every later check from that file.
- **Isolated contexts**: several personas open at the same time in one browser, each with its own cookies (Bronze next to Gold, Novacorp next to Solstice), and Guest is just a context with no state.
- **Network waits**: `waitForResponse`, `page.route`, and locators that wait on their own, which a streamed chatbot answer needs.

## When to Invoke

- An exercise verify step says "log in as", "as each real test account", "never admin", or "as Guest".
- A restriction must be proven: Account Restriction, a role or tier, a page closed to Guest, a segment experience.
- Client-side output must be checked: a fragment fetching data, a custom element, a chatbot answer, a form journey.
- A screenshot of what a user sees is needed (📸 steps).

## Setup (Once per Session)

```bash
mkdir -p <scratchpad>/browser-verify
cd <scratchpad>/browser-verify
npm init -y
npm install playwright-core
```

- `playwright-core` downloads no browser. The scripts launch with `channel: 'chrome'`, which finds the installed Google Chrome; pass `--executable-path <chrome>` if it is somewhere unusual.
- **Run the scripts from that directory.** `lib.mjs` resolves `playwright-core` from the current directory, not from its own location, so the skill folder stays free of `node_modules`.
- In Git Bash, prefix commands with `MSYS_NO_PATHCONV=1`, or `--path /web/...` is rewritten into `C:/Program Files/Git/web/...` (the script detects it and stops). With it set, `/c/...` paths are no longer converted either, so pass the script and `--workspace` paths as `C:/...`, not `$PWD`.

## Personas

Test users' credentials live in **`configs/local/test-users.properties`**, git-ignored, one alias per user:

```properties
sophie.email=sophie.martin@novacorp.example
sophie.password=<password>
marcus.email=marcus.webb@solsticemanufacturing.example
marcus.password=<password>
```

The alias `guest` is reserved: no entry, no session.

When a task creates the test user, set its password and write it straight to this file, without printing it to the conversation or a log:

1. Create or find the user, with its account membership and roles: `manage-roles-permissions` → "Test Users and Personas" (idempotent create by ERC, password handling, account roles).
1. Make sure it is **Active**: `PATCH /o/headless-admin-user/v1.0/user-accounts/{id}` with `{"status": "Active"}` (case-sensitive). Users created by a site initializer start INACTIVE (`rules/site-initializer-format.md` → "Users and Accounts").
1. Set the password with the same `PATCH` and `{"password": "<generated>"}`, then append the two lines to the file. Re-PATCHing the same value answers `400 "password is invalid"`: treat that as already set.

Admin credentials stay in `configs/local/admin.properties` and are never used as a persona. Proving something "as admin" is exactly what this skill exists to avoid.

## Sign In: `/c/portal/login`

The shortcut is the portal's login URL, which renders the Login portlet on every site without needing to know which page carries a Sign In link:

1. `goto /c/portal/login`.
1. **`fill()` the login field, never `type()`.** It comes prefilled with `@<domain>`, and typed text is appended to it.
1. Fill the password, click the form's submit button.
1. Wait until `Liferay.ThemeDisplay.isSignedIn()` is true, then confirm the session's owner through `GET /o/headless-admin-user/v1.0/my-user-account` (the `emailAddress` must match the persona; a leftover session of someone else is a real risk when contexts are reused). **Send `x-csrf-token: Liferay.authToken`** with any headless call made from the page with the session cookie, even a `GET`: without it the answer is a bare `403 { }` (verified 2026.q3.6). `Liferay.Util.fetch` adds the token on its own; a plain `fetch` does not.
1. Save `context.storageState()` to `<scratchpad>/browser-verify/state/<alias>.json`. The file holds live session cookies: it stays in the scratchpad, never in the repo.

The field ids are `_com_liferay_login_web_portlet_LoginPortlet_login` and `_com_liferay_login_web_portlet_LoginPortlet_password`, inside the form `_com_liferay_login_web_portlet_LoginPortlet_loginForm`.

A saved state expires with the portal session (30 minutes idle by default, and at every restart). The scripts check the state first and sign in again when it is no longer valid, so no manual cleanup is needed; `--fresh` forces a new login.

Login by email assumes the default `company.security.auth.type=emailAddress`. If the instance authenticates by screen name, put the screen name in `<alias>.email`.

### First-Login Blockers

These show up as "the login does not work", while the credentials are right:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Lands on `/c/portal/update_password` | Password reset required: the default password policy has Change Required, so every user created with a password gets the reset flag | Pass `--complete-password-change` (below), or turn off Change Required in Control Panel → Security → Password Policies → Default (a portal-wide security setting: ask first) |
| Lands on `/c/portal/update_terms_of_use` | Terms of use | `terms.of.use.required=false` |
| Lands on `/c/portal/update_reminder_query` | Security question | `users.reminder.queries.enabled=false` |
| "Authentication failed" with a correct password | User INACTIVE, or wrong auth type | `PATCH` `{"status": "Active"}`; check `company.security.auth.type` |
| "Authentication failed. Please enable browser cookies" | Requests rewritten by interception (see "Behind an ngrok Tunnel") | Use the user-agent mode, not header rewriting |

The workspace's `configs/local/portal-ext.properties` already sets the three properties. **`passwords.default.policy.change.required=false` does not reach an existing default policy.** On the 2026.q3.6 course bundle (2026-10-16) the property was in `bundles/portal-ext.properties`, yet the stored Default Password Policy had `changeRequired = 1`, and a user created over `POST /user-accounts` with a `password` landed on `update_password` (its `passwordReset` column `1`). Expect this on every user an exercise creates.

### Completing the Password Change

`--complete-password-change` (on `login.mjs`, `check-page.mjs`, or `personaPage` through `args`) does what the user would do on that screen: it generates a new password, writes it to the personas file **before** submitting (the old value is kept as `<alias>.previous-password`), fills `#password1` and `#password2`, submits, and waits to leave `update_password`. A rejection by the password policy is reported with the portlet's message. The new password is never printed. Verified live on 2026.q3.6 (2026-10-16): the first login with the option succeeded, and a later `--fresh` login with the rotated password succeeded too.

## The Base URL

With `web.server.host` set (an ngrok tunnel, exercise 0.2), **use the public URL**. Over `localhost` the pages load their scripts from `<public-host>:<port>` and `goto` times out. The scripts read `web.server.protocol` and `web.server.host` from `bundles/portal-ext.properties`, then `configs/local/portal-ext.properties`, and fall back to `http://localhost:8080`. Override with `--base` or `LIFERAY_BASE_URL`.

### Behind an ngrok Tunnel

A free tunnel shows browsers an interstitial page. Two ways past it (`--ngrok`):

- **`ua` (default)**: a non-browser user agent (`LiferayBrowserVerify/1.0`), which ngrok lets through. Nothing is rewritten, so the session cookie survives. Verified for signed-in journeys with Puppeteer on 2026.q3.2 (`rules/guest-access.md`).
- **`header`**: `ngrok-skip-browser-warning` added only to requests for the tunnel host, through `context.route` with the request's `allHeaders()`. **Never** through `extraHTTPHeaders`: sent to every host, it breaks third-party CORS preflights (Analytics Cloud), which reads as a broken integration. Use it when the analytics side must see a real browser user agent. Verified live with Playwright on 2026.q3.6: the session cookie survives.

## The Scripts

Both live in `scripts/` next to this file. Run them from `<scratchpad>/browser-verify`.

### `login.mjs` — Sign Personas In

```bash
node <skill>/scripts/login.mjs sophie marcus
```

Prints `OK sophie: signed in as sophie.martin@novacorp.example (userId …)` per persona, or the reason it failed (the Login portlet's message, or the first-login screen it stopped on). Exit `1` on failure, `2` on a usage error.

### `check-page.mjs` — Assert on a Page as One Persona

```bash
MSYS_NO_PATHCONV=1 node <skill>/scripts/check-page.mjs \
	--as sophie \
	--path /web/aurelis/partner-resources \
	--wait-for ".partner-card" \
	--expect "Bronze" \
	--absent "Gold" \
	--screenshot <scratchpad>/shots/sophie-partner-resources.png
```

- `--as guest` opens a fresh context with no session.
- `--expect` and `--absent` repeat; text is matched on `body.innerText` after `networkidle` and the optional `--wait-for`.
- `--status 404` asserts the status; a page closed to Guest answers **404**, not a redirect to the login. Seen live: Guest on `/group/control_panel/manage` gets `404`, while a signed-in user with no admin role gets `200` and only "Please select a tool from the left menu." So a `200` is no proof of access either: assert on content.
- One `PASS`/`FAIL` line per assertion, exit `1` if any fails.

### A Journey-Specific Script

For anything beyond one page (a chatbot turn, a form, two personas compared), write a short script in the scratchpad that reuses `lib.mjs`:

```javascript
import {launch, personaPage, resolveBaseURL, resolveWorkspace} from 'file:///<workspace>/.claude/skills/browser-verify/scripts/lib.mjs';

const args = {};
const workspace = resolveWorkspace(args);
const baseURL = resolveBaseURL(args, workspace);
const browser = await launch(args);

async function ask(alias, question) {
	const {context, page} = await personaPage(browser, baseURL, alias, args, workspace);

	await page.goto('/web/aurelis/energy-advisor', {waitUntil: 'networkidle'});

	await page.getByRole('textbox').fill(question);
	await page.keyboard.press('Enter');

	// Wait for the answer to stop growing, not for a fixed delay.

	const answer = page.locator('.chat-message.assistant').last();

	await answer.waitFor();

	let previous = '';

	for (let text = await answer.innerText(); text !== previous; text = await answer.innerText()) {
		previous = text;

		await page.waitForTimeout(1500);
	}

	await page.screenshot({fullPage: true, path: `shots/${alias}.png`});
	await context.close();

	return previous;
}

const [sophie, marcus] = await Promise.all([
	ask('sophie', 'What is our phased installation schedule?'),
	ask('marcus', 'What is our phased installation schedule?'),
]);

console.log({marcus, sophie});

await browser.close();
```

The selectors above are placeholders: read the real ones from the fragment or custom element source first. For a chatbot, the end of a turn is the stream's terminal event (`manage-ai-hub`); `page.waitForResponse` on the chat endpoint is the stricter alternative to watching the text settle.

## Asserting Correctly

- **Assert absence as well as presence.** A restriction is proven by what the persona does **not** see: Bronze must not see Gold content, Sophie must not get Solstice's figures. Check the other persona's distinctive values are absent.
- **Run both sides.** One persona seeing their own data proves the data exists; a second persona not seeing it proves the restriction.
- **Placeholders still present mean the data did not resolve** (`rules/guest-access.md`). Assert they are absent.
- **Empty is not proof.** An API that the visitor may not read returns `200` with an empty list, so "no Gold card" on an empty page proves nothing. Expect at least one item the persona should see.
- **Watch the API too** when the DOM is ambiguous: `page.waitForResponse(r => r.url().includes('/o/c/'))` and read `totalCount`. A bare `403` with an empty body is a Service Access Policy or OAuth scope, not a permission (`rules/guest-access.md`, `rules/oauth-scopes.md`).
- **Analytics** (`Analytics.track`): wrap the SDK with `page.addInitScript` before it loads, and assert on the `POST`s to the Analytics Cloud host. Procedure: `manage-analytics` → "Without a Human at the Browser".

## Not Used: Impersonation

Liferay's admin impersonation (`doAsUserId`) is deliberately **not** used, even though it would avoid managing test passwords. The impersonated session is still the administrator's underneath, so it does not prove what the user's own session, permissions and tokens produce. Always sign in as the real test user.

## Verification Status

Verified live on **2026.q3.6** (2026-10-16), Playwright 1.64.1 driving Chrome on Windows/Git Bash, through a free ngrok tunnel, against the Aurelis Energy site with two test users created for the purpose:

- Guest: home page `200` with "Sign In"; `/group/control_panel/manage` `404`.
- Sign-in through `/c/portal/login` in `ua` mode, session owner confirmed by email, state saved; a later check reused the state (about 4 s per check, no new login) and showed "Logout" and no "Sign In".
- First-login `update_password` detected without the option, completed with `--complete-password-change`, rotated password accepted on the next login.
- `--ngrok header` mode: sign-in succeeded and the session survived (owner confirmed), so `route.continue` with `allHeaders()` keeps the cookie in Playwright, unlike the Puppeteer header rewrite.

Still unverified: a journey with fragments that fetch object data, a chatbot stream, and Analytics assertions in `header` mode.

## References

- `rules/guest-access.md` — what Guest can read, Service Access Policies, `curl` as Guest.
- `skills/manage-roles-permissions/SKILL.md` — creating test users, account membership, roles.
- `skills/manage-analytics/SKILL.md` — asserting tracked events from a headless browser.
- `skills/manage-ai-hub/SKILL.md` — chatbot stream events.
- Playwright: `https://playwright.dev/docs/auth` (storage state), `https://playwright.dev/docs/browsers#google-chrome--microsoft-edge` (channel).
