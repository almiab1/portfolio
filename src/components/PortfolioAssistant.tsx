// ABOUTME: Renders the persistent assistant panel with shadcn/ui chat components.
// ABOUTME: Sends local demo questions and offers links to real portfolio apps.
import { ArrowUp, ArrowUpRight, Minus, Palette } from 'lucide-react';
import AssistantAvatar from '@/components/AssistantAvatar';
import { AVATARS, usePortfolioAssistant } from '@/hooks/use-portfolio-assistant';
import { Button } from '@/components/ui/button';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageContent } from '@/components/ui/message';
import { DESTINATIONS } from '@/lib/assistant-transport';
import { t, type Language } from '@/i18n/translations';

interface Props {
  lang: Language;
  preview?: boolean;
}

const AVATAR_LABELS = {
  orbit: 'desktop.avatarOrbit',
  pixel: 'desktop.avatarPixel',
  pulse: 'desktop.avatarPulse',
} as const;

export default function PortfolioAssistant({ lang, preview = false }: Props) {
  const translate = t(lang);
  const { messages, input, setInput, send, busy, error, avatar, selectAvatar, log, trackScroll } =
    usePortfolioAssistant(lang, preview);

  return (
    <aside className="desktop-assistant" id="desktop-assistant" aria-labelledby="assistant-title">
      <header className="assistant-header">
        <span className="assistant-badge">
          <AssistantAvatar avatar={avatar} />
        </span>
        <div className="assistant-title">
          <p className="portfolio-kicker">
            {translate(preview ? 'desktop.assistantPreview' : 'desktop.assistantDemo')}
          </p>
          <h2 id="assistant-title">{translate('desktop.assistant')}</h2>
        </div>
        <details className="assistant-settings">
          <summary
            aria-label={translate('desktop.assistantAvatar')}
            title={translate('desktop.assistantAvatar')}
          >
            <Palette size={18} aria-hidden="true" />
          </summary>
          <div
            className="assistant-presets"
            role="group"
            aria-label={translate('desktop.assistantAvatar')}
          >
            {AVATARS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={avatar === option}
                onClick={() => selectAvatar(option)}
              >
                <AssistantAvatar avatar={option} size={27} />
                <span>{translate(AVATAR_LABELS[option])}</span>
              </button>
            ))}
          </div>
        </details>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          data-assistant-minimize
          aria-label={translate('desktop.assistantClose')}
          title={translate('desktop.assistantClose')}
        >
          <Minus aria-hidden="true" />
        </Button>
      </header>

      <div
        ref={log}
        onScroll={trackScroll}
        className="assistant-log"
        role="log"
        aria-label={translate('desktop.assistantLog')}
        tabIndex={0}
      >
        {messages.map(({ id, role, parts }) => {
          const text = parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join(' ');
          const action = parts.find((part) => part.type === 'data-destination');
          const destination =
            action && Object.hasOwn(DESTINATIONS, action.data)
              ? DESTINATIONS[action.data]
              : undefined;
          return (
            <Message key={id} align={role === 'user' ? 'end' : 'start'}>
              <MessageContent>
                <span className="sr-only">
                  {translate(role === 'user' ? 'desktop.assistantYou' : 'desktop.assistant')}
                </span>
                <Bubble variant={role === 'user' ? 'muted' : 'outline'}>
                  <BubbleContent>
                    <p>{text}</p>
                    {destination && (
                      <a
                        className="assistant-destination"
                        href={lang === 'en' ? '/en' + destination.path : destination.path}
                        data-assistant-destination
                      >
                        {translate(destination.label)} <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    )}
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          );
        })}
        {error && <p role="alert">{translate('desktop.assistantError')}</p>}
      </div>

      <div className="assistant-suggestions">
        {(['desktop.askGlio', 'desktop.askCareer', 'desktop.askCv'] as const).map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => send(translate(key))}
          >
            {translate(key)}
          </Button>
        ))}
      </div>
      <form
        className="assistant-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <label className="sr-only" htmlFor="assistant-question">
          {translate('desktop.assistantInput')}
        </label>
        <input
          id="assistant-question"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={translate('desktop.assistantInput')}
          maxLength={400}
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || busy}
          aria-label={translate('desktop.assistantSend')}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
      </form>
    </aside>
  );
}
