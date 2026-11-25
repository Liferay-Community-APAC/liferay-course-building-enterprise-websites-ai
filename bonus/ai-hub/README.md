# AI Hub (course mock)

A lightweight stand-in for **Liferay AI Hub**, for the bonus Level 14 of the workbook. It lets you set up a website chatbot the way AI Hub does (agents, then a chatbot, then Liferay's *Click to Chat* on your site) without access to AI Hub, and it really answers: with your Liferay's content and **the AI agent you already use** in the course.

It isn't AI Hub, and isn't meant for production: it's one Node.js file and a few static pages, for learning the shape of the setup.

## Run it

Node.js 20 or later, no `npm install`. From the workspace root, in a terminal of your own (not from an agent session):

```bash
node bonus/ai-hub/server.mjs
```

Then open `http://localhost:3010`. Stop it with `Ctrl+C`.

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `AI_CLI` | the first installed of `claude`, `codex`, `copilot`, `gemini` | Which agent writes the answers. `none` lists the search results instead. |
| `AI_HUB_PORT` | `3010` | The console's and the chat's port. Change the *Service URL* in Liferay's *Instance Settings* → *AI Hub* to match. |
| `AI_CLI_TIMEOUT_SECONDS` | `120` | How long to wait for an answer. |

What you build in the console is saved in `bonus/ai-hub/data/ai-hub.json` (git-ignored). Delete it to start over.

## The console's API (for your agent)

Everything the console does goes through a small JSON API on the same port, so your agent can set the mock up with `curl`. It answers requests with no `Origin` header (a terminal) or from the console itself, and refuses other web pages. Each `PUT` creates or replaces the item named in the URL.

| Call | Body | Does |
| --- | --- | --- |
| `GET /api/state` | | Everything: `configuration`, `agents`, `chatbots`, and which agent CLI writes the answers (`runtime`) |
| `PUT /api/configuration` | `{"environmentURL": "http://localhost:8080"}` | Where your Liferay is |
| `POST /api/test-connection` | `{}` | Searches your Liferay as Guest once: `200` with a message, or `500` with the reason in `error` |
| `PUT /api/agents/<ERC>` | see below | Creates or replaces an agent |
| `PUT /api/chatbots/<ERC>` | see below | Creates or replaces a chatbot |
| `DELETE /api/agents/<ERC>`, `/api/chatbots/<ERC>` | | Deletes it |
| `POST /api/chatbots/<ERC>/chat` | `{"message": "…", "history": []}` | Asks the chatbot, as the chat bubble does: `{answer, sources, log}`. No sign-in or header needed; any page may call it |

An agent (`type` is `search` for a Liferay Search agent, `answer` for an LLM agent):

```json
{
	"description": "What the agent is for.",
	"enabled": true,
	"erc": "CLARITY_CONTENT_SEARCH",
	"prompt": "The node's Prompt.",
	"rag": {"blueprintExternalReferenceCode": "", "key": "liferay"},
	"title": "Clarity Content Search",
	"type": "search",
	"userMessage": "{{request}}"
}
```

`rag` is for search agents only, and `blueprintExternalReferenceCode` is optional. Leave out `userMessage` to get AI Hub's default: `{{request}}` for a search agent, the original request and the gathered information for an LLM agent.

A chatbot (`agents` lists agent ERCs):

```json
{
	"agents": ["CLARITY_CONTENT_SEARCH", "CLARITY_ANSWER_BUILDER"],
	"enabled": true,
	"erc": "CLARITY_ASSISTANT",
	"introMessage": "The first message visitors see.",
	"placeholderMessage": "The hint in the empty message box.",
	"title": "Clarity Assistant"
}
```

## How Liferay loads the chat

Liferay's **Click to Chat** has an **AI Hub** chat provider. With it chosen in a site's settings, each page gets two tags pointing at the *Service URL* of *Instance Settings* → *AI Hub*:

```html
<link href="<Service URL>/documents/d/global/index-css" rel="stylesheet">
<script id="aihub-chatbot-widget-script" src="<Service URL>/documents/d/global/index-js"
  ai-hub-url="<Service URL>" chatbot-external-reference-code="<Chat Provider Account ID>"></script>
```

With the Service URL set to `http://localhost:3010`, the mock serves its chat bubble (`public/widget.js`) at that path, and a near-empty stylesheet. Liferay never calls AI Hub itself for this, so the *Client ID* and *Client Secret* it asks for are only placeholders here: the mock shows them in *Configurations* and checks neither.

All three settings can live in code, which is what Level 14.5 does (verified on DXP 2026.Q3.10, with the AI Hub feature flag off):

- **AI Hub** and **Click to Chat for the instance**: two OSGi configuration files, in `configs/local/osgi/configs/` (kept with the workspace) and `bundles/osgi/configs/` (applies live):
  ```properties
  # com.liferay.ai.hub.cell.configuration.AIHubCellConfiguration.config
  clientId="ai-hub-mock-client"
  clientSecret="ai-hub-mock-secret"
  serviceURL="http://localhost:3010"
  ```
  ```properties
  # com.liferay.click.to.chat.web.internal.configuration.ClickToChatConfiguration.config
  enabled=B"true"
  siteSettingsStrategy="inherit-or-override"
  ```
  They have no `scoped~` part and no company id, so they're system-wide defaults: every instance without its own saved value uses them. A company-scoped file with only `companyWebId` was ignored.
- **Click to Chat for the site**: the site initializer's `site-settings.json`, with the same PID and `chatProviderId` `aihub`, `chatProviderAccountId` (the chatbot's ERC), `enabled` and `guestUsersAllowed`.

