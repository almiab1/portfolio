---
title: 'Estructura del Proyecto'
category: 'architecture'
tags: ['estructura', 'directorios', 'organización']
related: ['tech-stack.md', '../guides/getting-started.md']
version: '1.0.0'
lastUpdated: '2025-01-15'
---

# 📁 Estructura del Proyecto

Documentación completa de la organización de archivos y directorios del portfolio.

## 🌳 Árbol de Directorios

```
/home/pica/dev/projects/Portfolio/
├── public/                    # Archivos estáticos
│   ├── me.jpg                # Foto de perfil
│   └── og/                   # Open Graph images
├── src/
│   ├── components/           # Componentes de UI
│   │   ├── blocks/          # Bloques de página
│   │   │   ├── Hero.astro
│   │   │   ├── ProjectGrid.astro
│   │   │   └── ContactCTA.astro
│   │   ├── core/            # Componentes core
│   │   │   └── Header.tsx
│   │   └── ui/              # Componentes UI shadcn
│   │       └── button.tsx
│   ├── content/              # Contenido en MDX
│   │   ├── projects/        # Proyectos
│   │   │   ├── agente-llm-proyecto.mdx (es)
│   │   │   └── llm-agent-project.mdx (en)
│   │   ├── posts/           # Posts del blog
│   │   ├── talks/           # Charlas
│   │   └── oss/             # Open source
│   ├── i18n/                 # Sistema de internacionalización
│   │   ├── utils.ts         # Utilidades i18n
│   │   ├── ui.ts            # Traducciones
│   │   └── translations.ts  # Helpers para React
│   ├── layouts/              # Layouts de página
│   │   └── BaseLayout.astro
│   ├── lib/                  # Librerías y utilidades
│   │   ├── schema.ts        # JSON-LD schemas
│   │   └── i18n-content.ts  # Helpers de contenido i18n
│   ├── pages/                # Páginas y rutas
│   │   ├── index.astro      # Home (español)
│   │   ├── es/              # Páginas en español
│   │   │   ├── index.astro
│   │   │   └── work/
│   │   │       ├── index.astro
│   │   │       └── [slug].astro
│   │   └── en/              # Páginas en inglés
│   │       ├── index.astro
│   │       └── work/
│   │           ├── index.astro
│   │           └── [slug].astro
│   ├── styles/               # Estilos globales
│   │   └── global.css
│   └── content.config.ts     # Configuración de colecciones
├── docs/                      # Documentación del proyecto
│   ├── README.md
│   ├── architecture/
│   ├── i18n/
│   ├── features/
│   └── guides/
├── astro.config.mjs          # Configuración de Astro
├── tailwind.config.ts        # Configuración de Tailwind
├── tsconfig.json             # Configuración de TypeScript
└── package.json              # Dependencias y scripts

```

## 📂 Descripción de Directorios

### `/public`

Archivos estáticos servidos directamente:

- Imágenes, fuentes, íconos
- No procesados por Vite
- Accesibles desde la raíz del sitio

### `/src/components`

Componentes reutilizables organizados por tipo:

#### `/components/blocks`

Bloques grandes de contenido para páginas:

- `Hero.astro` - Sección hero principal
- `ProjectGrid.astro` - Grid de proyectos con i18n
- `ContactCTA.astro` - Call-to-action de contacto

#### `/components/core`

Componentes fundamentales del sitio:

- `Header.tsx` - Header con navegación y selector de idioma

#### `/components/ui`

Componentes UI de shadcn/ui:

- Componentes atómicos reutilizables
- Basados en Radix UI
- Estilizados con Tailwind

### `/src/content`

Contenido en MDX organizado por tipo:

#### `/content/projects`

Proyectos del portfolio:

- Archivos MDX con frontmatter
- Incluye campo `lang` para multiidioma
- Vinculados con `translationKey`

#### `/content/posts`, `/content/talks`, `/content/oss`

Otras colecciones de contenido (configuradas pero vacías)

### `/src/i18n`

Sistema de internacionalización:

- `utils.ts` - Helpers para detectar idioma y traducir
- `ui.ts` - Diccionario de traducciones
- `translations.ts` - Helpers específicos para React

### `/src/layouts`

Layouts base para páginas:

- `BaseLayout.astro` - Layout principal con SEO, hreflang, Open Graph

### `/src/lib`

