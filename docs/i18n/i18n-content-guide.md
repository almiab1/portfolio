---
title: 'Guía de Contenido Multiidioma'
category: 'i18n'
tags: ['contenido', 'proyectos', 'traducciones', 'mdx']
related: ['i18n-overview.md', 'i18n-api-reference.md']
version: '1.0.0'
lastUpdated: '2025-01-15'
---

# 📝 Guía de Contenido Multiidioma

Guía completa para crear y gestionar contenido traducido en el portfolio.

## 🎯 Resumen

Todos los proyectos pueden existir en múltiples idiomas usando:

- Campo `lang` para especificar idioma
- Campo `translationKey` para vincular versiones
- Sistema de filtrado automático por idioma

## 📋 Estructura de Proyecto

### Campos Obligatorios

```yaml
---
title: 'Título del proyecto'
summary: 'Resumen breve'
date: '2025-01-01'
lang: 'es' # OBLIGATORIO: 'es' o 'en'
---
```

### Campos Recomendados

```yaml
---
translationKey: 'proyecto-unico' # Para vincular traducciones
tags: ['GenAI', 'Agents']
tech: ['Python', 'FastAPI']
role: 'Lead Engineer'
links:
  demo: 'https://demo.example.com'
  repo: 'https://github.com/user/repo'
---
```

## 🌍 Crear Proyecto Bilingüe

### Paso 1: Proyecto en Español

**Archivo**: `src/content/projects/agente-llm-proyecto.mdx`

```mdx
---
title: 'Agentes LLM para soporte de producto'
summary: 'Orquestación multi-agente con LangGraph.'
date: '2025-09-01'
lang: 'es'
translationKey: 'agente-llm-proyecto'
tags: ['GenAI', 'Agents', 'LangGraph']
tech: ['Python', 'FastAPI', 'OpenAI']
role: 'Lead Engineer'
cover: { src: '/og/proyecto.png', alt: 'Vista del agente' }
---

# Sistema de Agentes LLM

Contenido del proyecto en español...
```

### Paso 2: Traducción al Inglés

**Archivo**: `src/content/projects/llm-agent-project.mdx`

```mdx
---
title: 'LLM Agents for product support'
summary: 'Multi-agent orchestration with LangGraph.'
date: '2025-09-01'
lang: 'en'
translationKey: 'agente-llm-proyecto' # ¡MISMA CLAVE!
tags: ['GenAI', 'Agents', 'LangGraph']
tech: ['Python', 'FastAPI', 'OpenAI']
role: 'Lead Engineer'
cover: { src: '/og/project.png', alt: 'Agent system view' }
---

# LLM Agent System

Project content in English...
```

## 🔑 Campo translationKey

### Propósito

Vincular versiones del mismo proyecto en diferentes idiomas.

### Reglas

1. **Debe ser idéntico** en ambas versiones
2. **Único** por proyecto (no reutilizar)
3. **Formato**: kebab-case recomendado
4. **Sugerencia**: usar el slug del proyecto original

### Ejemplo Correcto ✅

```yaml
# Español
lang: 'es'
translationKey: 'mi-proyecto'

# Inglés
lang: 'en'
translationKey: 'mi-proyecto'
```

### Ejemplo Incorrecto ❌

```yaml
# Español
lang: 'es'
translationKey: 'mi-proyecto'

# Inglés
lang: 'en'
translationKey: 'my-project' # ❌ Diferente
```

## 📁 Convenciones de Nombres

### Archivos en Español

- **Formato**: `nombre-proyecto.mdx`
- **Convención**: kebab-case
- **Ejemplos**:
  - `agente-llm-proyecto.mdx`
  - `plataforma-ecommerce.mdx`
  - `app-reconocimiento-voz.mdx`

### Archivos en Inglés

- **Formato**: `project-name.mdx`
- **Convención**: kebab-case
- **Ejemplos**:
  - `llm-agent-project.mdx`
  - `ecommerce-platform.mdx`
  - `voice-recognition-app.mdx`

## 🎨 Casos de Uso

### Caso 1: Proyecto Solo en Español

Si no planeas traducir inmediatamente:

```yaml
---
title: 'Mi Proyecto Local'
summary: 'Descripción'
date: '2025-01-15'
lang: 'es'
# translationKey no necesario si no hay traducción
---
```

**Resultado**:

- Aparece en `/work` y `/es/work`
- No aparece en `/en/work`
- Fallback mostrará español en `/en` si se accede directamente

### Caso 2: Proyecto Completamente Bilingüe

Para proyectos importantes con ambas versiones:

**Español**: `mi-proyecto.mdx`

```yaml
lang: 'es'
translationKey: 'mi-proyecto'
```

**Inglés**: `my-project.mdx`

```yaml
lang: 'en'
translationKey: 'mi-proyecto'
```

**Resultado**:

