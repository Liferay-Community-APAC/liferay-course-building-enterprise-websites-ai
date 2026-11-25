// The AI Hub mock's chat bubble. A site loads it in one of two ways:
// - Click to Chat with the AI Hub provider: Liferay adds
//   <script id="aihub-chatbot-widget-script" src="<Service URL>/documents/d/global/index-js"
//     ai-hub-url="<Service URL>" chatbot-external-reference-code="<chatbot ERC>">,
//   and the mock serves this file at that path.
// - The chatbot's embed snippet, in a fragment:
//   <script src="http://localhost:3010/widget.js" data-chatbot="<chatbot ERC>" defer></script>
// It renders in a shadow root, so the site's CSS and the bubble's don't mix.

(function () {
	const script = document.currentScript;

	if (!script || window.__aiHubChatMounted) {
		return;
	}

	window.__aiHubChatMounted = true;

	const hub = (script.getAttribute('ai-hub-url') || new URL(script.src).origin).replace(/\/+$/, '');
	const chatbot = script.dataset.chatbot || script.getAttribute('chatbot-external-reference-code');
	const history = [];

	const host = document.createElement('div');

	host.id = 'aihub-chatbot-widget'; // Click to Chat hides this id where the chat is turned off
	host.setAttribute('data-ai-hub-chat', chatbot || '');
	document.body.appendChild(host);

	const root = host.attachShadow({mode: 'open'});

	root.innerHTML = `
		<style>
			:host { all: initial; }
			* { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
			.bubble { align-items: center; background: #0b5fff; border: 0; border-radius: 50%; bottom: 24px; box-shadow: 0 4px 14px rgba(0,0,0,.25); color: #fff; cursor: pointer; display: flex; font-size: 26px; height: 58px; justify-content: center; position: fixed; right: 24px; width: 58px; z-index: 2147483000; }
			.panel { background: #fff; border-radius: 12px; bottom: 94px; box-shadow: 0 8px 30px rgba(0,0,0,.25); display: flex; flex-direction: column; height: 520px; max-height: calc(100vh - 120px); max-width: calc(100vw - 32px); position: fixed; right: 24px; width: 370px; z-index: 2147483000; }
			.panel[hidden] { display: none; }
			header { background: #0b5fff; border-radius: 12px 12px 0 0; color: #fff; font-size: 15px; font-weight: 600; padding: 14px 16px; }
			header small { display: block; font-size: 11px; font-weight: 400; opacity: .85; }
			.messages { display: flex; flex: 1; flex-direction: column; gap: 10px; overflow-y: auto; padding: 14px; }
			.m { border-radius: 10px; font-size: 14px; line-height: 1.45; max-width: 85%; padding: 9px 12px; white-space: pre-wrap; }
			.bot { align-self: flex-start; background: #f1f2f5; color: #272833; }
			.me { align-self: flex-end; background: #0b5fff; color: #fff; }
			.sources { font-size: 12px; margin-top: 8px; }
			.sources a, .sources span { display: block; }
			.sources a { color: #0b5fff; }
			.typing { color: #6b6c7e; font-size: 13px; font-style: italic; }
			form { border-top: 1px solid #e7e7ed; display: flex; gap: 8px; padding: 10px; }
			input { border: 1px solid #e7e7ed; border-radius: 8px; flex: 1; font-size: 14px; padding: 9px 10px; }
			button.send { background: #0b5fff; border: 0; border-radius: 8px; color: #fff; cursor: pointer; font-size: 14px; padding: 0 14px; }
			button.send:disabled { opacity: .5; }
		</style>
		<button class="bubble" aria-label="Open chat" title="Chat with us">💬</button>
		<section class="panel" hidden aria-label="Chat">
			<header><span class="title">Chat</span><small>Answers come from this site's content</small></header>
			<div class="messages" aria-live="polite"></div>
			<form><input type="text" placeholder="Ask a question" aria-label="Your question"><button class="send" type="submit">Send</button></form>
		</section>`;

	const bubble = root.querySelector('.bubble');
	const panel = root.querySelector('.panel');
	const messages = root.querySelector('.messages');
	const form = root.querySelector('form');
	const input = root.querySelector('input');
	const send = root.querySelector('.send');

	function add(text, who, sources) {
		const m = document.createElement('div');

		m.className = `m ${who}`;
		m.textContent = text;

		if (sources && sources.length) {
			const list = document.createElement('div');

			list.className = 'sources';
			list.textContent = 'Sources:';

			for (const source of sources) {
				const item = document.createElement(source.url ? 'a' : 'span');

				if (source.url) {
					item.href = source.url;
				}

				item.textContent = source.title;
				list.appendChild(item);
			}

			m.appendChild(list);
		}

		messages.appendChild(m);
		messages.scrollTop = messages.scrollHeight;

		return m;
	}

	let opened = false;

	bubble.addEventListener('click', async () => {
		panel.hidden = !panel.hidden;

		if (!panel.hidden) {
			input.focus();
		}

		if (opened) {
			return;
		}

		opened = true;

		try {
			const response = await fetch(`${hub}/api/chatbots/${encodeURIComponent(chatbot)}/public`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error);
			}

			root.querySelector('.title').textContent = data.title;

			if (data.placeholderMessage) {
				input.placeholder = data.placeholderMessage;
			}
			add(data.introMessage || 'Hi! How can I help?', 'bot');
		}
		catch (error) {
			add(`The chat isn't available: ${error.message}`, 'bot');
		}
	});

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		const message = input.value.trim();

		if (!message) {
			return;
		}

		input.value = '';
		add(message, 'me');
		send.disabled = true;

		const typing = add('Thinking…', 'bot');

		typing.classList.add('typing');

		try {
			const response = await fetch(`${hub}/api/chatbots/${encodeURIComponent(chatbot)}/chat`, {
				body: JSON.stringify({history: history.slice(-6), message}),
				headers: {'Content-Type': 'application/json'},
				method: 'POST',
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error);
			}

			typing.remove();
			add(data.answer, 'bot', data.sources);
			history.push({content: message, role: 'user'}, {content: data.answer, role: 'assistant'});
		}
		catch (error) {
			typing.remove();
			add(`Sorry, something went wrong: ${error.message}`, 'bot');
		}

		send.disabled = false;
		input.focus();
	});
})();
