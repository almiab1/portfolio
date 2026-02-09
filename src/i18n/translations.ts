/**
 * Helper para obtener traducciones en componentes React
 */

import { ui } from './ui';

export type Language = 'es' | 'en';
export type TranslationKey = keyof (typeof ui)['es'];

export const translations = {
  es: ui.es,
  en: ui.en,
};

export function getTranslation(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.es[key];
}

export function t(lang: Language) {
  return (key: TranslationKey): string => getTranslation(lang, key);
}
