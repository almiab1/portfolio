# 📸 Guía de Galería de Imágenes

## 🎯 Descripción

Los proyectos ahora soportan **galerías de imágenes** que se muestran en la página individual del proyecto, entre el header y el contenido principal.

---

## 📋 Schema

### Campo `gallery` (opcional)

```typescript
gallery?: Array<{
  src: string;    // Ruta de la imagen
  alt: string;    // Texto alternativo descriptivo
}>
```

---

## 🎨 Comportamiento Visual

### Una sola imagen
- Se muestra en **formato grande** (full width)
- Título: "Vista del Proyecto" / "Project View"
- Border redondeado
- Sin efectos de hover

### Múltiples imágenes
- Se muestra en **grid responsive**:
  - 2 imágenes → 2 columnas en desktop
  - 3 imágenes → 3 columnas en desktop
  - 4 imágenes → 2x2 grid
  - 5+ imágenes → 2-3 columnas según tamaño de pantalla
- Título: "Galería del Proyecto" / "Project Gallery"
- **Efectos hover**:
  - Zoom suave de la imagen (scale 1.05)
  - Overlay negro con gradiente
  - Texto alternativo visible en overlay
  - Shadow al hacer hover

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Una sola imagen (Hero/Screenshot principal)

```yaml
---
title: "Mi Proyecto"
summary: "Descripción del proyecto"
# ... otros campos

gallery:
  - src: "/images/projects/mi-proyecto/main-screenshot.png"
    alt: "Pantalla principal de la aplicación mostrando el dashboard"
---
```

**Resultado visual:**
```
┌─────────────────────────────────────────────────┐
│ Vista del Proyecto                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │         [IMAGEN GRANDE FULL WIDTH]          │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### Ejemplo 2: Galería de 2 imágenes

```yaml
---
title: "Sistema IoT"
summary: "Báscula inteligente con app móvil"
# ... otros campos

gallery:
  - src: "/images/projects/bascula/app-home.png"
    alt: "Pantalla principal de la app mostrando el peso actual"
  - src: "/images/projects/bascula/hardware.jpg"
    alt: "Hardware ESP32 con sensores de peso integrados"
---
```

**Resultado visual:**
```
┌─────────────────────────────────────────────────┐
│ Galería del Proyecto                            │
│                                                 │
│ ┌────────────────────┐  ┌────────────────────┐ │
│ │                    │  │                    │ │
│ │   [IMAGEN 1]       │  │   [IMAGEN 2]       │ │
│ │   (hover: alt)     │  │   (hover: alt)     │ │
│ └────────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### Ejemplo 3: Galería completa (4+ imágenes)

```yaml
---
title: "Videojuego Lost Scout"
summary: "Juego 3D de puzzles y exploración"
# ... otros campos

gallery:
  - src: "/images/projects/lost-scout/gameplay-01.jpg"
    alt: "Vista del nivel principal con puzzles de lógica"
  - src: "/images/projects/lost-scout/gameplay-02.jpg"
    alt: "Escena de exploración en el bosque"
  - src: "/images/projects/lost-scout/gameplay-03.jpg"
    alt: "Sistema de inventario e interacción"
  - src: "/images/projects/lost-scout/gameplay-04.jpg"
    alt: "Boss final del juego en acción"
  - src: "/images/projects/lost-scout/menu.jpg"
    alt: "Menú principal del juego"
---
```

**Resultado visual:**
```
┌─────────────────────────────────────────────────┐
│ Galería del Proyecto                            │
│                                                 │
│ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │ IMG 1  │ │ IMG 2  │ │ IMG 3  │               │
│ └────────┘ └────────┘ └────────┘               │
│                                                 │
│ ┌────────┐ ┌────────┐                          │
│ │ IMG 4  │ │ IMG 5  │                          │
│ └────────┘ └────────┘                          │
└─────────────────────────────────────────────────┘
```

---

## 📐 Especificaciones de Imágenes

### Dimensiones Recomendadas

| Tipo | Ancho | Alto | Ratio | Peso |
|------|-------|------|-------|------|
| **1 imagen (hero)** | 1920px | 1080px | 16:9 | < 500KB |
| **Galería (múltiples)** | 1200px | 800px | 3:2 | < 300KB |
| **Screenshots móvil** | 1080px | 1920px | 9:16 | < 400KB |

### Formatos Soportados
- ✅ `.jpg` / `.jpeg` (recomendado para fotos)
- ✅ `.png` (recomendado para screenshots con texto)
- ✅ `.webp` (óptimo para web, mejor compresión)
- ❌ `.gif` (no recomendado, usar videos en su lugar)

### Optimización
```bash
# Ejemplo de optimización con ImageMagick
convert input.jpg -quality 85 -resize 1200x800 output.jpg

# O con cwebp para WebP
cwebp -q 85 input.jpg -o output.webp
```

---

## 🗂️ Estructura de Carpetas Recomendada

