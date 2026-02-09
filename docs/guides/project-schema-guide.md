# 📚 Guía del Schema de Proyectos

> **Última actualización**: Septiembre 2025  
> **Versión**: 2.0 - Schema Mejorado

## 🎯 Descripción General

El schema de proyectos ha sido mejorado para proporcionar una presentación más rica y organizada de los proyectos en el portfolio. Esta guía documenta todos los campos disponibles y cómo utilizarlos.

## 📝 Schema Completo

### Campos Obligatorios

```yaml
title: string           # Título del proyecto
summary: string         # Descripción breve (se muestra en cards)
date: string           # Fecha del proyecto (formato: YYYY-MM-DD)
lang: "es" | "en"      # Idioma del contenido
```

### Campos Opcionales con Defaults

```yaml
translationKey: string           # Clave para vincular versiones en diferentes idiomas
type: enum                       # Tipo de proyecto (default: "other")
status: enum                     # Estado del proyecto (default: "completed")
duration: string                 # Duración (ej: "3 meses", "1 año")
featured: boolean                # Proyecto destacado (default: false)
priority: number                 # Prioridad 0-10 (default: 5)
tags: string[]                   # Etiquetas/categorías (default: [])
tech: string[]                   # Stack tecnológico (default: [])
role: string                     # Rol en el proyecto
links: { demo?, repo? }          # Enlaces del proyecto
cover: { src, alt }              # Imagen de portada
gallery: Array<{ src, alt }>     # Galería de imágenes (opcional, nuevo)
seo: { title?, description? }    # Metadatos SEO
updated: string                  # Fecha de última actualización
```

## 🎨 Tipos de Proyecto (`type`)

| Valor | Descripción | Icono | Ejemplo |
|-------|-------------|-------|---------|
| `web` | Aplicaciones web | 🌐 | SaaS, dashboards, sitios web |
| `mobile` | Apps móviles | 📱 | iOS, Android, React Native |
| `iot` | Internet de las Cosas | 🔌 | Arduino, sensores, hardware |
| `ai` | Inteligencia Artificial | 🧠 | ML, LLMs, agentes |
| `data` | Ciencia de datos | 📊 | Analytics, visualización |
| `api` | APIs y servicios | 🔧 | Backend, microservicios |
| `desktop` | Apps de escritorio | 💻 | Electron, Qt |
| `other` | Otros tipos | 📦 | Proyectos misceláneos |

## 🔄 Estados del Proyecto (`status`)

| Valor | Significado | Color | Icono |
|-------|-------------|-------|-------|
| `completed` | Proyecto terminado | Verde | ✓ |
| `in-progress` | En desarrollo activo | Azul | 🔄 |
| `archived` | Archivado, no se mantiene | Gris | 📦 |
| `maintained` | Activamente mantenido | Morado | 🔧 |

## ⭐ Sistema de Featured y Priority

### Featured (`featured`)

- `true`: Proyecto destacado
  - Aparece con badge "⭐ Featured"
  - Se ordena primero en el grid
  - Ideal para tus mejores proyectos

### Priority (`priority`)

- Rango: 0-10
- Default: 5
- Uso:
  - `9-10`: Proyectos principales/profesionales
  - `7-8`: Proyectos importantes
  - `5-6`: Proyectos estándar
  - `3-4`: Proyectos secundarios
  - `1-2`: Proyectos menores

## 📋 Ejemplos Completos

### Proyecto IoT Destacado

```yaml
---
title: "Sistema de Monitoreo IoT"
summary: "Plataforma de monitoreo en tiempo real con sensores Arduino y dashboard web."
date: "2023-06-01"
lang: "es"
translationKey: "iot-monitoring"

# Campos nuevos
type: "iot"
status: "maintained"
duration: "6 meses"
featured: true
priority: 9

# Stack completo
tags: ["IoT", "Real-time", "Dashboard"]
tech: ["Arduino", "Node.js", "React", "MQTT", "PostgreSQL"]
role: "Full Stack IoT Developer"

# Enlaces
links:
  demo: "https://demo.example.com"
  repo: "https://github.com/user/project"

# Portada
cover:
  src: "/projects/iot-monitoring.png"
  alt: "Dashboard del sistema IoT"

# 📸 Galería de imágenes (opcional)
gallery:
  - src: "/images/projects/iot/dashboard.png"
    alt: "Dashboard en tiempo real con métricas de sensores"
  - src: "/images/projects/iot/sensors-map.png"
    alt: "Mapa interactivo mostrando ubicación de sensores"
  - src: "/images/projects/iot/analytics.png"
    alt: "Panel de analytics con datos históricos"

# SEO
seo:
  title: "Sistema IoT de Monitoreo - Proyecto"
  description: "Sistema completo de monitoreo IoT con Arduino y React"
---

## Contexto

[... contenido del proyecto ...]
```

### Proyecto AI Actual

