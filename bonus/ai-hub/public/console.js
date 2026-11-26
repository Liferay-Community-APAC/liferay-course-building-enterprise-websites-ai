// The AI Hub mock's console: Home, Agent Builder (with its workflow editor), Chatbots and
// Configurations, laid out like Liferay AI Hub's own screens. Plain browser JavaScript.

const main = document.getElementById('main');
let state = null;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

const ICONS = {
	end: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h1.5v14H3z"/><path d="M4.5 1.5h9l-2.5 3.5 2.5 3.5h-9z"/></svg>',
	sparkle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3l1.6 4.6L16 9l-4.4 1.4L10 15l-1.6-4.6L4 9l4.4-1.4z"/><path d="M18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9z"/><path d="M17 2l.6 1.4L19 4l-1.4.6L17 6l-.6-1.4L15 4l1.4-.6z"/></svg>',
	start: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6z"/></svg>',
	workflow: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1.5" width="5" height="4" rx="1"/><rect x="10" y="10.5" width="5" height="4" rx="1"/><path d="M3.5 5.5v3a2 2 0 002 2h4.5"/></svg>',
};

const TYPES = {
	answer: {
		edges: ['LLM', 'END'], label: 'LLM agent', node: 'LLM', nodeHint: 'Generate content, summarize or answer.',
		rag: '[]',
	},
	search: {
		edges: ['LIFERAY SEARCH', 'END'], label: 'Liferay Search agent', node: 'Liferay Search',
		nodeHint: 'Search Liferay, then generate content from the results.',
	},
};

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
	document.getElementById('provider').textContent = state.runtime.cli
		? `Answers from ${state.runtime.cliLabel}`
		: 'No agent CLI found: answers list the search results';
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

const field = (id, label, value, {hint = '', readonly = false, required = false, textarea = false, code = false} = {}) => `
	<div class="field">
		<label for="${id}" class="${required ? 'req' : ''}">${label}</label>
		${textarea
			? `<textarea id="${id}" class="${code ? 'code' : ''}" ${code ? `rows="${String(value).split('\n').length}"` : ''} ${readonly ? 'readonly' : ''}>${esc(value)}</textarea>`
			: `<input type="text" id="${id}" value="${esc(value)}" ${readonly ? 'readonly' : ''}>`}
		${hint ? `<span class="hint">${hint}</span>` : ''}
	</div>`;

const toggle = (id, label, checked) =>
	`<label class="switch"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><span class="track"></span>${label}</label>`;

// What Liferay's Instance Settings → AI Hub asks for. The mock checks neither value.
const CREDENTIALS = {clientId: 'ai-hub-mock-client', clientSecret: 'ai-hub-mock-secret'};

const val = (id) => document.getElementById(id).value;

function route() {
	const [tab = 'home', kind, erc] = location.hash.slice(1).split('/');
	const key = decodeURIComponent(erc || '');

	document.querySelectorAll('.side a').forEach((a) => a.classList.toggle('active', a.dataset.tab === (tab || 'home')));

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
	const step = (n, title, text, link, linkText) => `
		<div class="card"><div class="num">STEP ${n}</div><h3 style="margin:6px 0 8px">${title}</h3>
		<p class="sub">${text}</p><p style="margin:12px 0 0"><a href="${link}">${linkText}</a></p></div>`;

	main.innerHTML = `<div class="narrow">
		<h1>Home</h1>
		<p class="sub" style="margin-bottom:24px">Build agents, combine them in a chatbot, and put the chatbot on your site. You have
			${state.agents.length} agent${state.agents.length === 1 ? '' : 's'} and ${state.chatbots.length} chatbot${state.chatbots.length === 1 ? '' : 's'}.</p>
		<div class="home-steps">
			${step(1, 'Connect your Liferay', 'Tell AI Hub where your Liferay is, test the connection, and copy the API credentials to Liferay.', '#configurations', 'Open Configurations')}
			${step(2, 'Build agents', 'A Liferay Search agent finds content in your Liferay; an LLM agent writes the answer.', '#agents', 'Open Agent Builder')}
			${step(3, 'Create a chatbot', 'Assign your agents to a chatbot, give it an intro message, and try it.', '#chatbots', 'Open Chatbots')}
		</div>
		<p class="foot">A lightweight stand-in for Liferay AI Hub, for the BEWL with AI course. Answers are written by your own AI agent, on this computer.</p>
	</div>`;
}

