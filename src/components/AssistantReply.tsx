// ABOUTME: Renders Markdown replies in the portfolio assistant.
// ABOUTME: Leaves navigation to the validated cards alongside each reply.
import Markdown from 'react-markdown';

interface Props {
  text: string;
}

const NON_CONTENT_ELEMENTS = ['a', 'img'];

export default function AssistantReply({ text }: Props) {
  const content = text.replace(/<https?:\/\/[^>\s]+>|https?:\/\/[^\s<>"')]+/gi, '').trim();
  if (!content) return null;

  return (
    <div className="assistant-reply">
      <Markdown skipHtml disallowedElements={NON_CONTENT_ELEMENTS} unwrapDisallowed>
        {content}
      </Markdown>
    </div>
  );
}
