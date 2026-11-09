// ABOUTME: Checks that long chat transcripts fit the preview endpoint's request budget.
// ABOUTME: Verifies that request preparation retains the latest question and leaves UI history intact.
import { expect, test } from 'vitest';
import type { UIMessage } from 'ai';
import { prepareAssistantRequest } from './assistant-request';

test('sends the newest text turns within the UTF-8 request limit', () => {
  const messages: UIMessage[] = Array.from({ length: 60 }, (_, index) => ({
    id: String(index),
    role: index % 2 === 0 ? 'assistant' : 'user',
    parts: [
      { type: 'text', text: '\u0000🧪'.repeat(450) + ' details' },
      { type: 'data-destination', data: 'glio' },
    ],
  }));
  const request = prepareAssistantRequest({
    api: '/api/chat',
    id: 'test-thread',
    messages,
    body: { lang: 'en' },
    trigger: 'submit-message',
    messageId: '59',
    headers: undefined,
    credentials: undefined,
    requestMetadata: undefined,
  });
  const history = request.body.messages;
  expect(request.body).toMatchObject({ lang: 'en', id: 'test-thread', trigger: 'submit-message' });
  expect(new TextEncoder().encode(JSON.stringify(request.body)).length).toBeLessThanOrEqual(24_000);
  expect(history.length).toBeLessThanOrEqual(9);
  expect(history.at(-1)).toMatchObject({ id: '59', role: 'user' });
  expect(history.every(({ parts }) => parts.length === 1 && parts[0].type === 'text')).toBe(true);
  expect(messages).toHaveLength(60);
  expect(messages.at(-1)?.parts).toHaveLength(2);
});
