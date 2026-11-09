// ABOUTME: Caps the conversation sent to the preview endpoint.
// ABOUTME: Keeps the full transcript in the chat while sending recent text turns only.
import type { PrepareSendMessagesRequest, UIMessage } from 'ai';

const MAX_MESSAGES = 9;
const MAX_MESSAGE_CHARS = 1_200;
const MAX_BODY_BYTES = 24_000;

export const prepareAssistantRequest = ({
  body,
  id,
  messages,
  trigger,
  messageId,
}: Parameters<PrepareSendMessagesRequest<UIMessage>>[0]) => {
  const history = messages
    .filter(({ role }) => role === 'user' || role === 'assistant')
    .slice(-MAX_MESSAGES)
    .flatMap(({ id: messageId, role, parts }) => {
      const text = parts
        .flatMap((part) => (part.type === 'text' ? [part.text] : []))
        .join(' ')
        .trim()
        .slice(0, MAX_MESSAGE_CHARS);
      return text ? [{ id: messageId, role, parts: [{ type: 'text', text }] }] : [];
    });
  const payload = { ...body, id, trigger, messageId, messages: history };
  const encoder = new TextEncoder();
  while (history.length > 1 && encoder.encode(JSON.stringify(payload)).length > MAX_BODY_BYTES) {
    history.shift();
  }
  return { body: payload };
};
