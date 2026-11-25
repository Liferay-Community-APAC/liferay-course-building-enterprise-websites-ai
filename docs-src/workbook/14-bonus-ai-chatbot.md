# Level 14 — A website chatbot (bonus): AI Hub's setup, with your own AI

⏱ **About 45 minutes**, on your own, after the course or when you finish early · **Builds on:** Levels 6 and 7 (content to answer from), and the Clarity site and its master pages

**What you'll build:** a **Clarity Assistant** chatbot on every page of the public site. A visitor asks a question; the chatbot searches the site's content, and an AI writes a short answer from what it found, with its sources. You set it up the way you set up a chatbot in **Liferay AI Hub**: a search agent, an answer agent, then a chatbot that uses both. AI Hub is a Liferay cloud service you may not have access to, so this level uses a small **mock** of it that runs on your computer and answers with **the AI agent you already use** in this course.

**Key terms**
- **AI Hub:** Liferay's cloud service for AI agents and chatbots. You build agents in its *Agent Builder*, combine them in a *chatbot*, and put the chatbot on a site. This level's mock copies its screens.
- **Agent:** one step a chatbot runs, with a small workflow: *Start → one node → End*. A **Liferay Search agent** searches your Liferay; an **LLM agent** asks a language model to write text.
- **RAG (retrieval-augmented generation):** first retrieve content that may answer the question, then have a language model answer from that content only. It keeps the answers grounded in your site instead of the model's memory.
- **Service Access Policy:** a Liferay rule that decides which API methods a caller may reach at all, before any permission is checked. Anonymous visitors get almost none by default.
- **Click to Chat:** Liferay's setting that adds a chat to every page of a site, from a chat provider such as AI Hub.

ℹ️ **Note:** the mock is in `bonus/ai-hub/` (no install: it only needs Node.js 20 or later, which the Playwright bonuses use too). It runs your agent's command line non-interactively, in an empty folder: with Claude Code every tool is switched off, so the chatbot can only write text; other agents run in their read-only modes. Each answer takes 5 to 30 seconds and uses your agent subscription, like any other prompt. See `bonus/ai-hub/README.md` for how it works.

### 14.1 — Start the AI Hub mock and connect it to Liferay

🎯 **Goal:** the AI Hub mock running at `http://localhost:3010`, pointing at your Liferay.

**Requirement:** none (bonus) · **Skills:** none, you do this yourself

