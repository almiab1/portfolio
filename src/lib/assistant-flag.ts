// ABOUTME: Checks the server-controlled availability of the portfolio assistant.
// ABOUTME: Shares requests across desktop instances and refreshes the open panel.
export const ASSISTANT_DISABLED = 'portfolio:assistant-disabled';
const REFRESH_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 5_000;
let pending: Promise<boolean> | undefined;

async function fetchAssistantFlag(): Promise<boolean> {
  try {
    const response = await fetch('/api/chat', {
      cache: 'no-store',
      credentials: 'same-origin',
      mode: 'same-origin',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const value: unknown = await response.json();
    return Boolean(
      value && typeof value === 'object' && 'enabled' in value && value.enabled === true,
    );
  } catch {
    return false;
  }
}

function checkAssistantFlag() {
  pending ??= fetchAssistantFlag().finally(() => {
    pending = undefined;
  });
  return pending;
}

export function watchAssistantFlag(
  setEnabled: (enabled: boolean) => void,
  isOpen: () => boolean,
  signal: AbortSignal,
) {
  let refreshing = false;
  const refresh = async () => {
    if (refreshing || signal.aborted || document.visibilityState === 'hidden') return;
    refreshing = true;
    const enabled = await checkAssistantFlag();
    refreshing = false;
    if (!signal.aborted) setEnabled(enabled);
  };
  window.addEventListener('focus', refresh, { signal });
  window.addEventListener('pageshow', refresh, { signal });
  document.addEventListener('visibilitychange', refresh, { signal });
  const timer = window.setInterval(() => {
    if (isOpen()) void refresh();
  }, REFRESH_INTERVAL_MS);
  signal.addEventListener('abort', () => window.clearInterval(timer), { once: true });
  void refresh();
}
