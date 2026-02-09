---
title: 'Getting Started'
description: 'Quick setup guide for cloning, installing, and running the portfolio locally'
category: 'guides'
subcategory: 'setup'
tags: ['setup', 'installation', 'node', 'pnpm', 'development']
related:
  ['development-workflow.md', '../architecture/build-system.md', '../architecture/tech-stack.md']
audience: ['developers', 'llm-agents']
complexity: 'beginner'
version: '1.0.0'
lastUpdated: '2026-02-09'
---

# Getting Started

## Prerequisites

- **Node.js v22** (enforced via `.nvmrc`)
- **pnpm** package manager
- **Git**

---

## Installation

```bash
# Clone the repository
git clone https://github.com/almiab1/personalWeb.git
cd personalWeb

# Switch to correct Node version
nvm use

# Install dependencies
pnpm install
```

---

## Start Development Server

```bash
pnpm run dev
```

Opens at **http://localhost:4321**. Features HMR (Hot Module Replacement) for instant updates.

---

## Verify Setup

After starting the dev server, verify:

1. **Homepage**: http://localhost:4321 (Spanish)
2. **English**: http://localhost:4321/en
3. **Projects**: http://localhost:4321/work

---

## Project Structure

```
src/
├── components/
│   ├── blocks/       # Page sections (Hero, ProjectGrid, Contact)
│   ├── core/         # Site-wide (Header)
│   └── ui/           # shadcn/ui components
├── content/
│   └── projects/
│       ├── es/       # Spanish content (MDX)
│       └── en/       # English content (MDX)
├── i18n/
│   ├── ui.ts         # Translation dictionary
│   ├── utils.ts      # Astro translation helpers
│   └── translations.ts  # React translation helpers
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── i18n-content.ts   # Content filtering by language
│   └── schema.ts         # JSON-LD schemas
├── pages/            # File-based routing
└── styles/
    └── global.css    # Tailwind CSS 4 entry point
```

### Path Aliases

| Alias           | Maps to              |
| --------------- | -------------------- |
| `@/*`           | `./src/*`            |
| `@components/*` | `./src/components/*` |
| `@layouts/*`    | `./src/layouts/*`    |
| `@lib/*`        | `./src/lib/*`        |

---

## Available Commands

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm run dev`     | Start dev server (port 4321)    |
| `pnpm run build`   | Build for production to `dist/` |
| `pnpm run preview` | Preview production build        |
| `pnpm run lint`    | ESLint check                    |
| `pnpm run format`  | Prettier formatting             |

---

## Common Issues

### Wrong Node Version

```
error: The engine "node" is incompatible...
```

**Fix**: Run `nvm use` to switch to v22.

### Missing Dependencies

```
Cannot find module '@astrojs/react'
```

**Fix**: Run `pnpm install`.

### Port Already in Use

```
Error: listen EADDRINUSE :::4321
```

**Fix**: Kill the existing process or use `pnpm run dev -- --port 4322`.

---

## Next Steps

- [Development Workflow](./development-workflow.md) - Daily development patterns
- [Build System](../architecture/build-system.md) - Build process details
- [Project Schema Guide](./project-schema-guide.md) - Adding new projects
