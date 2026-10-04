# AGENTS.md

Personal portfolio for Alex (alejandromira.com): a static Astro 5 site with React 19 islands, Tailwind CSS v4 + shadcn/ui, MDX content collections, custom es/en i18n, deployed on Vercel. There is no backend.

Address the user as "Alex".

## Environment

- Use pnpm and Node 22 (`nvm use && pnpm install`). Scripts live in `package.json`. Before committing, run `pnpm run lint`, `pnpm run test`, and `pnpm run build`.
- Path aliases (`@/*` → `src/*`) live in `tsconfig.json`. Lint and format rules live in `eslint.config.js` and `.prettierrc`.

## Architecture

- Static content belongs in `.astro` components. Use React only for interactive islands (`client:load` / `client:only`). Keep island logic in custom hooks, and have components receive props.
- Structured data (JSON-LD) helpers live in `src/lib/schema.ts`.
- Tailwind v4 doesn't support `@apply`, so style with inline utility classes and CSS variables (`src/styles/global.css`).

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
- End-to-end flows (navigation, language switching, project pages) use Playwright.
- Every change ships with tests that cover it. Only Alex can waive this, by explicitly saying "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME."
- Treat test output as part of the result: a run passes only when it is clean, with no warnings or stray logs. Logs that are supposed to contain errors get captured and asserted.

## Git

- `develop` is the integration branch and `main` is production. Branch features from `develop`, and target PRs at `develop`.
- Use Conventional Commits (`feat|fix|chore|refactor|test|docs: …`) and commit often.
- If uncommitted changes exist when you start, ask Alex how to handle them. Work on a branch, never directly on `develop` or `main`.
- Worktrees go in `.trees/`. Run `git worktree remove` before deleting the branch.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`almiab1/portfolio`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage roles, reusing GitHub's `question` (needs-info) and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
