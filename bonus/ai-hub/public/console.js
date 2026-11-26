// The AI Hub mock's console: Home, Agent Builder (with its workflow editor), Chatbots and
// Configurations, laid out like Liferay AI Hub's own screens. What AI Hub has and the mock
// doesn't is greyed out; what only the mock has is labelled "Course mock". Plain browser JavaScript.

const main = document.getElementById('main');
let state = null;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

const ICONS = {
	back: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10.5 2.5L5 8l5.5 5.5"/></svg>',
	bot: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="14" height="10" rx="1.5"/><path d="M7 14l-1.5 3L10 14"/><circle cx="7.5" cy="8.5" r=".9" fill="currentColor"/><circle cx="12.5" cy="8.5" r=".9" fill="currentColor"/><path d="M7.5 11c1.4 1 3.6 1 5 0"/></svg>',
	chevron: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg>',
	clear: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.3"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8"/></svg>',
	code: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5.5 4L1.5 8l4 4M10.5 4l4 4-4 4"/></svg>',
	copy: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="3" width="9" height="11.5" rx="1.2"/><path d="M6 3V1.8h4V3"/></svg>',
	end: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h1.5v14H3z"/><path d="M4.5 1.5h9l-2.5 3.5 2.5 3.5h-9z"/></svg>',
	external: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 2h5v5M14 2L7 9M12 9.5V14H2V4h4.5"/></svg>',
	eye: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>',
	filter: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 3.5h12M4.5 8h7M7 12.5h2"/></svg>',
	info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.3"/><path d="M8 7v4.5"/><circle cx="8" cy="4.8" r=".7" fill="currentColor"/></svg>',
	kebab: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="13" r="1.4"/></svg>',
	search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4.8"/><path d="M10.5 10.5L14.5 14.5"/></svg>',
	sparkle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3l1.6 4.6L16 9l-4.4 1.4L10 15l-1.6-4.6L4 9l4.4-1.4z"/><path d="M18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9z"/><path d="M17 2l.6 1.4L19 4l-1.4.6L17 6l-.6-1.4L15 4l1.4-.6z"/></svg>',
	start: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6z"/></svg>',
	trash: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 10h6.6L12 4"/></svg>',
	workflow: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1.5" width="5" height="4" rx="1"/><rect x="10" y="10.5" width="5" height="4" rx="1"/><path d="M3.5 5.5v3a2 2 0 002 2h4.5"/></svg>',
};

const NODE_HINT = 'Generate content, summarize and classify data using LLM models.';

const TYPES = {
	answer: {edges: ['TRANSITION LABEL', 'TRANSITION LABEL'], label: 'LLM agent', node: 'LLM', rag: '[]'},
	search: {edges: ['LIFERAY SEARCH', 'END'], label: 'Liferay Search agent', node: 'Liferay Search'},
};

// The node types AI Hub's workflow editor offers. The mock's agents use Start, one node and End,
// so the palette is shown but greyed out.
const PALETTE = [
	['AI Hub Agent', 'Invoke an AI Hub Agent'],
	['AI Decision', 'Make a decision using LLM models.'],
	['End', 'Conclude the workflow.'],
	['Fork', 'Split the workflow into multiple paths.'],
	['Join', 'All interactions need to be closed.'],
	['Join XOR', 'Only one interaction needs to be closed.'],
	['LLM', NODE_HINT],
	['HTTP Request', 'Make outbound calls to REST APIs or client extensions.'],
	['Service', 'Execute custom business logic using a Java delegate.'],
	['Start', 'Begin a workflow.'],
	['State', 'Execute actions in the workflow.'],
	['Task', 'Ask a user to work on the item.'],
];

async function api(method, path, body) {
	const response = await fetch(path, {
		body: body === undefined ? undefined : JSON.stringify(body),
		headers: {'Content-Type': 'application/json'},
		method,
	});
	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(data.error || `HTTP ${response.status}`);
	}

	return data;
}

async function load() {
	state = await api('GET', '/api/state');
}

function go(hash, {replace} = {}) {
	if (replace) {
		history.replaceState(null, '', `#${hash}`);
		route();
	}
	else {
		location.hash = hash;
	}
}

function flash(text, ok = true) {
	const msg = document.getElementById('msg');

	if (msg) {
		msg.innerHTML = `<div class="msg ${ok ? 'ok' : 'err'}">${esc(text)}</div>`;
	}
}

// The language selector AI Hub shows beside translatable fields. The mock is English only, so it's greyed out.
const LOCALE = `<button type="button" class="locale" disabled title="Not in the course mock: English only"><span class="flag" aria-label="English (United States)"></span>
	<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><path d="M5 1l4 5H1zM5 13L1 8h8z"/></svg></button>`;

