# 📝 Guía para Proyectos Multiidioma

Esta guía explica cómo crear y gestionar proyectos en múltiples idiomas.

## 🌍 Estructura de Proyectos Traducidos

Cada proyecto ahora puede tener las siguientes propiedades adicionales en su frontmatter:

```yaml
---
title: "Título del proyecto"
summary: "Resumen breve"
date: "2025-01-01"
lang: "es" # Idioma del proyecto: 'es' o 'en'
translationKey: "mi-proyecto" # Clave única para vincular traducciones
# ... otros campos
---
```

## 📁 Crear Proyectos en Español

Archivo: `src/content/projects/agente-llm-proyecto.mdx`

```mdx
---
title: "Agentes LLM para soporte de producto"
summary: "Orquestación multi-agente con LangGraph reduciendo el tiempo de respuesta un 40%."
date: "2025-09-01"
lang: "es"
translationKey: "agente-llm-proyecto"
tags: ["GenAI", "Agents", "LangGraph", "AWS"]
tech: ["Python", "FastAPI", "OpenAI", "S3", "RDS"]
role: "Lead Engineer"
links:
  demo: "https://demo.ejemplo.com"
  repo: "https://github.com/usuario/proyecto"
---

# Contenido del proyecto en español

Descripción detallada del proyecto...
```

## 🌐 Crear la Versión en Inglés

Archivo: `src/content/projects/llm-agent-project.mdx`

```mdx
---
title: "LLM Agents for product support"
summary: "Multi-agent orchestration with LangGraph reducing response time by 40%."
date: "2025-09-01"
lang: "en"
translationKey: "agente-llm-proyecto" # ¡Misma clave que la versión en español!
tags: ["GenAI", "Agents", "LangGraph", "AWS"]
tech: ["Python", "FastAPI", "OpenAI", "S3", "RDS"]
role: "Lead Engineer"
links:
  demo: "https://demo.example.com"
  repo: "https://github.com/user/project"
---

# Project content in English

Detailed project description...
```

## 🔑 Campo `translationKey`

- **Obligatorio** para vincular proyectos entre idiomas
- Debe ser **idéntico** en ambas versiones
- Se recomienda usar el slug del proyecto original (en español)

## 📂 Estructura de Archivos Recomendada

```
src/content/projects/
├── agente-llm-proyecto.mdx          # Español
├── llm-agent-project.mdx             # Inglés (traducción)
├── plataforma-ecommerce.mdx          # Español
├── ecommerce-platform.mdx            # Inglés (traducción)
└── ...
```

## ⚙️ Cómo Funciona

### 1. Filtrado por Idioma

Las páginas de proyectos filtran automáticamente por idioma:

```astro
---
import { getProjectsByLang } from "@/lib/i18n-content";

// En /es/work/
const projects = await getProjectsByLang("es");

// En /en/work/
const projects = await getProjectsByLang("en");
---
```

### 2. Fallback Automático

Si un proyecto no tiene traducción al inglés, el sistema puede mostrar automáticamente la versión en español gracias a la configuración de fallback en `astro.config.mjs`.

### 3. Detección de Traducciones

Puedes verificar si existe una traducción:

```typescript
import { hasTranslation } from "@/lib/i18n-content";

const hasEnglishVersion = await hasTranslation("agente-llm-proyecto", "es");
// true si existe la versión en inglés
```

## 🎯 Campos Opcionales vs Obligatorios

### Obligatorios

- `title`: Título del proyecto
- `summary`: Resumen breve
- `date`: Fecha de publicación
- `lang`: Idioma ('es' o 'en')

### Opcionales pero Recomendados

- `translationKey`: Para vincular traducciones
- `tags`: Etiquetas del proyecto
- `tech`: Tecnologías utilizadas
- `role`: Tu rol en el proyecto
- `links.demo`: URL de la demo
- `links.repo`: URL del repositorio

## 🔄 Flujo de Trabajo Recomendado

1. **Crear proyecto en español** (idioma principal)
   - Define `lang: "es"`
   - Asigna un `translationKey` único

2. **Traducir al inglés**
   - Crea un nuevo archivo con nombre en inglés
   - Define `lang: "en"`
   - Usa el **mismo** `translationKey`

3. **Verificar**
   - Ambos proyectos aparecerán en sus respectivas páginas
   - `/work` mostrará la versión en español
   - `/en/work` mostrará la versión en inglés

## 🚀 Ejemplos Rápidos

### Proyecto Solo en Español

Si no tienes traducción, simplemente crea el proyecto en español. El fallback se encargará del resto:

```mdx
---
title: "Mi Proyecto"
summary: "Descripción"
date: "2025-01-15"
lang: "es"
# No necesitas translationKey si no planeas traducir
---
```

### Proyecto Bilingüe

Para proyectos importantes que quieres en ambos idiomas:

**Español:** `mi-proyecto.mdx`

```yaml
lang: "es"
translationKey: "mi-proyecto"
```

**Inglés:** `my-project.mdx`

```yaml
lang: "en"
translationKey: "mi-proyecto" # ¡Misma clave!
```

## 📊 Estadísticas y Utilidades

Usa las funciones helper de `src/lib/i18n-content.ts`:

```typescript
// Obtener proyectos por idioma
const esProjects = await getProjectsByLang("es");
const enProjects = await getProjectsByLang("en");

// Obtener proyecto con su traducción
const { project, translation } = await getProjectWithTranslation("slug", "es");

// Verificar si existe traducción
const hasTranslation = await hasTranslation("slug", "es");
```

## ⚠️ Notas Importantes

1. **URLs diferentes**: Los proyectos tendrán URLs diferentes según el idioma
   - Español: `/work/agente-llm-proyecto`
   - Inglés: `/en/work/llm-agent-project`

2. **Contenido independiente**: Cada archivo MDX debe tener su propio contenido traducido

3. **SEO optimizado**: Las etiquetas hreflang se generan automáticamente en todas las páginas

4. **Metadatos Open Graph**: Se incluyen automáticamente con el idioma correcto

## 🎨 Personalización

Para personalizar el comportamiento de traducciones, edita:

- `src/lib/i18n-content.ts` - Lógica de filtrado
- `src/content.config.ts` - Schema de colecciones
- `src/i18n/ui.ts` - Traducciones de UI
