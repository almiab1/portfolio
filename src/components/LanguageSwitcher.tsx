// ABOUTME: Language switcher component that toggles between ES and EN locales.
// ABOUTME: Syncs path on astro:after-swap to stay correct with view transitions.
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CATALOG_FILTERS_CHANGE, catalogSearch, readCatalogFilters } from '@/lib/catalog-filters';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLocale?: string;
  initialPath?: string;
}

export default function LanguageSwitcher({
  currentLocale = 'es',
  initialPath,
}: LanguageSwitcherProps) {
  const [currentPath, setCurrentPath] = useState(
    () => initialPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
  );

  const [filterSearch, setFilterSearch] = useState('');

  // Sync path from window.location after view transition swaps the DOM.
  // This keeps the switcher links correct when transition:persist prevents re-mounting.
  useEffect(() => {
    const handleSwap = () => {
      const { pathname, search } = window.location;
      setCurrentPath(pathname);
      const isProjectPath = /^\/(en\/)?work(\/|$)/.test(pathname);
      setFilterSearch(isProjectPath ? catalogSearch(readCatalogFilters(search)) : '');
    };
    handleSwap();
    document.addEventListener('astro:after-swap', handleSwap);
    document.addEventListener(CATALOG_FILTERS_CHANGE, handleSwap);
    window.addEventListener('popstate', handleSwap);
    return () => {
      document.removeEventListener('astro:after-swap', handleSwap);
      document.removeEventListener(CATALOG_FILTERS_CHANGE, handleSwap);
      window.removeEventListener('popstate', handleSwap);
    };
  }, []);

  const languages = [
    { code: 'es', label: 'ES', fullName: 'Español' },
    { code: 'en', label: 'EN', fullName: 'English' },
  ];

  const getLocalizedPath = (targetLang: string) => {
    // Eliminar el prefijo de idioma actual
    let path = currentPath;

    // Si la ruta comienza con /en o /es (seguido de / o fin de cadena), quitarlo
    if (path === '/en' || path === '/es' || path.startsWith('/en/') || path.startsWith('/es/')) {
      path = path.replace(/^\/(en|es)(\/|$)/, '/') || '/';
    }

    // Si el idioma objetivo es español (default), no añadir prefijo
    if (targetLang === 'es') {
      return path;
    }

    // Para otros idiomas, añadir el prefijo
    return `/${targetLang}${path}`;
  };

  return (
    <div className="flex items-center gap-1">
      <Globe className="mr-1 h-4 w-4 text-muted-foreground" />
      {languages.map((lang) => {
        const isActive = currentLocale === lang.code;
        const href = getLocalizedPath(lang.code) + filterSearch;

        return (
          <Button
            key={lang.code}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-3 text-xs font-medium ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            asChild
          >
            <a
              href={href}
              title={lang.fullName}
              aria-label={lang.fullName}
              hrefLang={lang.code}
              lang={lang.code}
              aria-current={isActive ? 'page' : undefined}
            >
              {lang.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}
