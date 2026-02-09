---
title: 'SEO'
description: 'SEO implementation including JSON-LD schemas, hreflang tags, sitemap, Open Graph, and meta tags'
category: 'features'
subcategory: 'seo'
tags: ['seo', 'json-ld', 'hreflang', 'sitemap', 'open-graph', 'meta-tags']
related: ['../i18n/i18n-implementation.md', 'content-collections.md']
audience: ['developers', 'llm-agents']
complexity: 'intermediate'
version: '1.0.0'
lastUpdated: '2026-02-09'
---

# SEO

## Overview

The portfolio implements SEO through five mechanisms: JSON-LD structured data, hreflang tags for bilingual content, auto-generated sitemaps, Open Graph meta tags, and canonical URLs.

---

## JSON-LD Schemas (`src/lib/schema.ts`)

Five schema generators for structured data:

| Function            | Schema Type    | Purpose             |
| ------------------- | -------------- | ------------------- |
| `ldPerson()`        | `Person`       | Site owner identity |
| `ldWebsite()`       | `WebSite`      | Site metadata       |
| `ldCreativeWork(p)` | `CreativeWork` | Projects            |
| `ldBlogPosting(p)`  | `BlogPosting`  | Blog posts          |
| `ldEvent(p)`        | `Event`        | Talks/conferences   |

### Usage

```astro
---
import { ldPerson, ldWebsite } from '@/lib/schema';
---

<script type="application/ld+json" set:html={JSON.stringify(ldPerson())} />
<script type="application/ld+json" set:html={JSON.stringify(ldWebsite())} />
```

### For Projects

```astro
---
import { ldCreativeWork } from '@/lib/schema';
const schema = ldCreativeWork({
  title: project.data.title,
  date: project.data.date,
});
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

---

## hreflang Tags

Automatically generated in `BaseLayout.astro` for every page:

```html
<link rel="alternate" hreflang="es" href="https://alejandromira.com/{path}" />
<link rel="alternate" hreflang="en" href="https://alejandromira.com/en/{path}" />
<link rel="alternate" hreflang="x-default" href="https://alejandromira.com/{path}" />
```

- `x-default` always points to the Spanish (default) version
- URLs are computed by stripping the language prefix and regenerating with `getRelativeLocaleUrl()`

---

## Sitemap

Generated automatically by `@astrojs/sitemap` (configured in `astro.config.mjs`).

**Requirements**:

- `site` must be set in `astro.config.mjs`: `site: "https://alejandromira.com"`
- Output: `dist/sitemap-*.xml` during build

All static routes including both language variants are included automatically.

---

## Meta Tags

### BaseLayout.astro

Every page receives:

```html
<title>{title}</title>
<meta name="description" content="{description}" />
<link rel="canonical" href="{canonicalUrl}" />
```

- `title` and `description` are passed as props, with defaults
- Canonical URL matches the current language variant

### Open Graph

```html
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:url" content="{canonicalUrl}" />
<meta property="og:locale" content="es_ES" />
<!-- or en_US -->
<meta property="og:locale:alternate" content="en_US" />
<!-- or es_ES -->
```

Locale is set based on `currentLang`, with the alternate pointing to the other language.

---

## Per-Content SEO

Projects can override SEO metadata via the `seo` frontmatter field:

```yaml
---
title: 'CookoBot'
seo:
  title: 'CookoBot - AI Cooking Assistant'
  description: 'Custom meta description for search engines'
---
```

When present, `seo.title` and `seo.description` should be used instead of the default `title` and `summary`.

---

## Canonical URLs

Each page computes its canonical URL:

```typescript
const canonicalUrl = currentLang === 'es' ? esUrl : enUrl;
```

- Spanish pages: `https://alejandromira.com/{path}`
- English pages: `https://alejandromira.com/en/{path}`

---

## Related Documentation

- [i18n Implementation](../i18n/i18n-implementation.md) - hreflang generation details
- [Content Collections](./content-collections.md) - SEO fields in schemas
