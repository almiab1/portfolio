---
title: 'Stack Tecnológico'
category: 'architecture'
tags: ['tecnologías', 'frameworks', 'dependencias']
related: ['project-structure.md', 'build-system.md']
version: '1.0.0'
lastUpdated: '2025-01-15'
---

# 🛠️ Stack Tecnológico

Documentación completa de las tecnologías, frameworks y herramientas utilizadas en el proyecto.

## 🎯 Resumen Ejecutivo

**Framework Principal**: Astro 5  
**UI Library**: React 19  
**Styling**: Tailwind CSS 4  
**Content**: MDX + Content Collections  
**Deployment**: Static Site

## 📚 Dependencias Principales

### Core Framework

#### Astro v5

```json
"astro": "^5.0.0"
```

**Uso**: Framework principal del sitio  
**Características**:

- Islands Architecture
- Server-Side Rendering (SSG)
- Content Collections integradas
- Sistema i18n nativo
- Optimización automática de assets

**Configuración**: `astro.config.mjs`

### UI Framework

#### React 19

```json
"react": "^19.0.0",
"react-dom": "^19.0.0"
```

**Uso**: Componentes interactivos  
**Componentes React**:

- `Header.tsx` - Navegación principal
- `LanguageSwitcher.tsx` - Selector de idioma
- Componentes UI de shadcn

**Modo**: Client-side hydration con directivas:

- `client:load` - Hidrata inmediatamente
- `client:visible` - Hidrata cuando es visible
- `client:idle` - Hidrata cuando el navegador está idle

### Styling

#### Tailwind CSS v4

```json
"@tailwindcss/vite": "^4.0.0",
"tailwindcss": "^4.0.0"
```

**Uso**: Sistema de estilos utility-first  
**Características**:

- Modo JIT (Just-In-Time)
- Custom design tokens
- Dark mode support
- Responsive design
- Plugins integrados

**Configuración**: `tailwind.config.ts`

**Ejemplo**:

```jsx
<div className="bg-primary text-primary-foreground hover:bg-primary/90">Botón</div>
```

### Content Management

#### MDX

```json
"@astrojs/mdx": "^4.0.0"
```

**Uso**: Contenido con componentes interactivos  
**Características**:

- Markdown extendido
- Importar componentes React/Astro
- Frontmatter para metadatos
- Syntax highlighting

**Ejemplo**:

```mdx
---
title: 'Mi Proyecto'
lang: 'es'
---

# {frontmatter.title}

<Button>Click aquí</Button>
```

#### Content Collections

**Integrado en Astro**

**Uso**: Sistema type-safe para contenido  
**Colecciones definidas**:

- `projects` - Proyectos del portfolio
- `posts` - Posts del blog
- `talks` - Charlas y presentaciones
- `oss` - Proyectos open source

**Schema**: Validación con Zod en `content.config.ts`

### Integraciones Astro

#### @astrojs/react

```json
"@astrojs/react": "^4.0.0"
```

**Uso**: Integración de React en Astro

#### @astrojs/sitemap

```json
"@astrojs/sitemap": "^4.0.0"
```

**Uso**: Generación automática de sitemap.xml  
**Características**:

- Sitemap multiidioma
- Actualización automática
- Configuración en `astro.config.mjs`

## 🎨 UI Components

### shadcn/ui

**No instalado como dependencia** - Componentes copiados

**Uso**: Sistema de componentes UI  
**Base**: Radix UI primitives  
**Componentes incluidos**:

- `Button` - Botones con variantes
- Más componentes según necesidad

**Configuración**: `components.json`

### Icons

#### Lucide React

```json
"lucide-react": "^0.468.0"
```

**Uso**: Librería de íconos  
**Ejemplos usados**:

- `Menu`, `X` - Menú móvil
- `Globe` - Selector de idioma
- `Github`, `Linkedin`, `Mail` - Social links
- `Brain`, `Code2`, `Sparkles` - Decorativos

**Uso**:

```tsx
import { Github } from 'lucide-react';

<Github size={24} />;
```

## 🌍 Internacionalización

### Sistema i18n de Astro

**Integrado en Astro v5**

**Configuración**:

```javascript
i18n: {
  locales: ["es", "en"],
  defaultLocale: "es",
  routing: {
    prefixDefaultLocale: false,
    redirectToDefaultLocale: false,
  },
  fallback: { en: "es" }
}
```

**Helpers personalizados**:

- `src/i18n/utils.ts` - Utilidades
- `src/i18n/ui.ts` - Traducciones
- `src/i18n/translations.ts` - Helpers React
- `src/lib/i18n-content.ts` - Filtrado de contenido

