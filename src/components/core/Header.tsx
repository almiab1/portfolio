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

  const lang = currentLocale as Language;
  const translate = t(lang);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determinar si estamos en la home
  const isHome = currentPath === '/' || currentPath === '/en' || currentPath === '/en/';

  // Prefijo base para links según idioma
  const basePrefix = currentLocale === 'es' ? '' : '/en';

  // Si no estamos en home, necesitamos el prefijo completo para las anclas
  const anchorPrefix = isHome ? '' : currentLocale === 'es' ? '' : '/en';

  const navItems = [
    { href: currentLocale === 'es' ? '/' : '/en', label: translate('nav.home'), isPage: true },
    { href: `${basePrefix}/work`, label: translate('nav.work'), isPage: true },
    { href: `${anchorPrefix}#about`, label: translate('nav.about'), isPage: false },
    { href: `${anchorPrefix}#skills`, label: translate('nav.skills'), isPage: false },
    { href: `${anchorPrefix}#contact`, label: translate('nav.contact'), isPage: false },
  ];

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'border-b border-border bg-background/95 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a
            href={currentLocale === 'es' ? '/' : '/en'}
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
            <LanguageSwitcher currentLocale={currentLocale} />
            <a
              href={currentLocale === 'es' ? '/cv/esp/CV_MiraAbad_Alejandro.pdf' : '/cv/eng/CV_MiraAbad_Alejandro.pdf'}
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
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="mt-4 border-t border-border pb-4 md:hidden">
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
                <LanguageSwitcher currentLocale={currentLocale} />
              </div>
              <a
                href={currentLocale === 'es' ? '/cv/esp/CV_MiraAbad_Alejandro.pdf' : '/cv/eng/CV_MiraAbad_Alejandro.pdf'}
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
