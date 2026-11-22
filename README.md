# Portfolio — Alejandro Mira

> Personal portfolio website showcasing projects, articles, and expertise in Generative AI and LLM Agent Systems.

[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

**Live Site**: [alejandromira.com](https://www.alejandromira.com)

---

## ✨ Features

- 🌐 **Bilingual Support**: Full Spanish/English internationalization with URL-based routing
- 🎨 **Modern UI**: Built with Astro 5 islands architecture + React 19 components
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS v4
- 🚀 **Performance Optimized**: Static site generation with optimized images
- 🔍 **SEO Ready**: JSON-LD structured data, sitemap, and meta tags
- 📝 **MDX Content**: Projects managed as content collections
- 🎯 **TypeScript**: Fully typed for better DX and maintainability
- 🌊 **Neural Background**: Interactive particle animation on hero section
- 🎨 **shadcn/ui**: Beautiful, accessible UI components

---

## 🛠️ Tech Stack

### Core

- **Framework**: [Astro 5](https://astro.build) - Islands architecture
- **UI Library**: [React 19](https://react.dev) - Interactive components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) utilities
- **Language**: [TypeScript 5](https://www.typescriptlang.org) - Type safety

### Content & Data

- **Content**: [MDX](https://mdxjs.com) with Astro Content Collections
- **Internationalization**: Custom i18n implementation (es/en)

### SEO & Analytics

- **Sitemap**: [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- **Structured Data**: JSON-LD schemas for rich search results

### Deployment

- **Hosting**: [Vercel](https://vercel.com) - Automatic deployments
- **Domain**: Custom domain with SSL

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v22 (see `.nvmrc`)
- **Package Manager**: pnpm (required)

### Installation

```bash
# Use the correct Node version
nvm use

# Install dependencies
pnpm install
```

### Development

```bash
# Start dev server at http://localhost:4321
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Run linter
pnpm run lint

# Format code
pnpm run format
```

---

## 📁 Project Structure

```
/
├── public/              # Static assets (images, fonts, CV files)
├── src/
│   ├── components/      # UI components
│   │   ├── blocks/      # Page sections (Hero, About, Projects)
│   │   ├── core/        # Core components (Header, Footer)
│   │   └── ui/          # shadcn/ui components
│   ├── content/
│   │   └── projects/    # MDX project files (es/, en/)
│   ├── i18n/            # Internationalization
│   │   ├── ui.ts        # Translation dictionary
│   │   ├── utils.ts     # Astro i18n helpers
│   │   └── translations.ts  # React i18n helpers
│   ├── layouts/         # Page layouts
│   ├── lib/             # Utilities and helpers
│   │   ├── schema.ts    # JSON-LD structured data
│   │   └── i18n-content.ts  # Content i18n helpers
│   └── pages/           # Astro pages and routes
│       ├── index.astro  # Spanish homepage (/)
│       ├── es/          # Explicit Spanish pages
│       └── en/          # English pages (/en/*)
├── docs/                # Documentation for development
├── astro.config.mjs     # Astro configuration
├── tailwind.config.mjs  # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vercel.json          # Vercel deployment config
```

---

## 📝 Content Management

### Adding Projects

Projects are MDX files in `src/content/projects/` organized by language:

**Spanish**: `src/content/projects/es/my-project.mdx`

```yaml
---
title: 'Título del Proyecto'
summary: 'Descripción breve del proyecto'
date: '2024-01-15'
lang: 'es'
translationKey: 'my-project' # Same key for translations
type: 'ai'
status: 'completed'
tags: ['GenAI', 'Agents', 'LangGraph']
tech: ['Python', 'FastAPI', 'OpenAI']
role: 'Lead Engineer'
links:
  demo: 'https://demo.example.com'
  repo: 'https://github.com/username/project'
cover: { src: '/projects/project-cover.png', alt: 'Project screenshot' }
---
## Context

Your project content here...
```

**English**: `src/content/projects/en/my-project.mdx`

- Use the same `translationKey` to link translations
- Same frontmatter structure with English content

### URL Routing

- Spanish (default): `/`, `/work`, `/work/my-project`
- English: `/en`, `/en/work`, `/en/work/my-project`

---

## 🌐 Internationalization

The site supports Spanish (default) and English:

### Configuration

- **Default locale**: Spanish (`es`)
- **Available locales**: `['es', 'en']`
- **Routing**: No prefix for Spanish, `/en` prefix for English
- **Fallback**: English falls back to Spanish

### Usage in Components

**Astro components**:

```astro
---
import { useTranslations } from '@/i18n/utils';
const lang = Astro.currentLocale || 'es';
const t = useTranslations(lang);
---

<h1>{t('home.title')}</h1>
```

**React components**:

```tsx
import { t, type Language } from '@/i18n/translations';

function Component({ currentLocale = 'es' }: Props) {
  const translate = t(currentLocale as Language);
  return <h1>{translate('nav.home')}</h1>;
}
```

---

## 🚢 Deployment

### Vercel Configuration

The project is configured for automatic deployment on Vercel:

- **Framework**: Astro
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`
- **Node Version**: 22.x

### Git Workflow

```
Development:
  feature/* → new-portfolio → develop → main

Environments:
  main        → Production  (alejandromira.com)
  develop     → Staging     (Vercel preview)
  feature/*   → Preview     (Vercel preview)
```

### Manual Deployment

```bash
# Build locally
pnpm run build

# The dist/ folder contains the static site
# Can be deployed to any static hosting provider
```

---

## 🧪 Code Quality

### Linting

ESLint is configured with:

- TypeScript support
- React rules
- Astro-specific rules

```bash
pnpm run lint
```

### Formatting

Prettier is configured with:

- Astro plugin
- Tailwind CSS class sorting
- TypeScript support

```bash
pnpm run format
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **Architecture**: System design and structure
- **i18n Guide**: Internationalization implementation
- **Features**: Detailed feature documentation
- **Guides**: Development workflows and best practices

---

## 🤝 Contributing

This is a personal portfolio, but suggestions and feedback are welcome! Feel free to:

1. Open an issue for bugs or suggestions
2. Fork the repository for personal use
3. Submit a PR for improvements (documentation, fixes, etc.)

---

## 📄 License

This project is private and proprietary. The code is available for reference and learning purposes only.

**© 2024-2026 Alejandro Mira. All rights reserved.**

---

## 👤 Author

**Alejandro Mira**
GenAI & LLM Agent Systems Engineer

- Website: [alejandromira.com](https://www.alejandromira.com)
- LinkedIn: [linkedin.com/in/alejandro-mira](https://www.linkedin.com/in/alejandro-mira/)
- GitHub: [@almiab1](https://github.com/almiab1)

---

## 🙏 Acknowledgments

Built with:

- [Astro](https://astro.build) - The web framework for content-driven websites
- [React](https://react.dev) - The library for web and native user interfaces
- [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Beautifully designed components
- [Vercel](https://vercel.com) - Platform for frontend frameworks and static sites

---

<div align="center">
  <p>Made with ❤️ and ☕ by Alejandro Mira</p>
  <p>
    <a href="https://www.alejandromira.com">Website</a> •
    <a href="https://github.com/almiab1">GitHub</a> •
    <a href="https://www.linkedin.com/in/alejandro-mira/">LinkedIn</a>
  </p>
</div>
