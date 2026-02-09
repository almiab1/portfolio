---
title: 'API Reference i18n'
category: 'i18n'
tags: ['api', 'funciones', 'helpers', 'referencia']
related: ['i18n-overview.md', 'i18n-implementation.md']
version: '1.0.0'
lastUpdated: '2025-01-15'
---

# 🔧 API Reference i18n

Referencia completa de todas las funciones, helpers y APIs del sistema i18n.

## 📦 Módulos Disponibles

### `src/i18n/utils.ts`

Utilidades para componentes Astro

### `src/i18n/ui.ts`

Diccionario de traducciones

### `src/i18n/translations.ts`

Helpers para componentes React

### `src/lib/i18n-content.ts`

Helpers para contenido y colecciones

### `astro:i18n`

APIs nativas de Astro

## 🎯 src/i18n/utils.ts

### `languages`

**Tipo**: `const`

```typescript
const languages: {
  es: 'Español';
  en: 'English';
};
```

**Uso**: Obtener lista de idiomas disponibles

```typescript
import { languages } from '@/i18n/utils';

Object.keys(languages); // ['es', 'en']
Object.values(languages); // ['Español', 'English']
```

---

### `Language`

**Tipo**: `type`

```typescript
type Language = 'es' | 'en';
```

**Uso**: Type-safe para idiomas

```typescript
const lang: Language = 'es'; // ✅
const lang: Language = 'fr'; // ❌ Error de TypeScript
```

---

### `defaultLang`

**Tipo**: `const`

```typescript
const defaultLang: Language = 'es';
```

**Uso**: Idioma por defecto del sitio

---

### `ui`

**Tipo**: `const object`

```typescript
const ui: {
  es: Record<string, string>;
  en: Record<string, string>;
};
```

**Uso**: Diccionario completo de traducciones (importado de `ui.ts`)

---

### `getLangFromUrl(url)`

**Parámetros**:

- `url: URL` - Objeto URL de Astro

**Retorna**: `Language` - Idioma detectado de la URL

**Descripción**: Extrae el idioma del path de la URL

**Ejemplo**:

```astro
---
const lang = getLangFromUrl(Astro.url);
// URL: /en/work → 'en'
// URL: /work → 'es' (default)
---
```

---

### `useTranslations(lang)`

**Parámetros**:

- `lang: Language` - Idioma objetivo

**Retorna**: `function(key: string) => string` - Función de traducción

**Descripción**: Hook para traducir claves en componentes Astro

**Ejemplo**:

```astro
---
import { useTranslations } from '@/i18n/utils';

const lang = Astro.currentLocale || 'es';
const t = useTranslations(lang);
---

<h1>{t('home.title')}</h1>
<p>{t('home.description')}</p>
```

---

### `getLocalizedUrl(url, lang)`

**Parámetros**:

- `url: string` - URL relativa
- `lang: Language` - Idioma objetivo

**Retorna**: `string` - URL localizada

**Descripción**: Genera URL relativa para un idioma específico

**Ejemplo**:

```typescript
getLocalizedUrl('/work', 'es'); // '/work' o '/es/work'
getLocalizedUrl('/work', 'en'); // '/en/work'
```

## 🎨 src/i18n/ui.ts

### `ui`

**Tipo**: `const object`

```typescript
export const ui = {
  es: {
    'nav.home': 'Inicio',
    'nav.work': 'Proyectos',
    // ... 47 claves más
  },
  en: {
    'nav.home': 'Home',
    'nav.work': 'Projects',
    // ...
  },
} as const;
```

**Claves Disponibles**:

#### Navegación

- `nav.home`, `nav.work`, `nav.about`, `nav.skills`
- `nav.projects`, `nav.contact`, `nav.downloadCV`

#### Páginas

- `home.title`, `home.description`
- `site.title`, `site.description`

#### Proyectos

- `work.title`, `work.viewAll`, `work.caseStudy`
- `work.backToProjects`, `work.noProjects`, `work.featured`

#### Hero

- `hero.greeting`, `hero.role`, `hero.description`
- `hero.viewProjects`, `hero.contact`

#### About (Sobre mí)

- `about.title` - Título de la sección
- `about.intro` - Introducción personal
- `about.background` - Experiencia y trayectoria profesional
- `about.currentFocus` - Enfoque actual e intereses

#### Contacto

- `contact.cta` - Call to action de la sección de contacto

#### Común

- `common.readMore`, `common.learnMore`, `common.viewMore`
- `common.loading`

#### Fechas

- `date.updated`, `date.published`

#### Labels de Proyecto

- `project.role`, `project.tech`, `project.tags`
- `project.links`, `project.demo`, `project.repo`

## ⚛️ src/i18n/translations.ts

### `Language`

**Tipo**: `type`

```typescript
type Language = 'es' | 'en';
```

---

### `TranslationKey`

**Tipo**: `type`

```typescript
type TranslationKey = keyof (typeof ui)['es'];
```

**Descripción**: Tipo con todas las claves válidas de traducción

---

### `translations`

**Tipo**: `const object`

```typescript
const translations: {
  es: typeof ui.es;
  en: typeof ui.en;
};
```

---

### `getTranslation(lang, key)`

**Parámetros**:

- `lang: Language` - Idioma
- `key: TranslationKey` - Clave de traducción

**Retorna**: `string` - Texto traducido

**Ejemplo**:

