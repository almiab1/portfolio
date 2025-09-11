## Portafolio — Alejandro Mira

**Producción**: `https://alejandromira.com`

**Repositorio**: `https://github.com/almiab1/personalWeb`

Sitio personal con portfolio, proyectos y artículos construido con **Astro 5**, **React**, **MDX** y **Tailwind CSS**. Incluye sitemap y JSON-LD para SEO.

### Stack

- **Framework**: Astro (`astro@^5`)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui (utilidades)
- **Contenido**: MDX, `astro:content`
- **SEO**: `@astrojs/sitemap`, JSON-LD en `src/lib/schema.ts`

---

## Requisitos

- Node `v22` (archivo `.nvmrc`)
- npm

```bash
nvm use
npm install
```

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run build`: compila a `./dist`
- `npm run preview`: vista previa de la build
- `npm run astro`: utilidades CLI (`astro add`, `astro check`, etc.)
- `npm run lint`: lint de `.astro,.js,.jsx,.ts,.tsx`
- `npm run format`: formatea con Prettier

## Estructura

```text
/
├── public/                  # estáticos (imágenes, OG, etc.)
├── src/
│  ├── components/           # UI y bloques (ej. blocks/Hero.astro)
│  ├── content/projects/     # proyectos en MDX
│  ├── layouts/              # layouts base
│  ├── lib/                  # utilidades (ej. schema JSON-LD)
│  └── pages/                # páginas y rutas (ej. index, work/[slug])
├── astro.config.mjs         # configuración (site: alejandromira.com)
└── package.json
```

## Contenido: Proyectos (MDX)

Los proyectos viven en `src/content/projects`. Cada archivo MDX genera una página de caso de estudio accesible en `/work/[slug]`.

Ejemplo (`src/content/projects/agente-llm-proyecto.mdx`):

```mdx
---
title: "Agentes LLM para soporte de producto"
summary: "Orquestación multi-agente con LangGraph reduciendo el tiempo de respuesta un 40%."
date: "2025-09-01"
tags: ["GenAI", "Agents", "LangGraph", "AWS"]
tech: ["Python", "FastAPI", "OpenAI", "S3", "RDS"]
role: "Lead Engineer"
links:
  demo: "https://demo.ejemplo.com"
  repo: "https://github.com/usuario/proyecto"
cover: { src: "/og/proyecto.png", alt: "Vista del agente" }
seo:
  { title: "Case Study — Agentes LLM", description: "Arquitectura y métricas." }
---

## Contexto

Contenido del caso…
```

### Rutas dinámicas

`src/pages/work/[slug].astro` usa `getCollection('projects')` para generar rutas estáticas. El `slug` proviene del nombre del archivo MDX.

## Desarrollo

```bash
npm run dev
# abre http://localhost:4321
```

## Build y despliegue

```bash
npm run build
npm run preview
```

El sitio es estático y puede desplegarse en Vercel, Netlify o GitHub Pages. El dominio está configurado como `alejandromira.com` (ver `CNAME` y `astro.config.mjs`).

## Autor

Alejandro Mira — GenAI & Agentes LLM
