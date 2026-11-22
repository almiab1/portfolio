// ABOUTME: Loads Cloudflare Turnstile only when a hosted assistant message needs verification.
// ABOUTME: Creates and removes one widget per submission without persisting the token.
interface TurnstileOptions {
  sitekey: string;
  action: 'portfolio_chat';
  appearance: 'interaction-only';
  size: 'compact';
  language: 'en' | 'es';
  retry: 'never';
  'response-field': false;
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
}

interface Turnstile {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  remove: (id: string) => void;
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<Turnstile> | undefined;

function loadTurnstile(): Promise<Turnstile> {
  const turnstileWindow: Window & { turnstile?: Turnstile } = window;
  if (turnstileWindow.turnstile) return Promise.resolve(turnstileWindow.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error('Assistant verification unavailable'));
    };
    const timeout = setTimeout(fail, 15_000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      if (turnstileWindow.turnstile) resolve(turnstileWindow.turnstile);
      else fail();
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}

export async function verifyAssistantChallenge(
  container: HTMLElement,
  siteKey: string,
  language: 'en' | 'es',
  signal: AbortSignal,
): Promise<string> {
  const turnstile = await loadTurnstile();
  signal.throwIfAborted();

  let widget: string | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let fail: () => void = () => {};
  try {
    return await new Promise<string>((resolve, reject) => {
      fail = () => reject(new Error('Assistant verification failed'));
      signal.addEventListener('abort', fail, { once: true });
      timeout = setTimeout(fail, 120_000);
      widget = turnstile.render(container, {
        sitekey: siteKey,
        action: 'portfolio_chat',
        appearance: 'interaction-only',
        size: 'compact',
        language,
        retry: 'never',
        'response-field': false,
        callback: (token) => (token ? resolve(token) : fail()),
        'error-callback': fail,
        'expired-callback': fail,
        'timeout-callback': fail,
      });
      if (!widget) fail();
    });
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', fail);
    if (widget) turnstile.remove(widget);
  }
}
