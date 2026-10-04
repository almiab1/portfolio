import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  projects: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
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
      type: z
        .enum(['web', 'mobile', 'iot', 'ai', 'data', 'api', 'desktop', 'other'])
        .default('other'),
      status: z.enum(['completed', 'in-progress', 'archived', 'maintained']).default('completed'),
      duration: z.string().optional(), // e.g. "3 meses", "1 año"
      featured: z.boolean().default(false), // Proyectos destacados
      priority: z.number().min(0).max(10).default(5), // Para ordenamiento
      context: z.enum(['personal', 'company', 'research', 'academic']).optional(), // Contexto del proyecto

      links: z
        .object({
          demo: z.string().url().optional(),
          repo: z.string().url().optional(),
          external: z.string().url().optional(),
        })
        .partial(),
      cover: z.object({ src: z.string(), alt: z.string() }).partial(),
      gallery: z.array(z.object({ src: z.string(), alt: z.string() })).optional(), // Galería de imágenes del proyecto
      seo: z.object({ title: z.string().optional(), description: z.string().optional() }).partial(),
    }),
  }),
  posts: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
    schema: z.object({
      title: z.string(),
      excerpt: z.string().optional(),
      date: z.string(),
      updated: z.string().optional(),
      tags: z.array(z.string()).default([]),
      cover: z.object({ src: z.string(), alt: z.string() }).partial(),
    }),
  }),
  talks: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/talks' }),
    schema: z.object({
      title: z.string(),
      event: z.string(),
      date: z.string(),
      location: z.string().optional(),
      slides: z.string().url().optional(),
      video: z.string().url().optional(),
      abstract: z.string().optional(),
    }),
  }),
  oss: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/oss' }),
    schema: z.object({
      title: z.string(),
      repo: z.string().url(),
      description: z.string().optional(),
      tags: z.array(z.string()).default([]),
    }),
  }),
};