// A field as AI Hub draws it: label (with * when required), an optional character counter, the
// control, an optional language selector. The placeholder repeats the label.
const field = (id, label, value, {counter = false, disabled = false, hint = '', locale = false, placeholder, readonly = false, required = false, textarea = false, code = false} = {}) => {
	const attrs = `id="${id}" placeholder="${esc(placeholder ?? (code ? '' : label))}" ${readonly ? 'readonly' : ''} ${disabled ? 'disabled' : ''}`;
	const control = textarea
		? `<textarea ${attrs} class="${code ? 'code' : ''}" ${code ? `rows="${String(value).split('\n').length}"` : ''}>${esc(value)}</textarea>`
		: `<input type="text" ${attrs} value="${esc(value)}" ${counter ? 'maxlength="280"' : ''}>`;

	return `
	<div class="field${disabled ? ' soon' : ''}"${disabled ? ' title="Not in the course mock"' : ''}>
		<label for="${id}" class="${required ? 'req' : ''}">${label}</label>
		${counter ? `<span class="counter" data-for="${id}">${String(value).length}/280</span>` : ''}
		${locale ? `<div class="with-locale">${control}${LOCALE}</div>` : control}
		${hint ? `<span class="hint">${hint}</span>` : ''}
	</div>`;
};

function wireCounters() {
	main.querySelectorAll('.counter[data-for]').forEach((counter) => {
		const input = document.getElementById(counter.dataset.for);

		input.addEventListener('input', () => counter.textContent = `${input.value.length}/280`);
	});
}

const toggle = (id, label, checked, {disabled = false} = {}) =>
	`<label class="switch${disabled ? ' locked' : ''}"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="track"></span>${label}</label>`;

const status = (on) => `<span class="label-pill ${on ? 'on' : 'off'}">${on ? 'Running' : 'Stopped'}</span>`;

// A card or button that only the course mock has, labelled so it isn't mistaken for AI Hub.
const MOCK = '<span class="mock-pill" title="Not in Liferay AI Hub: added for the course">Course mock</span>';

// What Liferay's Instance Settings → AI Hub asks for. The mock checks neither value.
const CREDENTIALS = {clientId: 'ai-hub-mock-client', clientSecret: 'ai-hub-mock-secret'};

const val = (id) => document.getElementById(id).value;

const modelLabel = () => (state.runtime.cli ? state.runtime.cliLabel : 'No agent CLI found');

// Editors take the whole window, as in AI Hub: no header, no sidebar.
function fullPage(on) {
	document.body.classList.toggle('full', on);
	window.scrollTo(0, 0);
}

function route() {
	const [tab = 'home', kind, erc] = location.hash.slice(1).split('/');
	const key = decodeURIComponent(erc || '');

	document.querySelectorAll('.side a').forEach((a) => a.classList.toggle('active', a.dataset.tab === (tab || 'home')));
	fullPage(false);

	if (tab === 'agents') {
		if (kind === 'new') return agentEditor(null, key);
		if (kind === 'edit') return agentEditor(key);
		if (kind === 'workflow') return workflowEditor(key);
		return agentList();
	}

	if (tab === 'chatbots') {
		if (kind === 'new') return chatbotEditor(null);
		if (kind === 'edit') return chatbotEditor(key);
		return chatbotList();
	}

	if (tab === 'configurations') return configurations();

	return home();
}

// ---------- Home ----------

