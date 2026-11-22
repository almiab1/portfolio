// ABOUTME: Owns assistant chat, input, and avatar preferences.
// ABOUTME: Preserves the visible thread while the assistant panel is hidden or restored.
import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ASSISTANT_DISABLED } from '@/lib/assistant-flag';
import { verifyAssistantChallenge } from '@/lib/assistant-challenge';
import { prepareAssistantRequest } from '@/lib/assistant-request';
import { createPortfolioTransport, type PortfolioMessage } from '@/lib/assistant-transport';
import { t, type Language } from '@/i18n/translations';

export const AVATARS = ['orbit', 'pixel', 'pulse'] as const;
export type Avatar = (typeof AVATARS)[number];
const AVATAR_KEY = 'portfolio-assistant-avatar';
let localAvatar: Avatar | undefined;

function readAvatar(): Avatar {
  try {
    const stored = localStorage.getItem(AVATAR_KEY);
    return AVATARS.find((option) => option === stored) ?? localAvatar ?? 'orbit';
  } catch {
    return localAvatar ?? 'orbit';
  }
}

function subscribeAvatar(update: () => void) {
  window.addEventListener(AVATAR_KEY, update);
  window.addEventListener('storage', update);
  return () => {
    window.removeEventListener(AVATAR_KEY, update);
    window.removeEventListener('storage', update);
  };
}

export function usePortfolioAssistant(lang: Language, preview: boolean, siteKey?: string) {
  const transport = useMemo(
    () =>
      preview
        ? new DefaultChatTransport<PortfolioMessage>({
            api: '/api/chat',
            body: { lang },
            prepareSendMessagesRequest: prepareAssistantRequest,
          })
        : createPortfolioTransport(lang),
    [lang, preview],
  );
  const chatId = useId();
  const { messages, sendMessage, status, error, stop } = useChat<PortfolioMessage>({
    id: `${chatId}-${preview ? 'remote' : 'demo'}`,
    transport,
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: t(lang)('desktop.assistantWelcome') }],
      },
    ],
  });
  const widget = useRef<HTMLDivElement>(null);
  const pendingChallenge = useRef<AbortController | null>(null);
  const [checking, setChecking] = useState(false);
  const [challengeError, setChallengeError] = useState(false);
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const avatar = useSyncExternalStore<Avatar>(subscribeAvatar, readAvatar, () => 'orbit');
  const log = useRef<HTMLDivElement>(null);
  const followThread = useRef(true);
  const busy = checking || status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const panel = log.current;
    if (panel && followThread.current && panel.clientHeight) {
      panel.scrollTop = panel.scrollHeight;
    }
  }, [messages, expanded, checking, challengeError]);

  useEffect(() => () => pendingChallenge.current?.abort(), []);

  useEffect(() => {
    const panel = log.current?.closest('.desktop-assistant');
    const onDisabled = () => {
      pendingChallenge.current?.abort();
      setChecking(false);
      void stop();
    };
    panel?.addEventListener(ASSISTANT_DISABLED, onDisabled);
    return () => panel?.removeEventListener(ASSISTANT_DISABLED, onDisabled);
  }, [stop]);

  function trackScroll() {
    const panel = log.current;
    if (panel?.clientHeight) {
      followThread.current = panel.scrollHeight - panel.clientHeight - panel.scrollTop < 32;
    }
  }

  function selectAvatar(option: Avatar) {
    localAvatar = option;
    try {
      localStorage.setItem(AVATAR_KEY, option);
    } catch {
      // Keep the in-memory preference.
    }
    window.dispatchEvent(new Event(AVATAR_KEY));
  }

  function isDisabled() {
    return Boolean(log.current?.closest('[data-assistant-island][inert]'));
  }

  async function send(text: string, preset?: 'glio' | 'career' | 'cv') {
    const clean = text.trim();
    if (!clean || busy || pendingChallenge.current || isDisabled()) return;
    followThread.current = true;

    let headers: Record<string, string> | undefined;
    if (siteKey) {
      if (!widget.current) return;
      const challenge = new AbortController();
      pendingChallenge.current = challenge;
      setChallengeError(false);
      setChecking(true);
      try {
        const token = await verifyAssistantChallenge(
          widget.current,
          siteKey,
          lang,
          challenge.signal,
        );
        if (challenge.signal.aborted) return;
        headers = { 'X-Portfolio-Challenge': token };
      } catch {
        if (!challenge.signal.aborted) setChallengeError(true);
        return;
      } finally {
        pendingChallenge.current = null;
        if (!challenge.signal.aborted) setChecking(false);
      }
    }

    if (isDisabled()) return;
    setInput((current) => (current === input ? '' : current));
    void sendMessage({ text: clean }, { headers, body: preset ? { preset } : undefined });
  }

  function toggleReadingMode() {
    setExpanded((current) => !current);
  }

  return {
    messages,
    input,
    setInput,
    send,
    busy,
    error,
    checking,
    challengeError,
    widget,
    avatar,
    selectAvatar,
    log,
    trackScroll,
    expanded,
    toggleReadingMode,
  };
}
