// ABOUTME: Verifies analytics for public portfolio links and catalogue filters.
// ABOUTME: Ensures private interactions and unexpected properties are discarded.
import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { listenForPortfolioEvents, sanitizePortfolioEvent } from './portfolio-events';

const capture = vi.fn();
let cleanup: () => void;

beforeEach(() => {
  document.documentElement.lang = 'es';
  capture.mockClear();
  cleanup = listenForPortfolioEvents(capture);
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('lang');
});

function click(selector: string) {
  fireEvent.click(document.querySelector(selector)!);
}

it('tracks case and outbound link activations from nested icons across content swaps', () => {
  document.body.innerHTML = `
    <a data-project-card data-project-slug="glio-ia" data-project-type="ai"
       data-project-featured="true" data-search="private query"><svg><path /></svg></a>
  `;
  click('path');
  document.body.innerHTML = `
    <a data-project-link data-project-slug="glio-ia" data-link-type="repository"><span>Repo</span></a>
  `;
  click('span');
  click('span');
  expect(capture.mock.calls).toEqual([
    ['project_detail_opened', { project_slug: 'glio-ia', project_type: 'ai', is_featured: true }],
    ['project_link_opened', { project_slug: 'glio-ia', link_type: 'repository' }],
    ['project_link_opened', { project_slug: 'glio-ia', link_type: 'repository' }],
  ]);
});

it('tracks contact methods repeatedly and separates CV edition from interface locale', () => {
  document.documentElement.lang = 'en';
  document.body.innerHTML = `
    <a data-contact-method="email"><span>private@example.com</span></a>
    <a data-cv-edition="es" download><span>Descargar</span></a>
    <a data-cv-edition="es" id="preview">Preview</a>
  `;
  click('[data-contact-method] span');
  click('[data-contact-method] span');
  click('[download] span');
  click('#preview');
  expect(capture.mock.calls).toEqual([
    ['contact_method_opened', { method: 'email' }],
    ['contact_method_opened', { method: 'email' }],
    ['cv_downloaded', { locale: 'en', cv_locale: 'es' }],
  ]);
});

it('tracks the catalogue type controls while ignoring query-only actions', () => {
  document.body.innerHTML = `
    <project-catalog>
      <input type="search">
      <select data-project-type-filter>
        <option value="">All</option><option value="ai">AI</option>
      </select>
      <button data-clear-project-type><span>Clear</span></button>
      <a data-project-type-shortcut="web">Web</a>
    </project-catalog>
  `;
  const select = document.querySelector('select')!;
  document.querySelector('button')!.addEventListener('click', () => {
    select.value = '';
  });
  fireEvent.input(document.querySelector('input')!, { target: { value: 'private query' } });
  click('button span');
  fireEvent.change(select, { target: { value: 'ai' } });
  click('a');
  click('button span');
  expect(capture.mock.calls).toEqual([
    ['project_filter_changed', { project_type: 'ai' }],
    ['project_filter_changed', { project_type: 'web' }],
    ['project_filter_changed', { action: 'cleared' }],
  ]);
});

it('ignores private ancestors and descendants, malformed marked links, and clicks after cleanup', () => {
  document.body.innerHTML = `
    <a data-contact-method="email"><span data-analytics-private>Private</span></a>
    <div data-analytics-private><a data-contact-method="email">Mail</a></div>
    <a data-project-link data-project-slug="private query" data-link-type="repository">Bad slug</a>
    <a data-contact-method="email" id="public">Mail</a>
  `;
  click('span');
  click('div a');
  click('[data-project-link]');
  cleanup();
  click('#public');
  expect(capture).not.toHaveBeenCalled();
});

it('sanitizes outgoing properties and rejects unknown event names and values', () => {
  expect(
    sanitizePortfolioEvent('project_filter_changed', {
      project_type: 'ai',
      query: 'private query',
      $current_url: 'https://example.com/work?q=private+query',
    }),
  ).toEqual({ project_type: 'ai' });
  expect(
    sanitizePortfolioEvent('project_filter_changed', { project_type: 'unknown' }),
  ).toBeUndefined();
  expect(sanitizePortfolioEvent('$autocapture', { method: 'email' })).toBeUndefined();
});
