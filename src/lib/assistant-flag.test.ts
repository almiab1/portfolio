// ABOUTME: Tests the browser's fail-closed assistant availability check.
// ABOUTME: Covers refresh events, the polling bound, and navigation during a request.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { watchAssistantFlag } from './assistant-flag';

let controller: AbortController;
const fetchFlag = vi.fn<typeof fetch>();

beforeEach(() => {
  controller = new AbortController();
  fetchFlag.mockReset();
  vi.stubGlobal('fetch', fetchFlag);
  vi.useFakeTimers();
});

afterEach(() => {
  controller.abort();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const statusResponse = (enabled: unknown) => Response.json({ enabled });

test('requests the server decision without page context and only accepts boolean true', async () => {
  fetchFlag.mockResolvedValueOnce(statusResponse(true));
  fetchFlag.mockResolvedValueOnce(statusResponse('true'));
  fetchFlag.mockResolvedValueOnce(new Response('broken'));
  fetchFlag.mockResolvedValueOnce(Response.json({ enabled: true }, { status: 503 }));
  fetchFlag.mockRejectedValueOnce(new Error('Network unavailable'));
  const onChange = vi.fn();

  watchAssistantFlag(onChange, () => false, controller.signal);
  await vi.advanceTimersByTimeAsync(0);
  expect(fetchFlag).toHaveBeenNthCalledWith(
    1,
    '/api/chat',
    expect.objectContaining({
      cache: 'no-store',
      credentials: 'same-origin',
      mode: 'same-origin',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
    }),
  );

  for (let attempt = 0; attempt < 4; attempt++) {
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(0);
  }

  expect(onChange.mock.calls).toEqual([[true], [false], [false], [false], [false]]);
});

test('polls an open assistant every 30 seconds and refreshes a closed one on focus', async () => {
  fetchFlag.mockImplementation(async () => statusResponse(fetchFlag.mock.calls.length === 1));
  const onChange = vi.fn();
  let open = true;
  watchAssistantFlag(onChange, () => open, controller.signal);

  await vi.advanceTimersByTimeAsync(29_999);
  expect(onChange.mock.calls).toEqual([[true]]);

  await vi.advanceTimersByTimeAsync(1);
  expect(onChange.mock.calls).toEqual([[true], [false]]);

  open = false;
  await vi.advanceTimersByTimeAsync(30_000);
  expect(fetchFlag).toHaveBeenCalledTimes(2);

  window.dispatchEvent(new Event('focus'));
  await vi.advanceTimersByTimeAsync(0);
  expect(fetchFlag).toHaveBeenCalledTimes(3);

  controller.abort();
  window.dispatchEvent(new Event('focus'));
  await vi.advanceTimersByTimeAsync(30_000);
  expect(fetchFlag).toHaveBeenCalledTimes(3);
});

test('shares the pending request across page swaps and skips the detached panel', async () => {
  const result = Promise.withResolvers<Response>();
  fetchFlag.mockReturnValue(result.promise);
  const onOldPage = vi.fn();
  const onNewPage = vi.fn();
  const oldPage = new AbortController();

  watchAssistantFlag(onOldPage, () => true, oldPage.signal);
  oldPage.abort();
  watchAssistantFlag(onNewPage, () => true, controller.signal);
  window.dispatchEvent(new Event('focus'));

  expect(fetchFlag).toHaveBeenCalledOnce();
  result.resolve(statusResponse(true));
  await vi.advanceTimersByTimeAsync(0);
  expect(onOldPage).not.toHaveBeenCalled();
  expect(onNewPage).toHaveBeenCalledExactlyOnceWith(true);
});
