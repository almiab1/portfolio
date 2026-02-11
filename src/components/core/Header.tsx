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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      setIsMobileMenuOpen(false);
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
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? 'border-b border-border bg-background/95 backdrop-blur-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a
            href={locale === 'es' ? '/' : '/en'}
            className="text-xl font-bold text-foreground transition-colors hover:text-primary"
          >
            Alejandro Mira
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {item.label}
              </a>
            ))}
            <LanguageSwitcher currentLocale={locale} />
            <a
              href={
                locale === 'es'
                  ? '/cv/esp/CV_MiraAbad_Alejandro.pdf'
                  : '/cv/eng/CV_MiraAbad_Alejandro.pdf'
              }
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {translate('nav.downloadCV')}
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div
            id="mobile-nav"
            className="mt-4 border-t border-border bg-background pb-4 shadow-lg md:hidden"
          >
            <div className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2">
                <LanguageSwitcher currentLocale={locale} />
              </div>
              <a
                href={
                  locale === 'es'
                    ? '/cv/esp/CV_MiraAbad_Alejandro.pdf'
                    : '/cv/eng/CV_MiraAbad_Alejandro.pdf'
                }
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="default"
                  className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {translate('nav.downloadCV')}
                </Button>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
