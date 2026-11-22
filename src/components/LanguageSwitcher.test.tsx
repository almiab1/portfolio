// ABOUTME: Unit tests for LanguageSwitcher component.
// ABOUTME: Tests path computation, locale switching, and astro:after-swap sync.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { CATALOG_FILTERS_CHANGE } from '@/lib/catalog-filters';
import LanguageSwitcher from './LanguageSwitcher';

// Mock lucide-react Globe icon
vi.mock('lucide-react', () => ({
  Globe: () => <span data-testid="globe-icon">Globe</span>,
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/' },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders ES and EN language buttons', () => {
    render(<LanguageSwitcher currentLocale="es" />);

    expect(screen.getByText('ES')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('generates correct paths from Spanish home page', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/' },
    });

    render(<LanguageSwitcher currentLocale="es" />);

    const esLink = screen.getByText('ES').closest('a');
    const enLink = screen.getByText('EN').closest('a');

    expect(esLink).toHaveAttribute('href', '/');
    expect(enLink).toHaveAttribute('href', '/en/');
  });

  it('generates correct paths from English work page', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/en/work' },
    });

    render(<LanguageSwitcher currentLocale="en" />);

    const esLink = screen.getByText('ES').closest('a');
    const enLink = screen.getByText('EN').closest('a');

    expect(esLink).toHaveAttribute('href', '/work');
    expect(enLink).toHaveAttribute('href', '/en/work');
  });

  it('generates correct paths from Spanish work page', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/work' },
    });

    render(<LanguageSwitcher currentLocale="es" />);

    const esLink = screen.getByText('ES').closest('a');
    const enLink = screen.getByText('EN').closest('a');

    expect(esLink).toHaveAttribute('href', '/work');
    expect(enLink).toHaveAttribute('href', '/en/work');
  });

  it('updates path on astro:after-swap event', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/' },
    });

    render(<LanguageSwitcher currentLocale="es" />);

    // Initially on home, EN link should point to /en/
    const enLink = screen.getByText('EN').closest('a');
    expect(enLink).toHaveAttribute('href', '/en/');

    // Simulate navigation to /work via view transition
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/work' },
    });

    act(() => {
      document.dispatchEvent(new Event('astro:after-swap'));
    });

    // EN link should now point to /en/work
    expect(enLink).toHaveAttribute('href', '/en/work');
  });

  it('keeps only catalogue filters when the current URL changes', () => {
    window.location.pathname = '/en/work/glio-ia';
    window.location.search = '?q=PyTorch&type=ai&other=ignored';

    render(<LanguageSwitcher currentLocale="en" initialPath="/en/work/glio-ia" />);

    const esLink = screen.getByRole('link', { name: 'Español' });
    const enLink = screen.getByRole('link', { name: 'English' });
    expect(esLink).toHaveAttribute('href', '/work/glio-ia?q=PyTorch&type=ai');
    expect(enLink).toHaveAttribute('href', '/en/work/glio-ia?q=PyTorch&type=ai');

    window.location.search = '?type=web';
    act(() => {
      document.dispatchEvent(new Event(CATALOG_FILTERS_CHANGE));
    });
    expect(esLink).toHaveAttribute('href', '/work/glio-ia?type=web');

    window.location.pathname = '/en/experience';
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(esLink).toHaveAttribute('href', '/experience');
    expect(enLink).toHaveAttribute('href', '/en/experience');
  });

  it('cleans up astro:after-swap listener on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<LanguageSwitcher currentLocale="es" />);

    // Verify listener was added
    const afterSwapCalls = addSpy.mock.calls.filter(([event]) => event === 'astro:after-swap');
    expect(afterSwapCalls.length).toBeGreaterThanOrEqual(1);

    const handler = afterSwapCalls[0][1];

    unmount();

    // Verify listener was removed with the same handler
    const removeAfterSwapCalls = removeSpy.mock.calls.filter(
      ([event]) => event === 'astro:after-swap',
    );
    expect(removeAfterSwapCalls.length).toBeGreaterThanOrEqual(1);
    expect(removeAfterSwapCalls[0][1]).toBe(handler);
  });
});