// ---------- Agent Builder ----------

function agentList() {
	const rows = state.agents.map((a) => `
		<tr class="click" data-erc="${esc(a.erc)}">
			<td class="title-cell"><strong>${esc(a.title)}</strong><span>${esc(a.description.slice(0, 110))}</span></td>
			<td><span class="label-pill type">${TYPES[a.type].label}</span></td>
			<td>${esc(a.erc)}</td>
			<td><span class="label-pill ${a.enabled ? 'on' : 'off'}">${a.enabled ? 'Enabled' : 'Disabled'}</span></td>
		</tr>`).join('');

	main.innerHTML = `<div class="narrow">
		<h1>Agent Builder</h1>
		<div class="toolbar"><p class="sub">Each agent runs its own workflow: Start, one node, End.</p>
			<div class="row"><button class="btn" data-new="search">New Liferay Search Agent</button><button class="btn primary" data-new="answer">New LLM Agent</button></div></div>
		${state.agents.length
			? `<table class="list"><tr><th>Title</th><th>Type</th><th>External Reference Code</th><th>Status</th></tr>${rows}</table>`
			: '<div class="empty">No agents yet. Start with a Liferay Search agent, then an LLM agent.</div>'}
	</div>`;

	main.querySelectorAll('[data-new]').forEach((b) => b.onclick = () => go(`agents/new/${b.dataset.new}`));
	main.querySelectorAll('tr[data-erc]').forEach((r) => r.onclick = () => go(`agents/edit/${encodeURIComponent(r.dataset.erc)}`));
}

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

