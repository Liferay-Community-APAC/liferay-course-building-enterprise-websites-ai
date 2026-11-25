#!/usr/bin/env node

// AI Hub (course mock): a lightweight stand-in for Liferay AI Hub, for the bonus level.
//
// - Serves a console shaped like AI Hub's (Agent Builder, Chatbots, Configurations) at
//   http://localhost:3010, and keeps what you build there in data/ai-hub.json.
// - Answers a chatbot's questions: its Liferay Search agents search your Liferay as Guest
//   (GET /o/search/v1.0/search, optionally through a Search Blueprint), then its LLM agent
//   hands the question and the search results to YOUR AI agent's command line (Claude Code,
//   Codex, Copilot or Gemini), run with no tools in an empty folder.
// - Serves widget.js, the chat bubble: Liferay's Click to Chat loads it as AI Hub's
//   /documents/d/global/index-js when the AI Hub Service URL points here, and the chatbot's
//   embed snippet loads it as /widget.js.
//
// Node.js 20 or later, no dependencies. Start it yourself (not from an agent session):
//   node bonus/ai-hub/server.mjs
// Options (environment variables): AI_HUB_PORT (3010), AI_CLI (claude | codex | copilot |
// gemini | none; default: the first one installed), AI_CLI_TIMEOUT_SECONDS (120).

import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, 'public');
const DATA_FILE = path.join(HERE, 'data', 'ai-hub.json');
const PORT = Number(process.env.AI_HUB_PORT || 3010);
const CLI_TIMEOUT = Number(process.env.AI_CLI_TIMEOUT_SECONDS || 120) * 1000;

// ---------- Your AI agent's command line ----------
// Each runs non-interactively, reads the prompt from stdin, and prints the answer. They run in
// an empty temporary folder with tools switched off where the CLI allows it, so the chatbot can
// only write text: it can't read your files or run commands.

const CLIS = {
	claude: {
		args: ['-p', '--tools', '', '--strict-mcp-config', '--no-session-persistence', '--output-format', 'text'],
		label: 'Claude Code (claude -p)',
	},
	codex: {
		args: ['exec', '--skip-git-repo-check', '--sandbox', 'read-only', '--color', 'never', '-'],
		label: 'OpenAI Codex (codex exec)',
	},
	copilot: {
		args: ['-p', '{prompt}', '--no-color'],
		label: 'GitHub Copilot CLI (copilot -p)',
	},
	gemini: {
		args: ['-p', '{prompt}'],
		label: 'Gemini CLI (gemini -p)',
	},
};

function installed(command) {
	const which = process.platform === 'win32' ? 'where' : 'which';

	return spawnSync(which, [command], {stdio: 'ignore'}).status === 0;
}

function detectCli() {
	const wanted = (process.env.AI_CLI || '').trim().toLowerCase();

	if (wanted === 'none') {
		return null;
	}

	if (wanted) {
		if (!CLIS[wanted]) {
			console.error(`AI_CLI=${wanted} isn't one of: ${Object.keys(CLIS).join(', ')}, none`);
			process.exit(1);
		}

		if (!installed(wanted)) {
			console.error(`AI_CLI=${wanted}, but "${wanted}" isn't on your PATH.`);
			process.exit(1);
		}

		return wanted;
	}

	return Object.keys(CLIS).find(installed) || null;
}

const CLI = detectCli();

function runCli(prompt) {
	const spec = CLIS[CLI];
	const usesArg = spec.args.includes('{prompt}');
	const args = spec.args.map((a) => (a === '{prompt}' ? prompt : a));
	const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-hub-'));

	return new Promise((resolve, reject) => {
		const child = spawn(CLI, args, {cwd, shell: process.platform === 'win32', stdio: ['pipe', 'pipe', 'pipe']});
		let out = '';
		let err = '';
		const timer = setTimeout(() => {
			child.kill();
			reject(new Error(`${spec.label} didn't answer within ${CLI_TIMEOUT / 1000} seconds`));
		}, CLI_TIMEOUT);

		child.stdout.on('data', (d) => (out += d));
		child.stderr.on('data', (d) => (err += d));
		child.on('error', (e) => {
			clearTimeout(timer);
			reject(e);
		});
		child.on('close', (code) => {
			clearTimeout(timer);
			fs.rmSync(cwd, {force: true, recursive: true});

			if (code === 0 && out.trim()) {
				resolve(out.trim());
			}
			else {
				reject(new Error(`${spec.label} exited with ${code}: ${(err || out).trim().slice(-400)}`));
			}
		});

		child.stdin.end(usesArg ? '' : prompt);
	});
}

