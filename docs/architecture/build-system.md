---
title: 'Build System'
description: 'Complete guide to Astro build process, Vite integration, and production optimization'
category: 'architecture'
subcategory: 'infrastructure'
tags: ['build', 'vite', 'astro', 'tailwind', 'deployment', 'optimization']
related: ['tech-stack.md', 'deployment.md', '../guides/getting-started.md']
audience: ['developers', 'llm-agents']
complexity: 'intermediate'
version: '1.0.0'
lastUpdated: '2026-02-02'
---

# Build System

## Overview

**Framework**: Astro 5.13.7
**Build Tool**: Vite (integrated)
**Output**: Static Site Generation (SSG)
**Styling**: Tailwind CSS 4 via `@tailwindcss/vite` plugin

This document covers the complete build system for the portfolio, from development server to production deployment.

---

## Development Build

### Dev Server

```bash
pnpm run dev
```

- **Port**: 4321 (default)
- **Features**: Hot Module Replacement (HMR), TypeScript checking, Tailwind JIT compilation
- **URL**: http://localhost:4321

### Build Process Flow

1. **Astro reads** `astro.config.mjs` configuration
2. **Vite processes** files with Tailwind CSS plugin
3. **Content Collections** validated via Zod schemas in `content.config.ts`
4. **React components** hydrated using Astro Island architecture
5. **i18n routing** applied (Spanish default, `/en` prefix for English)

### Development Features

- **HMR (Hot Module Replacement)**: Instant updates without full page reload
- **TypeScript Checking**: Real-time type errors in terminal
- **Tailwind JIT**: Just-in-Time compilation of CSS classes
- **Content Hot Reload**: MDX and content collection changes update instantly

---

## Production Build

### Build Command

```bash
pnpm run build
```

**Output Directory**: `dist/`
**Process**: Static pre-rendering of all routes

### Build Steps

1. **TypeScript Compilation**: All `.ts`/`.tsx`/`.astro` files compiled
2. **Content Collections Type Generation**: Zod schemas generate TypeScript types
3. **MDX Compilation**: Markdown with JSX processed into components
4. **Asset Optimization**: Images, CSS, and JavaScript minified
5. **Sitemap Generation**: XML sitemaps created for all routes
6. **i18n Route Generation**: All language variants generated (`/`, `/en`, `/work`, `/en/work`, etc.)

### Build Artifacts

```
dist/
├── _astro/           # Optimized assets with content hashes
│   ├── *.css        # Minified stylesheets
│   ├── *.js         # Minified JavaScript bundles
│   └── *.webp       # Optimized images
├── index.html        # Spanish homepage
├── en/
│   └── index.html    # English homepage
├── work/
│   └── index.html    # Spanish projects page
├── en/work/
│   └── index.html    # English projects page
└── sitemap-*.xml     # Generated sitemaps
```

### Preview Production Build

```bash
pnpm run build
pnpm run preview
```

- **Purpose**: Test production build locally before deployment
- **Port**: 4321
- **Important**: Runs actual production assets, not dev server

---

## Critical Configurations

### astro.config.mjs

Key configuration points:

```javascript
export default defineConfig({
  site: 'https://alejandromira.com', // Required for sitemap/SEO
  vite: {
    plugins: [tailwindcss()], // Tailwind CSS 4 integration
  },
  integrations: [react(), mdx(), sitemap()],
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false, // Spanish has no /es prefix
      redirectToDefaultLocale: false,
    },
    fallback: { en: 'es' }, // English falls back to Spanish
  },
});
```

**Critical**:

- `site`: Must match production domain for proper sitemap URLs
- `prefixDefaultLocale: false`: Spanish routes have no `/es` prefix
- Tailwind v4 uses Vite plugin, **not** traditional PostCSS

### Tailwind CSS 4 Integration

**Important**: Tailwind CSS 4 uses a different integration method:

- **Via**: `@tailwindcss/vite` plugin (added to `vite.plugins`)
- **No `tailwind.config.js` needed**: Configuration is CSS-based
- **Styles**: Defined in `src/styles/global.css`

```css
/* src/styles/global.css */
@import 'tailwindcss';

@theme {
  --color-primary: #3b82f6;
  /* Theme configuration here */
}
```

---

## Environment Requirements

- **Node Version**: v22 (enforced via `.nvmrc`)
- **Package Manager**: pnpm
- **TypeScript**: Strict mode enabled (`tsconfig.json`)

```bash
# Switch to correct Node version
nvm use

# Verify version
node --version  # Should show v22.x.x
```

---

## Common Issues

### Issue: Tailwind Classes Not Working

**Symptoms**: Tailwind classes don't apply styling
**Causes**:

- Tailwind Vite plugin not in `astro.config.mjs`
- Missing `@import "tailwindcss"` in `src/styles/global.css`
- Conflicting `tailwind.config.js` file (v4 doesn't use it)

**Solution**:

1. Verify `@tailwindcss/vite` in `astro.config.mjs` vite plugins
2. Check `global.css` imports Tailwind directives
3. Remove any `tailwind.config.js` file

### Issue: Content Collections Errors

**Symptoms**: "Collection not found" or Zod validation errors
**Causes**:

- Types not generated
- Frontmatter doesn't match Zod schema in `content.config.ts`

**Solution**:

```bash
# Regenerate types
pnpm run dev

# Check types generated
ls -la .astro/types.d.ts

# Validate frontmatter matches schema in content.config.ts
```

### Issue: i18n Routes Missing

**Symptoms**: `/en` routes return 404
**Causes**:

- Content missing `lang` field in frontmatter
- Content files not in correct language folders

**Solution**:

1. Verify `lang: "es"` or `lang: "en"` in all content frontmatter
2. Check files in `src/content/projects/es/` and `src/content/projects/en/`
3. Verify `i18n` config in `astro.config.mjs`

### Issue: Build Fails with Module Not Found

**Symptoms**: Build fails with "Cannot find module '@/...'"
**Causes**:

- Path alias misconfiguration
- Missing TypeScript paths

**Solution**:

1. Check `tsconfig.json` has path aliases defined:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  }
}
```

2. Restart TypeScript server if in IDE

---

## Build Performance

**Typical build times**:

- Development server start: ~2-3 seconds
- Production build: ~10-20 seconds (depends on content volume)
- Preview server start: ~1 second

**Optimization tips**:

- Content Collections are cached after first build
- Vite caches dependencies in `node_modules/.vite`
- Images are optimized during build (use Astro's `<Image>` component)

---

## Related Documentation

- [Tech Stack](./tech-stack.md) - Full technology overview
- [Deployment Guide](../guides/deployment.md) - Production deployment
- [Getting Started](../guides/getting-started.md) - Initial setup
