@AGENTS.md

## Claude Code

- Subagents in `.claude/agents/` research and propose; you implement. Read the plan file a subagent writes before you act on it.
- For multi-phase features or subagent work, `.claude/sessions/context_session_{feature_name}.md` is the shared plan. Read it and `.claude/doc/{feature_name}/` before starting, pass its path to subagents, and update it after each phase.
