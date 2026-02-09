## Portafolio — Alejandro Mira

**Produccion**: `https://alejandromira.com`

**Repositorio**: `https://github.com/almiab1/personalWeb`

Sitio personal con portfolio, proyectos y articulos construido con **Astro 5**, **React**, **MDX** y **Tailwind CSS**. Incluye sitemap y JSON-LD para SEO.

### Stack

- **Framework**: Astro (`astro@^5`)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui (utilidades)
- **Contenido**: MDX, `astro:content`
- **SEO**: `@astrojs/sitemap`, JSON-LD en `src/lib/schema.ts`
- **Despliegue**: Vercel

---

## Requisitos

- Node `v22` (archivo `.nvmrc`)
- pnpm

```bash
nvm use
pnpm install
```

## Scripts

- `pnpm run dev`: servidor de desarrollo
- `pnpm run build`: compila a `./dist`
- `pnpm run preview`: vista previa de la build
- `pnpm run astro`: utilidades CLI (`astro add`, `astro check`, etc.)
- `pnpm run lint`: lint de `.astro,.js,.jsx,.ts,.tsx`
- `pnpm run format`: formatea con Prettier

## Estructura

```text
/
├── public/                  # estaticos (imagenes, OG, etc.)
├── src/
│  ├── components/           # UI y bloques (ej. blocks/Hero.astro)
│  ├── content/projects/     # proyectos en MDX
│  ├── layouts/              # layouts base
│  ├── lib/                  # utilidades (ej. schema JSON-LD)
│  └── pages/                # paginas y rutas (ej. index, work/[slug])
├── astro.config.mjs         # configuracion (site: alejandromira.com)
├── vercel.json              # configuracion de Vercel
└── package.json
```

## Contenido: Proyectos (MDX)

Los proyectos viven en `src/content/projects`. Cada archivo MDX genera una pagina de caso de estudio accesible en `/work/[slug]`.

Ejemplo (`src/content/projects/agente-llm-proyecto.mdx`):

```mdx
---
title: 'Agentes LLM para soporte de producto'
summary: 'Orquestacion multi-agente con LangGraph reduciendo el tiempo de respuesta un 40%.'
date: '2025-09-01'
tags: ['GenAI', 'Agents', 'LangGraph', 'AWS']
tech: ['Python', 'FastAPI', 'OpenAI', 'S3', 'RDS']
role: 'Lead Engineer'
links:
  demo: 'https://demo.ejemplo.com'
  repo: 'https://github.com/usuario/proyecto'
cover: { src: '/og/proyecto.png', alt: 'Vista del agente' }
seo: { title: 'Case Study — Agentes LLM', description: 'Arquitectura y metricas.' }
---

## Contexto

Contenido del caso…
```

### Rutas dinamicas

`src/pages/work/[slug].astro` usa `getCollection('projects')` para generar rutas estaticas. El `slug` proviene del nombre del archivo MDX.

## Desarrollo

```bash
pnpm run dev
# abre http://localhost:4321
```

## Despliegue

### Entornos

El proyecto utiliza **Vercel** con Git Flow para gestionar los despliegues:

| Rama        | Entorno         | URL                               |
| ----------- | --------------- | --------------------------------- |
| `main`      | Produccion      | `https://alejandromira.com`       |
| `develop`   | Preview/Staging | Auto-generada por Vercel          |
| `feature/*` | Preview         | Auto-generada por Vercel          |

### Git Flow

```
Desarrollo de features:
1. git checkout develop
2. git checkout -b feature/nombre-feature
3. Desarrollar y probar localmente (pnpm run dev)
4. git push origin feature/nombre-feature
   → Vercel crea preview en feature-xxx.vercel.app
5. Crear PR a develop → Review → Merge
6. develop se despliega automaticamente a preview

Release a produccion:
1. Crear PR de develop a main
2. Revisar cambios acumulados
3. Merge → Despliegue automatico a alejandromira.com
```

### Configuracion de Vercel

- **Framework Preset**: Astro
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`
- **Node.js Version**: 22

### DNS (OVH)

El dominio `alejandromira.com` esta configurado en OVH con:

- **A Record**: `@` → `76.76.21.21` (Vercel)
- **CNAME**: `www` → `cname.vercel-dns.com`

## Autor

Alejandro Mira — GenAI & Agentes LLM
