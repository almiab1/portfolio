---
name: worktree-from-develop
description: Create a Portfolio worktree and task branch from the latest origin/develop using Worktrunk. Use when the user wants to start isolated work.
---

# Worktree From Develop

1. Read [the repository instructions](../../../AGENTS.md). Inspect the primary checkout for uncommitted changes and ask how to handle them if present. Use the branch prefix required by the host and repository.
2. Locate `wt` on `PATH` or in the user's configured binary directory. If it is unavailable, report the missing prerequisite.
3. Run `git fetch origin develop` and pin `origin/develop`. If the configured transport fails, verify the same repository through an available authorized transport before relying on the ref.
4. Use `wt list` and inspect local and remote branch names for a collision. Preserve existing branches and worktrees.
5. Run `wt switch --create <branch> --base origin/develop`. Follow Worktrunk's configured hook approval behavior. In WSL, use the configured worktree path from `AGENTS.md`.
6. Resolve the absolute worktree path from Worktrunk output or `wt list`. Check the branch, pinned commit, and clean status from that path. Use it as the working directory for subsequent commands.
