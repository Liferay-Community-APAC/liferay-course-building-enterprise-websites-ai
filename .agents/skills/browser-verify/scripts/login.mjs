//
// login.mjs — sign a persona in through /c/portal/login and save its session.
//
//   node login.mjs <alias> [<alias> ...] [--base URL] [--users FILE]
//                  [--state-dir DIR] [--fresh] [--complete-password-change]
//                  [--headed] [--ngrok ua|header]
//
// Writes <state-dir>/<alias>.json (Playwright storage state) and prints who the
// session belongs to. Exit 1 when a persona cannot sign in.
//

import {launch, list, parseArgs, personaPage, resolveBaseURL, resolveWorkspace, stateFile} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const aliases = args._.concat(list(args.persona));

if (!aliases.length) {
	console.error('Usage: node login.mjs <alias> [<alias> ...] [--base URL] [--fresh]');

	process.exit(2);
}

const workspace = resolveWorkspace(args);
const baseURL = resolveBaseURL(args, workspace);
const browser = await launch(args);

try {
	for (const alias of aliases) {
		const {context, me} = await personaPage(browser, baseURL, alias, {...args, fresh: args.fresh}, workspace);

		console.log(
			`OK ${alias}: signed in as ${me.email || me.userName} (userId ${me.userId}) on ${baseURL} -> ${stateFile(alias, args)}`
		);

		await context.close();
	}
}
finally {
	await browser.close();
}