function home() {
	const card = (item, kind, href) => `
		<a class="tile" href="${href}">
			<span class="tile-icon">${ICONS.bot}</span>
			<strong>${esc(item.title)}</strong>
			<span class="tile-text">${esc(item.description || '')}</span>
			<span class="tile-labels"><span class="label-pill kind">${kind}</span>${status(item.enabled)}</span>
		</a>`;
	const latest = (list) => list.slice(-4).reverse();

	main.innerHTML = `<div class="home">
		<div class="hero">
			<h1>Start Building AI Agents</h1>
			<p class="sub">Create AI agents that help teams and customers work more efficiently.</p>
			<button class="btn primary pill-btn" id="create">Create New Agent</button>
		</div>
		<div class="row section-head"><h3>Latest Agents</h3><a href="#agents">View Agents</a></div>
		<div class="tiles">${state.agents.length ? latest(state.agents).map((a) => card(a, 'Agents', `#agents/edit/${encodeURIComponent(a.erc)}`)).join('') : '<p class="sub">No agents yet.</p>'}</div>
		<div class="row section-head"><h3>Latest Chatbots</h3><a href="#chatbots">View Chatbots</a></div>
		<div class="tiles">${state.chatbots.length ? latest(state.chatbots).map((c) => card(c, 'Chatbots', `#chatbots/edit/${encodeURIComponent(c.erc)}`)).join('') : '<p class="sub">No chatbots yet.</p>'}</div>
		<p class="foot">${MOCK} A lightweight stand-in for Liferay AI Hub, for the BEWL with AI course. Answers are written by your own AI agent, on this computer.</p>
	</div>`;

	document.getElementById('create').onclick = () => go('agents/new/search');
}

// ---------- Lists ----------

// The toolbar AI Hub puts above a list: Filter (greyed out in the mock), Search, and the New button.
const toolbar = (newButton) => `
	<div class="list-toolbar">
		<button class="btn flat" disabled title="Not in the course mock">${ICONS.filter} Filter <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3h8L5 8z"/></svg></button>
		<label class="search"><input type="text" id="search" placeholder="Search">${ICONS.search}</label>
		${newButton}
	</div>`;

const pager = (count) => `
	<div class="pager"><span><span class="soon">20 Items ⇕</span> Showing ${count ? 1 : 0} to ${count} of ${count} entries.</span>
		<span class="pages"><span class="soon">‹</span><span class="current">1</span><span class="soon">›</span></span></div>`;

function wireSearch() {
	const rows = [...main.querySelectorAll('.list-row')].map((el) => ({el, text: el.innerText.toLowerCase()}));

	document.getElementById('search').addEventListener('input', (event) => {
		const term = event.target.value.toLowerCase();

		rows.forEach(({el, text}) => el.hidden = !text.includes(term));
	});
}

function closeMenus() {
	main.querySelectorAll('.menu').forEach((m) => m.hidden = true);
}

function wireMenus() {
	main.querySelectorAll('.kebab').forEach((button) => {
		button.onclick = (event) => {
			event.stopPropagation();

			const menu = button.nextElementSibling;
			const open = menu.hidden;

			closeMenus();
			menu.hidden = !open;
		};
	});
}

document.addEventListener('click', closeMenus);

async function remove(kind, erc) {
	const item = state[kind].find((x) => x.erc === erc);

	if (item && confirm(`Delete ${item.title}?`)) {
		await api('DELETE', `/api/${kind}/${encodeURIComponent(erc)}`);
		await load();
		route();
	}
}

function agentList() {
	const rows = state.agents.map((a) => `
		<div class="list-row">
			<div class="list-main">
				<a class="list-title" href="#agents/edit/${encodeURIComponent(a.erc)}">${esc(a.title)}</a>
				${a.description ? `<p>${esc(a.description)}</p>` : ''}
				<p>${esc(modelLabel())}</p>
				<span class="tile-labels"><span class="label-pill custom">Custom</span><span class="label-pill type">${TYPES[a.type].label}</span>${status(a.enabled)}</span>
			</div>
			<div class="list-actions"><button class="icon-plain kebab" aria-label="${esc(a.title)} Actions">${ICONS.kebab}</button>
				<div class="menu" hidden>
					<a href="#agents/edit/${encodeURIComponent(a.erc)}">${ICONS.eye} View</a>
					<span class="soon" title="Not in the course mock">${ICONS.copy} Duplicate</span>
					<button type="button" data-delete="${esc(a.erc)}">${ICONS.trash} Delete</button>
				</div></div>
		</div>`).join('');

	main.innerHTML = `
		<h1 class="page-title">Agent Builder</h1>
		<div class="tabs"><span class="active">Agents</span><span class="soon" title="Not in the course mock">Instructions</span><span class="soon" title="Not in the course mock">Data Sources</span><span class="soon" title="Not in the course mock">Guardrails</span></div>
		${toolbar(`<div class="new-wrap"><button class="btn primary" id="new">New Agent</button>
			<div class="menu new-menu" hidden>
				<button type="button" data-new="search">${ICONS.sparkle} Liferay Search agent</button>
				<button type="button" data-new="answer">${ICONS.sparkle} LLM agent</button>
				<span class="menu-note">${MOCK} In AI Hub, you pick the node in the workflow.</span>
			</div></div>`)}
		<div class="list">${rows || '<div class="empty">No agents yet. Start with a Liferay Search agent, then an LLM agent.</div>'}</div>
		${pager(state.agents.length)}`;

	const menu = main.querySelector('.new-menu');

	document.getElementById('new').onclick = (event) => {
		event.stopPropagation();

		const open = menu.hidden;

		closeMenus();
		menu.hidden = !open;
	};
	main.querySelectorAll('[data-new]').forEach((b) => b.onclick = () => go(`agents/new/${b.dataset.new}`));
	main.querySelectorAll('[data-delete]').forEach((b) => b.onclick = () => remove('agents', b.dataset.delete));
	wireMenus();
	wireSearch();
}

function chatbotList() {
	const rows = state.chatbots.map((c) => `
		<div class="list-row compact">
			<div class="list-main">
				<a class="list-title" href="#chatbots/edit/${encodeURIComponent(c.erc)}">${esc(c.title)}</a>
				<span class="tile-labels">${status(c.enabled)}</span>
			</div>
			<div class="list-actions"><button class="icon-plain kebab" aria-label="${esc(c.title)} Actions">${ICONS.kebab}</button>
				<div class="menu" hidden>
					<a href="#chatbots/edit/${encodeURIComponent(c.erc)}">${ICONS.eye} View</a>
					<button type="button" data-delete="${esc(c.erc)}">${ICONS.trash} Delete</button>
				</div></div>
		</div>`).join('');

	main.innerHTML = `
		<h1 class="page-title">Chatbots</h1>
		${toolbar('<button class="btn primary" id="new">New Chatbot</button>')}
		<div class="list">${rows || '<div class="empty">No chatbots yet.</div>'}</div>
		${pager(state.chatbots.length)}`;

	document.getElementById('new').onclick = () => go('chatbots/new');
	main.querySelectorAll('[data-delete]').forEach((b) => b.onclick = () => remove('chatbots', b.dataset.delete));
	wireMenus();
	wireSearch();
}

// ---------- Agent editor ----------

function blankAgent(type) {
	return type === 'search'
		? {description: '', enabled: false, erc: '', prompt: '', rag: {blueprintExternalReferenceCode: '', key: 'liferay'}, title: '', type, userMessage: '{{request}}'}
		: {description: '', enabled: false, erc: '', prompt: '', rag: null, title: '', type,
			userMessage: 'Original user request:\n{{originalRequest}}\n\nGathered information:\n{{gatheredInformation}}'};
}

const inputVariables = (type) => (type === 'search' ? ['request'] : ['originalRequest', 'gatheredInformation']);
const variablesJSON = (names) => JSON.stringify(names.map((name) => ({name, type: 'string'})), null, 2);

async function saveAgent(agent, changes) {
	const next = {...agent, ...changes};

	await api('PUT', `/api/agents/${encodeURIComponent(next.erc)}`, next);
	await load();

	return next;
}

// The bar at the top of AI Hub's full-page editors: back, the page name, Cancel and Save.
const editBar = (title, back) => `
	<div class="edit-bar"><a class="icon-plain" href="${back}" aria-label="Back">${ICONS.back}</a><span class="edit-title">${title}</span>
		<span class="edit-actions"><a class="btn flat" href="${back}">Cancel</a><button class="btn primary" id="save">Save</button></span></div>`;

function agentEditor(erc, newType) {
	const existing = erc ? state.agents.find((a) => a.erc === erc) : null;

	if (erc && !existing) {
		return go('agents');
	}

	const agent = existing ? structuredClone(existing) : blankAgent(TYPES[newType] ? newType : 'search');
	const inputs = inputVariables(agent.type).join(',');

	fullPage(true);
	main.innerHTML = `${editBar('Create Agent', '#agents')}
		<div class="edit-body">
			<div id="msg"></div>
			<div class="card">
				<div class="card-head"><h2>Details</h2>${toggle('enabled', 'Enable Agent', agent.enabled)}</div>
				${field('title', 'Title', agent.title, {counter: true, locale: true, required: true})}
				${field('erc', 'External Reference Code', agent.erc, {readonly: Boolean(existing), required: true})}
				${field('description', 'Description', agent.description, {required: true, textarea: true})}
			</div>
			<div class="card">
				<div class="card-head"><h2>Workflow</h2>
					<button class="btn" id="editWorkflow" ${existing ? '' : 'disabled'}>${ICONS.workflow} Edit Workflow</button></div>
				<p class="sub">Every agent runs its own workflow. Edit the workflow to define what this agent does when it runs.</p>
			</div>
			<div class="card">
				<h2 class="card-title">Variables</h2>
				<div class="field"><label class="req" for="inputVars">Input Variables</label><span class="counter">${inputs.length}/280</span><input type="text" id="inputVars" value="${inputs}" readonly></div>
				<div class="field"><label class="req" for="outputVar">Output Variable</label><span class="counter">8/280</span><input type="text" id="outputVar" value="response" readonly></div>
			</div>
			<div class="card">
				<h2 class="card-title">Data Sources</h2>
				${field('sources', 'Assigned Sources', '', {disabled: true, placeholder: ''})}
			</div>
			<div class="card">
				<h2 class="card-title">Guardrails</h2>
				${field('guardrails', 'Assigned Guardrails', '', {disabled: true, placeholder: ''})}
			</div>
			<div class="card">
				<div class="card-head"><h2>AI Provider</h2>${MOCK}</div>
				<dl class="facts">
					<dt>Provider</dt><dd>Your AI agent, on this computer</dd>
					<dt>Model</dt><dd>${esc(modelLabel())}</dd>
					<dt>Risk Classification</dt><dd><span class="label-pill risk">Minimum Risk</span></dd>
					<dt>Compliance Docs</dt><dd class="soon" title="Not in the course mock">Vendor Compliance Documentation ${ICONS.external}</dd>
				</dl>
			</div>
		</div>`;

	wireCounters();

	if (existing) {
		document.getElementById('editWorkflow').onclick = () => go(`agents/workflow/${encodeURIComponent(agent.erc)}`);
	}

	document.getElementById('save').onclick = async () => {
		try {
			const next = await saveAgent(agent, {
				description: val('description'),
				enabled: document.getElementById('enabled').checked,
				erc: val('erc').trim(),
				title: val('title').trim(),
			});

			go(`agents/edit/${encodeURIComponent(next.erc)}`, {replace: true});
			flash(existing ? 'Saved.' : 'Saved. Now click Edit Workflow to configure what the agent does.');
		}
		catch (error) {
			flash(error.message, false);
		}
	};
}

// ---------- Workflow editor ----------

function workflowEditor(erc) {
	const agent = state.agents.find((a) => a.erc === erc);

	if (!agent) {
		return go('agents');
	}

	const type = TYPES[agent.type];
	const back = `#agents/edit/${encodeURIComponent(agent.erc)}`;
	const node = (id, icon, title, hint) => `
		<div class="node" data-node="${id}"><span class="ico">${icon}</span><div style="min-width:0"><strong>${title}</strong><small>${hint}</small></div></div>`;
	const edge = (label) => `<div class="edge"><span class="pill">${label}</span></div>`;

	fullPage(true);
	main.innerHTML = `
		<div class="wf-top"><a class="icon-plain" href="${back}" aria-label="Back">${ICONS.back}</a>
			<span class="top-right"><span class="apps soon" title="Not in the course mock">${document.querySelector('.top .apps').innerHTML}</span><span class="avatar">${document.querySelector('.top .avatar').innerHTML}</span></span></div>
		<div class="wf-bar"><span class="locale-tile soon" title="Not in the course mock: English only"><span class="flag"></span>en_US</span>
			<span class="edit-title">${esc(agent.title)}</span>
			<span class="edit-actions"><button class="btn icon-square" disabled title="Not in the course mock">${ICONS.info}</button>
				<a class="btn" href="${back}">Cancel</a><button class="btn primary" id="update">Update</button>
				<button class="btn icon-square" disabled title="Not in the course mock">${ICONS.code}</button></span></div>
		<div id="msg" class="wf-msg"></div>
		<div class="wf">
			<div class="canvas">
				${node('start', ICONS.start, 'Start', 'Begin a workflow.')}
				${edge(type.edges[0])}
				${node('step', ICONS.sparkle, type.node, NODE_HINT)}
				${edge(type.edges[1])}
				${node('end', ICONS.end, 'End', 'Conclude the workflow.')}
				<div class="zoom soon" title="Not in the course mock"><span>+</span><span>−</span></div>
			</div>
			<aside class="panel" id="panel"></aside>
		</div>`;

	const panel = document.getElementById('panel');
	const edits = {prompt: agent.prompt, rag: null, userMessage: agent.userMessage};

	// Keep what was typed in the node's panel when another node is selected, until Update.
	function keep() {
		if (document.getElementById('prompt')) {
			edits.prompt = val('prompt');
			edits.userMessage = val('userMessage');
			edits.rag = val('rag');
		}
	}

	function palette() {
		main.querySelectorAll('.node').forEach((n) => n.classList.remove('selected'));
		panel.innerHTML = `<h3 class="panel-title">Nodes</h3>
			<p class="sub" style="margin:0 0 12px">Click a node on the canvas to see its settings.</p>
			<div class="palette soon" title="Not in the course mock: its agents use Start, one node and End">
			${PALETTE.map(([name, hint]) => `<div class="palette-item"><span class="grip">⠿</span><span class="ico">${name === 'Start' ? ICONS.start : name === 'End' ? ICONS.end : ICONS.sparkle}</span><div><strong>${name}</strong><small>${hint}</small></div></div>`).join('')}
			</div>`;
	}

	function show(id) {
		keep();
		main.querySelectorAll('.node').forEach((n) => n.classList.toggle('selected', n.dataset.node === id));

		if (id === 'start') {
			panel.innerHTML = `<p class="node-name">Start</p><p class="sub" style="margin-bottom:20px">Begin a workflow.</p>
				${field('startVars', 'Input Variables', variablesJSON(inputVariables(agent.type)), {code: true, readonly: true, textarea: true})}`;

			return;
		}

		if (id === 'end') {
			panel.innerHTML = `<p class="node-name">End</p><p class="sub" style="margin-bottom:20px">Conclude the workflow.</p>
				${field('endVars', 'Output Variables', variablesJSON(['response']), {code: true, readonly: true, textarea: true})}`;

			return;
		}

		// As AI Hub writes it: the retriever's key first, and a blueprint only when there is one.
		const retriever = agent.rag ? {key: agent.rag.key, ...(agent.rag.blueprintExternalReferenceCode ? {blueprintExternalReferenceCode: agent.rag.blueprintExternalReferenceCode} : {})} : null;
		const rag = edits.rag ?? (agent.type === 'search' ? JSON.stringify({contentRetriever: retriever}, null, 2) : type.rag);

		panel.innerHTML = `
			<p class="node-name">${type.node}</p><p class="sub" style="margin-bottom:20px">${NODE_HINT}</p>
			<h4>Prompt ${ICONS.chevron}</h4>
			<div class="field"><textarea id="prompt" style="min-height:150px">${esc(edits.prompt)}</textarea></div>
			${field('inVars', 'Input Variables', variablesJSON(inputVariables(agent.type)), {code: true, readonly: true, textarea: true})}
			${field('outVars', 'Output Variables', variablesJSON(['response']), {code: true, readonly: true, textarea: true})}
			${field('userMessage', 'User Message', edits.userMessage, {placeholder: '', textarea: true})}
			<h4>Retrieval-Augmented Generation ${ICONS.chevron}</h4>
			<div class="field"><textarea id="rag" class="code" rows="${rag.split('\n').length}" ${agent.type === 'search' ? '' : 'readonly'} aria-label="Retrieval-Augmented Generation">${esc(rag)}</textarea></div>`;
	}

	document.getElementById('update').onclick = async () => {
		keep();

		try {
			const changes = {prompt: edits.prompt, userMessage: edits.userMessage};

			if (agent.type === 'search' && edits.rag !== null) {
				changes.rag = JSON.parse(edits.rag).contentRetriever;
			}

			Object.assign(agent, await saveAgent(agent, changes));
			flash('Workflow saved.');
		}
		catch (error) {
			flash(error instanceof SyntaxError ? `The Retrieval-Augmented Generation configuration isn't valid JSON: ${error.message}` : error.message, false);
		}
	};

	main.querySelectorAll('.node').forEach((n) => n.onclick = (event) => {
		event.stopPropagation();
		show(n.dataset.node);
	});
	main.querySelector('.canvas').onclick = () => {
		keep();
		palette();
	};
	palette();
}

