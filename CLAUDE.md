@AGENTS.md

## Claude Code

- Subagents in `.claude/agents/` research and propose; you implement. Use `shadcn-ui-architect` for shadcn/ui design, `ui-ux-analyzer` for visual review, `qa-criteria-validator` for acceptance criteria and Playwright validation, and `frontend-test-engineer` for Vitest test design. Read the plan file a subagent writes before you act on it.
- For multi-phase features or subagent work, `.claude/sessions/context_session_{feature_name}.md` is the shared plan. Read it and `.claude/doc/{feature_name}/` before starting, pass its path to subagents, and update it after each phase.
- Skills for UI and motion live in `.claude/skills/` (Emil Kowalski). Engineering process skills come from the `mattpocock-skills` plugin.
