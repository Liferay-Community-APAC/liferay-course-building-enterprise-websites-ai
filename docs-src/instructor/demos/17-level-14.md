# Level 14 — Liferay AI Hub: an AI chatbot for your website (bonus)

⏱ **Optional: no block in the schedule** · **Slides:** [Day 2, 42–44](slides/day-2.html#42) · **Learners:** [Level 14](../workbook/level-14.html)

**In this block:** Learners who finish early, or who continue after the course, build an AI chatbot with Liferay AI Hub's setup: a Liferay Search agent, an LLM agent and a chatbot, in a small AI Hub mock that runs on their laptop, then Liferay's own Click to Chat to put it on every page. Their own agent CLI writes the answers, so nobody needs AI Hub access or an API key.

**Demos:** D2.14 (8 min)

ℹ️ **Note:** run this demo only if the class has time at the end of Day 2, or when a few learners start the level and you want to show the shape of it. Present slides 42 to 44 with it; they come after the closing slides, as an appendix.

### D2.14 — An AI Hub chatbot on the Clarity site

🕒 **8 minutes** · Day 2, slides 43 and 44 · after the conclusion, or when learners start Level 14

🎯 **Show:** the chain from a visitor's question to an answer: the chat bubble on the site, the chatbot, its Liferay Search agent, its LLM agent, and the answer with its sources.

💡 **Say:** this is Liferay AI Hub's real setup, on a course mock: the steps learners take here are the same in AI Hub. Retrieval decides *what the chatbot knows*, the LLM agent decides *how it speaks*, and the search runs as Guest, so the chatbot can never answer from content a visitor isn't allowed to see.

🧰 **Prepare:** on your demo build, do Level 14 once (14.1 to 14.5). Before the demo, start the mock in a terminal of your own: `node bonus/ai-hub/server.mjs`. It prints which agent CLI writes the answers. Open `http://localhost:3010` in one tab and Clarity's Home in a private window.

📋 **Steps:**
1. The mock's **Home** → **expect:** *Start Building AI Agents*, the two Clarity agents and the Clarity Assistant chatbot as cards. Say it copies AI Hub's screens; greyed-out items are AI Hub features the mock leaves out.
2. **Agent Builder** → **Clarity Content Search** → **Edit Workflow**, then click the **Liferay Search** node → **expect:** *Start → Liferay Search → End*, and the node's prompt, *User Message* `{{request}}` and Retrieval-Augmented Generation configuration with `"key": "liferay"`. Leave with **Cancel**.
3. **Chatbots** → **Clarity Assistant** → **expect:** both agents as chips, the intro and placeholder messages, and AI Hub's **Chatbot Code** at the bottom. In **Try It**, ask `Do I have to pay for return shipping?` → **expect:** a short answer from Clarity's FAQ, its sources, and the run log: the search as Guest (`200`), then the agent's answer and its time. Don't save.
4. In the private window, open **Home** and click the chat bubble → **expect:** *Clarity Assistant* and its intro message. Ask `Are you hiring?` → **expect:** an answer about Clarity's hiring events and openings.
5. As the admin, Clarity's *Site Settings* → **Click to Chat** → **expect:** *AI Hub* as the chat provider and `CLARITY_ASSISTANT` as the account ID, set from `site-settings.json`. Say that with the real AI Hub, only the Service URL and the credentials would change.

💬 **Live prompt** (optional, replaces step 3's question): 
```
Ask the Clarity Assistant in the AI Hub mock "What is your return policy?"
through its chat endpoint, as a site would, and show me the answer, its
sources and its run log.
```

🧹 **After the demo:** stop the mock with `Ctrl+C` in its terminal. The site keeps working without it, with no chat.

🚀 **Close with AI Hub:** the real AI Hub adds Liferay's ready-made agents (writing, translation, categorization, SEO, image generation), guardrails, data sources, managed models and the AI Assistant in Liferay CMS. Invite anyone interested to talk to their Liferay account team about using it with their Liferay.

### Knowledge check answers

🕒 **5 minutes, if the class did the level** · learners answer on their own first ([Level 14, Knowledge check](../workbook/level-14.html#knowledge-check)). The answers are also at the end of `bonus/ai-hub/README.md`, for learners working after the course.

💡 **Say:** most questions about chatbots come back to two gates: what the search may reach (Service Access Policy, then permissions), and what the model is told to do with it (the prompt).

**Question 1.** Signed in as the admin, the chatbot's search finds nothing that Guest can't see. Why?

✔ **Answer: B.** The mock searches as Guest, so permissions limit results to what Guest may view, whoever is chatting. The chat runs in the visitor's browser, but the search behind it is anonymous.

- **A:** The search API returns whatever the caller may see; an admin's own search finds admin content.
- **C:** The policy opens the API method; it doesn't filter results.
- **D:** The LLM agent only sees what the search returned.

**Ask next:** How would you give signed-in employees answers from internal content? (The real AI Hub calls Liferay on behalf of the user with an OAuth client, so permissions follow the user; the mock always searches as Guest.)

**Question 2.** Which setting keeps the chatbot from answering with facts that aren't on Clarity's site?

✔ **Answer: C.** The LLM agent's prompt: answer from the gathered information alone, and say so when it doesn't cover the question. In 14.4 the warranty question shows it: no number is made up.

- **A:** The policy decides whether the search API can be called at all.
- **B:** That configuration picks what to search, not what the model may say.
- **D:** The intro message is only the chat's first line.

**Ask next:** What else would you add in AI Hub? (Guardrails, and instructions for tone and policy, which the mock greys out.)

**Question 3.** You remove the Service Access Policy. What does a visitor see?

✔ **Answer: D.** The chatbot can't search, so it can't answer. Liferay refuses the search with a `403`, and the bubble shows the error instead of an answer.

- **A:** No results come back at all, not fewer.
- **B:** The bubble comes from Click to Chat and the mock, not from the policy.
- **C:** Nothing asks the visitor to sign in; the API call simply fails.

**Ask next:** How would you find out, on a live site? (Run the mock's *Test Connection*, or fetch `/o/search/v1.0/search` as Guest: an empty-bodied `403` is the policy.)
