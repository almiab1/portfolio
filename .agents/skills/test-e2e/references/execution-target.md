# Execution Target

- For a local run, record the worktree path, HEAD, and relevant dirty changes. Use the URL the caller supplies or start an Astro server from that worktree. For production-build behavior, use the existing Playwright suite or build and serve the site with Astro Preview. Check that a reused server serves the intended checkout.
- For a PR run, resolve the PR head SHA and Vercel deployment from its GitHub checks and deployment metadata. Use a ready preview tied to that SHA. When provenance is unresolved, report the limitation and keep the run separate from revision-specific evidence.
- For another supplied URL, record the exact URL and any available source provenance. Use the URL within the authorized test scope.
- Recheck source or deployment identity if it changes during the run. Report observations for each revision separately.
