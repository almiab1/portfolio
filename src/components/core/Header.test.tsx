// ABOUTME: Unit tests for Header component view transition persistence behavior.
// ABOUTME: Tests astro:after-swap event handling, locale/path state sync, and mobile menu closing.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

// Mock LanguageSwitcher to avoid side effects
vi.mock('@/components/LanguageSwitcher', () => ({
  default: ({ currentLocale }: { currentLocale: string }) => (
    <div data-testid="language-switcher" data-locale={currentLocale}>
      Language: {currentLocale}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  X: () => <span data-testid="x-icon">X</span>,
}));

describe('Header', () => {
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

  it('renders with default Spanish locale', () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    const switchers = within(header).getAllByTestId('language-switcher');
    expect(switchers[0]).toHaveAttribute('data-locale', 'es');
  });

  it('renders with English locale when passed as prop', () => {
    render(<Header currentLocale="en" currentPath="/en" />);

    const header = screen.getByRole('banner');
    const switchers = within(header).getAllByTestId('language-switcher');
    expect(switchers[0]).toHaveAttribute('data-locale', 'en');

    // Logo link should point to /en
    const logoLinks = within(header).getAllByText('Alejandro Mira');
    expect(logoLinks[0].closest('a')).toHaveAttribute('href', '/en');
  });

  it('updates locale and path on astro:after-swap event', () => {
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');

    // Verify initial state is Spanish
    const switcherBefore = within(header).getAllByTestId('language-switcher')[0];
    expect(switcherBefore).toHaveAttribute('data-locale', 'es');

    // Simulate navigation to English page
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/en/work' },
    });

    act(() => {
      document.dispatchEvent(new Event('astro:after-swap'));
    });

    // Verify locale updated to English
    const switcherAfter = within(header).getAllByTestId('language-switcher')[0];
    expect(switcherAfter).toHaveAttribute('data-locale', 'en');

    // Logo link should now point to /en
    const logoLinks = within(header).getAllByText('Alejandro Mira');
    expect(logoLinks[0].closest('a')).toHaveAttribute('href', '/en');
  });

  it('updates locale from English to Spanish on astro:after-swap', () => {
    render(<Header currentLocale="en" currentPath="/en/work" />);

    const header = screen.getByRole('banner');

    // Simulate navigation to Spanish page
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/work' },
    });

    act(() => {
      document.dispatchEvent(new Event('astro:after-swap'));
    });

    // Verify locale updated to Spanish
    const switcher = within(header).getAllByTestId('language-switcher')[0];
    expect(switcher).toHaveAttribute('data-locale', 'es');
    const logoLinks = within(header).getAllByText('Alejandro Mira');
    expect(logoLinks[0].closest('a')).toHaveAttribute('href', '/');
  });

  it('closes mobile menu on astro:after-swap', async () => {
    const user = userEvent.setup();
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');

    // Open mobile menu — there are multiple buttons (nav links rendered as Button asChild),
    // find the one with the menu icon
    const menuButton = within(header).getByTestId('menu-icon').closest('button')!;
    await user.click(menuButton);

    // Verify menu is open (X icon visible)
    expect(within(header).getByTestId('x-icon')).toBeInTheDocument();

    // Simulate navigation via view transition
    act(() => {
      document.dispatchEvent(new Event('astro:after-swap'));
    });

    // Verify menu is closed (Menu icon visible again)
    expect(within(header).getByTestId('menu-icon')).toBeInTheDocument();
  });

  it('generates correct nav items for Spanish home page', () => {
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');
    const links = within(header).getAllByRole('link');

    // Anchor links on home page should not have prefix
    const aboutLinks = links.filter((a) => a.getAttribute('href') === '#about');
    expect(aboutLinks.length).toBeGreaterThan(0);

    const contactLinks = links.filter((a) => a.getAttribute('href') === '#contact');
    expect(contactLinks.length).toBeGreaterThan(0);
  });

  it('generates correct nav items for English non-home page', () => {
    render(<Header currentLocale="en" currentPath="/en/work" />);

    const header = screen.getByRole('banner');
    const links = within(header).getAllByRole('link');

    // Anchor links on non-home English page should have /en prefix
    const aboutLinks = links.filter((a) => a.getAttribute('href') === '/en#about');
    expect(aboutLinks.length).toBeGreaterThan(0);

    // Work link should be /en/work
    const workLinks = links.filter((a) => a.getAttribute('href') === '/en/work');
    expect(workLinks.length).toBeGreaterThan(0);
  });

  it('updates nav items after astro:after-swap changes locale', () => {
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');

    // Navigate to English work page
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/en/work' },
    });

    act(() => {
      document.dispatchEvent(new Event('astro:after-swap'));
    });

    // Verify nav items now use English paths
    const links = within(header).getAllByRole('link');
    const workLinks = links.filter((a) => a.getAttribute('href') === '/en/work');
    expect(workLinks.length).toBeGreaterThan(0);
  });

  it('generates anchor links with / prefix on Spanish non-home pages', () => {
    render(<Header currentLocale="es" currentPath="/work" />);

    const header = screen.getByRole('banner');
    const links = within(header).getAllByRole('link');

    // Anchor links on non-home Spanish page should prefix with /
    const aboutLinks = links.filter((a) => a.getAttribute('href') === '/#about');
    expect(aboutLinks.length).toBeGreaterThan(0);

    const contactLinks = links.filter((a) => a.getAttribute('href') === '/#contact');
    expect(contactLinks.length).toBeGreaterThan(0);
  });

  it('generates anchor links with / prefix on Spanish project detail pages', () => {
    render(<Header currentLocale="es" currentPath="/work/my-project" />);

    const header = screen.getByRole('banner');
    const links = within(header).getAllByRole('link');

    const aboutLinks = links.filter((a) => a.getAttribute('href') === '/#about');
    expect(aboutLinks.length).toBeGreaterThan(0);

    const contactLinks = links.filter((a) => a.getAttribute('href') === '/#contact');
    expect(contactLinks.length).toBeGreaterThan(0);
  });

  it('mobile menu has opaque background and shadow', async () => {
    const user = userEvent.setup();
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');
    const menuButton = within(header).getByTestId('menu-icon').closest('button')!;
    await user.click(menuButton);

    const mobileNav = document.getElementById('mobile-nav');
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav).toHaveClass('bg-background');
    expect(mobileNav).toHaveClass('shadow-lg');
  });

  it('header becomes opaque when mobile menu is open', async () => {
    const user = userEvent.setup();
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');

    // Before opening menu (not scrolled), header is transparent
    expect(header).toHaveClass('bg-transparent');

    // Open mobile menu
    const menuButton = within(header).getByTestId('menu-icon').closest('button')!;
    await user.click(menuButton);

    // Header should now have opaque background
    expect(header).toHaveClass('bg-background/95');
    expect(header).not.toHaveClass('bg-transparent');
  });

  it('hamburger button has correct ARIA attributes when closed', () => {
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');
    const menuButton = within(header).getByTestId('menu-icon').closest('button')!;

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-nav');
    expect(menuButton).toHaveAttribute('aria-label', 'Open menu');
  });

  it('hamburger button has correct ARIA attributes when open', async () => {
    const user = userEvent.setup();
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');
    const menuButton = within(header).getByTestId('menu-icon').closest('button')!;
    await user.click(menuButton);

    // After opening, find the button with X icon
    const closeButton = within(header).getByTestId('x-icon').closest('button')!;
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    expect(closeButton).toHaveAttribute('aria-controls', 'mobile-nav');
    expect(closeButton).toHaveAttribute('aria-label', 'Close menu');
  });

  it('anchor links update from home to non-home after astro:after-swap', () => {
    render(<Header currentLocale="es" currentPath="/" />);

    const header = screen.getByRole('banner');

    // On home, anchors are just #about
    let links = within(header).getAllByRole('link');
    expect(links.some((a) => a.getAttribute('href') === '#about')).toBe(true);

    // Navigate to /work via view transition
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/work' },
    });

    act(() => {
      document.dispatchEvent(new Event('astro:after-swap'));
    });

    // Now anchors should be /#about
    links = within(header).getAllByRole('link');
    expect(links.some((a) => a.getAttribute('href') === '/#about')).toBe(true);
    expect(links.some((a) => a.getAttribute('href') === '/#contact')).toBe(true);
  });

  it('cleans up astro:after-swap listener on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<Header />);

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
