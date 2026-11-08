// ABOUTME: Main navigation header component with mobile menu support.
// ABOUTME: Handles transition:persist by syncing locale/path from window.location on astro:after-swap.
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { t, type Language } from '@/i18n/translations';

interface HeaderProps {
  currentLocale?: string;
  currentPath?: string;
}

function Header({ currentLocale = 'es', currentPath = '/' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState<'closed' | 'pointer' | 'keyboard'>('closed');
  const isMobileMenuOpen = mobileMenu !== 'closed';

  // Internal state for locale/path — updated on astro:after-swap when
  // the Header is kept alive across navigations via transition:persist.
  const [locale, setLocale] = useState(currentLocale);
  const [path, setPath] = useState(currentPath);

  const lang = locale as Language;
  const translate = t(lang);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync locale/path from window.location after view transition swaps the DOM.
  // This keeps the Header in sync when transition:persist prevents re-mounting.
  useEffect(() => {
    const handleSwap = () => {
      const newPath = window.location.pathname;
      const newLocale = newPath.startsWith('/en') ? 'en' : 'es';
      setPath(newPath);
      setLocale(newLocale);
      setMobileMenu('closed');
    };
    document.addEventListener('astro:after-swap', handleSwap);
    return () => document.removeEventListener('astro:after-swap', handleSwap);
  }, []);

  // Determinar si estamos en la home
  const isHome = path === '/' || path === '/en' || path === '/en/';

  // Prefijo base para links según idioma
  const basePrefix = locale === 'es' ? '' : '/en';

  // When not on home, prefix anchors with the home path so they navigate back
  const anchorPrefix = isHome ? '' : locale === 'es' ? '/' : '/en';

  const navItems = [
    { href: locale === 'es' ? '/' : '/en', label: translate('nav.home'), isPage: true },
    { href: `${basePrefix}/work`, label: translate('nav.work'), isPage: true },
    { href: `${anchorPrefix}#about`, label: translate('nav.about'), isPage: false },
    { href: `${anchorPrefix}#contact`, label: translate('nav.contact'), isPage: false },
  ];

  return (
    <header
      className={`portfolio-header fixed top-0 z-50 w-full transition-colors duration-150 ${
        isScrolled || isMobileMenuOpen ? 'bg-background/95 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <nav className="portfolio-wrap py-2.5" aria-label={translate('nav.label')}>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <a
            href={locale === 'es' ? '/' : '/en'}
            className="inline-flex min-h-11 items-center gap-2 text-base font-bold text-foreground transition-colors hover:text-primary"
          >
            <span className="portfolio-monogram" aria-hidden="true">
              AM
            </span>
            <span>Alejandro Mira</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-4 lg:flex xl:space-x-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={
                  item.isPage && path.replace(/\/$/, '') === item.href.replace(/\/$/, '')
                    ? 'page'
                    : undefined
                }
                className="portfolio-nav-link"
              >
                {item.label}
              </a>
            ))}
            <LanguageSwitcher currentLocale={locale} initialPath={path} />
            <a
              href="/cv/eng/CV_MiraAbad_Alejandro.pdf"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="portfolio-button">{translate('profile.cv')}</span>
            </a>
          </div>

          {!isMobileMenuOpen && (
            <div className="ml-auto lg:hidden">
              <a
                href={`${basePrefix}/work`}
                className="portfolio-nav-link"
                aria-current={path.replace(/\/$/, '') === `${basePrefix}/work` ? 'page' : undefined}
              >
                {translate('nav.work')}
              </a>
            </div>
          )}
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={(event) => {
              const entry = event.detail > 0 ? 'pointer' : 'keyboard';
              setMobileMenu((current) => (current === 'closed' ? entry : 'closed'));
            }}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={translate(isMobileMenuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div
            id="mobile-nav"
            data-menu-entry={mobileMenu}
            className="mt-4 border-t border-border bg-background pb-4 shadow-lg lg:hidden"
          >
            <div className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={
                    item.isPage && path.replace(/\/$/, '') === item.href.replace(/\/$/, '')
                      ? 'page'
                      : undefined
                  }
                  className="portfolio-nav-link"
                  onClick={() => setMobileMenu('closed')}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2">
                <LanguageSwitcher currentLocale={locale} initialPath={path} />
              </div>
              <a
                href="/cv/eng/CV_MiraAbad_Alejandro.pdf"
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="portfolio-button">{translate('profile.cv')}</span>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
