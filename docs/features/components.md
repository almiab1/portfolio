---
title: "Componentes UI - Astro + React"
category: "features"
tags: ["components", "astro", "react", "shadcn", "ui", "blocks"]
related: ["../architecture/project-structure.md", "../architecture/tech-stack.md", "../i18n/i18n-api-reference.md"]
version: "1.0.0"
lastUpdated: "2026-02-02"
---

# Componentes UI - Arquitectura Astro + React

Documentación completa del sistema de componentes del portfolio: Astro components, React components, shadcn/ui integration y patrones de uso.

## Organización de Componentes

```
src/components/
├── blocks/              # Page sections (Astro)
│   ├── Hero.astro
│   ├── ProjectGrid.astro
│   ├── ProjectCard.astro
│   ├── ProjectFilter.tsx
│   ├── Contact.astro
│   └── ContactCTA.astro
├── core/                # Site-wide components
│   └── Header.tsx
├── ui/                  # shadcn/ui primitives
│   ├── button.tsx
│   └── [otros shadcn]
├── LanguageSwitcher.tsx
└── LanguageSelector.astro
```

### Principios de Organización

1. **`/blocks`** - Secciones completas de página (Hero, grids, CTAs)
2. **`/core`** - Componentes fundamentales (Header, Footer)
3. **`/ui`** - Primitivos reutilizables (shadcn/ui components)

## Diferencias: Astro vs React Components

### Cuándo Usar Astro Components (.astro)

Usar `.astro` cuando:
- El componente es principalmente estático
- Necesitas acceso directo a colecciones de contenido
- Requieres renderizado en build time
- No necesitas interactividad del lado del cliente

```astro
---
// ProjectGrid.astro - Static rendering with content collections
import { getCollection } from "astro:content";
const projects = await getCollection("projects");
---
<div class="grid">{projects.map(p => <Card />)}</div>
```

### Cuándo Usar React Components (.tsx)

Usar `.tsx` cuando:
- Necesitas interactividad (state, events)
- Requieres hooks (useState, useEffect)
- El componente tiene lógica compleja del lado del cliente
- Usas librerías React-specific

```tsx
// ProjectFilter.tsx - Client-side filtering
"use client";
import { useState } from "react";

export default function ProjectFilter() {
  const [selected, setSelected] = useState<string[]>([]);
  return <button onClick={() => setSelected([...])}>Filter</button>;
}
```

## Path Aliases

Configurados en `tsconfig.json`, funcionan en ambos tipos:

```typescript
import Header from "@/components/core/Header";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/utils";
import { t } from "@/i18n/translations";
```

## Integración con i18n

### En Astro Components

```astro
---
import { useTranslations, type Language } from "@/i18n/utils";

const lang: Language = (Astro.currentLocale as Language) || "es";
const t = useTranslations(lang);
---
<h1>{t("hero.title")}</h1>
```

### En React Components

```tsx
import { t, type Language } from "@/i18n/translations";

interface Props {
  currentLocale?: string;
}

export default function Component({ currentLocale = "es" }: Props) {
  const translate = t(currentLocale as Language);
  return <h1>{translate("hero.title")}</h1>;
}
```

**Diferencia clave**: Astro usa `useTranslations()` que devuelve función `t`, React usa helper `t(lang)` que devuelve función de traducción.

## Client Directives en Astro

Para incluir React components en páginas Astro:

```astro
---
import Header from "@/components/core/Header";
---

<!-- Carga inmediata -->
<Header client:load currentLocale={lang} />

<!-- Carga cuando visible -->
<ProjectFilter client:visible allTags={tags} />

<!-- Solo hidratación, sin JS -->
<StaticComponent client:only="react" />
```

**Opciones comunes**:
- `client:load` - Carga JS inmediatamente
- `client:visible` - Carga cuando entra en viewport
- `client:idle` - Carga cuando browser está idle
- `client:only="react"` - Solo renderiza en cliente

## shadcn/ui Integration

### Instalación de Componentes

shadcn/ui components van en `src/components/ui/`:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

### Uso en Astro

```astro
---
import { Button } from "@/components/ui/button";
---
<Button variant="default">Click</Button>
```

### Uso en React

```tsx
import { Button } from "@/components/ui/button";

export default function MyComponent() {
  return <Button onClick={() => {}}>Click</Button>;
}
```

### Personalización de shadcn

Los componentes usan variables CSS definidas en `src/index.css`:

```css
@layer base {
  :root {
    --primary: 217 91% 60%;
    --secondary: 142 76% 36%;
    --background: 222 47% 11%;
    /* ... */
  }
}
```

