// ABOUTME: Reads the current portfolio route for the language switcher.
// ABOUTME: Keeps catalogue filters in locale links as the browser URL changes.
import { useEffect, useState } from 'react';
import { CATALOG_FILTERS_CHANGE, catalogSearch, readCatalogFilters } from '@/lib/catalog-filters';

function switcherPath(pathname: string, search = '') {
  const path = pathname.replace(/^\/(en|es)(\/|$)/, '/');
  return /^\/work(\/|$)/.test(path) ? path + catalogSearch(readCatalogFilters(search)) : path;
}

export function useLanguageSwitcherPath(initialPath?: string) {
  const [path, setPath] = useState(() =>
    switcherPath(initialPath ?? (typeof window === 'undefined' ? '/' : window.location.pathname)),
  );

  useEffect(() => {
    const syncPath = () => {
      const { pathname, search } = window.location;
      setPath(switcherPath(pathname, search));
    };
    syncPath();
    document.addEventListener('astro:after-swap', syncPath);
    document.addEventListener(CATALOG_FILTERS_CHANGE, syncPath);
    window.addEventListener('popstate', syncPath);
    return () => {
      document.removeEventListener('astro:after-swap', syncPath);
      document.removeEventListener(CATALOG_FILTERS_CHANGE, syncPath);
      window.removeEventListener('popstate', syncPath);
    };
  }, []);

  return path;
}