Librerías y utilidades:

- `schema.ts` - Generadores de JSON-LD para SEO
- `i18n-content.ts` - Helpers para filtrar contenido por idioma

### `/src/pages`

Sistema de routing de Astro:

- `index.astro` - Ruta raíz (español)
- `/es/*` - Páginas en español
- `/en/*` - Páginas en inglés
- Rutas dinámicas con `[slug].astro`

### `/docs`

Documentación técnica del proyecto:

- Organizada por categorías
- Optimizada para Agentes LLM
- Formato Markdown con metadatos

## 🔧 Archivos de Configuración

### `astro.config.mjs`

Configuración principal de Astro:

```javascript
{
  site: "https://alejandromira.com",
  integrations: [react(), mdx(), sitemap()],
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
    fallback: { en: "es" }
  }
}
```

### `content.config.ts`

Definición de colecciones de contenido:

- Schema de validación con Zod
- Campos requeridos y opcionales
- Tipos TypeScript generados automáticamente

### `tsconfig.json`

Configuración de TypeScript:

- Path aliases (`@/*`)
- Strict mode habilitado
- JSX para React

### `tailwind.config.ts`

Configuración de Tailwind CSS v4:

- Variables CSS custom
- Tema personalizado
- Plugins y utilidades

## 🎯 Convenciones de Nombres

### Archivos de Componentes

- **Astro**: `ComponentName.astro` (PascalCase)
- **React**: `ComponentName.tsx` (PascalCase)
- **Estilos**: `styles.css` o integrados

### Archivos de Contenido

- **Español**: `nombre-descriptivo.mdx`
- **Inglés**: `descriptive-name.mdx`
- Usar slugs URL-friendly (kebab-case)

### Archivos de Utilidades

- **TypeScript**: `feature-name.ts` (kebab-case)
- **Helpers**: `useFeatureName.ts` o `getFeatureName.ts`

## 🔗 Path Aliases

Configurados en `tsconfig.json`:

```typescript
{
  "@/*": ["./src/*"],
  "@components/*": ["./src/components/*"],
  "@layouts/*": ["./src/layouts/*"],
  "@lib/*": ["./src/lib/*"],
  "@pages/*": ["./src/pages/*"],
  "@styles/*": ["./src/styles/*"]
}
```

**Uso:**

```typescript
import Header from '@/components/core/Header';
import { ldPerson } from '@/lib/schema';
```

## 📦 Bundles y Chunks

### Build Output (`/dist`)

```
dist/
├── _astro/              # Assets optimizados
│   ├── *.js            # JavaScript chunks
│   ├── *.css           # Estilos compilados
│   └── *.webp          # Imágenes optimizadas
├── index.html          # Home español
├── en/
│   └── index.html      # Home inglés
└── work/
    └── [slug]/
        └── index.html  # Páginas de proyectos
```

## 🚀 Rutas Generadas

### Estáticas

- `/` - Home español
- `/en` - Home inglés
- `/es/work` - Lista de proyectos español
- `/en/work` - Lista de proyectos inglés

### Dinámicas

- `/es/work/[slug]` - Proyecto individual español
- `/en/work/[slug]` - Proyecto individual inglés

Generadas en build time con `getStaticPaths()`.

## 📝 Archivos Importantes

### `.cursorrules`

Reglas para Cursor AI con:

- Convenciones del proyecto
- Referencias a documentación
- Guías de estilo

### `.gitignore`

Excluye:

- `node_modules/`
- `dist/`
- `.astro/`
- Archivos de configuración local

### `package.json`

Scripts disponibles:

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Vista previa del build
- `npm run lint` - Linting del código
- `npm run format` - Formateo con Prettier

## 🔍 Notas Adicionales

### Generación de Tipos

Astro genera automáticamente tipos TypeScript en `.astro/`:

- Tipos de colecciones de contenido
- Tipos de rutas
- Tipos de componentes

**No editar manualmente** - se regeneran en cada build.

### Hot Module Replacement (HMR)

En desarrollo, Astro recarga automáticamente:

- Componentes `.astro`
- Estilos CSS
- Contenido MDX
- Configuración (requiere restart)

---

**Ver también:**

- [Stack Tecnológico](./tech-stack.md)
- [Guía de Inicio](../guides/getting-started.md)
- [Sistema i18n](../i18n/i18n-overview.md)
