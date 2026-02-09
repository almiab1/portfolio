---
title: 'Deployment'
description: 'Production deployment guide for Vercel, build optimization, and post-deployment verification'
category: 'guides'
subcategory: 'deployment'
tags: ['deployment', 'vercel', 'production', 'build', 'optimization']
related: ['../architecture/build-system.md', 'getting-started.md', '../features/seo.md']
audience: ['developers', 'llm-agents']
complexity: 'intermediate'
version: '1.0.0'
lastUpdated: '2026-02-09'
---

# Deployment

## Overview

The portfolio is a static site (SSG) built with Astro and deployed to **Vercel**. All pages are pre-rendered at build time.

---

## Pre-Deployment Checklist

```bash
# 1. Verify build succeeds
pnpm run build

# 2. Preview production output
pnpm run preview

# 3. Check code quality
pnpm run lint
pnpm run format
```

Verify in the preview:

- Both language variants render (`/` and `/en`)
- Project pages load correctly
- No console errors

---

## Vercel Deployment

### Automatic Deployment

Vercel auto-detects Astro projects. Pushing to the main branch triggers a build.

**Build settings** (auto-detected):

- Framework Preset: Astro
- Build Command: `pnpm run build`
- Output Directory: `dist`
- Install Command: `pnpm install`

### Manual Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

If needed, set in Vercel Dashboard > Settings > Environment Variables:

| Variable       | Value | Purpose                     |
| -------------- | ----- | --------------------------- |
| `NODE_VERSION` | `22`  | Ensure correct Node version |

---

## Build Output

```
dist/
├── index.html          # Spanish homepage
├── en/index.html       # English homepage
├── work/index.html     # Spanish projects
├── en/work/index.html  # English projects
├── _astro/             # Hashed static assets
├── sitemap-index.xml   # Sitemap index
└── sitemap-0.xml       # Sitemap entries
```

---

## Post-Deployment Verification

### Routes

- `https://alejandromira.com/` - Spanish home
- `https://alejandromira.com/en` - English home
- `https://alejandromira.com/work` - Spanish projects
- `https://alejandromira.com/en/work` - English projects

### SEO Checks

- View page source: verify `<link rel="alternate" hreflang="...">` tags
- Check `https://alejandromira.com/sitemap-index.xml` resolves
- Verify `<link rel="canonical">` on each page
- Verify Open Graph meta tags present

### Performance

- Run Lighthouse audit (target: 90+ on all categories)
- Verify static assets are cached (check `_astro/` hashed filenames)

---

## Alternative Platforms

### Netlify

```toml
# netlify.toml
[build]
  command = "pnpm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

### Cloudflare Pages

- Build command: `pnpm run build`
- Build output directory: `dist`
- Node.js version: 22

---

## Debugging Failed Builds

### Common Failures

**Missing dependencies**:

```
Cannot find module '...'
```

Fix: Ensure `pnpm install` runs before build.

**Content validation errors**:

```
ZodError: ...
```

Fix: Check frontmatter matches schema in `src/content.config.ts`.

**TypeScript errors**:
Fix: Run `pnpm run build` locally to reproduce and fix.

### Rollback

In Vercel Dashboard:

1. Go to Deployments
2. Find the last working deployment
3. Click "..." > "Promote to Production"

Or via git:

```bash
git revert HEAD
git push
```

---

## Related Documentation

- [Build System](../architecture/build-system.md) - Build process details
- [Getting Started](./getting-started.md) - Local setup
- [SEO](../features/seo.md) - SEO verification after deploy