```typescript
getTranslation('es', 'nav.home'); // 'Inicio'
getTranslation('en', 'nav.home'); // 'Home'
```

---

### `t(lang)`

**Parámetros**:

- `lang: Language` - Idioma

**Retorna**: `function(key: TranslationKey) => string`

**Descripción**: Helper curried para componentes React

**Ejemplo**:

```tsx
import { t, type Language } from '@/i18n/translations';

function Header({ currentLocale = 'es' }: Props) {
  const translate = t(currentLocale as Language);

  return (
    <nav>
      <a href="/">{translate('nav.home')}</a>
      <a href="/work">{translate('nav.work')}</a>
    </nav>
  );
}
```

## 📚 src/lib/i18n-content.ts

### `Language`

**Tipo**: `type`

```typescript
type Language = 'es' | 'en';
```

---

### `getProjectsByLang(lang)`

**Parámetros**:

- `lang: Language` - Idioma

**Retorna**: `Promise<CollectionEntry<'projects'>[]>`

**Descripción**: Obtiene todos los proyectos de un idioma

**Ejemplo**:

```astro
---
const projects = await getProjectsByLang('es');
---

{projects.map((p) => <div>{p.data.title}</div>)}
```

---

### `getProjectWithTranslation(slug, lang)`

**Parámetros**:

- `slug: string` - Slug del proyecto
- `lang: Language` - Idioma

**Retorna**: `Promise<{ project, translation }>`

**Descripción**: Obtiene un proyecto y su traducción si existe

**Ejemplo**:

```typescript
const { project, translation } = await getProjectWithTranslation('agente-llm-proyecto', 'es');

if (translation) {
  console.log('Traducción disponible:', translation.data.title);
}
```

---

### `hasTranslation(slug, fromLang)`

**Parámetros**:

- `slug: string` - Slug del proyecto
- `fromLang: Language` - Idioma origen

**Retorna**: `Promise<boolean>`

**Descripción**: Verifica si existe traducción

**Ejemplo**:

```typescript
const hasEnglish = await hasTranslation('mi-proyecto', 'es');
if (hasEnglish) {
  // Mostrar link a versión en inglés
}
```

---

### `getPostsByLang(lang)`

**Parámetros**:

- `lang: Language`

**Retorna**: `Promise<CollectionEntry<'posts'>[]>`

**Descripción**: Obtiene posts por idioma

---

### `getTalksByLang(lang)`

**Parámetros**:

- `lang: Language`

**Retorna**: `Promise<CollectionEntry<'talks'>[]>`

**Descripción**: Obtiene charlas por idioma

## 🌐 astro:i18n

### `getRelativeLocaleUrl(locale, path)`

**API nativa de Astro**

**Parámetros**:

- `locale: string` - Código de idioma
- `path: string` - Path relativo

**Retorna**: `string` - URL localizada

**Ejemplo**:

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';

const esUrl = getRelativeLocaleUrl('es', '/work');
const enUrl = getRelativeLocaleUrl('en', '/work');
---

<a href={esUrl}>Proyectos</a>
<a href={enUrl}>Projects</a>
```

---

### `Astro.currentLocale`

**Propiedad del objeto Astro**

**Tipo**: `string | undefined`

**Descripción**: Idioma actual detectado de la URL

**Ejemplo**:

```astro
---
const lang = Astro.currentLocale || 'es';
---
```

---

### `Astro.preferredLocale`

**Propiedad del objeto Astro**

**Tipo**: `string | undefined`

**Descripción**: Idioma preferido del navegador (on-demand)

---

### `Astro.preferredLocaleList`

**Propiedad del objeto Astro**

**Tipo**: `string[]`

**Descripción**: Lista de idiomas preferidos del navegador

## 🎨 Ejemplos Completos

### Ejemplo 1: Página Astro con Traducciones

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { useTranslations } from '@/i18n/utils';
import { getProjectsByLang } from '@/lib/i18n-content';

const lang = Astro.currentLocale || 'es';
const t = useTranslations(lang);
const projects = await getProjectsByLang(lang);
---

<BaseLayout title={t('work.title')}>
  <h1>{t('work.featured')}</h1>

  {
    projects.map((p) => (
      <article>
        <h2>{p.data.title}</h2>
        <p>{p.data.summary}</p>
      </article>
    ))
  }
</BaseLayout>
```

### Ejemplo 2: Componente React con Traducciones

```tsx
import { t, type Language } from '@/i18n/translations';

interface Props {
  currentLocale?: string;
}

export default function Nav({ currentLocale = 'es' }: Props) {
  const translate = t(currentLocale as Language);

  return (
    <nav>
      <a href="#">{translate('nav.home')}</a>
      <a href="#">{translate('nav.work')}</a>
      <a href="#">{translate('nav.about')}</a>
    </nav>
  );
}
```

### Ejemplo 3: Selector de Idioma

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';

const currentLang = Astro.currentLocale || 'es';
const currentPath = Astro.url.pathname;
---

<div class="language-selector">
  <a href={getRelativeLocaleUrl('es', currentPath)} class:list={{ active: currentLang === 'es' }}>
    ES
  </a>
  <a href={getRelativeLocaleUrl('en', currentPath)} class:list={{ active: currentLang === 'en' }}>
    EN
  </a>
</div>
```

## 📚 Ver También

- [Visión General i18n](./i18n-overview.md)
- [Guía de Contenido](./i18n-content-guide.md)
- [Implementación](./i18n-implementation.md)
