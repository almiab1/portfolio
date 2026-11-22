// ABOUTME: Renders the persistent assistant panel with shadcn/ui chat components.
// ABOUTME: Supports demo and preview chat and links to portfolio apps.
import { useSyncExternalStore } from 'react';
import { ArrowUp, Maximize2, Minimize2, Minus, Palette } from 'lucide-react';
import AssistantAvatar from '@/components/AssistantAvatar';
import AssistantDestination from '@/components/AssistantDestination';
import AssistantReply from '@/components/AssistantReply';
import { AVATARS, usePortfolioAssistant } from '@/hooks/use-portfolio-assistant';
import { Button } from '@/components/ui/button';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageContent } from '@/components/ui/message';
import { t, type Language } from '@/i18n/translations';

interface Props {
  lang: Language;
  preview?: boolean;
  challenge?: { siteKey: string; origin: string };
}

const AVATAR_LABELS = {
  orbit: 'desktop.avatarOrbit',
  pixel: 'desktop.avatarPixel',
  pulse: 'desktop.avatarPulse',
} as const;

function subscribeToOrigin() {
  return () => {};
}

export default function PortfolioAssistant({ lang, preview = false, challenge }: Props) {
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => '',
  );
  const siteKey = challenge?.origin === origin ? challenge.siteKey : undefined;
  const remote = preview || Boolean(siteKey);
  const translate = t(lang);
  const mode = translate(remote ? 'desktop.assistantPreview' : 'desktop.assistantDemo');
  const {
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
  } = usePortfolioAssistant(lang, remote, siteKey);
  const ReadingIcon = expanded ? Minimize2 : Maximize2;

  return (
    <aside
      className="desktop-assistant"
      id="desktop-assistant"
      aria-labelledby="assistant-title"
      data-reading-mode={expanded ? 'expanded' : undefined}
    >
      <header className="assistant-header">
        <span className="assistant-badge">
          <AssistantAvatar avatar={avatar} />
        </span>
        <div className="assistant-title">
          <p className="portfolio-kicker" title={mode}>
            {mode}
          </p>
          <h2 id="assistant-title">{translate('desktop.assistant')}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          data-assistant-reading
          aria-label={translate('desktop.assistantReading')}
          aria-pressed={expanded}
          title={translate('desktop.assistantReading')}
          onClick={toggleReadingMode}
        >
          <ReadingIcon aria-hidden="true" />
        </Button>
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
          const content = parts
            .flatMap((part) => (part.type === 'text' ? [part.text] : []))
            .join(role === 'assistant' ? '\n\n' : ' ');
          const action = parts.find((part) => part.type === 'data-destination');
          return (
            <Message key={id} align={role === 'user' ? 'end' : 'start'}>
              <MessageContent>
                <span className="sr-only">
                  {translate(role === 'user' ? 'desktop.assistantYou' : 'desktop.assistant')}
                </span>
                <Bubble variant={role === 'user' ? 'muted' : 'outline'}>
                  <BubbleContent>
                    {role === 'assistant' ? <AssistantReply text={content} /> : <p>{content}</p>}
                    {action && <AssistantDestination destination={action.data} lang={lang} />}
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          );
        })}
        {busy && (
          <p role="status">
            {translate(checking ? 'desktop.assistantChecking' : 'desktop.assistantPending')}
          </p>
        )}
        {(challengeError || error) && (
          <p role="alert">
            {translate(
              challengeError ? 'desktop.assistantChallengeError' : 'desktop.assistantError',
            )}
          </p>
        )}
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
      <div>
        {siteKey && <div ref={widget} className="px-3 empty:hidden" />}
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
      </div>
    </aside>
  );
}
