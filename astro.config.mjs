// @ts-check
import { env } from 'node:process';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const assistantProxy = env.PORTFOLIO_ASSISTANT_LOCAL_URL;

// https://astro.build/config
export default defineConfig({
  site: 'https://alejandromira.com',
  vite: {
    plugins: [tailwindcss()],
    server: assistantProxy ? { proxy: { '/api/chat': assistantProxy } } : undefined,
  },
  integrations: [react(), mdx(), sitemap()],
  prefetch: true,
  // Keep whitespace between inline elements (Astro 7 defaults to 'jsx', which strips it)
  compressHTML: true,
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
    fallback: {
      en: 'es',
    },
  },
});