**No modificar componentes shadcn directamente** - usar variants o wrapper components.

## Patrones de Componentes

### 1. Block Component (Astro)

Sección de página con contenido estático y i18n:

```astro
---
import { useTranslations, type Language } from "@/i18n/utils";

export interface Props {
  showTitle?: boolean;
}
const { showTitle = true } = Astro.props;
const lang: Language = (Astro.currentLocale as Language) || "es";
const t = useTranslations(lang);
---
<section class="py-12">
  {showTitle && <h2>{t("section.title")}</h2>}
  <slot />
</section>
```

**Características**:
- Props tipadas con interfaz exportada
- Destructuring con defaults
- i18n integrado
- Slots para contenido flexible

### 2. Interactive Component (React)

Componente con estado y eventos:

```tsx
"use client";
import { useState } from "react";

interface Props {
  translations: { label: string };
}

export default function Filter({ translations }: Props) {
  const [active, setActive] = useState(false);

  return (
    <button onClick={() => setActive(!active)}>
      {translations.label}
    </button>
  );
}
```

**Características**:
- Directiva `"use client"` arriba
- Props tipadas con interface
- Estado local con useState
- Event handlers

### 3. Hybrid Pattern

Astro component que incluye React component:

```astro
---
import ProjectFilter from "./ProjectFilter.tsx";
import { useTranslations, type Language } from "@/i18n/utils";

const lang: Language = (Astro.currentLocale as Language) || "es";
const t = useTranslations(lang);

const translations = {
  filterBy: t("work.filterBy"),
  clearFilters: t("work.clearFilters"),
};
---

<div>
  <ProjectFilter
    client:load
    translations={translations}
    allTags={["AI", "Web"]}
  />
</div>
```

**Uso**: Cuando necesitas combinar data fetching de servidor con interactividad de cliente.

## Props Typing

### En Astro

```astro
---
export interface Props {
  title: string;
  description?: string;
  featured?: boolean;
}
const { title, description = "", featured = false } = Astro.props;
---
```

### En React

```tsx
interface Props {
  title: string;
  description?: string;
  featured?: boolean;
}

export default function Component({
  title,
  description = "",
  featured = false
}: Props) {
  return <div>{title}</div>;
}
```

**Convenciones**:
- Interface siempre llamada `Props`
- Exportar interface en Astro para reuso
- Props opcionales con `?` y defaults en destructuring

## Styling con Tailwind

### Clases de Color

Usar variables CSS definidas en `src/index.css`:

```tsx
<div className="bg-primary text-primary-foreground">
<button className="bg-secondary text-secondary-foreground">
<p className="text-muted-foreground">
```

**Variables disponibles**:
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `background`, `foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`

### Responsive Design

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
```

Breakpoints Tailwind:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

### Utility Patterns

```tsx
// Spacing
"px-4 py-2"           // Padding horizontal/vertical
"mb-8"                // Margin bottom

// Layout
"flex items-center justify-between"
"grid gap-6 md:grid-cols-2"

// Typography
"text-lg font-semibold"
"text-muted-foreground"

// Transitions
"transition-colors hover:bg-primary/90"
"transition-all duration-300"
```

## Component Communication

### Pasando Datos de Astro a React

```astro
---
const data = await fetchData();
const serializedData = JSON.stringify(data);
---
<ReactComponent client:load data={serializedData} />
```

**Limitaciones**: Solo datos serializables (no funciones, no clases).

### DOM Manipulation en React

```tsx
// ProjectFilter manipula DOM directamente para filtrar
useEffect(() => {
  const cards = document.querySelectorAll('[data-project-tags]');
  cards.forEach(card => {
    const shouldShow = matchesFilter(card);
    (card as HTMLElement).style.display = shouldShow ? '' : 'none';
  });
}, [filters]);
```

**Uso**: Cuando React component necesita controlar elementos Astro renderizados.

## Casos de Uso Comunes

### 1. Static Section with i18n

```astro
---
// Hero.astro
import { Button } from "@/components/ui/button";
import { useTranslations, type Language } from "@/i18n/utils";

const lang: Language = (Astro.currentLocale as Language) || "es";
const t = useTranslations(lang);
---
<section>
  <h1>{t("hero.title")}</h1>
  <a href="/work">
    <Button variant="default">{t("hero.cta")}</Button>
  </a>
</section>
```

### 2. Interactive Filter

```tsx
// ProjectFilter.tsx
"use client";
import { useState, useEffect } from "react";

export default function ProjectFilter({ allTags }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    // Filter DOM elements
  }, [selected]);

  return <button onClick={() => setSelected([...])}>Filter</button>;
}
```

### 3. Client-Side Navigation

```tsx
// Header.tsx
"use client";
import { useState, useEffect } from "react";

