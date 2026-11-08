---
name: test-e2e
description: Verify Portfolio acceptance criteria in a real browser against a local checkout or a Vercel preview. Use when the user requests an end-to-end run or wants to validate a preview.
disable-model-invocation: true
---

# Test E2E

Perform one requested acceptance run and report what the browser actually showed. Use [verify](../verify/SKILL.md) for the repository's general verification workflow.

## 1. Establish the branch scope

Read `AGENTS.md` and [resolve the execution target](references/execution-target.md). Record the checkout and tested revision. Use a user-supplied comparison base when available. Otherwise pin the merge base with `origin/develop` and disclose if that ref could not be refreshed. Inspect the committed diff and, for a local run, relevant staged, unstaged, and untracked changes. Preserve the current branch and worktree.

Find acceptance criteria in the request and linked spec or GitHub issue. Use the diff to locate changed behavior and use the request and product contracts to determine expected behavior. Label any inferred criteria.

## 2. Prepare and execute cases

Create a unique run directory outside the repository and copy [the scenario template](assets/test-cases.md) there. Select cases for the behavior under review. When applicable, cover navigation, the default Spanish route, the corresponding `/en/` route, and links between project translations. Include mobile and keyboard coverage when the change affects layout or interaction.

Delegate browser execution to the validator specified in `AGENTS.md`. Give the validator the worktree, tested URL, affected routes, scenarios, and concrete expected results. Use Playwright MCP when available or a unique `pnpm exec playwright-cli` session. For the automated suite, run `pnpm run test:e2e` in the worktree with Node 22 and pnpm. That command builds and serves its own local site.

Use the visible UI and wait for observable conditions. Record the failing step and the expected and actual result for any mismatch. Continue independent cases. A successful retry still carries the original failure and retry context. Limit scenarios to authorized actions and use synthetic data. Keep secrets and browser session state out of evidence.

## 3. Report

Use [the report template](assets/report.md). Identify the tested URL and revision, then give each case a PASS, FAIL, BLOCKED, or NOT RUN status with concise evidence. Mark the run incomplete if cases remain unverified. Keep the report local unless the user requests publishing it to a specific issue or PR. Follow `docs/agents/issue-tracker.md` for issue operations.
