// ABOUTME: Language switcher component that toggles between ES and EN locales.
// ABOUTME: Syncs path on astro:after-swap to stay correct with view transitions.
'use client';

import { useLanguageSwitcherPath } from '@/hooks/use-language-switcher-path';
import type { Language } from '@/i18n/translations';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLocale?: Language;
  initialPath?: string;
}

export default function LanguageSwitcher({
  currentLocale = 'es',
  initialPath,
}: LanguageSwitcherProps) {
  const path = useLanguageSwitcherPath(initialPath);

  const languages = [
    { code: 'es', label: 'ES', fullName: 'Español' },
    { code: 'en', label: 'EN', fullName: 'English' },
  ] as const;

  return (
    <div className="flex items-center gap-1">
      <Globe className="mr-1 size-4 text-muted-foreground" aria-hidden="true" />
      {languages.map((lang) => {
        const isActive = currentLocale === lang.code;
        const href = lang.code === 'es' ? path : '/en' + path;

        return (
          <a
            key={lang.code}
            href={href}
            title={lang.fullName}
            aria-label={lang.fullName}
            hrefLang={lang.code}
            lang={lang.code}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-grid min-h-11 min-w-11 place-items-center rounded-md text-xs font-medium ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {lang.label}
          </a>
        );
      })}
    </div>
  );
}