```
public/
└── images/
    └── projects/
        ├── agente-llm/
        │   ├── dashboard.png
        │   ├── architecture.png
        │   └── metrics.png
        ├── bascula-inteligente/
        │   ├── app-home.png
        │   ├── app-charts.png
        │   └── hardware.jpg
        └── lost-scout/
            ├── gameplay-01.jpg
            ├── gameplay-02.jpg
            ├── gameplay-03.jpg
            └── menu.jpg
```

---

## ✅ Buenas Prácticas

### 1. Texto Alternativo (`alt`)

✅ **Correcto** (descriptivo y específico):
```yaml
alt: "Dashboard mostrando métricas en tiempo real con gráficos de barras"
```

❌ **Incorrecto** (genérico):
```yaml
alt: "Screenshot de la app"
```

### 2. Orden de las Imágenes

Ordena las imágenes de forma lógica:
1. **Primero**: Vista principal / hero shot
2. **Segundo**: Características principales
3. **Tercero**: Detalles técnicos
4. **Último**: Detalles secundarios o extras

### 3. Cantidad de Imágenes

- **1 imagen**: Proyectos simples, MVP, prototipos
- **2-3 imágenes**: Proyectos estándar con múltiples vistas
- **4-6 imágenes**: Proyectos complejos con varias características
- **7+ imágenes**: Proyectos grandes (considerar video en su lugar)

### 4. Consistencia Visual

- Mantén un ratio consistente (preferiblemente 16:9 o 3:2)
- Usa el mismo estilo de capturas (mismo tema, colores)
- Optimiza todas al mismo nivel de calidad

---

## 🚫 Sin Galería

Si un proyecto **no tiene imágenes**, simplemente omite el campo `gallery`:

```yaml
---
title: "Mi Proyecto"
summary: "Descripción"
# ... otros campos
# ⚠️ Sin campo gallery
---
```

La sección no se mostrará y el contenido fluirá normalmente.

---

## 🎨 Personalización Avanzada

### Cambiar altura de imágenes en grid

En `/src/pages/work/[slug].astro`, línea ~200:

```astro
<!-- Cambiar h-64 por otro valor -->
<img
  class="h-64 w-full object-cover"  <!-- h-64 = 256px -->
  ...
/>

<!-- Opciones: h-48 (192px), h-56 (224px), h-64 (256px), h-72 (288px) -->
```

### Cambiar distribución del grid

En `/src/pages/work/[slug].astro`, línea ~189-194:

```astro
<div class={`grid gap-4 ${
  data.gallery.length === 2 ? 'md:grid-cols-2' :
  data.gallery.length === 3 ? 'md:grid-cols-3' :
  data.gallery.length === 4 ? 'md:grid-cols-2' :
  'md:grid-cols-2 lg:grid-cols-3'  <!-- Cambiar aquí -->
}`}>
```

---

## 📱 Responsividad

La galería es completamente responsiva:

| Pantalla | Comportamiento |
|----------|----------------|
| **Mobile** (< 768px) | 1 columna |
| **Tablet** (768px - 1024px) | 2 columnas |
| **Desktop** (> 1024px) | 2-3 columnas según cantidad |

---

## 🔗 Referencias

- **Schema**: `src/content.config.ts` - Campo `gallery`
- **Página**: `src/pages/work/[slug].astro` - Sección galería
- **Traducciones**: `src/i18n/ui.ts` - Keys `project.gallery*`

---

## 📊 Ejemplo Completo

```yaml
---
title: "Sistema de Monitoreo IoT"
summary: "Plataforma de sensores con dashboard en tiempo real"
date: "2024-01-15"
lang: "es"
translationKey: "iot-monitoring"
type: "iot"
status: "completed"
duration: "6 meses"
featured: true
priority: 8

tags: ["IoT", "Real-time", "Arduino"]
tech: ["Arduino", "Node.js", "React", "MQTT", "PostgreSQL"]
role: "Full Stack IoT Developer"

# 🎯 GALERÍA DE IMÁGENES
gallery:
  - src: "/images/projects/iot-monitoring/dashboard-main.png"
    alt: "Dashboard principal mostrando sensores en tiempo real"
  - src: "/images/projects/iot-monitoring/sensors-map.png"
    alt: "Mapa interactivo con ubicación de sensores"
  - src: "/images/projects/iot-monitoring/analytics.png"
    alt: "Panel de analytics con gráficos históricos"
  - src: "/images/projects/iot-monitoring/hardware.jpg"
    alt: "Hardware Arduino con sensores conectados"

links:
  demo: "https://demo.iot-monitoring.com"
  repo: "https://github.com/user/iot-monitoring"
---

## Descripción

[... contenido del proyecto ...]
```

---

## 🎉 Resultado Final

Con esta configuración, tu página de proyecto mostrará:

1. ✅ **Header** con título, badges, metadata
2. 📸 **Galería visual** con tus imágenes
3. 📝 **Contenido** detallado del proyecto

Todo optimizado para una presentación profesional y atractiva.