```yaml
---
title: "Agente LLM Inteligente"
summary: "Sistema de agentes basado en LLMs para automatización de soporte."
date: "2025-01-15"
lang: "es"
translationKey: "llm-agent"

type: "ai"
status: "in-progress"
duration: "3 meses (en curso)"
featured: true
priority: 10

tags: ["GenAI", "LLM", "Agents", "RAG"]
tech: ["Python", "LangChain", "OpenAI", "Pinecone", "FastAPI"]
role: "AI Engineer"

links:
  demo: "https://demo.ai-agent.com"
  repo: "https://github.com/user/llm-agent"
---
```

### Proyecto Web Simple

```yaml
---
title: "Portfolio Personal"
summary: "Sitio web personal construido con Astro y Tailwind CSS."
date: "2024-03-10"
lang: "es"

type: "web"
status: "completed"
duration: "2 semanas"
featured: false
priority: 5

tags: ["Web", "Portfolio"]
tech: ["Astro", "Tailwind CSS", "TypeScript"]

links:
  demo: "https://portfolio.example.com"
---
```

## 🎯 Ordenamiento Automático

Los proyectos se ordenan por:

1. **Featured**: Destacados primero
2. **Priority**: Mayor a menor (10 → 0)
3. **Date**: Más reciente primero

```typescript
// Ejemplo de ordenamiento
featured: true, priority: 10   // 🥇 Primero
featured: true, priority: 9    // 🥈 Segundo
featured: true, priority: 7    // 🥉 Tercero
featured: false, priority: 10  // 4º (no featured)
featured: false, priority: 8   // 5º (no featured)
```

## 🔍 Visualización

### En el Grid (`/work`)

**ProjectCard muestra:**
- Badge de Featured (si aplica)
- Tipo de proyecto con icono
- Estado con color
- Duración
- Título
- Summary
- **Stack tecnológico (prominente)**
- Tags (secundario)
- Rol

### En Página Individual (`/work/[slug]`)

**Header mejorado con:**
- Badges de Featured, Tipo y Estado
- Título grande
- Summary destacado
- Metadata Grid:
  - Stack tecnológico (primera sección, destacado)
  - Rol y Duración
  - Tags
  - Enlaces a demo y repo

## 📊 Estadísticas Automáticas

La página `/work` muestra automáticamente:

- Total de proyectos
- Proyectos destacados
- Tipos de proyectos únicos

## 🌍 Internacionalización

### Vincular Versiones

Usa `translationKey` para vincular versiones en diferentes idiomas:

**Español** (`proyecto-iot.mdx`):
```yaml
lang: "es"
translationKey: "iot-monitoring"
```

**Inglés** (`iot-project.mdx`):
```yaml
lang: "en"
translationKey: "iot-monitoring"  # Misma clave
```

### Traducciones de UI

Todas las etiquetas y estados están traducidos automáticamente:
- `project.type.iot` → "IoT" / "IoT"
- `project.status.completed` → "Completado" / "Completed"
- Etc.

## ⚠️ Migración de Proyectos Existentes

### Opción 1: Agregar Todos los Campos

```yaml
# Proyecto existente
---
title: "Mi Proyecto"
# ... campos existentes

# Agregar:
type: "web"
status: "completed"
duration: "2 meses"
featured: false
priority: 5
---
```

### Opción 2: Sin Cambios (Usar Defaults)

Los proyectos sin los nuevos campos seguirán funcionando con valores por defecto:
- `type: "other"`
- `status: "completed"`
- `featured: false`
- `priority: 5`

## 🎨 Componentes Creados

### `ProjectCard.astro`

Componente reutilizable para mostrar proyectos en grid.

**Props:**
```typescript
{
  project: CollectionEntry<"projects">;
  currentLang: Language;
}
```

**Uso:**
```astro
<ProjectCard project={project} currentLang="es" />
```

## 📚 Referencias

- **Schema**: `src/content.config.ts`
- **Traducciones**: `src/i18n/ui.ts`
- **Componente Card**: `src/components/blocks/ProjectCard.astro`
- **Página Grid**: `src/pages/work/index.astro`
- **Página Individual**: `src/pages/work/[slug].astro`

## ✨ Beneficios de la Nueva Estructura

1. **Mejor jerarquía visual**: Stack tecnológico prominente
2. **Más información**: Tipo, estado, duración visibles
3. **Ordenamiento inteligente**: Featured + Priority + Date
4. **Componentes reutilizables**: `ProjectCard.astro`
5. **Estadísticas automáticas**: Total, featured, tipos
6. **Iconografía consistente**: Tipos y estados con iconos
7. **Retrocompatibilidad**: Proyectos antiguos siguen funcionando

## 🚀 Next Steps

Para nuevos proyectos, sigue esta plantilla:

```yaml
---
title: "Nombre del Proyecto"
summary: "Descripción breve y atractiva"
date: "YYYY-MM-DD"
lang: "es"
translationKey: "clave-unica"

type: "web"              # Tipo apropiado
status: "completed"      # Estado real
duration: "X meses"      # Duración real
featured: true/false     # ¿Es destacado?
priority: 5-10          # Prioridad

tags: ["Tag1", "Tag2"]
tech: ["Tech1", "Tech2", "Tech3"]  # Stack completo
role: "Tu rol en el proyecto"

links:
  demo: "https://..."   # opcional
  repo: "https://..."   # opcional
---

[Contenido detallado del proyecto...]
```
