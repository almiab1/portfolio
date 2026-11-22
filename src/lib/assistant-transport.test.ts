// ABOUTME: Checks localized sample replies and their portfolio destinations.
// ABOUTME: Keeps education and capability questions routed to their respective pages.
import { describe, expect, it } from 'vitest';
import { createPortfolioTransport, type PortfolioMessage } from './assistant-transport';

describe.each([
  ['es', '¿Cuál es su formación?', 'experience', 'Trayectoria'],
  ['en', 'What is his education?', 'experience', 'Experience'],
  ['en', 'What did he study?', 'experience', 'Experience'],
  ['en', 'Where did he study?', 'experience', 'Experience'],
  ['es', '¿Dónde estudió Alex?', 'experience', 'Trayectoria'],
  ['en', 'Show me a case study', 'work', 'projects'],
  ['es', '¿Cuáles son sus capacidades?', 'skills', 'Capacidades'],
  ['en', 'What technologies does he use?', 'skills', 'Capabilities'],
] as const)('%s sample reply', (lang, question, destination, evidence) => {
  it(`routes ${question}`, async () => {
    const transport = createPortfolioTransport(lang);
    const messages: PortfolioMessage[] = [
      { id: '1', role: 'user', parts: [{ type: 'text', text: question }] },
    ];
    const stream = await transport.sendMessages({
      trigger: 'submit-message',
      chatId: 'test',
      messageId: undefined,
      messages,
      abortSignal: undefined,
    });
    const events = await Array.fromAsync(stream);
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'data-destination', data: destination }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'text-delta', delta: expect.stringContaining(evidence) }),
    );
  });
});
