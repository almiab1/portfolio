---
name: verify
description: Run the checks appropriate to the Portfolio changes and report any warnings, failures, or skipped checks.
---

Identify changes from the current task without treating unrelated worktree edits as yours. Read `AGENTS.md`, `package.json`, and the relevant test configuration before selecting checks.

- Start with focused checks for changed behavior, then broaden to affected integration/e2e paths and mandatory service checks.
- Use Node 22 and pnpm. Before committing, run the lint, unit, E2E, and build commands required by `AGENTS.md`. Delegate browser and E2E validation as described there.
- For documentation/configuration-only changes, check syntax, links, and affected behavior rather than unrelated application suites.
- Inspect the full output. Treat warnings and stray logs as a failed clean run and distinguish regressions from existing failures.
- Report unavailable dependencies and checks not run; do not install dependencies, fix unrelated code, or claim success implicitly.
