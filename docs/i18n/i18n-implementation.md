---
title: "i18n Implementation"
description: "Technical implementation details of the Astro i18n system including routing, translation loading, and content filtering"
category: "i18n"
subcategory: "implementation"
tags: ["i18n", "routing", "translations", "astro", "react", "content-filtering"]
related: ["i18n-overview.md", "i18n-content-guide.md", "i18n-api-reference.md"]
audience: ["developers", "llm-agents"]
complexity: "intermediate"
version: "1.0.0"
lastUpdated: "2026-02-09"
---

# i18n Implementation

## Overview

The portfolio supports two languages: **Spanish (es)** as default and **English (en)**. The implementation spans four layers: Astro routing config, translation dictionaries, helper functions, and content collection filtering.

---

## Routing

### Configuration (`astro.config.mjs`)

```javascript
i18n: {
  locales: ["es", "en"],
  defaultLocale: "es",
  routing: {
    prefixDefaultLocale: false,   // Spanish: / (no prefix)
    redirectToDefaultLocale: false,
  },
  fallback: { en: "es" }         // English falls back to Spanish
}
```

### URL Structure

| Route | Spanish (default) | English |
|-------|-------------------|---------|
| Home | `/` | `/en` |
| Projects | `/work` | `/en/work` |
| Project detail | `/work/[slug]` | `/en/work/[slug]` |

**Key rule**: Spanish routes never have a `/es` prefix. English routes always have `/en`.

### Language Detection

```typescript
// src/i18n/utils.ts
export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Language;
  return defaultLang; // 'es'
}
```

Parses the first URL segment. If it matches a known language key (`es` or `en`), returns it. Otherwise defaults to `es`.

---

## Translation Dictionary

### Structure (`src/i18n/ui.ts`)

Single file with all UI strings organized by namespace:

```typescript
export const ui = {
  es: {
    'nav.home': 'Inicio',
    'hero.title': 'Ingeniero de',
    'contact.cta': '¿Tienes un proyecto en mente? ¡Hablemos!',
    // ...
  },
  en: {
    'nav.home': 'Home',
    'hero.title': 'Artificial Intelligence',
    'contact.cta': 'Have a project in mind? Let\'s talk!',
    // ...
  },
} as const;
```

**Namespaces**: `nav.*`, `home.*`, `site.*`, `work.*`, `hero.*`, `contact.*`, `common.*`, `date.*`, `project.*`

### Fallback Behavior

Both `useTranslations` and `t()` fall back to Spanish if a key is missing in English:

```typescript
return ui[lang][key] || ui[defaultLang][key];
```

---

## Translation Helpers

### Astro Components (`src/i18n/utils.ts`)

```typescript
import { useTranslations } from "@/i18n/utils";

const lang = Astro.currentLocale || "es";
const t = useTranslations(lang);
// Usage: t("nav.home") → "Inicio" or "Home"
```

**Exports**: `getLangFromUrl()`, `useTranslations()`, `getLocalizedUrl()`, `languages`, `defaultLang`

### React Components (`src/i18n/translations.ts`)

```typescript
import { t, type Language } from "@/i18n/translations";

function MyComponent({ currentLocale = "es" }: Props) {
  const translate = t(currentLocale as Language);
  return <span>{translate("hero.title")}</span>;
}
```

**Exports**: `t()`, `getTranslation()`, `translations`, `Language`, `TranslationKey`

### URL Localization

```typescript
import { getLocalizedUrl } from "@/i18n/utils";

// Generate localized URL
getLocalizedUrl("/work", "en"); // → "/en/work"
getLocalizedUrl("/work", "es"); // → "/work"
```

Uses Astro's built-in `getRelativeLocaleUrl()` internally.

---

## Content Filtering by Language

### Implementation (`src/lib/i18n-content.ts`)

Content collections use a `lang` field in frontmatter for filtering:

```typescript
import { getProjectsByLang } from "@/lib/i18n-content";

// Get all Spanish projects
const projects = await getProjectsByLang("es");
```

### Translation Linking

Projects across languages are linked via `translationKey`:

```typescript
// Spanish: src/content/projects/es/cookobot.mdx
// lang: "es", translationKey: "cookobot"

// English: src/content/projects/en/cookobot.mdx
// lang: "en", translationKey: "cookobot"
```

The `getProjectWithTranslation()` function finds the counterpart:

```typescript
const { project, translation } = await getProjectWithTranslation(slug, "es");
// translation contains the English version if it exists
```

### Content Directory Structure

```
src/content/projects/
├── es/          # Spanish projects
│   ├── cookobot.mdx
│   └── ...
└── en/          # English projects
    ├── cookobot.mdx
    └── ...
```

---

## hreflang Implementation

### BaseLayout.astro

Automatically generates `<link rel="alternate">` tags for all pages:

```html
<link rel="alternate" hreflang="es" href="https://alejandromira.com/..." />
<link rel="alternate" hreflang="en" href="https://alejandromira.com/en/..." />
<link rel="alternate" hreflang="x-default" href="https://alejandromira.com/..." />
```

The `x-default` always points to the Spanish version (default locale).

### Canonical URL

Each page sets a canonical URL matching the current language:

```html
<link rel="canonical" href="{currentLang === 'es' ? esUrl : enUrl}" />
```

---

## Adding a New Translation Key

1. Add the key to both language objects in `src/i18n/ui.ts`
2. Use the appropriate namespace prefix (e.g., `nav.`, `hero.`, `project.`)
3. Access via `useTranslations()` in Astro or `t()` in React

```typescript
// 1. Add to ui.ts
es: { 'footer.copyright': 'Derechos reservados' },
en: { 'footer.copyright': 'All rights reserved' },

// 2. Use in Astro
const t = useTranslations(lang);
t("footer.copyright");

// 3. Use in React
const translate = t(currentLocale);
translate("footer.copyright");
```

---

## Related Documentation

- [i18n Overview](./i18n-overview.md) - High-level i18n architecture
- [i18n Content Guide](./i18n-content-guide.md) - Creating bilingual content
- [i18n API Reference](./i18n-api-reference.md) - Function signatures and types
- [Content Collections](../features/content-collections.md) - Schema and querying
