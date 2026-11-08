// ABOUTME: Verifies the imported project skills are discoverable in Codex and Claude Code.
// ABOUTME: Checks that bundled Markdown references resolve in a fresh checkout.
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const IMPORTED_SKILLS = [
  'code-review',
  'codebase-design',
  'demo-video',
  'diagnosing-bugs',
  'handoff',
  'implement',
  'improve-codebase-architecture',
  'pr-to-develop',
  'show-me',
  'sync-with-develop',
  'tdd',
  'test-e2e',
  'to-spec',
  'to-tickets',
  'verify',
  'worktree-from-develop',
];

describe.each(IMPORTED_SKILLS)('project skill %s', (name) => {
  const directory = resolve('.agents/skills', name);
  const entry = join(directory, 'SKILL.md');

  it('declares its name and shares its entry point with Claude Code', () => {
    const frontmatter = readFileSync(entry, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    expect(frontmatter?.[1]).toMatch(new RegExp(`^name: ${name}$`, 'm'));
    expect(frontmatter?.[1]).toMatch(/^description: \S/m);
    expect(realpathSync(resolve('.claude/skills', name, 'SKILL.md'))).toBe(entry);
  });

  it('ships the files referenced by its Markdown instructions', () => {
    const files = readdirSync(directory, { recursive: true }).filter((file) =>
      file.endsWith('.md'),
    );

    for (const file of files) {
      const path = join(directory, file);
      const markdown = readFileSync(path, 'utf8');
      const links = markdown.matchAll(/\]\(([^\s)#]+\.[a-z]+)(?:#[^)]*)?\)/gi);

      for (const [, target] of links) {
        if (/^[a-z]+:\/\//i.test(target)) continue;
        expect(existsSync(resolve(dirname(path), target)), `${file} → ${target}`).toBe(true);
      }
    }
  });
});