- Español aparece en `/work` y `/es/work`
- Inglés aparece en `/en/work`
- URLs diferentes pero contenido vinculado

### Caso 3: Traducción Progresiva

Empieza con español, añade inglés después:

1. **Crear primero en español** con `translationKey`
2. **Deploy** y verifica que funciona
3. **Crear versión en inglés** con mismo `translationKey`
4. **Deploy** nuevamente

El sistema detecta automáticamente las nuevas traducciones.

## 🔍 Filtrado Automático

### Cómo Funciona

Las páginas de trabajo filtran automáticamente por idioma:

```astro
---
// src/pages/es/work/index.astro
import { getProjectsByLang } from '@/lib/i18n-content';

const projects = await getProjectsByLang('es');
---
```

### Resultado

- `/work` o `/es/work` → Solo proyectos con `lang: "es"`
- `/en/work` → Solo proyectos con `lang: "en"`

### Helpers Disponibles

```typescript
// Obtener proyectos por idioma
const esProjects = await getProjectsByLang('es');
const enProjects = await getProjectsByLang('en');

// Obtener proyecto con su traducción
const { project, translation } = await getProjectWithTranslation('slug', 'es');

// Verificar si existe traducción
const hasEnglish = await hasTranslation('slug', 'es');
```

## 📊 Flujo de Trabajo Recomendado

### 1. Planificación

- [ ] Decidir qué proyectos traducir
- [ ] Priorizar proyectos más importantes
- [ ] Asignar `translationKey` únicos

### 2. Creación Español

- [ ] Crear proyecto en español
- [ ] Definir `lang: "es"`
- [ ] Asignar `translationKey`
- [ ] Añadir todo el contenido

### 3. Verificación Español

- [ ] Build sin errores
- [ ] Aparece en `/work`
- [ ] URLs correctas
- [ ] Contenido visible

### 4. Traducción Inglés

- [ ] Crear archivo con nombre en inglés
- [ ] Definir `lang: "en"`
- [ ] Usar **mismo** `translationKey`
- [ ] Traducir todo el contenido

### 5. Verificación Inglés

- [ ] Build sin errores
- [ ] Aparece en `/en/work`
- [ ] URLs correctas
- [ ] Contenido traducido visible

## ⚙️ Configuración Técnica

### Schema de Validación

```typescript
// src/content.config.ts
projects: defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string(),
    lang: z.enum(['es', 'en']).default('es'),
    translationKey: z.string().optional(),
    // ... más campos
  }),
});
```

### Helpers de Filtrado

```typescript
// src/lib/i18n-content.ts
export async function getProjectsByLang(lang: Language) {
  const allProjects = await getCollection('projects');
  return allProjects.filter((p) => p.data.lang === lang);
}
```

## 🎯 Tips y Mejores Prácticas

### 1. Consistencia en translationKey

Usa siempre el slug del proyecto original en español:

```yaml
# Español: agente-llm-proyecto.mdx
translationKey: 'agente-llm-proyecto'

# Inglés: llm-agent-project.mdx
translationKey: 'agente-llm-proyecto'
```

### 2. Contenido Equivalente

Ambas versiones deben tener contenido similar:

- Misma estructura
- Mismas secciones
- Imágenes equivalentes
- Enlaces traducidos

### 3. Metadatos Consistentes

Tags y tech pueden variar, pero mantén coherencia:

```yaml
# Español
tags: ['GenAI', 'Agentes']
tech: ['Python', 'FastAPI']

# Inglés
tags: ['GenAI', 'Agents'] # Traducido
tech: ['Python', 'FastAPI'] # Igual
```

### 4. URLs y Links Internos

Actualiza links según el idioma:

```markdown
# Español

[Ver demo](/es/work/otro-proyecto)

# Inglés

[View demo](/en/work/other-project)
```

### 5. Imágenes y Assets

Usa paths relativos que funcionen en ambos idiomas:

```yaml
cover: { src: '/og/project.png', alt: 'Descripción' }
```

## 🐛 Troubleshooting

### Proyecto No Aparece

**Problema**: Proyecto no visible en lista

**Solución**:

1. Verificar campo `lang` existe
2. Verificar valor es `"es"` o `"en"`
3. Verificar sintaxis YAML correcta
4. Rebuild: `npm run build`

### translationKey No Funciona

**Problema**: Versiones no se vinculan

**Solución**:

1. Verificar `translationKey` es **idéntico**
2. Verificar no tiene typos
3. Verificar ambos archivos tienen el campo

### Build Error

**Problema**: Error al compilar

**Solución**:

1. Verificar schema en `content.config.ts`
2. Verificar todos campos obligatorios
3. Verificar sintaxis frontmatter
4. Verificar imports de componentes en MDX

## 📚 Ver También

- [Visión General i18n](./i18n-overview.md)
- [API Reference](./i18n-api-reference.md)
- [Content Collections](../features/content-collections.md)
