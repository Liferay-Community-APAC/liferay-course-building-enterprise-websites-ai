# Reference tests for the acceptance criteria

A Playwright suite with one test per acceptance criterion (🧪) in the workbook: 113 tests over Setup and Levels 1 to 13, plus 4 for the bonus Level 14, each titled with its id (`AC 2.3-1 · …`). It's the instructor's answer key for the Playwright bonus exercises, and a quick way to check a build.

## What it's for

- **Before the course:** check your own demo build. Every demo assumes the whole site exists, and the suite confirms it in about two minutes.
- **During the course:** check a learner's build up to their level (`npx playwright test specs/level-6.spec.ts`), or a catch-up kit after it's applied (each kit in `catch-up/` was proven this way).
- **The Playwright bonuses:** compare a learner's tests with these. Learners write theirs in their own `tests/e2e/`; this suite stays in `instructor/`.
- **Upgrading the course to a new DXP release:** run the suite on a build made with the new release; failures show what changed.

## Run it

Node.js 20 or later, and Google Chrome (or set `PLAYWRIGHT_CHANNEL=chromium` after `npx playwright install chromium`).

```bash
cd instructor/tests/e2e
npm install
npx playwright test                         # every level
npx playwright test specs/level-7.spec.ts   # one level (a bare "level-1" also matches levels 10 to 14)
npx playwright show-report                  # the HTML report, with traces of failures
```

By default it checks the workspace it's in (this repository's root) at Liferay's port: a Tomcat bundle's `server.xml` if there is one, otherwise 8080 (Docker). To check another workspace or instance:

```bash
WORKSPACE=~/courses/bewl-ai LIFERAY_URL=http://localhost:8080 npx playwright test
```

It reads the admin account from `configs/local/admin.properties` in that workspace, and signs the personas in with their training password. Signed-in sessions are saved in `.auth/` (git-ignored) and reused.

## What it changes

Nothing, except four tests that need their own data, and clean it up in a `finally` even when they fail:

- **AC 6.2-3** creates a throwaway FAQ as Christian Carter, checks the delete is refused, and deletes it as the admin.
- **AC 12.1-3, 12.2-2, 12.3-2 and 12.4-3** create Contact Us entries named *Reference Test <timestamp>* and delete them. 12.4-3 approves its entry's Follow Up task as Daniel Raymond. Each entry starts a workflow, so Daniel gets a notification per run.

## Reading a failure

- **A step the learner does by hand (📋) wasn't done.** AC 2.3-3 (virtual host) and AC 2.5-1/2.5-2 (the instance's home and landing pages) fail until those screens are saved.
- **A deploy reset the site.** If AC 2.3-1, 2.3-2 or 3.1-2 fail after a deploy, the site lost its Open membership or its two languages: deploy with `scripts/deploy_site.sh`, which re-applies them.
- **Where no API exists, the tests read the admin UI:** fragments (the fragment API needs the beta flag LPD-39244, which the course doesn't enable), style books, client extensions, widget templates, site settings screens, and the channel's site type. A Liferay UI change can break those tests without the build being wrong; read the trace before blaming the build.

Last full run: 113 of 113 passed on a complete build on DXP 2026.Q3.10.

**Level 14 is a bonus:** its 4 tests need the AI Hub mock (`node bonus/ai-hub/server.mjs`, set up as in the workbook), and are skipped when it doesn't answer, so a full run still passes without it. Set `AI_HUB_URL` if it runs on another port. AC 14.4-2 waits for the learner's agent to answer (up to 2 minutes). Last run: 4 of 4 passed, with Claude Code writing the answers.
