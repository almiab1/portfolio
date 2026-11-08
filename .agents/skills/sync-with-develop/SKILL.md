---
name: sync-with-develop
description: Synchronize the current task branch with the latest origin/develop through a safe rebase and verify it is only ahead. Use for branch or PR sync requests, including pushing a successfully synchronized published branch. Respect explicit local-only requests.
---

# Sync With Develop

Rebase the current task branch onto the fetched remote integration branch while preserving both the branch's work and upstream changes.

## Workflow

1. Read the repository instructions governing Git, protected branches, rebasing, and required checks.
2. Confirm the current worktree and branch are the intended task branch. Do not run this workflow directly on protected or integration branches such as `main`, `develop`, or `beta`.
3. Inspect `git status --short --untracked-files=all`. If the working tree is dirty, stop and ask the user how they want the changes preserved. Do not stash, create a commit, discard files, or use rebase autostash implicitly.
4. For a published branch, fetch its remote head and record its SHA before rebasing. Confirm local history contains that remote head; if it does not, stop and resolve the divergence before rewriting history. Use this recorded SHA as the push lease. Fetch and resolve the fixed remote base:

   ```bash
   git fetch origin develop
   git rev-parse origin/develop
   ```

5. Measure the relationship before changing history:

   ```bash
   git rev-list --left-right --count origin/develop...HEAD
   git log --oneline --left-right origin/develop...HEAD
   ```

   If the left count is zero, the branch is already only ahead of `origin/develop`; make no history change and continue with verification and publication if needed.
6. If the left count is nonzero, run `git rebase origin/develop`.
   - Resolve trivial conflicts when the intended combined result is unambiguous. Inspect the conflicting files and source commits, preserve both intents where compatible, stage the resolution, and continue the rebase.
   - If a conflict is difficult or changes behavior in a way that requires choosing between intents, leave the rebase paused and ask the user for input. Do not guess, skip commits, or discard a side.
7. After the rebase, run relevant checks for files affected by conflict resolution and always run `git diff --check`.
8. Verify the final state:

   ```bash
   git merge-base --is-ancestor origin/develop HEAD
   git rev-list --left-right --count origin/develop...HEAD
   git status --short
   ```

   The ahead/behind result must start with zero, and the working tree must be clean.
9. A sync request includes pushing the existing published task branch once the rebase and required checks succeed, unless the user explicitly requested local-only work. Push without asking for separate authorization, including after trivial conflicts resolved above. Use a normal push for fast-forward updates; for rewritten history, use `--force-with-lease=<remote-ref>:<recorded-sha>` against the recorded remote head. If a conflict requires user input, a check fails or cannot run, or the lease is rejected, stop and report the problem. Never bypass the lease or refresh it merely to overwrite concurrent remote work. An unpublished branch stays local unless publication was requested.
10. Verify the remote branch points to local HEAD after pushing. Report the rebase, conflict resolutions, checks, rewritten commit hashes, and push status.

Creating commits, opening a pull request, or creating another worktree remains outside this workflow unless the user requests that action.