// ---------- Storage ----------

const DEFAULT_STATE = {agents: [], chatbots: [], configuration: {environmentURL: 'http://localhost:8080'}};

function readState() {
	try {
		return {...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))};
	}
	catch {
		return structuredClone(DEFAULT_STATE);
	}
}

function writeState(state) {
	fs.mkdirSync(path.dirname(DATA_FILE), {recursive: true});
	fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, '\t') + '\n');
}

const ERC = /^[A-Za-z0-9_-]{1,80}$/;

function validAgent(a) {
	if (!a || !ERC.test(a.erc || '')) {
		throw new Error('The External Reference Code may only use letters, digits, - and _.');
	}

	if (!a.title) {
		throw new Error('Give the agent a title.');
	}

	if (!['answer', 'search'].includes(a.type)) {
		throw new Error('Unknown agent type.');
	}

	if (a.type === 'search' && (!a.rag || a.rag.key !== 'liferay')) {
		throw new Error('The RAG config needs {"contentRetriever": {"key": "liferay", ...}}.');
	}

	return {
		description: String(a.description || ''),
		enabled: Boolean(a.enabled),
		erc: a.erc,
		inputVariables: a.type === 'search' ? 'request' : 'originalRequest,gatheredInformation',
		outputVariable: 'response',
		prompt: String(a.prompt || ''),
		rag: a.type === 'search' ? {blueprintExternalReferenceCode: String(a.rag.blueprintExternalReferenceCode || ''), key: 'liferay'} : null,
		title: String(a.title),
		type: a.type,
		userMessage: String(a.userMessage || ''),
	};
}

function validChatbot(c) {
	if (!c || !ERC.test(c.erc || '')) {
		throw new Error('The External Reference Code may only use letters, digits, - and _.');
	}

	if (!c.title) {
		throw new Error('Give the chatbot a title.');
	}

	return {
		agents: Array.isArray(c.agents) ? c.agents.filter((e) => ERC.test(e)) : [],
		description: String(c.description || ''),
		enabled: Boolean(c.enabled),
		erc: c.erc,
		introMessage: String(c.introMessage || ''),
		placeholderMessage: String(c.placeholderMessage || ''),
		title: String(c.title),
	};
}

// ---------- Liferay search (as Guest) ----------

const STOPWORDS = new Set(('a about an and any are as at be been but by can could do does did for from had has have how i if in into ' +
	'is it its many me much my of on or our please should so tell than that the their them then there these they this to us was ' +
	'we what when where which who why will with would you your yours').split(' '));

function keywords(text) {
	const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter((w) => w && !STOPWORDS.has(w));

	return [...new Set(words)].slice(0, 8).join(' ');
}

const META = new Set(['actions', 'creator', 'dateCreated', 'dateModified', 'defaultLanguageId', 'displayDate', 'externalReferenceCode',
	'friendlyUrlPath', 'id', 'keywords', 'objectEntryFolderExternalReferenceCode', 'objectEntryFolderId', 'scopeId', 'scopeKey', 'status',
	'systemProperties', 'taxonomyCategoryBriefs', 'title']);

const plain = (html) => String(html || '').replace(/<liferay-hl>|<\/liferay-hl>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
	.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

function hitText(item) {
	const parts = [plain(item.description)];
	const e = item.embedded && typeof item.embedded === 'object' ? item.embedded : {};

	for (const [key, value] of Object.entries(e)) {
		if (META.has(key) || key.endsWith('_i18n') || typeof value !== 'string') {
			continue;
		}

		if (e[`${key}RawText`] !== undefined) {
			continue; // the RawText twin is the same field without its HTML
		}

		const text = plain(value);

		if (text.length > 2 && !parts.includes(text)) {
			parts.push(`${key.replace(/RawText$/, '')}: ${text}`);
		}
	}

	return parts.filter(Boolean).join(' · ').slice(0, 900);
}

async function liferaySearch(environmentURL, query, blueprint, log) {
	const url = new URL('/o/search/v1.0/search', environmentURL);

	url.searchParams.set('search', query);
	url.searchParams.set('pageSize', '5');
	url.searchParams.set('nestedFields', 'embedded');

	if (blueprint) {
		url.searchParams.set('blueprintExternalReferenceCode', blueprint);
	}

	const started = Date.now();
	const response = await fetch(url, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(20000)});

	log.push(`  GET ${url.pathname}${url.search} as Guest → ${response.status} (${Date.now() - started} ms)`);

	if (response.status === 403) {
		throw new Error('Liferay refused the search as Guest (403): its Service Access Policy doesn\'t allow anonymous calls to ' +
			'SearchResultResourceImpl#getSearchPage yet.');
	}

	if (!response.ok) {
		throw new Error(`Liferay's search answered ${response.status}.`);
	}

	const data = await response.json();

	return (data.items || []).map((item) => ({
		text: hitText(item),
		title: plain(item.title),
		type: String(item.entryClassName || '').split('.').pop().replace(/#.*/, ''),
		url: item.itemURL || '',
	}));
}

// ---------- Running a chatbot ----------

const fill = (template, values) => template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, name) => (name in values ? values[name] : m));

