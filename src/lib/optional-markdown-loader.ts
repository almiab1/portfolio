// ABOUTME: Loads optional Markdown collections when they have published entries.
// ABOUTME: Keeps Astro's file watcher active when the first entry is added in development.
import { globSync } from 'node:fs';
import { glob, type Loader } from 'astro/loaders';

export function optionalMarkdownLoader(base: string): Loader {
  const pattern = '**/*.{md,mdx}';
  const loader = glob({ base, pattern });
  return {
    ...loader,
    async load(context) {
      if (
        !context.watcher &&
        !globSync(pattern, { cwd: new URL(base, context.config.root) }).length
      ) {
        context.store.clear();
        return;
      }
      await loader.load(context);
    },
  };
}
