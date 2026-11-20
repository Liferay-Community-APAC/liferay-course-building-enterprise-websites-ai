//
// check-page.mjs — open a page as a persona (or guest) and assert on the
// rendered DOM, after JavaScript ran.
//
//   node check-page.mjs --as <alias|guest> --path /web/<site>/<page>
//                       [--expect TEXT]... [--absent TEXT]...
//                       [--wait-for SELECTOR] [--status CODE]
//                       [--screenshot FILE] [--base URL] [--headed]
//                       [--complete-password-change]
//
// Exit 0 when every assertion holds, 1 otherwise. --expect and --absent repeat.
//

import {fail, launch, list, parseArgs, personaPage, resolveBaseURL, resolveWorkspace} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));

if (typeof args.as !== 'string' || typeof args.path !== 'string') {
	fail('Usage: node check-page.mjs --as <alias|guest> --path <path> [--expect TEXT]... [--absent TEXT]...');
}

// Git Bash rewrites a leading-slash argument into a Windows path (/web/x -> C:/Program Files/Git/web/x).

if (/^[A-Za-z]:[\\/]/.test(args.path)) {
	fail(`--path looks like a rewritten Windows path (${args.path}). In Git Bash, prefix the command with MSYS_NO_PATHCONV=1.`);
}

const workspace = resolveWorkspace(args);
const baseURL = resolveBaseURL(args, workspace);
const browser = await launch(args);

let failures = 0;

function report(ok, message) {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`);

	if (!ok) {
		failures++;
	}
}

try {
	const {context, me, page} = await personaPage(browser, baseURL, args.as, args, workspace);

	console.log(`as ${args.as}: ${me.signedIn ? me.email || me.userName : 'Guest'} on ${baseURL}`);

	const response = await page.goto(args.path, {waitUntil: 'networkidle', timeout: 60000});
	const status = response ? response.status() : 0;

	if (args.status !== undefined) {
		report(status === Number(args.status), `HTTP ${status} (expected ${args.status})`);
	}
	else {
		console.log(`HTTP ${status} ${page.url()}`);
	}

	if (typeof args['wait-for'] === 'string') {
		try {
			await page.locator(args['wait-for']).first().waitFor({timeout: 30000});

			report(true, `selector ${args['wait-for']} present`);
		}
		catch (error) {
			report(false, `selector ${args['wait-for']} never appeared`);
		}
	}

	const text = await page.locator('body').innerText();

	for (const expected of list(args.expect)) {
		report(text.includes(expected), `expect "${expected}"`);
	}

	for (const absent of list(args.absent)) {
		report(!text.includes(absent), `absent "${absent}"`);
	}

	if (typeof args.screenshot === 'string') {
		await page.screenshot({fullPage: true, path: args.screenshot});

		console.log(`screenshot ${args.screenshot}`);
	}

	await context.close();
}
finally {
	await browser.close();
}

process.exit(failures ? 1 : 0);