async function chat(state, bot, message, history) {
	const log = [];
	const agents = bot.agents.map((erc) => state.agents.find((a) => a.erc === erc)).filter((a) => a && a.enabled);
	const searchAgents = agents.filter((a) => a.type === 'search');
	const answerAgent = agents.find((a) => a.type === 'answer');
	const started = Date.now();

	log.push(`Question: ${message}`);

	if (!searchAgents.length) {
		throw new Error(`The chatbot ${bot.erc} has no enabled Liferay Search agent assigned.`);
	}

	const hits = [];

	for (const agent of searchAgents) {
		const request = keywords(message) || message;
		const query = fill(agent.userMessage || '{{request}}', {request}).trim();

		log.push(`${agent.title} (Liferay Search agent): request = "${request}"`);

		const found = await liferaySearch(state.configuration.environmentURL, query, agent.rag.blueprintExternalReferenceCode, log);

		log.push(`  ${found.length} result${found.length === 1 ? '' : 's'}${found.length ? ': ' + found.map((h) => h.title).join(' | ') : ''}`);
		hits.push(...found.map((h) => ({...h, agent})));
	}

	const gatheredInformation = hits.length
		? hits.map((h, i) => `[${i + 1}] ${h.title} (${h.type})\n${h.text}`).join('\n\n')
		: 'No content was found.';
	const sources = hits.slice(0, 3).map((h) => ({title: h.title, url: h.url})); // the top three; the answer step sees all

	if (!answerAgent || !CLI) {
		log.push(!answerAgent ? 'No enabled LLM agent assigned: listing the results.' : 'No agent CLI found: listing the results.');

		return {
			answer: hits.length ? `Here's what I found:\n${hits.map((h) => `• ${h.title}: ${h.text.slice(0, 200)}`).join('\n')}` : 'I found nothing about that.',
			log,
			sources,
		};
	}

	const conversation = (Array.isArray(history) ? history : []).slice(-6)
		.map((m) => `${m.role === 'assistant' ? 'Assistant' : 'Visitor'}: ${String(m.content).slice(0, 600)}`).join('\n');
	const prompt = [
		'You are the answering step of a website chatbot. Reply with the answer for the visitor only: plain text, no Markdown headings, ' +
			'no preamble. Never run tools or read files.',
		answerAgent.prompt,
		searchAgents.map((a) => a.prompt).filter(Boolean).map((p) => `How to use the search results: ${p}`).join('\n'),
		conversation && `Conversation so far:\n${conversation}`,
		fill(answerAgent.userMessage, {gatheredInformation, originalRequest: message}),
	].filter(Boolean).join('\n\n');

	log.push(`${answerAgent.title} (LLM agent): ${CLIS[CLI].label}, prompt of ${prompt.length} characters`);

	const t = Date.now();
	const answer = await runCli(prompt);

	log.push(`  answered in ${((Date.now() - t) / 1000).toFixed(1)} s`, `Total: ${((Date.now() - started) / 1000).toFixed(1)} s`);

	return {answer, log, sources};
}

// ---------- HTTP ----------

const TYPES = {'.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript'};

function send(res, status, body, cors) {
	const headers = {'Cache-Control': 'no-store', 'Content-Type': 'application/json'};

	if (cors) {
		headers['Access-Control-Allow-Headers'] = 'Content-Type';
		headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
		headers['Access-Control-Allow-Origin'] = '*';
	}

	res.writeHead(status, headers);
	res.end(JSON.stringify(body));
}

async function body(req) {
	let raw = '';

	for await (const chunk of req) {
		raw += chunk;

		if (raw.length > 100000) {
			throw new Error('Request too large.');
		}
	}

	return raw ? JSON.parse(raw) : {};
}

// The console's own API answers its own page only: a page on another origin (such as your Liferay
// site) can't change agents or chatbots. Only the chatbot's public endpoints allow other origins.