**Ver**: [Documentación i18n completa](../i18n/i18n-overview.md)

## 🔧 Herramientas de Desarrollo

### TypeScript

```json
"typescript": "^5.7.2"
```

**Uso**: Type safety en todo el proyecto  
**Características**:

- Strict mode habilitado
- Path aliases configurados
- Tipos generados automáticamente para content

**Configuración**: `tsconfig.json`

### ESLint

```json
"eslint": "^9.17.0"
```

**Uso**: Linting de código  
**Plugins**:

- TypeScript
- React
- Astro

**Script**: `npm run lint`

### Prettier

```json
"prettier": "^3.4.2",
"prettier-plugin-astro": "^0.15.1"
```

**Uso**: Formateo de código  
**Formatea**:

- JavaScript/TypeScript
- Astro components
- CSS/Tailwind
- Markdown/MDX

**Script**: `npm run format`

## 📦 Build System

### Vite

**Integrado en Astro**

**Uso**: Build tool y dev server  
**Características**:

- HMR ultrarrápido
- Optimización de assets
- Code splitting automático
- CSS modules

**Plugins**:

- `@tailwindcss/vite` - Tailwind CSS v4
- Integración de Astro

### Asset Optimization

#### astro:assets

**Integrado en Astro**

**Uso**: Optimización de imágenes  
**Características**:

- Conversión a WebP/AVIF
- Responsive images
- Lazy loading
- Generación de srcset

**Ejemplo**:

```astro
import {Image} from "astro:assets"; import photo from "./photo.jpg";
<Image src={photo} alt="Descripción" width={800} height={600} />
```

## 🔍 SEO & Analytics

### JSON-LD

**Implementación custom**: `src/lib/schema.ts`

**Schemas implementados**:

- `Person` - Información personal
- `WebSite` - Información del sitio
- `CreativeWork` - Proyectos
- `BlogPosting` - Posts
- `Event` - Charlas

**Uso**:

```astro
---
import { ldPerson, ldWebsite } from '@/lib/schema';
const jsonLd = [ldPerson(), ldWebsite()];
---

{jsonLd.map((schema) => (
  <script type="application/ld+json" set:html={JSON.stringify(schema)} />
))}
```

### Sitemap

**@astrojs/sitemap**

**Genera**:

- `sitemap-index.xml`
- Sitemap por idioma
- URLs canónicas

## 📱 Responsive & Performance

### Tailwind Responsive

Breakpoints configurados:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Performance Features

- **Static Site Generation**: Pre-renderizado completo
- **Asset Optimization**: Imágenes, CSS, JS
- **Code Splitting**: Chunks por ruta
- **Prefetch**: Links importantes
- **Lazy Loading**: Imágenes y componentes

## 🚀 Deployment

### Static Output

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'static', // o "server" para SSR
  site: 'https://alejandromira.com',
});
```

**Compatible con**:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

## 📋 Scripts de Package.json

```json
{
  "dev": "astro dev", // Servidor de desarrollo
  "build": "astro build", // Build de producción
  "preview": "astro preview", // Vista previa del build
  "astro": "astro", // CLI de Astro
  "lint": "eslint .", // Linting
  "format": "prettier --write ." // Formateo
}
```

## 🔄 Versiones

| Paquete    | Versión  | Última Compatible |
| ---------- | -------- | ----------------- |
| Astro      | ^5.0.0   | ✅ Latest         |
| React      | ^19.0.0  | ✅ Latest         |
| Tailwind   | ^4.0.0   | ✅ Latest         |
| TypeScript | ^5.7.2   | ✅ Latest         |
| Node       | >=22.0.0 | ✅ Recomendado    |

**Archivo**: `.nvmrc` especifica Node v22

## 🛠️ Actualización de Dependencias

```bash
# Verificar actualizaciones
npm outdated

# Actualizar todas las dependencias menores
npm update

# Actualizar dependencia específica
npm install astro@latest

# Verificar breaking changes
npm run build
npm run lint
```

## 📚 Recursos Adicionales

### Documentación Oficial

- [Astro Docs](https://docs.astro.build)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [MDX Docs](https://mdxjs.com)

### Guías Internas

- [Estructura del Proyecto](./project-structure.md)
- [Sistema de Build](./build-system.md)
- [Guía de Desarrollo](../guides/development-workflow.md)

---

**Ver también:**

- [Estructura del Proyecto](./project-structure.md)
- [Guía de Inicio](../guides/getting-started.md)
