import { defineCollection, z } from 'astro:content';

export const collections = {
  projects: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      summary: z.string(),
      date: z.string(),
      updated: z.string().optional(),
      tags: z.array(z.string()).default([]),
      tech: z.array(z.string()).default([]),
      role: z.string().optional(),
      lang: z.enum(['es', 'en']).default('es'), // Idioma del proyecto
      translationKey: z.string().optional(), // Clave para vincular traducciones
      
      // Nuevos campos mejorados
      type: z.enum(['web', 'mobile', 'iot', 'ai', 'data', 'api', 'desktop', 'other']).default('other'),
      status: z.enum(['completed', 'in-progress', 'archived', 'maintained']).default('completed'),
      duration: z.string().optional(), // e.g. "3 meses", "1 año"
      featured: z.boolean().default(false), // Proyectos destacados
      priority: z.number().min(0).max(10).default(5), // Para ordenamiento
      
      links: z.object({ demo: z.string().url().optional(), repo: z.string().url().optional() }).partial(),
      cover: z.object({ src: z.string(), alt: z.string() }).partial(),
      gallery: z.array(z.object({ src: z.string(), alt: z.string() })).optional(), // Galería de imágenes del proyecto
      seo: z.object({ title: z.string().optional(), description: z.string().optional() }).partial()
    })
  }),
  posts: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      excerpt: z.string().optional(),
      date: z.string(),
      updated: z.string().optional(),
      tags: z.array(z.string()).default([]),
      cover: z.object({ src: z.string(), alt: z.string() }).partial()
    })
  }),
  talks: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(), event: z.string(), date: z.string(),
      location: z.string().optional(), slides: z.string().url().optional(),
      video: z.string().url().optional(), abstract: z.string().optional()
    })
  }),
  oss: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(), repo: z.string().url(),
      description: z.string().optional(), tags: z.array(z.string()).default([])
    })
  }),
};