The *AI Hub* screen in *Instance Settings* only appears once the release feature flag **AI Hub (LPD-62272)** is on; the configuration file works without it. Liferay adds the script with inline JavaScript, so look for `aihub-chatbot-widget-script` in a browser (or in the page's JavaScript), not as a `<script id=…>` tag in the HTML.

Without Click to Chat, the same bubble loads from the chatbot's embed snippet, for example in a fragment:

```html
<script src="http://localhost:3010/widget.js" data-chatbot="CLARITY_ASSISTANT" defer></script>
```

## How a question is answered

```
Visitor's browser ──(chat bubble)──► mock /api/chatbots/<ERC>/chat
                                      │
   for each enabled Liferay Search agent of the chatbot:
                                      ├─► GET <Environment URL>/o/search/v1.0/search?search=<keywords>
                                      │       as Guest (no sign-in), optionally with the agent's blueprint
   then the chatbot's LLM agent:
                                      └─► your agent's command line, with the prompts, the question
                                          and the search results, run with no tools in an empty folder
```

1. **Search agents** turn the question into keywords and search Liferay **as Guest**, so the chatbot only ever sees what an anonymous visitor may see. Liferay's Service Access Policy blocks that API for Guest until you allow `SearchResultResourceImpl#getSearchPage` (Level 14.2).
2. **The LLM agent** gets one prompt: its own *Prompt*, the search agents' *Prompt*, the conversation so far, and its *User Message* with `{{originalRequest}}` and `{{gatheredInformation}}` filled in.
3. The answer, and the top three results as sources, go back to the chat bubble.

The real AI Hub differs in ways the mock skips: a chatbot's agents are chosen by a supervising model reading their descriptions (the mock always runs every search agent, then the LLM agent); the Liferay Search node summarizes its results with a model before passing them on; and AI Hub signs in to Liferay with an OAuth client, on behalf of the visitor.

## How your agent is run

| `AI_CLI` | Command | Tools |
| --- | --- | --- |
| `claude` | `claude -p --tools "" --strict-mcp-config --no-session-persistence` (prompt on stdin) | none |
| `codex` | `codex exec --skip-git-repo-check --sandbox read-only -` (prompt on stdin) | read-only sandbox: it may read files, never change them |
| `copilot` | `copilot -p "<prompt>"` | its non-interactive default (not tested here) |
| `gemini` | `gemini -p "<prompt>"` | its non-interactive default (not tested here) |

Each runs in a new empty temporary folder, which is deleted afterwards. Every answer uses your agent subscription, like any prompt you send it. Tested with Claude Code; the others follow their documented non-interactive modes.

## Safety

- The mock listens on `127.0.0.1` only: other computers can't reach it.
- The console's API (agents, chatbots, configuration) only answers the console's own page. A Liferay page can only read a chatbot's title and intro message, and ask it a question.
- Questions are limited to 1000 characters. With Claude Code, the agent runs with every tool switched off, so a visitor's question can't make it read or change anything on your computer. Other agents run in their non-interactive modes, in an empty folder; Codex can read files there but not change them. Keep the mock on your own computer, for training.

## Knowledge check answers (Level 14)

1. **B.** The mock searches as Guest, so permissions limit the results to what Guest may view, whoever is chatting.
2. **C.** The LLM agent's prompt tells the model to answer from the gathered information alone, and to say so when it doesn't cover the question.
3. **D.** Without the policy, Liferay refuses the search with a 403, so the chatbot has nothing to answer from and reports an error.
