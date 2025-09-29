# Sistema de Internacionalización (i18n)

Este proyecto usa el sistema i18n integrado de Astro para soportar múltiples idiomas.

## Idiomas soportados

- **Español (es)** - Idioma principal
- **Inglés (en)** - Idioma secundario

## Estructura de archivos

```
src/
├── i18n/
│   ├── utils.ts      # Utilidades i18n (funciones helper)
│   └── ui.ts         # Traducciones de la UI
├── pages/
│   ├── index.astro   # Página raíz (español por defecto)
│   ├── es/           # Páginas en español
│   │   ├── index.astro
│   │   └── work/
│   └── en/           # Páginas en inglés
│       ├── index.astro
│       └── work/
└── components/
    └── LanguageSelector.astro  # Selector de idioma
```

## Configuración

La configuración de i18n está en `astro.config.mjs`:

```javascript
i18n: {
  locales: ["es", "en"],
  defaultLocale: "es",
  routing: {
    prefixDefaultLocale: false,  // No añade /es/ al idioma por defecto
    redirectToDefaultLocale: false,
  },
  fallback: {
    en: "es"  // Si falta una página en inglés, muestra la de español
  }
}
```

## Uso

### 1. Obtener traducciones

```astro
---
import { getLangFromUrl, useTranslations } from "@/i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<h1>{t("home.title")}</h1>
<p>{t("home.description")}</p>
```

### 2. Generar URLs localizadas

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";

const esUrl = getRelativeLocaleUrl("es", "/work");
const enUrl = getRelativeLocaleUrl("en", "/work");
---

<a href={esUrl}>Proyectos (ES)</a>
<a href={enUrl}>Projects (EN)</a>
```

### 3. Usar el selector de idioma

```astro
---
import LanguageSelector from "@/components/LanguageSelector.astro";
---

<header>
  <LanguageSelector />
</header>
```

### 4. Detectar el idioma actual

```astro
---
const currentLocale = Astro.currentLocale; // 'es' o 'en'
---
```

## Añadir nuevas traducciones

1. Edita `src/i18n/ui.ts`
2. Añade las claves en ambos idiomas:

```typescript
export const ui = {
  es: {
    "nueva.clave": "Texto en español",
  },
  en: {
    "nueva.clave": "Text in English",
  },
};
```

## Añadir nuevas páginas

1. Crea la página en ambas carpetas de idioma:
   - `src/pages/es/nueva-pagina.astro`
   - `src/pages/en/nueva-pagina.astro`

2. Las URLs generadas serán:
   - Español: `/nueva-pagina` (sin prefijo por configuración)
   - Inglés: `/en/nueva-pagina`

## URLs

- **Español (por defecto):**
  - Home: `/`
  - Proyectos: `/work`
  - Proyecto: `/work/[slug]`

- **Inglés:**
  - Home: `/en`
  - Projects: `/en/work`
  - Project: `/en/work/[slug]`

## Fallback

Si una página no existe en inglés, Astro mostrará automáticamente la versión en español gracias a la configuración de fallback.

## Referencias

- [Astro i18n Documentation](https://docs.astro.build/en/guides/internationalization/)
- [astro:i18n API](https://docs.astro.build/en/reference/api-reference/#astroi18n)
