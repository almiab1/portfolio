// ABOUTME: Verifies optional collection loading across empty and populated builds.
// ABOUTME: Checks that Astro still installs its development watcher for empty collections.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { LoaderContext } from 'astro/loaders';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { optionalMarkdownLoader } from './optional-markdown-loader';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('astro/loaders', () => ({ glob: () => ({ name: 'glob-loader', load }) }));

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'optional-collection-'));
  load.mockClear();
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function context(watching = false) {
  return {
    config: { root: pathToFileURL(root + '/') },
    store: { clear: vi.fn() },
    watcher: watching ? {} : undefined,
  } as unknown as LoaderContext;
}

it('clears stale entries in builds with missing or empty collections', async () => {
  const loader = optionalMarkdownLoader('./posts');
  const build = context();
  await loader.load(build);
  mkdirSync(join(root, 'posts'));
  await loader.load(build);
  expect(build.store.clear).toHaveBeenCalledTimes(2);
  expect(load).not.toHaveBeenCalled();
});

it.each(['md', 'mdx'])('loads the first nested .%s entry with Astro', async (extension) => {
  mkdirSync(join(root, 'posts', 'en'), { recursive: true });
  writeFileSync(join(root, 'posts', 'en', 'first.' + extension), '# Hello');
  const build = context();
  await optionalMarkdownLoader('./posts').load(build);
  expect(load).toHaveBeenCalledWith(build);
});

it('lets Astro watch for the first entry in development', async () => {
  const development = context(true);
  await optionalMarkdownLoader('./posts').load(development);
  expect(load).toHaveBeenCalledWith(development);
});