function agentEditor(erc, newType) {
	const existing = erc ? state.agents.find((a) => a.erc === erc) : null;

	if (erc && !existing) {
		return go('agents');
	}

	const agent = existing ? structuredClone(existing) : blankAgent(TYPES[newType] ? newType : 'search');
	const type = TYPES[agent.type];

	main.innerHTML = `<div class="narrow">
		<a class="back" href="#agents">← Agent Builder</a>
		<h1>${existing ? esc(agent.title) : `New ${type.label}`}</h1>
		<div class="card">
			<div class="card-head"><h2>Details</h2>${toggle('enabled', 'Enable Agent', agent.enabled)}</div>
			${field('title', 'Title', agent.title, {required: true})}
			${field('erc', 'External Reference Code', agent.erc, {hint: existing ? '' : 'Letters, digits, - and _. A chatbot\'s Assigned Agents refer to it.', readonly: Boolean(existing), required: true})}
			${field('description', 'Description', agent.description, {hint: 'What the agent is for. In AI Hub, the chatbot reads it to decide when to call the agent.', required: true, textarea: true})}
		</div>
		<div class="card">
			<div class="card-head"><h2>Workflow</h2>
				<button class="btn" id="editWorkflow" ${existing ? '' : 'disabled'}>${ICONS.workflow} Edit Workflow</button></div>
			<p class="sub">Every agent runs its own workflow. Edit the workflow to define what this agent does when it runs.${existing ? '' : ' Save the agent first.'}</p>
		</div>
		<div class="card">
			<h2 style="margin-bottom:20px">Variables</h2>
			${field('inputVars', 'Input Variables', inputVariables(agent.type).join(','), {readonly: true, required: true})}
			${field('outputVar', 'Output Variable', 'response', {readonly: true, required: true})}
		</div>
		<div class="row"><div class="actions"><button class="btn primary" id="save">Save</button><button class="btn" id="cancel">Cancel</button></div>
			${existing ? '<button class="btn danger" id="delete">Delete</button>' : ''}</div>
		<div id="msg"></div>
	</div>`;

	document.getElementById('cancel').onclick = () => go('agents');

	if (existing) {
		document.getElementById('editWorkflow').onclick = () => go(`agents/workflow/${encodeURIComponent(agent.erc)}`);
		document.getElementById('delete').onclick = async () => {
			if (confirm(`Delete the agent ${agent.title}?`)) {
				await api('DELETE', `/api/agents/${encodeURIComponent(agent.erc)}`);
				await load();
				go('agents');
			}
		};
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

function workflowEditor(erc) {
	const agent = state.agents.find((a) => a.erc === erc);

	if (!agent) {
		return go('agents');
	}

	const type = TYPES[agent.type];
	const node = (id, icon, title, hint) => `
		<div class="node" data-node="${id}"><span class="ico">${icon}</span><div style="min-width:0"><strong>${title}</strong><small>${hint}</small></div></div>`;
	const edge = (label) => `<div class="edge"><span class="pill">${label}</span></div>`;

	main.innerHTML = `
		<a class="back" href="#agents/edit/${encodeURIComponent(agent.erc)}">← ${esc(agent.title)}</a>
		<h1>Workflow</h1>
		<div class="wf">
			<div class="canvas">
				${node('start', ICONS.start, 'Start', 'Begin a workflow.')}
				${edge(type.edges[0])}
				${node('step', ICONS.sparkle, type.node, type.nodeHint)}
				${edge(type.edges[1])}
				${node('end', ICONS.end, 'End', 'Conclude the workflow.')}
			</div>
			<aside class="panel" id="panel"></aside>
		</div>
		<div id="msg"></div>`;

	const panel = document.getElementById('panel');

	function show(id) {
		main.querySelectorAll('.node').forEach((n) => n.classList.toggle('selected', n.dataset.node === id));

		if (id === 'start') {
			panel.innerHTML = `<p class="node-name">Start</p><p class="sub" style="margin-bottom:20px">Begin a workflow. The agent receives its input variables here.</p>
				${field('startVars', 'Input Variables', variablesJSON(inputVariables(agent.type)), {code: true, readonly: true, textarea: true})}`;

			return;
		}

		if (id === 'end') {
			panel.innerHTML = `<p class="node-name">End</p><p class="sub" style="margin-bottom:20px">Conclude the workflow. The agent returns its output variable.</p>
				${field('endVars', 'Output Variables', variablesJSON(['response']), {code: true, readonly: true, textarea: true})}`;

			return;
		}

		const rag = agent.type === 'search' ? JSON.stringify({contentRetriever: agent.rag}, null, 2) : type.rag;

		panel.innerHTML = `
			<p class="node-name">${type.node}</p><p class="sub" style="margin-bottom:20px">${type.nodeHint}</p>
			<h4>Prompt</h4>
			<div class="field"><textarea id="prompt" style="min-height:150px">${esc(agent.prompt)}</textarea></div>
			${field('inVars', 'Input Variables', variablesJSON(inputVariables(agent.type)), {code: true, readonly: true, textarea: true})}
			${field('outVars', 'Output Variables', variablesJSON(['response']), {code: true, readonly: true, textarea: true})}
			${field('userMessage', 'User Message', agent.userMessage, {hint: 'Variables in {{double braces}} are filled in when the agent runs.', textarea: true})}
			<h4>Retrieval-Augmented Generation</h4>
			${field('rag', 'RAG Configuration', rag, {code: true, readonly: agent.type !== 'search', textarea: true,
				hint: agent.type === 'search'
					? '"key": "liferay" searches your Liferay as Guest. Set blueprintExternalReferenceCode to search through a Search Blueprint, or leave it empty.'
					: 'An LLM agent retrieves nothing: it writes from its input variables.'})}
			<div class="actions"><button class="btn primary" id="saveNode">Save</button><button class="btn" id="cancelNode">Cancel</button></div>`;

		document.getElementById('cancelNode').onclick = () => go(`agents/edit/${encodeURIComponent(agent.erc)}`);
		document.getElementById('saveNode').onclick = async () => {
			try {
				const changes = {prompt: val('prompt'), userMessage: val('userMessage')};

				if (agent.type === 'search') {
					changes.rag = JSON.parse(val('rag')).contentRetriever;
				}

				Object.assign(agent, await saveAgent(agent, changes));
				flash('Workflow saved.');
			}
			catch (error) {
				flash(error instanceof SyntaxError ? `The RAG configuration isn't valid JSON: ${error.message}` : error.message, false);
			}
		};
	}

	main.querySelectorAll('.node').forEach((n) => n.onclick = () => show(n.dataset.node));
	show('step');
}

// ---------- Chatbots ----------

function chatbotList() {
	const rows = state.chatbots.map((c) => `
		<tr class="click" data-erc="${esc(c.erc)}">
			<td class="title-cell"><strong>${esc(c.title)}</strong><span>${esc((c.description || c.introMessage).slice(0, 110))}</span></td>
			<td>${esc(c.erc)}</td>
			<td>${c.agents.length}</td>
			<td><span class="label-pill ${c.enabled ? 'on' : 'off'}">${c.enabled ? 'Enabled' : 'Disabled'}</span></td>
		</tr>`).join('');

	main.innerHTML = `<div class="narrow">
		<h1>Chatbots</h1>
		<div class="toolbar"><p class="sub">A chatbot runs its assigned agents for each question, and goes on your site through Liferay's Click to Chat.</p>
			<button class="btn primary" id="new">New Chatbot</button></div>
		${state.chatbots.length
			? `<table class="list"><tr><th>Title</th><th>External Reference Code</th><th>Assigned Agents</th><th>Status</th></tr>${rows}</table>`
			: '<div class="empty">No chatbots yet.</div>'}
	</div>`;

	document.getElementById('new').onclick = () => go('chatbots/new');
	main.querySelectorAll('tr[data-erc]').forEach((r) => r.onclick = () => go(`chatbots/edit/${encodeURIComponent(r.dataset.erc)}`));
}

function chatbotEditor(erc) {
	const existing = erc ? state.chatbots.find((c) => c.erc === erc) : null;

	if (erc && !existing) {
		return go('chatbots');
	}

	const bot = existing ? structuredClone(existing)
		: {agents: [], description: '', enabled: false, erc: '', introMessage: '', placeholderMessage: '', title: ''};
	let assigned = [...bot.agents];

	main.innerHTML = `<div class="narrow">
		<a class="back" href="#chatbots">← Chatbots</a>
		<h1>${existing ? esc(bot.title) : 'New Chatbot'}</h1>
		<div class="card">
			<div class="card-head"><h2>Details</h2>${toggle('enabled', 'Enable Chatbot', bot.enabled)}</div>
			${field('title', 'Title', bot.title, {required: true})}
			${field('erc', 'External Reference Code', bot.erc, {hint: 'Write it down: your site\'s Click to Chat names the chatbot by it.', readonly: Boolean(existing), required: true})}
			${field('description', 'Description', bot.description || '', {textarea: true})}
			<div class="field"><span class="label">Assigned Agents</span><div class="chips" id="chips"></div></div>
			${field('placeholder', 'Placeholder Message', bot.placeholderMessage || '', {hint: 'The hint in the visitor\'s empty message box, such as "Ask a question".'})}
			${field('intro', 'Intro Message', bot.introMessage, {hint: 'The first message visitors see when they open the chat.', textarea: true})}
		</div>
		<div class="row"><div class="actions"><button class="btn primary" id="save">Save</button><button class="btn" id="cancel">Cancel</button></div>
			${existing ? '<button class="btn danger" id="delete">Delete</button>' : ''}</div>
		<div id="msg"></div>
		${existing ? `
		<div class="card" style="margin-top:24px">
			<h2 style="margin-bottom:8px">Add It to Your Site</h2>
			<p class="sub" style="margin-bottom:16px">In Liferay, turn on <strong>Click to Chat</strong> for the site, with <strong>AI Hub</strong> as the chat provider and this chatbot's ERC as the account ID. Liferay finds AI Hub through its AI Hub configuration: the credentials and Service URL in <a href="#configurations">Configurations</a>.</p>
			${field('ctcAccount', 'Chat Provider Account ID', bot.erc, {readonly: true})}
			<span class="label">Or, without Click to Chat: Embed Snippet</span>
			<pre class="snippet">&lt;script src="${esc(location.origin)}/widget.js" data-chatbot="${esc(bot.erc)}" defer&gt;&lt;/script&gt;</pre>
		</div>
		<div class="card" id="tryIt">
			<h2 style="margin-bottom:8px">Try It</h2>
			<p class="sub" style="margin-bottom:16px">Ask a question here first. The run log shows each step a visitor's question goes through.</p>
			<div class="play"><input type="text" id="question" placeholder="${esc(bot.placeholderMessage || 'Ask the chatbot a question')}"><button class="btn primary" id="ask">Ask</button></div>
			<div id="result"></div>
		</div>` : ''}
	</div>`;

	const chips = document.getElementById('chips');

	function renderChips() {
		const name = (e) => state.agents.find((a) => a.erc === e)?.title || e;
		const free = state.agents.filter((a) => !assigned.includes(a.erc));

		chips.innerHTML = assigned.map((e) => `<span class="chip">${esc(name(e))}<button type="button" data-remove="${esc(e)}" aria-label="Remove ${esc(name(e))}">×</button></span>`).join('') +
			(free.length ? `<select id="addAgent" aria-label="Add an agent"><option value="">${assigned.length ? 'Add another agent…' : 'Select agents…'}</option>${free.map((a) =>
				`<option value="${esc(a.erc)}">${esc(a.title)} (${TYPES[a.type].label}${a.enabled ? '' : ', disabled'})</option>`).join('')}</select>` : '');

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
	document.getElementById('cancel').onclick = () => go('chatbots');

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

	document.getElementById('delete').onclick = async () => {
		if (confirm(`Delete the chatbot ${bot.title}?`)) {
			await api('DELETE', `/api/chatbots/${encodeURIComponent(bot.erc)}`);
			await load();
			go('chatbots');
		}
	};

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
		<h1>Configurations</h1>
		<div style="margin:0 auto;max-width:1160px;padding-top:24px">
			<h2 style="margin-bottom:20px">Account Configuration</h2>
			${field('env', 'Environment URL', state.configuration.environmentURL, {
				hint: 'Your Liferay\'s address. The real AI Hub is a cloud service and needs a public HTTPS URL here; this mock runs on your computer, so http://localhost:8080 works.'})}
			<hr style="border:0;border-top:1px solid var(--border);margin:24px 0">
			<h2 style="margin-bottom:8px">API Credentials</h2>
			<p class="sub" style="margin-bottom:20px">Your Liferay's AI Hub configuration needs them (<em>Instance Settings</em> → <em>AI Hub</em>, or its configuration file). The mock doesn't check them: they're placeholders, never a secret.</p>
			${field('clientId', 'Client ID', CREDENTIALS.clientId, {readonly: true})}
			${field('clientSecret', 'Client Secret', CREDENTIALS.clientSecret, {readonly: true})}
			${field('serviceURL', 'Service URL', location.origin, {readonly: true, hint: 'Liferay\'s Click to Chat loads the chat bubble from here.'})}
			<hr style="border:0;border-top:1px solid var(--border);margin:24px 0">
			<h2 style="margin-bottom:20px">AI Provider</h2>
			${field('provider', 'Answers From', state.runtime.cli ? state.runtime.cliLabel : 'None found: answers list the search results only', {readonly: true,
				hint: 'In AI Hub, the models run in Liferay\'s cloud. In the mock, your own AI agent writes the answers, run in an empty folder. To choose another, restart the mock with AI_CLI=claude, codex, copilot, gemini or none.'})}
			<div class="row"><div class="actions"><button class="btn primary" id="save">Save</button><button class="btn" id="cancel">Cancel</button></div>
				<button class="btn" id="test" style="margin-top:24px">Test Connection</button></div>
			<div id="msg"></div>
		</div>`;

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
		try {
			flash((await api('POST', '/api/test-connection', {environmentURL: val('env').trim()})).message);
		}
		catch (error) {
			flash(error.message, false);
		}
	};
}

window.addEventListener('hashchange', route);

load().then(route).catch((error) => {
	main.innerHTML = `<div class="msg err">Can't reach the AI Hub mock: ${esc(error.message)}</div>`;
});
