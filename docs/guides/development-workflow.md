---
title: 'Development Workflow'
description: 'Day-to-day development patterns for adding pages, content, components, and maintaining code quality'
category: 'guides'
subcategory: 'workflow'
tags: ['development', 'workflow', 'linting', 'formatting', 'git', 'content']
related:
  [
    'getting-started.md',
    'project-schema-guide.md',
    '../features/components.md',
    '../i18n/i18n-content-guide.md',
  ]
audience: ['developers', 'llm-agents']
complexity: 'beginner'
version: '1.0.0'
lastUpdated: '2026-02-09'
---

# Development Workflow

## Development Server

```bash
pnpm run dev
```

- HMR updates Astro, React, CSS, and MDX changes instantly
- Content Collection changes are hot-reloaded
- TypeScript errors appear in the terminal

---

## Adding New Pages

Create a file in `src/pages/`. Astro uses file-based routing.

**For bilingual pages**, create both variants:

```
src/pages/
├── about.astro          # Spanish: /about
└── en/
    └── about.astro      # English: /en/about
```

Page template:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { useTranslations } from '@/i18n/utils';

const lang = Astro.currentLocale || 'es';
const t = useTranslations(lang);
---

<BaseLayout title={t('page.title')}>
  <!-- Page content -->
</BaseLayout>
```

---

## Adding Bilingual Content

### New Project

1. Create Spanish file: `src/content/projects/es/my-project.mdx`
2. Create English file: `src/content/projects/en/my-project.mdx`
3. Use the same `translationKey` in both:

```yaml
# Spanish
---
title: 'Mi Proyecto'
lang: 'es'
translationKey: 'my-project'
type: 'web'
status: 'completed'
---
# English
---
title: 'My Project'
lang: 'en'
translationKey: 'my-project'
type: 'web'
status: 'completed'
---
```

See [Project Schema Guide](./project-schema-guide.md) for all frontmatter fields.

---

## Component Development

### Astro Components

For static content with translations:

```astro
---
import { useTranslations } from '@/i18n/utils';
const lang = Astro.currentLocale || 'es';
const t = useTranslations(lang);
---

<section>
  <h2>{t('section.title')}</h2>
</section>
```

### React Components

For interactive UI. Must use `client:load` or `client:visible` directive:

```astro
<MyReactComponent client:load currentLocale={lang} />
```

React components receive translations via the `t()` helper:

```tsx
import { t, type Language } from '@/i18n/translations';

export function MyComponent({ currentLocale }: { currentLocale: Language }) {
  const translate = t(currentLocale);
  return <button>{translate('common.learnMore')}</button>;
}
```

### shadcn/ui Components

Located in `src/components/ui/`. Install new ones with:

```bash
pnpm dlx shadcn@latest add <component-name>
```

---

## Code Quality

### Linting

```bash
pnpm run lint
```

Checks `.astro`, `.js`, `.jsx`, `.ts`, `.tsx` files with ESLint.

### Formatting

```bash
pnpm run format
```

Formats all files with Prettier (including `.astro` files via `prettier-plugin-astro`).

### Recommended Workflow

```bash
# Before committing
pnpm run lint
pnpm run format
```

---

## Build Verification

Before pushing, verify the production build works:

```bash
pnpm run build && pnpm run preview
```

Check:

- No build errors
- All routes render correctly
- Both language variants work
- Sitemap generated in `dist/`

---

## Git Workflow

1. Create a feature branch from `master`
2. Make changes and verify locally
3. Run `pnpm run lint` and `pnpm run format`
4. Commit with descriptive messages
5. Open a pull request

---

## Related Documentation

- [Getting Started](./getting-started.md) - Initial setup
- [Components](../features/components.md) - Component patterns
- [i18n Content Guide](../i18n/i18n-content-guide.md) - Bilingual content details
- [Build System](../architecture/build-system.md) - Build process
