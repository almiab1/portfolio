// ABOUTME: Verifies which project material reaches the assistant's generated evidence file.
// ABOUTME: Builds from temporary MDX fixtures to exercise filtering before serialization.
// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildCatalog } from '../../scripts/build-assistant-catalog.mjs';
const PUBLIC_EMAIL = 'miraabad.alejandro@gmail.com';

let fixtureRoot: string;

function fixture(path: string, contents: string) {
  writeFileSync(join(fixtureRoot, path), contents);
}

function project(folder: 'es' | 'en', name: string, metadata = '', body = '', lang = folder) {
  fixture(`src/content/projects/${folder}/${name}.mdx`, `---
title: ${name}
lang: ${lang}
translationKey: ${name}
${metadata}
---
${body}
`);
}

async function buildEvidence() {
  return JSON.stringify(await buildCatalog(pathToFileURL(fixtureRoot + '/')));
}

describe('assistant catalog privacy', () => {
  beforeEach(() => {
    fixtureRoot = mkdtempSync(join(tmpdir(), 'assistant-catalog-'));
    for (const path of ['src/content/projects/es', 'src/content/projects/en', 'src/i18n', 'src/data']) {
      mkdirSync(join(fixtureRoot, path), { recursive: true });
    }
    fixture('src/i18n/profile-content.json', '{"es":{},"en":{}}');
    fixture('src/i18n/assistant-replies.json', '{"es":{},"en":{}}');
    fixture('src/data/portfolio-jobs.json', '[]');
  });

  afterEach(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it('omits unpublished and misplaced projects before validating translation parity', async () => {
    project('en', 'draft-only', 'draft: true', 'DRAFT BODY');
    project('es', 'private-only', 'private: true', 'PRIVATE BODY');
    project('en', 'restricted-only', 'visibility: internal', 'RESTRICTED BODY');
    project('es', 'unpublished-only', 'published: false', 'UNPUBLISHED BODY');
    project('es', 'hidden-only', 'status: draft', 'HIDDEN BODY');
    project('en', 'misplaced-only', '', 'MISPLACED BODY', 'es');
    project('es', 'published-pair', 'visibility: public', 'Caso público');
    project('en', 'published-pair', '', 'Public case');

    const result = await buildEvidence();
    expect(result).not.toMatch(/(draft|private|restricted|unpublished|hidden|misplaced)-only/);
    expect(result).not.toMatch(/(?:DRAFT|PRIVATE|RESTRICTED|UNPUBLISHED|HIDDEN|MISPLACED) BODY/);
    expect(result).toContain('Caso público');
    expect(result).toContain('Public case');
  });

  it('removes credential-shaped text, non-public emails and hidden comments from serialized evidence', async () => {
    const summaryToken = 'nvapi-fixture1234567890';
    const tagToken = 'ghp_fixture1234567890';
    const bodyToken = 'fixture1234567890password';
    const techToken = 'sk-proj-fixture1234567890';
    const headerToken = 'xoxb-fixture1234567890';
    const privateEmail = 'private@example.com';
    project('es', 'published-pair', '', 'Caso público');
    project('en', 'published-pair', [
      `summary: "A public project. NVIDIA_API_KEY=${summaryToken}"`,
      `tags: ["Python", "${tagToken}", "${privateEmail}"]`,
      `tech: ["React", "${techToken}"]`,
    ].join('\n'), [
      `Public email: ${PUBLIC_EMAIL}. Private email: ${privateEmail}.`,
      '<!-- HIDDEN HTML COMMENT -->',
      '{/* HIDDEN MDX COMMENT */}',
      `### Alternate heading ${headerToken}`,
      `Public body. password: "${bodyToken}"`,
      '-----BEGIN PRIVATE KEY-----',
      'FIXTURE_PRIVATE_KEY_PAYLOAD',
      '-----END PRIVATE KEY-----',
    ].join('\n'));

    const result = await buildEvidence();
    for (const excluded of [
      summaryToken, tagToken, bodyToken, techToken, headerToken, privateEmail,
      'FIXTURE_PRIVATE_KEY_PAYLOAD', 'HIDDEN HTML COMMENT', 'HIDDEN MDX COMMENT',
    ]) {
      expect(result).not.toContain(excluded);
    }
    for (const included of ['Python', 'React', 'A public project.', 'Public body.', PUBLIC_EMAIL]) {
      expect(result).toContain(included);
    }
    expect(result).toContain('section-alternate-heading-redacted');
  });
});
