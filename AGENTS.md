# AGENTS.md

Personal portfolio for Alex (alejandromira.com): a static Astro 5 site with React 19 islands, Tailwind CSS v4 + shadcn/ui, MDX content collections, custom es/en i18n, deployed on Vercel. There is no backend.

Address the user as "Alex".

## Environment

- Use pnpm and Node 22 (`nvm use && pnpm install`). Before committing, run `pnpm run lint`, `pnpm run test`, `pnpm run test:e2e` (builds and serves the site itself), and `pnpm run build`.

## Architecture

- Static content belongs in `.astro` components. Use React only for interactive islands (`client:load` / `client:only`). Keep island logic in custom hooks, and have components receive props.
- Structured data (JSON-LD) helpers live in `src/lib/schema.ts`.
- Don't use `@apply`; style with inline utility classes and CSS variables (`src/styles/global.css`).

## i18n

Spanish is the default locale, served without a prefix (`/`, `/work/[slug]`). English lives under `/en/*`.

- Every UI string comes from `src/i18n/ui.ts` and needs both an `es` and an `en` entry. Astro reads strings through `useTranslations` (`@/i18n/utils`) and React through `t` (`@/i18n/translations`).
- A project lives in two MDX files, `src/content/projects/es/*.mdx` and `src/content/projects/en/*.mdx`. Each needs `lang` and the same `translationKey` in both languages, which is what links the translations. Load projects with `getProjectsByLang(lang)` from `@/lib/i18n-content`.
- Read `docs/i18n/` before changing i18n behaviour or the content schema.

## Code

- Prefer simple, readable solutions over clever ones, even at some cost to conciseness or performance.
- Make the smallest change that does the task, and leave unrelated code and whitespace alone. If you spot an unrelated problem, report it instead of fixing it.
- Match the style of the surrounding file.
- TypeScript is strict. Use `unknown` or a precise type where you might reach for `any`. Use interfaces for objects and types for unions. Give every component an explicit `Props` type.
- Name components `PascalCase.astro` / `.tsx`, utilities `kebab-case.ts`, MDX files `kebab-case.mdx`, and constants `UPPER_CASE`.
- Start every code file with two comment lines prefixed `ABOUTME: ` that say what the file does.
- Keep names and comments evergreen, describing the code as it is. Keep existing comments unless they are provably false.
- Ask before throwing away an implementation to rewrite it.

## Language

- Code, comments, commits, and agent docs are in English.
- Site content (MDX, UI strings) and project docs (`docs/`, `README.md`) are in Spanish.

## Testing

- Unit and integration tests use Vitest + React Testing Library, colocated as `*.test.tsx`.
- End-to-end flows (navigation, language switching, project pages) use Playwright, in `e2e/*.spec.ts`.
- Delegate browser-based UI and end-to-end validation to a subagent. In Codex, use `ui-validator` with GPT-6 Luna. If the client exposes only model selection, spawn `gpt-6-luna` and pass `.codex/agents/ui-validator.toml` as its role instructions. In Claude Code, use `qa-criteria-validator` for acceptance flows and `ui-ux-analyzer` for visual checks. Both Claude agents use Haiku 5.5.
- Give the subagent the working directory, local URL, affected routes, and acceptance criteria. Use Playwright MCP when available or `pnpm exec playwright-cli` with a unique session. Review the reported checks and evidence before handing off the work.
- Install Chromium for the CLI with `pnpm exec playwright-cli install-browser chromium` when the browser is missing.
- Every change ships with tests that cover it. Only Alex can waive this, by explicitly saying "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME."
- Treat test output as part of the result: a run passes only when it is clean, with no warnings or stray logs. Logs that are supposed to contain errors get captured and asserted.

## Git

- `develop` is the integration branch and `main` is production. Branch features from `develop`, and target PRs at `develop`.
- Keep history linear: rebase feature branches onto `develop` (`git pull --rebase`, `git rebase develop`) and integrate by fast-forward or GitHub "Rebase and merge"; merge commits are disabled.
- Use Conventional Commits (`feat|fix|chore|refactor|test|docs: …`) and commit often.
- If uncommitted changes exist when you start, ask Alex how to handle them. Work on a branch, never directly on `develop` or `main`.
- Use Worktrunk (`wt`) for feature worktrees. In WSL, configure `worktree-path = "/home/pica/dev/projects/worktrees/{{ repo }}/{{ branch | sanitize }}"` in `~/.config/worktrunk/config.toml` so new Portfolio worktrees go under `/home/pica/dev/projects/worktrees/Portfolio/`.
- For WSL checkouts on a Linux filesystem, run `git config --local core.symlinks true` once in the repository so new worktrees check out the shared skills in `.claude/skills/` as symbolic links.
- Run `git fetch origin develop` before creating a worktree with `wt switch --create codex/<feature> --base origin/develop`. Use `wt list` to list worktrees and `wt switch <branch>` to open one.
- After the PR is integrated into `develop`, remove the worktree with `wt remove --no-delete-branch <branch>` before deleting the branch.

## Agent skills

### Design

Project design skills live in `.agents/skills/` and are shared with Claude Code through `.claude/skills/`. Use `docs/design/references/` to look up an Awesome DESIGN.md reference when a task calls for an external design pattern.

### Issue tracker

Issues live in GitHub Issues (`almiab1/portfolio`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage roles, reusing GitHub's `question` (needs-info) and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
