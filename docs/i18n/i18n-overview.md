---
title: "Sistema i18n - Visión General"
category: "i18n"
tags: ["i18n", "internacionalización", "multiidioma"]
related:
  ["i18n-implementation.md", "i18n-content-guide.md", "i18n-api-reference.md"]
version: "1.0.0"
lastUpdated: "2025-01-15"
---

# 🌍 Sistema de Internacionalización (i18n)

Visión general del sistema de internacionalización implementado en el portfolio, soportando español e inglés.

## 📋 Resumen

**Idiomas soportados**: Español (principal) e Inglés (secundario)  
**Framework**: Sistema i18n nativo de Astro v5  
**Routing**: Español sin prefijo (`/`), Inglés con prefijo (`/en`)  
**Fallback**: Automático de inglés a español  
**SEO**: Etiquetas hreflang y Open Graph configuradas

## 🎯 Características Principales

### ✅ Routing Automático

- URLs en español sin prefijo: `/`, `/work`
- URLs en inglés con prefijo: `/en`, `/en/work`
- Detección automática del idioma actual
- Fallback a español si falta contenido en inglés

### ✅ Componentes Traducidos

- Header con navegación dinámica
- Selector de idioma integrado (React)
- ProjectGrid filtra por idioma
- Traducciones consistentes en toda la UI

### ✅ Contenido Multiidioma

- Proyectos con campo `lang`
- Sistema de `translationKey` para vincular versiones
- Filtrado automático por idioma
- Helpers para obtener traducciones

### ✅ SEO Optimizado

- Etiquetas `hreflang` automáticas
- URLs canónicas por idioma
- Open Graph con locale correcto
- Sitemap multiidioma

## 🗂️ Estructura i18n

```
src/
├── i18n/
│   ├── utils.ts          # Utilidades generales
│   ├── ui.ts             # Diccionario de traducciones
│   └── translations.ts   # Helpers para React
├── lib/
│   └── i18n-content.ts   # Helpers para contenido
├── content/
│   └── projects/
│       ├── proyecto-es.mdx (lang: "es")
│       └── project-en.mdx  (lang: "en")
└── pages/
    ├── index.astro       # Español (/)
    ├── es/
    │   ├── index.astro
    │   └── work/
    └── en/
        ├── index.astro
        └── work/
```

## 🔧 Configuración

### astro.config.mjs

```javascript
export default defineConfig({
  site: "https://alejandromira.com",
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: false, // Sin /es/ en URLs
      redirectToDefaultLocale: false, // Sin redirección automática
    },
    fallback: {
      en: "es", // Si falta página en inglés, mostrar español
    },
  },
});
```

### Características del Routing

**`prefixDefaultLocale: false`**  
Las URLs en español no llevan prefijo `/es/`:

- ✅ `/` - Home español
- ✅ `/work` - Proyectos español
- ❌ `/es/` - No se usa

**`redirectToDefaultLocale: false`**  
No redirige automáticamente a `/es/`:

- Permite que `/` sirva español directamente
- Mejor para SEO
- URLs más limpias

**`fallback: { en: "es" }`**  
Si una página no existe en inglés:

- Muestra la versión en español
- Evita errores 404
- Permite despliegue incremental de traducciones

## 🌐 URLs Generadas

| Contenido | Español                                    | Inglés               |
| --------- | ------------------------------------------ | -------------------- |
| Home      | `/`                                        | `/en`                |
| Proyectos | `/work` o `/es/work`                       | `/en/work`           |
| Proyecto  | `/work/agente-llm` o `/es/work/agente-llm` | `/en/work/llm-agent` |

**Nota**: Ambas `/work` y `/es/work` funcionan para español, pero se prefiere sin prefijo.

## 🧩 Componentes del Sistema

### 1. Diccionario de Traducciones

**Archivo**: `src/i18n/ui.ts`

```typescript
export const ui = {
  es: {
    "nav.about": "Sobre mí",
    "nav.work": "Proyectos",
    // ...
  },
  en: {
    "nav.about": "About",
    "nav.work": "Projects",
    // ...
  },
} as const;
```

**47 claves de traducción** organizadas por secciones:

- Navegación (6 claves)
- Páginas (4 claves)
- Proyectos (6 claves)
- Hero (3 claves)
- Común (4 claves)
- Fechas (2 claves)
- Proyectos labels (6 claves)

