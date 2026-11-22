// ABOUTME: Exercises the demo and challenge-gated preview from the chat composer.
// ABOUTME: Uses a mock Turnstile widget and intercepts chat requests without network access.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import PortfolioAssistant from './PortfolioAssistant';

interface WidgetCallbacks {
  callback: (token: string) => void;
  'expired-callback': () => void;
}

function stubTurnstile() {
  const render = vi
    .fn<(container: HTMLElement, options: WidgetCallbacks) => string>()
    .mockReturnValue('widget');
  const remove = vi.fn();
  vi.stubGlobal('turnstile', { render, remove });
  return { render, remove };
}

const getQuestion = () => screen.getByRole('textbox');
const getSend = () => screen.getByRole('button', { name: 'Send message' });

afterEach(() => {
  cleanup();
  localStorage.removeItem('portfolio-assistant-avatar');
  vi.unstubAllGlobals();
});

test('shows Mota with the stored skin and lets visitors change it', () => {
  localStorage.setItem('portfolio-assistant-avatar', 'pulse');
  const { container } = render(<PortfolioAssistant lang="es" />);
  const portrait = container.querySelector('.assistant-badge svg');

  expect(screen.getByRole('heading', { name: 'Mota' })).toBeInTheDocument();
  expect(portrait).toHaveAttribute('data-avatar', 'pulse');
  expect(portrait).toHaveAttribute('aria-hidden', 'true');

  fireEvent.click(screen.getAllByLabelText('Personalizar avatar')[0]);
  const pixel = screen.getByRole('button', { name: 'Píxel' });
  fireEvent.click(pixel);

  expect(pixel).toHaveAttribute('aria-pressed', 'true');
  expect(portrait).toHaveAttribute('data-avatar', 'pixel');
  expect(localStorage.getItem('portfolio-assistant-avatar')).toBe('pixel');
});

test('keeps verification tokens out of the chat body and obtains a new token per submission', async () => {
  const widget = stubTurnstile();
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => new Response(''));
  vi.stubGlobal('fetch', fetch);
  const assistant = (
    <PortfolioAssistant lang="en" challenge={{ siteKey: 'site-key', origin: location.origin }} />
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(assistant);
  document.body.append(container);
  expect(container).toHaveTextContent('Demo mode');
  render(assistant, { container, hydrate: true });
  expect(screen.getByText('Assistant preview')).toBeInTheDocument();
  const portrait = container.querySelector('.assistant-badge svg');
  expect(portrait).toHaveAttribute('data-expression', 'idle');

  for (const [attempt, token] of ['first-token', 'second-token'].entries()) {
    fireEvent.change(getQuestion(), { target: { value: `Question ${attempt + 1}` } });
    fireEvent.click(getSend());
    await waitFor(() => expect(widget.render).toHaveBeenCalledTimes(attempt + 1));
    expect(fetch).toHaveBeenCalledTimes(attempt);
    expect(portrait).toHaveAttribute('data-expression', 'busy');
    const [, options] = widget.render.mock.calls[attempt];
    expect(options).toMatchObject({ action: 'portfolio_chat', 'response-field': false });
    await act(async () => options.callback(token));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(attempt + 1));
    const [url, request] = fetch.mock.calls[attempt];
    expect(url).toBe('/api/chat');
    expect(new Headers(request?.headers).get('X-Portfolio-Challenge')).toBe(token);
    expect(request?.body).toContain(`Question ${attempt + 1}`);
    expect(request?.body).not.toContain(token);
    await waitFor(() => expect(getQuestion()).toHaveValue(''));
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(portrait).toHaveAttribute('data-expression', 'idle');
    expect(widget.remove).toHaveBeenCalledTimes(attempt + 1);
  }
});

test('keeps the draft and allows another challenge after the widget expires', async () => {
  const widget = stubTurnstile();
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(
    <PortfolioAssistant lang="en" challenge={{ siteKey: 'site-key', origin: location.origin }} />,
  );
  fireEvent.change(getQuestion(), { target: { value: 'What did Alex build?' } });
  fireEvent.click(getSend());
  await waitFor(() => expect(widget.render).toHaveBeenCalledOnce());
  await act(async () => widget.render.mock.calls[0][1]['expired-callback']());

  expect(screen.getByRole('alert')).toHaveTextContent('Verification could not be completed');
  expect(getQuestion()).toHaveValue('What did Alex build?');
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(getSend());
  await waitFor(() => expect(widget.render).toHaveBeenCalledTimes(2));
});

test('an alias runs the static demo without contacting Turnstile or the preview API', async () => {
  const widget = stubTurnstile();
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(
    <PortfolioAssistant
      lang="en"
      challenge={{ siteKey: 'site-key', origin: 'https://canonical.example' }}
    />,
  );
  fireEvent.change(getQuestion(), { target: { value: 'What is GLIO?' } });
  fireEvent.click(getSend());
  await waitFor(() => expect(getQuestion()).toHaveValue(''));

  expect(widget.render).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
