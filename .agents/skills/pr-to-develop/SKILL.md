---
name: pr-to-develop
description: Prepare the current task branch and publish a GitHub pull request to develop. Use when the user asks to commit remaining work, synchronize with remote develop, push, and create or update a concise PR; do not use for sync-only requests.
---

# PR To Develop

Leave the branch as a clean, reviewable sequence that is based only on the latest `origin/develop`, then create or update its pull request.

## Inspect Before Mutating

1. Read the repository's Git instructions, branch conventions, required checks and changelog policy.
2. Confirm the current worktree and branch are the intended task and that the branch name follows the repository's conventions. Refuse to publish directly from protected or integration branches such as `main`, `develop`, or `beta`; ask before renaming a nonconforming task branch.
3. Before changing commits or rebasing, check whether the exact current branch already has an open pull request. Prefer an installed and authenticated `gh` CLI, then an available GitHub MCP tool. Record its URL, base, head, and status. An existing pull request means the branch is already published: plan to update it instead of creating a duplicate and treat optional history rewrites with extra care. If neither tool can query GitHub, state that the pull-request status could not be verified; do not infer that no pull request exists.
4. Fetch `origin/develop` so every comparison uses the latest remote state.
5. Inspect all staged, unstaged, and untracked changes, plus the commits and complete diff against the merge-base with `origin/develop`. Do not include unrelated files or assume every dirty file belongs to the task. Record ahead/behind with:

   ```bash
   git rev-list --left-right --count origin/develop...HEAD
   ```

## Produce a Reviewable Commit Sequence

- If work remains uncommitted, decide how to group it by logical purpose. A small cohesive change should be one commit. Independent behavior, migration, documentation, or test-only changes may deserve separate commits when that makes review clearer. Explain the chosen grouping briefly, then stage exact paths for each commit; never use a blanket add when unrelated changes may exist.
- Run checks appropriate to each group before committing when practical. Use the repository's Conventional Commit format and never add AI or tool attribution.
- If everything is already committed, inspect every commit in `origin/develop..HEAD`. Validate its message against the repository's Conventional Commit rules. Reword a nonconforming commit only when it is local and unshared. An existing pull request makes the branch shared, so ask before optional rewrites such as rewording or squashing; a required rebase onto `origin/develop` is handled below and must later use `--force-with-lease` if the branch was already pushed.
- Do not manufacture an empty commit merely to follow a sequence.

## Rebase Onto Remote Develop

After all intended work is committed, fetch again if necessary and inspect ahead/behind. If the branch is behind or diverged, run `git rebase origin/develop`.

- Resolve trivial conflicts directly when both intents are clear, such as additive changelog entries or non-overlapping documentation edits. Inspect the source commits before resolving and preserve both intents where compatible.
- For a difficult or behaviorally ambiguous conflict, stop at the conflict, explain the competing intents, and ask the user for direction. Do not guess, skip the commit, or discard either side.
- Continue until every branch commit is rebased. Then rerun the relevant tests, lint, formatting, type checks, and `git diff --check` in proportion to the change.

Verify both of these before publishing:

```bash
git merge-base --is-ancestor origin/develop HEAD
git rev-list --left-right --count origin/develop...HEAD
```

The second command must report zero commits on the `origin/develop` side. Review `git log origin/develop..HEAD` and `git diff origin/develop...HEAD` one final time.

## Prepare The PR Body

Use three short sections for the PR body: Summary, Evidence and Merge Risk. Describe the change, how it was verified and anything a reviewer needs to know before merging.

- Link the originating issues when available and explain the concrete problem and resulting behavior.
- Report local and development-environment validation actually performed, including failures, checks not run, and any remaining validation. Separate planned validation from completed checks.
- Include screenshots or recordings when they help verify a UI change, and deployment considerations in Merge Risk when relevant.

## Push And Open The PR

1. Re-check for an open pull request immediately before creating one in case it appeared during preparation. Update the pull request found earlier or this newly discovered one; never create a duplicate.
2. Push with ordinary Git. Use `git push -u origin <branch>` for a new branch. If a rebase rewrote an already-pushed task branch, use `git push --force-with-lease`, never plain `--force`.
3. Prefer an installed and authenticated `gh` CLI for GitHub PR operations. If `gh` is unavailable, use an available GitHub MCP tool that can inspect and create pull requests. If neither is available, finish the Git push, provide the GitHub compare URL or exact base/head pair, and state clearly that the PR itself could not be opened automatically.
4. Target `develop`. Use a concise descriptive title consistent with repository conventions and the body prepared above.
5. Verify the resulting PR's URL, base, head, commit list, changed files, and mergeability. Do not report success until the remote PR exists and targets `develop`.
