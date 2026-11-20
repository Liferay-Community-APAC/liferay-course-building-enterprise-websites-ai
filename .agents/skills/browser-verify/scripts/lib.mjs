//
// Shared helpers for the browser-verify scripts.
//
// playwright-core is resolved from the CURRENT WORKING DIRECTORY, not from this
// file, so run the scripts from the scratch directory where it was installed:
//
//   cd <scratch>/browser-verify && node <workspace>/.claude/skills/browser-verify/scripts/login.mjs ...
//

import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function loadPlaywright() {
	const require = createRequire(path.join(process.cwd(), 'noop.js'));

	try {
		return require('playwright-core');
	}
	catch (error) {
		fail(
			`playwright-core not found under ${process.cwd()}. Run "npm install playwright-core" there first.`
		);
	}
}

export function parseArgs(argv) {
	const args = {_: []};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];

		if (!arg.startsWith('--')) {
			args._.push(arg);

			continue;
		}

		const key = arg.slice(2);
		const next = argv[i + 1];
		const value = next === undefined || next.startsWith('--') ? true : argv[++i];

		if (key in args) {
			args[key] = [].concat(args[key], value);
		}
		else {
			args[key] = value;
		}
	}

	return args;
}

export function list(value) {
	if (value === undefined || value === true) {
		return [];
	}

	return [].concat(value);
}

export function fail(message, code = 2) {
	console.error(`ERROR: ${message}`);

	process.exit(code);
}

function readProperties(file) {
	const properties = {};

	if (!fs.existsSync(file)) {
		return properties;
	}

	for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
			continue;
		}

		const index = trimmed.indexOf('=');

		properties[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
	}

	return properties;
}

export function findWorkspace(start = process.cwd()) {
	let dir = path.resolve(start);

	while (true) {
		if (
			fs.existsSync(path.join(dir, 'gradle.properties')) &&
			fs.existsSync(path.join(dir, 'settings.gradle'))
		) {
			return dir;
		}

		const parent = path.dirname(dir);

		if (parent === dir) {
			return null;
		}

		dir = parent;
	}
}

//
// The workspace is found from --workspace, else from the current directory,
// else from this script's own location (it lives inside the workspace).
//

export function resolveWorkspace(args) {
	if (typeof args.workspace === 'string') {
		return findWorkspace(args.workspace);
	}

	return findWorkspace(process.cwd()) || findWorkspace(path.dirname(fileURLToPath(import.meta.url)));
}

//
// The base URL the browser must use. With web.server.host set (a tunnel), pages
// served on localhost load their scripts from the public host and never finish,
// so the public URL wins whenever it is configured.
//

export function resolveBaseURL(args, workspace) {
	if (typeof args.base === 'string') {
		return args.base.replace(/\/$/, '');
	}

	if (process.env.LIFERAY_BASE_URL) {
		return process.env.LIFERAY_BASE_URL.replace(/\/$/, '');
	}

	if (workspace) {
		for (const file of [
			path.join(workspace, 'bundles', 'portal-ext.properties'),
			path.join(workspace, 'configs', 'local', 'portal-ext.properties'),
		]) {
			const properties = readProperties(file);
			const host = properties['web.server.host'];

			if (host && !host.includes('[')) {
				const protocol = properties['web.server.protocol'] || 'http';

				return `${protocol}://${host}`;
			}
		}
	}

	return 'http://localhost:8080';
}

export function isNgrok(baseURL) {
	return /\.ngrok(-free)?\.(app|dev|io)$/.test(new URL(baseURL).hostname);
}

//
// Personas live in configs/local/test-users.properties (git-ignored):
//
//   sophie.email=sophie.martin@novacorp.example
//   sophie.password=...
//
// The alias "guest" is reserved and needs no entry.
//

export function readPersona(alias, args, workspace) {
	const file =
		typeof args.users === 'string'
			? args.users
			: path.join(workspace || '.', 'configs', 'local', 'test-users.properties');

	const properties = readProperties(file);
	const email = properties[`${alias}.email`];
	const password = properties[`${alias}.password`];

	if (!email || !password) {
		fail(
			`No "${alias}.email" / "${alias}.password" in ${file}. Add the persona there (the file is git-ignored).`
		);
	}

	return {alias, email, file, password};
}

