/**
 * Utilidades para contenido traducido en colecciones
 */

import { getCollection } from 'astro:content';

export type Language = 'es' | 'en';

/**
 * Filtra proyectos por idioma
 */
export async function getProjectsByLang(lang: Language) {
  const allProjects = await getCollection('projects');
  return allProjects.filter((project) => project.data.lang === lang);
}

/**
 * Obtiene un proyecto y su traducción si existe
 */
export async function getProjectWithTranslation(slug: string, lang: Language) {
  const allProjects = await getCollection('projects');

  // Los slugs ahora incluyen el idioma: es/cookobot, en/cookobot
  // Extraer el slug base sin el prefijo de idioma
  const slugBase = slug.replace(/^(es|en)\//, '');
  const fullSlug = `${lang}/${slugBase}`;

  const project = allProjects.find((p) => p.id === fullSlug);

  if (!project) {
    return { project: null, translation: null };
  }

  // Buscar traducción usando translationKey o el slug base
  const translationKey = project.data.translationKey || slugBase;
  const otherLang = lang === 'es' ? 'en' : 'es';

  const translation = allProjects.find((p) => {
    const pSlugBase = p.id.replace(/^(es|en)\//, '');
    return (
      (p.data.translationKey === translationKey || pSlugBase === slugBase) &&
      p.data.lang === otherLang
    );
  });

  return { project, translation };
}

/**
 * Verifica si existe una traducción para un proyecto
 */
export async function hasTranslation(slug: string, fromLang: Language): Promise<boolean> {
  const allProjects = await getCollection('projects');

  // Extraer slug base sin prefijo de idioma
  const slugBase = slug.replace(/^(es|en)\//, '');
  const fullSlug = `${fromLang}/${slugBase}`;

  const project = allProjects.find((p) => p.id === fullSlug);

  if (!project) return false;

  const translationKey = project.data.translationKey || slugBase;
  const toLang = fromLang === 'es' ? 'en' : 'es';

  return allProjects.some((p) => {
    const pSlugBase = p.id.replace(/^(es|en)\//, '');
    return (
      (p.data.translationKey === translationKey || pSlugBase === slugBase) && p.data.lang === toLang
    );
  });
}

/**
 * Obtiene todos los posts por idioma
 */
export async function getPostsByLang(lang: Language) {
  const allPosts = await getCollection('posts');
  return allPosts.filter((post) => {
    // `lang` defaults to Spanish in the collection schema
    return post.data.lang === lang;
  });
}

/**
 * Obtiene todas las charlas por idioma
 */
export async function getTalksByLang(lang: Language) {
  const allTalks = await getCollection('talks');
  return allTalks.filter((talk) => {
    return talk.data.lang === lang;
  });
}
