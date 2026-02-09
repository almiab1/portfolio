'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLocale?: string;
}

export default function LanguageSwitcher({ currentLocale = 'es' }: LanguageSwitcherProps) {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
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
        const href = getLocalizedPath(lang.code);

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
            <a href={href} title={lang.fullName}>
              {lang.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}
