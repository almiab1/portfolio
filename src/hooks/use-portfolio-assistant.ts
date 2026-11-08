// ABOUTME: Owns assistant chat, input, and avatar preferences.
// ABOUTME: Preserves the visible thread while the assistant panel is hidden or restored.
import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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

export function usePortfolioAssistant(lang: Language, preview: boolean) {
  const transport = useMemo(
    () =>
      preview
        ? new DefaultChatTransport<PortfolioMessage>({ api: '/api/chat', body: { lang } })
        : createPortfolioTransport(lang),
    [lang, preview],
  );
  const { messages, sendMessage, status, error } = useChat<PortfolioMessage>({
    transport,
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: t(lang)('desktop.assistantWelcome') }],
      },
    ],
  });
  const [input, setInput] = useState('');
  const avatar = useSyncExternalStore<Avatar>(subscribeAvatar, readAvatar, () => 'orbit');
  const log = useRef<HTMLDivElement>(null);
  const followThread = useRef(true);
  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const panel = log.current;
    if (panel && followThread.current && panel.clientHeight) {
      panel.scrollTop = panel.scrollHeight;
    }
  }, [messages]);

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

  function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    followThread.current = true;
    setInput('');
    void sendMessage({ text: clean });
  }

  return { messages, input, setInput, send, busy, error, avatar, selectAvatar, log, trackScroll };
}