// ---------- Chatbot editor ----------

// AI Hub's Chatbot Code: the snippet that puts the chatbot on any web page. Here it points at the mock.
const chatbotCode = (erc) => `<link href="${location.origin}/documents/d/global/index-css" rel="stylesheet">

<script>
	(function () {
		function loadWidget() {
			if (document.getElementById('aihub-chatbot-widget-script')) {
				return;
			}

			var scriptElement = document.createElement('script');

			scriptElement.id = 'aihub-chatbot-widget-script';
			scriptElement.setAttribute('ai-hub-url', '${location.origin}');
			scriptElement.setAttribute('chatbot-external-reference-code', '${erc}');
			scriptElement.src = '${location.origin}/documents/d/global/index-js';

			document.body.appendChild(scriptElement);
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', loadWidget);
		}
		else {
			loadWidget();
		}
	})();
</script>`;

function chatbotEditor(erc) {
	const existing = erc ? state.chatbots.find((c) => c.erc === erc) : null;

	if (erc && !existing) {
		return go('chatbots');
	}

	const bot = existing ? structuredClone(existing)
		: {agents: [], description: '', enabled: false, erc: '', introMessage: '', placeholderMessage: '', title: ''};
	let assigned = [...bot.agents];

	fullPage(true);
	main.innerHTML = `${editBar(existing ? 'Edit Chatbot' : 'Create Chatbot', '#chatbots')}
		<div class="edit-body">
			<div id="msg"></div>
			<div class="card">
				<div class="card-head"><h2>Details</h2>${toggle('enabled', 'Enable Chatbot', bot.enabled)}</div>
				${field('title', 'Title', bot.title, {counter: true, locale: true, required: true})}
				${field('erc', 'External Reference Code', bot.erc, {readonly: Boolean(existing), required: true})}
				${field('description', 'Description', bot.description || '', {textarea: true})}
				<div class="field soon" title="Not in the course mock"><span class="label">Avatar</span><button type="button" class="btn" disabled>Select File</button>
					<span class="hint">Upload a jpeg, jpg, png no larger than 500 KB.</span></div>
				<div class="field"><span class="label">Assigned Agents</span><div class="chips" id="chips"></div></div>
				${field('notification', 'Notification Message', '', {counter: true, disabled: true, locale: true})}
				${field('placeholder', 'Placeholder Message', bot.placeholderMessage || '', {counter: true, locale: true})}
				${field('intro', 'Intro Message', bot.introMessage, {locale: true, textarea: true})}
				${field('disclaimer', 'Disclaimer Message', '', {disabled: true, locale: true, textarea: true})}
			</div>
			<div class="card soon" title="Not in the course mock">
				<div class="card-head"><h2>Suggested Questions</h2>${LOCALE}</div>
				<p class="sub">Users will see only the intro message when they open the chat.<br>Add up to 5.</p>
				<div class="empty-state"><strong>No Suggested Questions Yet</strong><span class="sub">Add up to 5.</span><button class="btn" disabled>Add Question</button></div>
			</div>
			<div class="card slim">${toggle('guest', 'Allow Guest Access', true, {disabled: true})}
				<span class="hint">${MOCK} The mock always lets visitors chat as Guest, which is what Clarity's public site needs.</span></div>
			${existing ? `
			<div class="card">
				<div class="card-head"><span class="label" style="margin:0">Chatbot Code</span><button type="button" class="square" id="copyCode" title="Copy" aria-label="Copy the chatbot code">${ICONS.copy}</button></div>
				<span class="label">Description</span>
				<textarea class="code chatbot-code" id="chatbotCode" readonly rows="14">${esc(chatbotCode(bot.erc))}</textarea>
				<span class="hint">Paste it into any web page, or use Liferay's Click to Chat with the AI Hub provider and this chatbot's External Reference Code as the account ID.</span>
			</div>
			<div class="card" id="tryIt">
				<div class="card-head" style="margin-bottom:8px"><h2>Try It</h2>${MOCK}</div>
				<p class="sub" style="margin-bottom:16px">Ask a question here first. The run log shows each step a visitor's question goes through.</p>
				<div class="play"><input type="text" id="question" placeholder="${esc(bot.placeholderMessage || 'Ask the chatbot a question')}"><button class="btn primary" id="ask">Ask</button></div>
				<div id="result"></div>
			</div>` : ''}
		</div>`;

	wireCounters();

	const chips = document.getElementById('chips');

	function renderChips() {
		const name = (e) => state.agents.find((a) => a.erc === e)?.title || e;
		const free = state.agents.filter((a) => !assigned.includes(a.erc));

		chips.innerHTML = assigned.map((e) => `<span class="chip">${esc(name(e))}<button type="button" data-remove="${esc(e)}" aria-label="Remove ${esc(name(e))}">✕</button></span>`).join('') +
			(free.length ? `<select id="addAgent" aria-label="Add an agent"><option value=""></option>${free.map((a) =>
				`<option value="${esc(a.erc)}">${esc(a.title)}</option>`).join('')}</select>` : '<span class="chips-fill"></span>') +
			(assigned.length ? `<button type="button" class="chips-clear" id="clearAgents" aria-label="Remove all agents">${ICONS.clear}</button>` : '');

		document.getElementById('clearAgents')?.addEventListener('click', () => {
			assigned = [];
			renderChips();
		});

		chips.querySelectorAll('[data-remove]').forEach((b) => b.onclick = () => {
			assigned = assigned.filter((e) => e !== b.dataset.remove);
			renderChips();
		});

		const add = document.getElementById('addAgent');

		if (add) {
			add.onchange = () => {
				if (add.value) {
					assigned.push(add.value);
					renderChips();
				}
			};
		}
	}

	renderChips();

	document.getElementById('save').onclick = async () => {
		try {
			const next = {
				...bot,
				agents: assigned,
				description: val('description'),
				enabled: document.getElementById('enabled').checked,
				erc: val('erc').trim(),
				introMessage: val('intro'),
				placeholderMessage: val('placeholder'),
				title: val('title').trim(),
			};

			await api('PUT', `/api/chatbots/${encodeURIComponent(next.erc)}`, next);
			await load();
			go(`chatbots/edit/${encodeURIComponent(next.erc)}`, {replace: true});
			flash('Saved.');
		}
		catch (error) {
			flash(error.message, false);
		}
	};

	if (!existing) {
		return;
	}

	document.getElementById('copyCode').onclick = () => navigator.clipboard?.writeText(chatbotCode(bot.erc));

	const ask = document.getElementById('ask');
	const question = document.getElementById('question');
	const result = document.getElementById('result');
	const run = async () => {
		if (!question.value.trim()) {
			return;
		}

		ask.disabled = true;
		result.innerHTML = '<p class="sub" style="margin-top:16px">Running… your agent can take 5 to 30 seconds.</p>';

		try {
			const data = await api('POST', `/api/chatbots/${encodeURIComponent(bot.erc)}/chat`, {message: question.value});
			const sources = data.sources.map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank">${esc(s.title)}</a>` : esc(s.title)}</li>`).join('');

			result.innerHTML = `<div class="answer">${esc(data.answer)}</div>
				${sources ? `<p class="label" style="margin:16px 0 4px">Sources</p><ul style="margin:0">${sources}</ul>` : ''}
				<p class="label" style="margin:16px 0 8px">Run Log</p><div class="log">${esc(data.log.join('\n'))}</div>`;
		}
		catch (error) {
			result.innerHTML = `<div class="msg err">${esc(error.message)}</div>`;
		}

		ask.disabled = false;
	};

	ask.onclick = run;
	question.onkeydown = (event) => event.key === 'Enter' && run();
}