//
// Generates a new password for the persona and writes it to the personas file
// BEFORE it is submitted, so a crash mid-change never loses the credential.
// The password is never printed.
//

export function rotatePassword(persona) {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
	const bytes = crypto.randomBytes(16);

	let password = 'Bv-';

	for (const byte of bytes) {
		password += alphabet[byte % alphabet.length];
	}

	password += '7!';

	// The old value is kept as <alias>.previous-password in case the portal rejects the new one.

	const key = `${persona.alias}.password`;
	const previousKey = `${persona.alias}.previous-password`;

	const lines = fs
		.readFileSync(persona.file, 'utf8')
		.split(/\r?\n/)
		.filter((line) => !line.trim().startsWith(`${previousKey}=`))
		.flatMap((line) =>
			line.trim().startsWith(`${key}=`) ? [`${key}=${password}`, `${previousKey}=${persona.password}`] : [line]
		);

	fs.writeFileSync(persona.file, lines.join('\n'));

	persona.password = password;

	return password;
}

export function stateFile(alias, args) {
	const dir = typeof args['state-dir'] === 'string' ? args['state-dir'] : path.join(process.cwd(), 'state');

	fs.mkdirSync(dir, {recursive: true});

	return path.join(dir, `${alias}.json`);
}

export async function launch(args) {
	const {chromium} = loadPlaywright();

	const options = {headless: !args.headed};

	if (typeof args['executable-path'] === 'string') {
		options.executablePath = args['executable-path'];
	}
	else {
		options.channel = 'chrome';
	}

	return chromium.launch(options);
}

//
// Free ngrok tunnels serve an interstitial to browsers. Two ways around it:
//
// - "ua" (default): a non-browser user agent, which ngrok lets through. Works
//   for signed-in journeys; nothing is rewritten, so the session cookie stays.
// - "header": add ngrok-skip-browser-warning to requests for the tunnel host
//   only. Never send it to every host: third-party CORS preflights (Analytics
//   Cloud) fail on it.
//

export async function newContext(browser, baseURL, args, storageState) {
	const options = {baseURL, ignoreHTTPSErrors: true};
	const mode = typeof args.ngrok === 'string' ? args.ngrok : 'ua';
	const ngrok = isNgrok(baseURL);

	if (ngrok && mode === 'ua') {
		options.userAgent = 'LiferayBrowserVerify/1.0';
	}

	if (storageState) {
		options.storageState = storageState;
	}

	const context = await browser.newContext(options);

	if (ngrok && mode === 'header') {
		const host = new URL(baseURL).host;

		await context.route(
			(url) => url.host === host,
			async (route) => {
				const headers = await route.request().allHeaders();

				await route.continue({
					headers: {...headers, 'ngrok-skip-browser-warning': '1'},
				});
			}
		);
	}

	return context;
}

export async function whoAmI(page) {
	return page.evaluate(async () => {
		const themeDisplay = window.Liferay && window.Liferay.ThemeDisplay;

		const result = {
			email: null,
			signedIn: Boolean(themeDisplay && themeDisplay.isSignedIn && themeDisplay.isSignedIn()),
			userId: themeDisplay && themeDisplay.getUserId ? themeDisplay.getUserId() : null,
			userName: themeDisplay && themeDisplay.getUserName ? themeDisplay.getUserName() : null,
		};

		if (result.signedIn) {
			// A session-authenticated headless call answers a bare 403 without the CSRF token, even on a GET.

			try {
				const response = await fetch('/o/headless-admin-user/v1.0/my-user-account', {
					headers: {Accept: 'application/json', 'x-csrf-token': window.Liferay.authToken},
				});

				if (response.ok) {
					result.email = (await response.json()).emailAddress;
				}
			}
			catch (error) {
			}
		}

		return result;
	});
}

const LOGIN_PORTLET = '_com_liferay_login_web_portlet_LoginPortlet_';

//
// Signs in through /c/portal/login. Returns {ok, reason, me}. The password is
// typed into the field and never logged.
//

