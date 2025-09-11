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
      links: z.object({ demo: z.string().url().optional(), repo: z.string().url().optional() }).partial(),
      cover: z.object({ src: z.string(), alt: z.string() }).partial(),
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