// ---------- Configurations ----------

function configurations() {
	main.innerHTML = `
		<h1 class="page-title">Configurations</h1>
		<div class="config">
			<h2 style="margin-bottom:20px">Account Configuration</h2>
			${field('env', 'Environment URL', state.configuration.environmentURL)}
			<hr>
			<h2 style="margin-bottom:20px">API Credentials</h2>
			<div class="field"><label for="clientId">Client ID</label>
				<div class="with-locale"><input type="text" id="clientId" value="${esc(CREDENTIALS.clientId)}" readonly>
				<button type="button" class="square" id="copyId" title="Copy" aria-label="Copy the Client ID">${ICONS.copy}</button></div></div>
			<div class="field"><label for="clientSecret">Client Secret</label>
				<div class="with-locale"><input type="password" id="clientSecret" value="${esc(CREDENTIALS.clientSecret)}" readonly>
				<button type="button" class="btn" id="reveal">Reveal</button></div>
				<span class="hint">Shown only when you choose to reveal it.</span></div>
			<div class="actions"><button class="btn primary" id="save">Save</button><button class="btn" id="cancel">Cancel</button></div>
			<div id="msg"></div>
			<div class="card mock-card">
				<div class="card-head"><h2>Course Mock</h2></div>
				<p class="sub" style="margin-bottom:20px">Not in Liferay AI Hub. The mock runs on your computer, so <em>Environment URL</em> can be <code>http://localhost:8080</code>. The Client ID and Secret are placeholders that nothing checks.</p>
				${field('serviceURL', 'Service URL', location.origin, {readonly: true, hint: 'Liferay\'s AI Hub configuration points here; Click to Chat loads the chat bubble from it.'})}
				${field('provider', 'Answers From', state.runtime.cli ? state.runtime.cliLabel : 'None found: answers list the search results only', {readonly: true,
					hint: 'In AI Hub, the models run in Liferay\'s cloud. In the mock, your own AI agent writes the answers, in an empty folder. To choose another, restart the mock with AI_CLI=claude, codex, copilot, gemini or none.'})}
				<button class="btn" id="test">Test Connection</button>
				<div id="testMsg"></div>
			</div>
		</div>`;

	document.getElementById('copyId').onclick = () => navigator.clipboard?.writeText(CREDENTIALS.clientId);
	document.getElementById('reveal').onclick = (event) => {
		const secret = document.getElementById('clientSecret');

		secret.type = secret.type === 'password' ? 'text' : 'password';
		event.target.textContent = secret.type === 'password' ? 'Reveal' : 'Hide';
	};
	document.getElementById('cancel').onclick = () => route();
	document.getElementById('save').onclick = async () => {
		try {
			await api('PUT', '/api/configuration', {environmentURL: val('env').trim()});
			await load();
			flash('Saved.');
		}
		catch (error) {
			flash(error.message, false);
		}
	};
	document.getElementById('test').onclick = async () => {
		const out = document.getElementById('testMsg');

		try {
			out.innerHTML = `<div class="msg ok">${esc((await api('POST', '/api/test-connection', {environmentURL: val('env').trim()})).message)}</div>`;
		}
		catch (error) {
			out.innerHTML = `<div class="msg err">${esc(error.message)}</div>`;
		}
	};
}

window.addEventListener('hashchange', route);

load().then(route).catch((error) => {
	main.innerHTML = `<div class="msg err">Can't reach the AI Hub mock: ${esc(error.message)}</div>`;
});