export async function signIn(page, persona, {changePassword, timeout = 30000} = {}) {
	await page.goto('/c/portal/login', {waitUntil: 'domcontentloaded'});

	const login = page.locator(`#${LOGIN_PORTLET}login`);

	try {
		await login.waitFor({timeout});
	}
	catch (error) {
		return {
			ok: false,
			reason: `No login field on ${page.url()} (already signed in, a redirect, or the Login portlet is not on this page).`,
		};
	}

	// The field comes prefilled with "@<domain>": fill() replaces it, type() would append.

	await login.fill(persona.email);
	await page.locator(`#${LOGIN_PORTLET}password`).fill(persona.password);

	await page.locator(`#${LOGIN_PORTLET}loginForm button[type="submit"]`).first().click();

	const deadline = Date.now() + timeout;

	let newPassword = null;
	let passwordChanged = false;

	while (Date.now() < deadline) {
		await page.waitForTimeout(500);

		const url = page.url();

		// The "Change Required" screen, completed the way the user would, when allowed.

		if (url.includes('/c/portal/update_password') && changePassword && !passwordChanged) {
			try {

				// Generated once: a retry must not rotate the stored password a second time.

				newPassword = newPassword || changePassword();

				await page.locator('#password1').fill(newPassword);
				await page.locator('#password2').fill(newPassword);

				await page.locator('#password1').evaluate((input) => input.form.querySelector('button[type="submit"]').click());

				passwordChanged = true;
			}
			catch (error) {

				// The page is still loading; retry on the next poll.

				continue;
			}

			// The submit reloads update_password on a rejection and redirects on success.

			try {
				await page.waitForURL((next) => !next.pathname.includes('/c/portal/update_password'), {timeout: 15000});
			}
			catch (error) {
				const alert = page.locator('.alert-danger').first();
				const message = (await alert.isVisible()) ? (await alert.innerText()).trim() : 'no message';

				return {
					ok: false,
					reason: `The new password was rejected (${message}). The previous one is kept as ${persona.alias}.previous-password.`,
				};
			}

			continue;
		}

		if (url.includes('/c/portal/update_') || url.includes('/c/portal/terms_of_use')) {
			return {
				ok: false,
				reason: `Login stopped on a first-login screen: ${new URL(url).pathname}. See "First-Login Blockers" in the skill.`,
			};
		}

		try {
			const alert = page.locator('.portlet-login .alert-danger, .portlet-login .alert-warning').first();

			if (await alert.isVisible()) {
				return {ok: false, reason: `Login portlet says: ${(await alert.innerText()).trim()}`};
			}

			const me = await whoAmI(page);

			if (me.signedIn) {
				return {me, ok: true};
			}
		}
		catch (error) {

			// Navigation in progress; poll again.

		}
	}

	return {ok: false, reason: `Not signed in after ${timeout} ms (last URL ${page.url()}).`};
}

//
// A page signed in as the persona: reuses the saved storage state when it is
// still valid, signs in again (and saves) when it is not.
//

export async function personaPage(browser, baseURL, alias, args, workspace) {
	if (alias === 'guest') {
		const context = await newContext(browser, baseURL, args);

		return {context, me: {signedIn: false}, page: await context.newPage()};
	}

	const persona = readPersona(alias, args, workspace);
	const file = stateFile(alias, args);

	if (fs.existsSync(file) && !args.fresh) {
		const context = await newContext(browser, baseURL, args, file);
		const page = await context.newPage();

		await page.goto('/', {waitUntil: 'domcontentloaded'});

		const me = await whoAmI(page);

		if (me.signedIn && (!me.email || me.email.toLowerCase() === persona.email.toLowerCase())) {
			return {context, me, page};
		}

		await context.close();
	}

	const context = await newContext(browser, baseURL, args);
	const page = await context.newPage();
	const result = await signIn(page, persona, {
		changePassword: args['complete-password-change'] ? () => rotatePassword(persona) : undefined,
	});

	if (!result.ok) {
		await context.close();

		fail(`${alias} (${persona.email}): ${result.reason}`, 1);
	}

	if (result.me.email && result.me.email.toLowerCase() !== persona.email.toLowerCase()) {
		await context.close();

		fail(`${alias}: signed in, but the session belongs to ${result.me.email}.`, 1);
	}

	await context.storageState({path: file});

	return {context, me: result.me, page};
}
