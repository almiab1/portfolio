// ABOUTME: Verifies that streamed assistant destinations become localized cards.
// ABOUTME: Keeps unknown destination IDs and arbitrary URLs out of the rendered chat.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import AssistantDestination from './AssistantDestination';

afterEach(cleanup);

test.each([
  { lang: 'es', label: 'Leer el caso GLIO-IA', path: '/work/glio-ia' },
  { lang: 'en', label: 'Read the GLIO-IA case study', path: '/en/work/glio-ia' },
] as const)('renders the GLIO-IA project card in $lang', ({ lang, label, path }) => {
  render(<AssistantDestination destination="glio" lang={lang} />);

  expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', path);
  expect(screen.getByText(/^GLIO-IA ·/)).toBeVisible();
});

test('renders the contact app using the same catalog', () => {
  render(<AssistantDestination destination="contact" lang="en" />);

  expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/contact');
});

test.each([undefined, '__proto__', 'https://example.com'])(
  'rejects an unknown destination %s',
  (destination) => {
    render(<AssistantDestination destination={destination} lang="es" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  },
);
