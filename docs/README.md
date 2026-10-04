# 📚 Portfolio - Documentación del Proyecto

Documentación técnica completa del portfolio de Alejandro Mira, optimizada para consulta de Agentes LLM y desarrolladores.

## 🗂️ Estructura de Documentación

### 📁 `/docs/architecture`

Documentación de arquitectura del proyecto:

- `project-structure.md` - Estructura general del proyecto
- `tech-stack.md` - Stack tecnológico y dependencias
- `build-system.md` - Sistema de build y despliegue

### 📁 `/docs/i18n`

Sistema de internacionalización completo:

- `i18n-overview.md` - Visión general del sistema i18n
- `i18n-implementation.md` - Implementación técnica detallada
- `i18n-content-guide.md` - Guía para crear contenido multiidioma
- `i18n-api-reference.md` - Referencia de APIs y helpers

### 📁 `/docs/features`

Documentación de características específicas:

- `components.md` - Componentes UI y su uso
- `content-collections.md` - Sistema de colecciones de contenido
- `seo.md` - Configuración SEO y metadatos

### 📁 `/docs/guides`

Guías prácticas y tutoriales:

- `getting-started.md` - Guía de inicio rápido
- `development-workflow.md` - Flujo de trabajo de desarrollo
- `deployment.md` - Guía de despliegue
- `project-schema-guide.md` - Schema completo de proyectos
- `gallery-guide.md` - Guía de galería de imágenes

## 🤖 Uso para Agentes LLM

Esta documentación está optimizada para ser consumida por Agentes LLM:

### Características Clave:

- **Estructura jerárquica clara**: Fácil navegación por contexto
- **Ejemplos de código completos**: Copy-paste ready
- **Referencias cruzadas**: Links entre documentos relacionados
- **Metadatos semánticos**: Tags y categorías para búsqueda
- **Formato consistente**: Markdown estructurado

### Cómo Usar:

1. **Búsqueda por feature**: Navega a `/docs/features/` para características específicas
2. **Implementación técnica**: Consulta `/docs/i18n/` para detalles de internacionalización
3. **Arquitectura**: Revisa `/docs/architecture/` para entender la estructura
4. **Guías prácticas**: Sigue `/docs/guides/` para tareas específicas

## 📋 Índice Rápido

### Configuración y Setup

- [Primeros Pasos](./guides/getting-started.md)
- [Estructura del Proyecto](./architecture/project-structure.md)
- [Stack Tecnológico](./architecture/tech-stack.md)

### Internacionalización (i18n)

- [Visión General i18n](./i18n/i18n-overview.md)
- [Implementación i18n](./i18n/i18n-implementation.md)
- [Guía de Contenido Multiidioma](./i18n/i18n-content-guide.md)
- [API Reference i18n](./i18n/i18n-api-reference.md)

### Features

- [Componentes](./features/components.md)
- [Content Collections](./features/content-collections.md)
- [SEO y Metadatos](./features/seo.md)

### Desarrollo

- [Flujo de Trabajo](./guides/development-workflow.md)
- [Despliegue](./guides/deployment.md)

## 🔍 Búsqueda y Tags

Cada documento incluye metadatos en formato YAML al inicio:

```yaml
---
title: 'Título del Documento'
category: 'i18n|architecture|features|guides'
tags: ['tag1', 'tag2', 'tag3']
related: ['doc1.md', 'doc2.md']
version: '1.0.0'
lastUpdated: '2025-01-15'
---
```

## 📝 Convenciones de Documentación

### Formato de Código

- Usar bloques de código con lenguaje especificado
- Incluir comentarios explicativos en español
- Proporcionar contexto de dónde va el código

### Enlaces

- Links relativos entre documentos
- Links absolutos para recursos externos
- Verificar que todos los links funcionen

### Ejemplos

- Ejemplos completos y funcionales
- Incluir casos de uso reales
- Mostrar tanto código como resultado esperado

## 🚀 Actualización de Documentación

Al añadir nuevas features:

1. Crear/actualizar documento en la categoría correspondiente
2. Actualizar este README con link al nuevo documento
3. Añadir referencias cruzadas en documentos relacionados
4. Actualizar `AGENTS.md` si es necesario

## 📞 Soporte

Para dudas sobre la documentación:

- Revisa primero el índice de contenidos
- Busca por tags o categorías
- Consulta documentos relacionados
- Verifica los ejemplos de código

---

**Versión**: 1.0.0  
**Última Actualización**: 2026-02-09  
**Mantenedor**: Alejandro Mira