function sameOrigin(req) {
	const origin = req.headers.origin;

	return !origin || origin === `http://localhost:${PORT}` || origin === `http://127.0.0.1:${PORT}`;
}

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);
	const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

	try {
		if (parts[0] === 'api' && parts[1] === 'chatbots' && ['chat', 'public'].includes(parts[3])) {
			if (req.method === 'OPTIONS') {
				return send(res, 204, {}, true);
			}

			const state = readState();
			const bot = state.chatbots.find((c) => c.erc === parts[2]);

			if (!bot || !bot.enabled) {
				return send(res, 404, {error: `No enabled chatbot with the External Reference Code ${parts[2]}.`}, true);
			}

			if (parts[3] === 'public' && req.method === 'GET') {
				return send(res, 200, {introMessage: bot.introMessage, placeholderMessage: bot.placeholderMessage || '', title: bot.title}, true);
			}

			if (parts[3] === 'chat' && req.method === 'POST') {
				const {history, message} = await body(req);

				if (!message || typeof message !== 'string' || message.length > 1000) {
					return send(res, 400, {error: 'Send a message of up to 1000 characters.'}, true);
				}

				const result = await chat(state, bot, message.trim(), history);

				console.log(result.log.join('\n'));

				return send(res, 200, result, true);
			}
		}

		if (parts[0] === 'api') {
			if (!sameOrigin(req)) {
				return send(res, 403, {error: 'The console API only answers the console.'});
			}

			const state = readState();

			if (parts[1] === 'state' && req.method === 'GET') {
				return send(res, 200, {...state, runtime: {cli: CLI, cliLabel: CLI ? CLIS[CLI].label : null}});
			}

			if (parts[1] === 'configuration' && req.method === 'PUT') {
				const {environmentURL} = await body(req);

				new URL(environmentURL); // throws on a bad URL
				state.configuration.environmentURL = environmentURL.replace(/\/+$/, '');
				writeState(state);

				return send(res, 200, state.configuration);
			}

			if (parts[1] === 'test-connection' && req.method === 'POST') {
				const {environmentURL} = await body(req);
				const log = [];

				await liferaySearch(environmentURL || state.configuration.environmentURL, 'clarity', '', log);

				return send(res, 200, {message: `Liferay answered a search as Guest: ${log[0].trim()}`});
			}

			if ((parts[1] === 'agents' || parts[1] === 'chatbots') && parts[2]) {
				const key = parts[1];
				const list = state[key];
				const index = list.findIndex((x) => x.erc === parts[2]);

				if (req.method === 'PUT') {
					const item = (key === 'agents' ? validAgent : validChatbot)(await body(req));

					if (item.erc !== parts[2]) {
						throw new Error('The External Reference Code in the URL and the body differ.');
					}

					if (index >= 0) {
						list[index] = item;
					}
					else {
						list.push(item);
					}

					writeState(state);

					return send(res, 200, item);
				}

				if (req.method === 'DELETE' && index >= 0) {
					list.splice(index, 1);
					writeState(state);

					return send(res, 200, {});
				}
			}

			return send(res, 404, {error: 'Not found.'});
		}

		// Click to Chat's AI Hub provider loads <Service URL>/documents/d/global/index-js and index-css.

		if (url.pathname === '/documents/d/global/index-css') {
			res.writeHead(200, {'Cache-Control': 'no-store', 'Content-Type': 'text/css'});

			return res.end('/* The AI Hub mock styles its chat bubble inside the bubble itself. */\n');
		}

		const file = url.pathname === '/' ? 'console.html' : url.pathname === '/documents/d/global/index-js' ? 'widget.js' : url.pathname.slice(1);
		const resolved = path.join(PUBLIC, file);

		if (!resolved.startsWith(PUBLIC + path.sep) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
			res.writeHead(404, {'Content-Type': 'text/plain'});

			return res.end('Not found');
		}

		res.writeHead(200, {'Cache-Control': 'no-store', 'Content-Type': TYPES[path.extname(resolved)] || 'application/octet-stream'});
		fs.createReadStream(resolved).pipe(res);
	}
	catch (error) {
		console.error(error.message);
		send(res, 500, {error: error.message}, parts[0] === 'api' && parts[1] === 'chatbots');
	}
});

server.listen(PORT, '127.0.0.1', () => {
	console.log(`AI Hub (course mock) on http://localhost:${PORT}`);
	console.log(CLI ? `Answers from: ${CLIS[CLI].label}` : 'No agent CLI found (claude, codex, copilot, gemini): answers list the search results only.');
	console.log('Stop it with Ctrl+C.');
});