📋 **Steps** (there's no prompt in this exercise):
1. Open a **second terminal** in VS Code (*Terminal* → *New Terminal*), and start the mock from the workspace root. Like Liferay, you start and stop it yourself, never the agent:
   ```bash
   node bonus/ai-hub/server.mjs
   ```
   It prints which AI agent will write the answers, for example `Answers from: Claude Code (claude -p)`. It looks for `claude`, `codex`, `copilot` and `gemini`, in that order. To choose one, start it with `AI_CLI=codex node bonus/ai-hub/server.mjs` (on Windows PowerShell: `$env:AI_CLI="codex"; node bonus/ai-hub/server.mjs`).
2. Open `http://localhost:3010` in your browser: the **AI Hub** console, with *Agent Builder*, *Chatbots* and *Configurations*.
3. Open **Configurations**. Check that *Environment URL* is `http://localhost:8080`, your Liferay, and click **Save**.
4. Click **Test connection**. You should get a red message: *Liferay refused the search as Guest (403)*. That's expected: the next exercise fixes it.

📖 **Why it matters:** the real AI Hub is a cloud service: it needs a public HTTPS URL for your Liferay, and it signs in to Liferay with an OAuth client. The mock runs next to your Liferay, so `localhost` works, and it searches as an anonymous visitor (Guest), which is what a public chatbot should see.

### 14.2 — Let anonymous visitors search through the API

🎯 **Goal:** Guest may call Liferay's headless search API, so the chatbot can search what any visitor may see, and nothing more.

**Requirement:** none (bonus) · **Skills:** none, you do this yourself

📋 **Steps** (there's no prompt: Service Access Policies have no headless API):
1. *Global Menu* → *Control Panel* → *Security* → **Service Access Policy** → **New**.
2. Fill in:
   - **Name:** `CLARITY_GUEST_SEARCH`
   - **Enabled:** on. **Default:** on (a policy applies to anonymous requests only when it's a default one).
   - **Title:** `Clarity Guest Search`
   - **Service Class:** `com.liferay.portal.search.rest.internal.resource.v1_0.SearchResultResourceImpl`
   - **Method Name:** `getSearchPage`
3. **Save**.
4. Back in the mock's **Configurations**, click **Test connection** again: *Liferay answered a search as Guest: … → 200*.

✅ **Verify** (look, don't change anything):
1. In a private window, open `http://localhost:8080/o/search/v1.0/search?search=return%20policy`: JSON with Clarity's FAQ entries about returns.

📖 **Why it matters:** two gates protect your content from an API call. The Service Access Policy decides whether the API method can be reached at all; then permissions decide which results come back. This policy opens only the first gate, for one read method: the search still runs as Guest, so it returns only what Guest may view (your public FAQs, products and articles), never a persona's or the admin's content. A public chatbot is only as public as its content's permissions.

### 14.3 — Build the two agents

🎯 **Goal:** a **Clarity Content Search** agent that searches your Liferay, and a **Clarity Answer Builder** agent that writes the answer.

**Requirement:** none (bonus) · **Skills:** none, you do this yourself

📋 **Steps**, in the mock's **Agent Builder** (as in AI Hub, an agent is saved before you edit its workflow):
1. Click **New Liferay Search Agent**. In **Details**, turn **Enable Agent** on, and fill in:
   - **Title:** `Clarity Content Search`
   - **External Reference Code:** `CLARITY_CONTENT_SEARCH`
   - **Description:** `Retrieval worker for Clarity Vision Solutions: products, FAQs, articles and job openings. The request is used directly as the search query.`

   **Variables** shows its input (`request`) and output (`response`). Click **Save**.
2. In the **Workflow** card, click **Edit Workflow**: the canvas shows **Start → Liferay Search → End**. The **Liferay Search** node is selected, and its settings are in the panel on the right:
   - **Prompt:** `Use only the retrieved content as evidence. Do not invent or infer missing facts.`
   - Leave **User Message** (`{{request}}`) and the **Retrieval-Augmented Generation** configuration as they are: `"key": "liferay"` searches your Liferay, with no Search Blueprint.

   Click **Save** in the panel. Click **Start** and **End** too: they show the variables going in and out.
3. Back in **Agent Builder**, click **New LLM Agent**. Turn **Enable Agent** on, fill in, and **Save**:
   - **Title:** `Clarity Answer Builder`
   - **External Reference Code:** `CLARITY_ANSWER_BUILDER`
   - **Description:** `Always runs last: writes the answer from the gathered information.`
4. **Edit Workflow**: **Start → LLM → End**. In the **LLM** node's panel:
   - **Prompt:** `You are Clarity Vision Solutions' website assistant. Build a clear, short answer to the original request from the gathered information alone. Never invent facts. If the information doesn't cover the question, say so and suggest contacting Clarity. Offer more details at the end.`
   - Leave the **User Message**: it passes `{{originalRequest}}` and `{{gatheredInformation}}`, the search results.

   Click **Save** in the panel.

![The Clarity Content Search agent's workflow in the mock's Agent Builder: Start, Liferay Search and End nodes on a dotted canvas, and the Liferay Search node's Prompt, variables, User Message and Retrieval-Augmented Generation configuration in the panel on the right.](screenshots/14-3-search-agent.png)

📖 **Why it matters:** splitting retrieval from writing is the RAG pattern. The search agent decides *what the chatbot knows*; the LLM agent decides *how it speaks*. The prompt that says "from the gathered information alone" is what stops the model from answering from its own memory.

### 14.4 — Create the chatbot and try it

🎯 **Goal:** a **Clarity Assistant** chatbot that uses both agents, tried in the console.

**Requirement:** none (bonus) · **Skills:** none, you do this yourself

📋 **Steps**, in the mock's **Chatbots**:
1. **New Chatbot**. In **Details**, turn **Enable Chatbot** on, and fill in:
   - **Title:** `Clarity Assistant`
   - **External Reference Code:** `CLARITY_ASSISTANT`. Write it down: Click to Chat names the chatbot by it.
   - **Assigned Agents:** select both of your agents; each becomes a chip.
   - **Placeholder Message:** `Ask about eyewear, orders or careers`
   - **Intro Message:** `Hi! I'm the Clarity Assistant. Ask me about our eyewear, orders and returns, or careers at Clarity.`
2. **Save**. The page now shows **Add It to Your Site** and a **Try It** card.
3. In **Try It**, ask `What is your return policy?`, and read the **Run Log**: the search request, its results, then your agent's answer and how long each step took.

✅ **Verify** (look, don't change anything):
1. The answer says returns are accepted within **30 days** of delivery, for unused items, and **Sources** lists *What is your return policy?*.
2. Ask `How many years of warranty do your frames have?`: Clarity's content doesn't say, so the answer says it found no warranty information, and doesn't make a number up.

![Try It in the mock's chatbot screen: the answer about Clarity's 30-day return policy, its sources, and the run log showing the Liferay search as Guest (200) and the answer step.](screenshots/14-4-try-it.png)

⚠️ **If it doesn't match:**
- *No enabled Liferay Search agent assigned:* turn the agent's **Enable Agent** on, and check it's a chip under **Assigned Agents**.
- *Liferay refused the search as Guest (403):* redo 14.2; check that the policy is both **Enabled** and **Default**.
- *The answer lists results instead of a written answer:* the mock found no agent command line, or no enabled LLM agent is assigned. The terminal running the mock says which.
- *exited with … or didn't answer within 120 seconds:* run your agent once in a terminal (for example `claude -p "hello"`) to check it's signed in.

### 14.5 — Put the chatbot on every page, with Click to Chat

🎯 **Goal:** the chat bubble on every page of the public site, for anyone, Guest included, added the way you add an AI Hub chatbot: with Liferay's **Click to Chat**.

**Requirement:** none (bonus) · **Skills:** none, you do this yourself

📋 **Steps** (there's no prompt in this exercise), as the admin in Liferay:
1. **Turn on AI Hub.** *Control Panel* → *Instance Settings* → *Platform* → **Feature Flags**, then the **Release** tab: turn **AI Hub (LPD-62272)** on. No restart is needed.
2. **Connect Liferay to the mock.** In the mock's **Configurations**, find **API Credentials**. Back in *Instance Settings* → *Platform* → **AI Hub**, paste the **Client ID** and **Client Secret**, set **Service URL** to `http://localhost:3010`, and **Save**.
3. **Turn on Click to Chat for the instance.** *Instance Settings* → *Content and Data* → **Click to Chat**: turn **Enable Click to Chat** on, set **Site Settings Strategy** to **Inherit or Override**, and **Save**. This lets each site choose its own chat.
4. **Turn it on for Clarity.** On the Clarity site, *Site Menu* → *Configuration* → *Site Settings* → **Click to Chat**: turn **Enable Click to Chat** on, choose **AI Hub** as the **Chat Provider**, enter `CLARITY_ASSISTANT` as the **Chat Provider Account ID**, turn **Guest Users Allowed** on, and **Save**. Ignore the *Get my account token for AI Hub* link: it's for the real AI Hub.

![Clarity's Site Settings, Click to Chat: enabled, the AI Hub provider, CLARITY_ASSISTANT as the account ID, and guest users allowed.](screenshots/14-5-click-to-chat.png)

✅ **Verify** (look, don't change anything):
1. In a private window (as Guest), open Clarity's Home page: a round chat bubble sits bottom right. Click it: *Clarity Assistant* and its intro message.
2. Ask `Do I have to pay for return shipping?`: after a few seconds, an answer (yes, unless the item is defective or Clarity made an error) and its sources.
3. Open another page, such as *FAQ*: the bubble is there too.
4. View the page source (*Ctrl+U*, or *Cmd+Option+U* on a Mac) and search for `aihub-chatbot-widget-script`: Liferay added a script from `http://localhost:3010/documents/d/global/index-js`, with `chatbot-external-reference-code="CLARITY_ASSISTANT"`. That's the path Click to Chat loads from AI Hub; the mock serves its bubble there.

![Clarity's Home page as Guest, with the Clarity Assistant chat open: the answer about return shipping, and its sources.](screenshots/14-5-chat-on-site.png)

🧪 **Acceptance criteria** (what the level's Playwright check tests, in ⭐ Extras):

- **AC 14.2-1** · *API, as Guest:* `GET /o/search/v1.0/search?search=return policy` answers 200, and its items include *What is your return policy?*.
- **AC 14.4-1** · *API, as the console (`http://localhost:3010/api/state`):* the chatbot `CLARITY_ASSISTANT` is enabled, and its assigned agents are an enabled Liferay Search agent and an enabled LLM agent.
- **AC 14.4-2** · *API, as a site (`POST http://localhost:3010/api/chatbots/CLARITY_ASSISTANT/chat`):* *What is your return policy?* gets an answer that mentions 30 days, with *What is your return policy?* among its sources.
- **AC 14.5-1** · *Browser, as Guest:* Home and the FAQ page have Click to Chat's AI Hub script (`script#aihub-chatbot-widget-script`) from `http://localhost:3010`, with `chatbot-external-reference-code="CLARITY_ASSISTANT"`, and clicking the bubble shows the intro message.

⚠️ **If it doesn't match:**
- *No* AI Hub *in Instance Settings:* the feature flag isn't on (step 1). Reload the page after turning it on.
- *No bubble, and the script tag is in the HTML:* the mock isn't running. Start it again (14.1): the site only links to it.
- *No script tag in the HTML:* Click to Chat is off for the instance or the site, the *Chat Provider* isn't *AI Hub*, or *Guest Users Allowed* is off (check signed in: if the bubble shows there, it's this one). An empty *Service URL* in *AI Hub* also leaves it out.
- *The bubble says the chat isn't available:* the chatbot is disabled, or its ERC differs from the *Chat Provider Account ID*.

📖 **Why it matters:** these are the same four settings you'd change with the real AI Hub; only the *Service URL* and the credentials would come from your AI Hub account instead of the mock. Click to Chat puts one chatbot on every page of a site, without touching a page or a master, and a site can override the instance's choice. The bubble only links to AI Hub: stop the mock, and the site keeps working, without a chat.

## 🧠 Knowledge check

⏱ **About 3 minutes, on your own.** Choose one answer for each question. The answers are at the end of `bonus/ai-hub/README.md`.

**Question 1.** Signed in as the admin, the chatbot's search finds nothing that Guest can't see. Why?

- **A.** The search API never returns admin content.
- **B.** The mock searches as Guest, so permissions limit results to what Guest may view.
- **C.** The Service Access Policy hides admin content.
- **D.** The LLM agent filters out private results.

**Question 2.** Which setting keeps the chatbot from answering with facts that aren't on Clarity's site?

- **A.** The Service Access Policy.
- **B.** The search agent's Retrieval-Augmented Generation configuration, `"key": "liferay"`.
- **C.** The LLM agent's prompt: answer from the gathered information alone.
- **D.** The chatbot's intro message.

**Question 3.** You remove the Service Access Policy. What does a visitor see?

- **A.** The chatbot answers as before, with fewer sources.
- **B.** The bubble disappears from the site.
- **C.** Liferay asks the visitor to sign in.
- **D.** The chatbot can't search, so it can't answer.

## ⭐ Extras

Optional, for when you finish early.

### ⭐ 14.6 — Bonus: search through a blueprint

🎯 **Goal:** a second search agent that searches through the **Boost Associate Job Listings** blueprint from 11.2, so career questions get job listings only.

📋 **Steps:**
1. In **Agent Builder**, create a Liferay Search agent **Clarity Jobs Search** (`CLARITY_JOBS_SEARCH`), enabled, with the description `Job openings at Clarity.`, and then **Edit Workflow**, and set its **Retrieval-Augmented Generation** configuration to:
   ```json
   {"contentRetriever": {"blueprintExternalReferenceCode": "BOOST_ASSOCIATE_JOB_LISTINGS", "key": "liferay"}}
   ```
2. Add it to **Clarity Assistant**'s **Assigned Agents**, and ask in **Try It**: `Are you hiring warehouse staff?`. The run log shows two searches, the second with `blueprintExternalReferenceCode`.

ℹ️ **Note:** blueprints need Liferay's Search Experiences. If *Applications* → *Blueprints* says the portlet can't be found, your activation key doesn't include it: skip this bonus.

### ⭐ 14.7 — Bonus: check Level 14 with Playwright

🎯 **Goal:** `tests/e2e/level-14.spec.ts`, with one test per acceptance criterion (🧪) of Level 14, added to the Playwright suite from 1.3. Write the prompt yourself: start from 1.3's and point it at this level's criteria. AC 14.4-2 waits for your agent's answer, so give it a 2-minute timeout.

✅ **Success looks like:**
1. With the mock running, `npx playwright test level-14` runs one test per acceptance criterion, each named by its id, and all pass.
2. Stop the mock: AC 14.4-1, AC 14.4-2 and AC 14.5-1 fail, and AC 14.2-1 still passes. Start it again: all pass.

### ⭐ 14.8 — Bonus: the embed snippet instead of Click to Chat

🎯 **Goal:** the same bubble from a fragment, for a site that doesn't use Click to Chat. The chatbot page's **Add It to Your Site** card shows the snippet.

💬 **Prompt:**
```
Using the scaffold-fragment and theme-and-design skills, add a "Clarity
Chat" fragment to the Clarity Components set in
client-extensions/clarity-site. Configuration: chatbotERC (text, default
"CLARITY_ASSISTANT") and aiHubURL (text, default "http://localhost:3010").
On the live page, its HTML is only the AI Hub embed snippet:
<script data-chatbot="${configuration.chatbotERC}" defer
src="${configuration.aiHubURL}/widget.js"></script>
In the page editor (layoutMode "edit"), render a small dashed label
"Clarity Chat: <chatbotERC>" instead of the script. Place it at the end of
both master pages, after the footer, with those two values. Deploy with
scripts/deploy_site.sh, then fetch Home as Guest and show me the script
tag in the HTML.
```

✅ **Success looks like:** turn Click to Chat off in Clarity's *Site Settings*: the bubble still shows on every page, now from the fragment. One page shows one bubble, even with both on.