### 2. Helpers de Traducción

#### Para Componentes Astro

```astro
---
import { getLangFromUrl, useTranslations } from "@/i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<h1>{t("home.title")}</h1>
```

#### Para Componentes React

```tsx
import { t, type Language } from "@/i18n/translations";

function Component({ currentLocale = "es" }: Props) {
  const lang = currentLocale as Language;
  const translate = t(lang);

  return <h1>{translate("home.title")}</h1>;
}
```

### 3. Contenido Multiidioma

**Schema de Proyectos**:

```typescript
// content.config.ts
projects: defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    lang: z.enum(["es", "en"]).default("es"),
    translationKey: z.string().optional(),
    // ... otros campos
  }),
});
```

**Helpers de Contenido**:

```typescript
import { getProjectsByLang } from "@/lib/i18n-content";

// Obtener proyectos en español
const esProjects = await getProjectsByLang("es");

// Obtener proyectos en inglés
const enProjects = await getProjectsByLang("en");
```

### 4. Selector de Idioma

**Componente React**: `LanguageSwitcher.tsx`

Características:

- Detecta idioma actual
- Mantiene la ruta al cambiar
- Indicador visual de idioma activo
- Integrado en el Header

```tsx
<LanguageSwitcher currentLocale={currentLang} />
```

### 5. SEO Multiidioma

**Implementado en**: `BaseLayout.astro`

```astro
<!-- Etiquetas hreflang -->
<link rel="alternate" hreflang="es" href={esUrl} />
<link rel="alternate" hreflang="en" href={enUrl} />
<link rel="alternate" hreflang="x-default" href={esUrl} />

<!-- Open Graph -->
<meta property="og:locale" content={currentLang === "es" ? "es_ES" : "en_US"} />
<meta
  property="og:locale:alternate"
  content={currentLang === "es" ? "en_US" : "es_ES"}
/>
```

## 📊 Flujo de Datos

```
Usuario solicita /en/work
           ↓
Astro detecta locale = 'en'
           ↓
Astro.currentLocale = 'en'
           ↓
BaseLayout recibe currentLang = 'en'
           ↓
Header usa t('en') para traducciones
           ↓
ProjectGrid filtra getProjectsByLang('en')
           ↓
Se renderizan solo proyectos con lang: 'en'
```

## 🎨 Casos de Uso

### Caso 1: Traducir un Componente

```astro
---
import { useTranslations } from "@/i18n/utils";

const lang = Astro.currentLocale || "es";
const t = useTranslations(lang);
---

<button>{t("common.learnMore")}</button>
```

### Caso 2: Crear Contenido Bilingüe

**Español**: `mi-proyecto.mdx`

```yaml
---
title: "Mi Proyecto"
lang: "es"
translationKey: "mi-proyecto"
---
```

**Inglés**: `my-project.mdx`

```yaml
---
title: "My Project"
lang: "en"
translationKey: "mi-proyecto"
---
```

### Caso 3: Generar URLs Localizadas

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";

const esUrl = getRelativeLocaleUrl("es", "/work");
const enUrl = getRelativeLocaleUrl("en", "/work");
---

<a href={esUrl}>Proyectos</a>
<a href={enUrl}>Projects</a>
```

## ✅ Estado del Sistema

### Implementado

- [x] Routing automático
- [x] Traducción de componentes
- [x] Contenido multiidioma
- [x] Selector de idioma
- [x] SEO con hreflang
- [x] Open Graph locale
- [x] Fallback automático
- [x] Sitemap multiidioma

### Por Implementar (Opcional)

- [ ] Detección de idioma del navegador
- [ ] Guardar preferencia en localStorage
- [ ] Más contenido traducido
- [ ] Blog multiidioma
- [ ] Charlas multiidioma

## 📚 Documentación Relacionada

- **[Implementación Técnica](./i18n-implementation.md)** - Detalles de implementación
- **[Guía de Contenido](./i18n-content-guide.md)** - Cómo crear contenido multiidioma
- **[API Reference](./i18n-api-reference.md)** - Referencia completa de APIs

---

**Ver también:**

- [Estructura del Proyecto](../architecture/project-structure.md)
- [Componentes](../features/components.md)
