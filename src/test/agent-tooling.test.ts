// ABOUTME: Checks that the installed design skills can be loaded by both coding agents.
// ABOUTME: Detects broken skill links and missing resources in a project checkout.
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import skillLock from '../../skills-lock.json';

const ROOT = resolve(import.meta.dirname, '../..');
const SKILLS = resolve(ROOT, '.agents/skills');

describe('project design skills', () => {
  it.each(Object.keys(skillLock.skills))('shares %s with Claude Code', (name) => {
    const codexEntry = resolve(SKILLS, name, 'SKILL.md');
    const claudeEntry = resolve(ROOT, '.claude/skills', name, 'SKILL.md');

    expect(realpathSync(claudeEntry)).toBe(realpathSync(codexEntry));
  });

  it('ships the Taste Skill starter and browser checker', () => {
    const taste = resolve(SKILLS, 'design-taste-frontend');

    expect(existsSync(resolve(taste, 'assets/starter.html'))).toBe(true);
    expect(existsSync(resolve(taste, 'scripts/consistency.mjs'))).toBe(true);
  });
});
