---
title: 'Content Collections'
description: 'Astro Content Collections setup with Zod schemas, querying patterns, and MDX support'
category: 'features'
subcategory: 'content'
tags: ['content-collections', 'zod', 'mdx', 'astro', 'schema', 'projects']
related: ['../i18n/i18n-content-guide.md', '../guides/project-schema-guide.md', 'seo.md']
audience: ['developers', 'llm-agents']
complexity: 'intermediate'
version: '1.0.0'
lastUpdated: '2026-02-09'
---

# Content Collections

## Overview

Content Collections provide type-safe access to MDX/Markdown content. Schemas are defined in `src/content.config.ts` using Zod, and Astro generates TypeScript types from them automatically.

---

## Collections

Four collections are defined:

| Collection | Path                            | Format | Purpose                   |
| ---------- | ------------------------------- | ------ | ------------------------- |
| `projects` | `src/content/projects/{es,en}/` | MDX    | Portfolio projects        |
| `posts`    | `src/content/posts/`            | MDX    | Blog posts                |
| `talks`    | `src/content/talks/`            | MDX    | Conference talks          |
| `oss`      | `src/content/oss/`              | MDX    | Open source contributions |

---

## Schemas (`src/content.config.ts`)

### Projects Schema

The most detailed collection with i18n support:

```typescript
projects: defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string(),
    updated: z.string().optional(),
    tags: z.array(z.string()).default([]),
    tech: z.array(z.string()).default([]),
    role: z.string().optional(),

    // i18n
    lang: z.enum(['es', 'en']).default('es'),
    translationKey: z.string().optional(),

    // Classification
    type: z
      .enum(['web', 'mobile', 'iot', 'ai', 'data', 'api', 'desktop', 'other'])
      .default('other'),
    status: z.enum(['completed', 'in-progress', 'archived', 'maintained']).default('completed'),
    duration: z.string().optional(),
    featured: z.boolean().default(false),
    priority: z.number().min(0).max(10).default(5),
    context: z.enum(['personal', 'company', 'research', 'academic']).optional(),

    // External
    links: z
      .object({
        demo: z.string().url().optional(),
        repo: z.string().url().optional(),
        external: z.string().url().optional(),
      })
      .partial(),
    cover: z.object({ src: z.string(), alt: z.string() }).partial(),
    gallery: z.array(z.object({ src: z.string(), alt: z.string() })).optional(),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
      })
      .partial(),
  }),
});
```

### Posts Schema

```typescript
posts: defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    date: z.string(),
    updated: z.string().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.object({ src: z.string(), alt: z.string() }).partial(),
  }),
});
```

### Talks Schema

```typescript
talks: defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    event: z.string(),
    date: z.string(),
    location: z.string().optional(),
    slides: z.string().url().optional(),
    video: z.string().url().optional(),
    abstract: z.string().optional(),
  }),
});
```

### OSS Schema

```typescript
oss: defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    repo: z.string().url(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});
```

---

## Querying Content

### Basic Query

```typescript
import { getCollection } from 'astro:content';

const allProjects = await getCollection('projects');
```

### Filter by Language

```typescript
// Direct filter
const esProjects = await getCollection('projects', ({ data }) => data.lang === 'es');

// Using helper
import { getProjectsByLang } from '@/lib/i18n-content';
const esProjects = await getProjectsByLang('es');
```

### Filter by Featured

```typescript
const featured = await getCollection(
  'projects',
  ({ data }) => data.featured === true && data.lang === 'es',
);
```

### Sort by Priority

```typescript
const sorted = projects.sort((a, b) => b.data.priority - a.data.priority);
```

### Get Single Entry

```typescript
import { getEntry } from 'astro:content';

const project = await getEntry('projects', 'es/cookobot');
```

---

## MDX Support

Content files use `.mdx` format, allowing JSX components inside Markdown:

```mdx
---
title: 'My Project'
lang: 'es'
---

# Project Title

Regular markdown content here.

import { Button } from '@/components/ui/button';

<Button>Interactive element</Button>
```

The `@astrojs/mdx` integration is configured in `astro.config.mjs`.

---

## Content Directory Structure

```
src/content/
├── projects/
│   ├── es/              # Spanish projects
│   │   ├── cookobot.mdx
│   │   └── ...
│   └── en/              # English projects
│       ├── cookobot.mdx
│       └── ...
├── posts/               # Blog posts (future)
├── talks/               # Conference talks (future)
└── oss/                 # Open source (future)
```

### Frontmatter Example (Project)

```yaml
---
title: 'CookoBot'
summary: 'AI-powered cooking assistant'
date: '2024-06-15'
lang: 'es'
translationKey: 'cookobot'
type: 'ai'
status: 'completed'
featured: true
priority: 8
context: 'personal'
tech: ['Python', 'LangChain', 'React']
tags: ['ai', 'chatbot', 'nlp']
links:
  demo: 'https://cookobot.example.com'
  repo: 'https://github.com/user/cookobot'
cover:
  src: '/images/cookobot.webp'
  alt: 'CookoBot interface'
---
```

---

## Type Generation

Astro auto-generates TypeScript types from schemas. After running `pnpm run dev` or `pnpm run build`, types are available at `.astro/types.d.ts`.

```typescript
import type { CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;
// project.data is fully typed with all schema fields
```

---

## Related Documentation

- [Project Schema Guide](../guides/project-schema-guide.md) - Complete frontmatter reference
- [i18n Content Guide](../i18n/i18n-content-guide.md) - Bilingual content patterns
- [SEO](./seo.md) - SEO metadata in content
