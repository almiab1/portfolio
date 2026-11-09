// ABOUTME: Provides sample portfolio replies through the Vercel AI SDK transport contract.
// ABOUTME: Uses typed destination IDs for navigation inside the workspace.
import { createUIMessageStream, type ChatTransport, type UIMessage } from 'ai';
import { t, type Language, type TranslationKey } from '@/i18n/translations';

export const DESTINATIONS = {
  glio: { path: '/work/glio-ia', label: 'profile.readGlio' },
  work: { path: '/work', label: 'profile.exploreWork' },
  experience: { path: '/experience', label: 'desktop.experience' },
  skills: { path: '/skills', label: 'desktop.viewSkills' },
  cv: { path: '/cv', label: 'desktop.cvOpen' },
  profile: { path: '/', label: 'desktop.profile' },
} as const;

type Destination = keyof typeof DESTINATIONS;
export type PortfolioMessage = UIMessage<unknown, { destination: Destination }>;

const TOPICS: { pattern: RegExp; destination: Destination; reply: TranslationKey }[] = [
  {
    pattern: /\b(glio|tumor\w*|medical|medica|medico|oncolog\w*)\b/,
    destination: 'glio',
    reply: 'desktop.replyGlio',
  },
  {
    pattern: /\b(cv|curriculum|resume|download|descarg\w*)\b/,
    destination: 'cv',
    reply: 'desktop.replyCv',
  },
  {
    pattern:
      /\b(trabaj\w*|career|experience|experiencia|trayectoria|worked|gurusup|convotis|aiju)\b/,
    destination: 'experience',
    reply: 'desktop.replyCareer',
  },
  {
    pattern: /\b(habilidad\w*|skill\w*|tecnolog\w*|formacion|education|contact\w*)\b/,
    destination: 'skills',
    reply: 'desktop.replySkills',
  },
  {
    pattern: /\b(proyecto\w*|project\w*|robot\w*|catalog\w*|portfolio)\b/,
    destination: 'work',
    reply: 'desktop.replyProjects',
  },
  {
    pattern: /\b(perfil|profile|quien|who|alex|alejandro)\b/,
    destination: 'profile',
    reply: 'desktop.replyProfile',
  },
];

export function createPortfolioTransport(lang: Language): ChatTransport<PortfolioMessage> {
  const translate = t(lang);

  return {
    async sendMessages({ messages }) {
      const input =
        messages
          .at(-1)
          ?.parts.flatMap((part) => (part.type === 'text' ? [part.text] : []))
          .join(' ')
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase() ?? '';
      const topic = TOPICS.find(({ pattern }) => pattern.test(input));
      const reply = translate(topic?.reply ?? 'desktop.replyFallback');

      return createUIMessageStream<PortfolioMessage>({
        execute({ writer }) {
          writer.write({ type: 'start' });
          writer.write({ type: 'text-start', id: 'reply' });
          writer.write({ type: 'text-delta', id: 'reply', delta: reply });
          writer.write({ type: 'text-end', id: 'reply' });
          writer.write({ type: 'data-destination', data: topic?.destination ?? 'work' });
          writer.write({ type: 'finish' });
        },
      });
    },
    async reconnectToStream() {
      return null;
    },
  };
}