export default function Header({ currentLocale }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <header className={isScrolled ? "scrolled" : ""}>...</header>;
}
```

## Important Gotchas

### 1. Astro Island Isolation

Cada React component con `client:*` es una isla independiente:

```astro
<!-- NO comparten estado -->
<ComponentA client:load value={x} />
<ComponentB client:load value={x} />
```

**Solución**: Usar store externo (Zustand, Nanostores) o props compartidas.

### 2. i18n Function Names

```typescript
// Astro: useTranslations
import { useTranslations } from "@/i18n/utils";
const t = useTranslations(lang);

// React: t helper
import { t } from "@/i18n/translations";
const translate = t(lang);
```

**Diferente API** para mismo propósito.

### 3. Client Directive Required

```astro
<!-- ERROR: No interactivity -->
<ReactComponentWithState />

<!-- CORRECT: Con client directive -->
<ReactComponentWithState client:load />
```

**Sin client directive**, React component renderiza solo HTML estático.

### 4. Serialization Limits

```astro
---
const data = { fn: () => {} }; // ❌ No serializable
---
<ReactComponent client:load data={data} />
```

**Solo props JSON-serializables**: strings, numbers, arrays, objects.

### 5. CSS-in-JS No Recomendado

```tsx
// ❌ Evitar styled-components, emotion
import styled from 'styled-components';

// ✅ Usar Tailwind
<div className="bg-primary text-white">
```

**Razón**: Astro + Tailwind es el patrón del proyecto.

## Testing Components

### Astro Components

No hay tests unitarios tradicionales - usar:
- Visual testing en navegador
- Build time errors catch issues
- Type checking con TypeScript

### React Components

Setup con Vitest + Testing Library (si se implementa):

```tsx
import { render, screen } from '@testing-library/react';
import ProjectFilter from './ProjectFilter';

test('renders filter', () => {
  render(<ProjectFilter allTags={['AI']} />);
  expect(screen.getByText('AI')).toBeInTheDocument();
});
```

## Performance Considerations

### 1. Minimize Client JS

```astro
<!-- Preferir Astro estático -->
<StaticCard project={p} />

<!-- Sobre React interactivo -->
<ReactCard client:load project={p} />
```

### 2. Lazy Load Interactive Components

```astro
<!-- Carga diferida -->
<ProjectFilter client:visible allTags={tags} />
```

### 3. Memoization en React

```tsx
import { useMemo, useCallback } from "react";

const filtered = useMemo(() =>
  projects.filter(p => matches(p)),
  [projects, filters]
);

const handleClick = useCallback(() => {
  // handler
}, [deps]);
```

## Migration Path

### De HTML estático a Astro Component

```html
<!-- Before: HTML -->
<section class="hero">
  <h1>Title</h1>
</section>

<!-- After: Astro -->
<!-- Hero.astro -->
<section class="hero">
  <h1>{t("hero.title")}</h1>
</section>
```

### De Astro a React (cuando necesitas interactividad)

```astro
<!-- Before: Static Astro -->
---
const items = ["A", "B"];
---
<div>{items.map(i => <span>{i}</span>)}</div>

<!-- After: Interactive React -->
---
import FilterComponent from "./Filter.tsx";
---
<FilterComponent client:load items={["A", "B"]} />
```

## Quick Reference

### Import Patterns

```typescript
// shadcn/ui
import { Button } from "@/components/ui/button";

// Custom components
import Hero from "@/components/blocks/Hero.astro";
import Header from "@/components/core/Header";

// i18n
import { useTranslations } from "@/i18n/utils";      // Astro
import { t } from "@/i18n/translations";             // React

// Utils
import { cn } from "@/lib/utils";
```

### Component Template

**Astro**:
```astro
---
import { useTranslations, type Language } from "@/i18n/utils";

export interface Props {
  title: string;
}
const { title } = Astro.props;
const lang: Language = (Astro.currentLocale as Language) || "es";
const t = useTranslations(lang);
---
<section>{title}</section>
```

**React**:
```tsx
"use client";
import { t, type Language } from "@/i18n/translations";

interface Props {
  currentLocale?: string;
  title: string;
}

export default function Component({
  currentLocale = "es",
  title
}: Props) {
  const translate = t(currentLocale as Language);
  return <section>{title}</section>;
}
```

---

**Ver también**:
- [Estructura del Proyecto](../architecture/project-structure.md)
- [Stack Tecnológico](../architecture/tech-stack.md)
- [API Reference i18n](../i18n/i18n-api-reference.md)
