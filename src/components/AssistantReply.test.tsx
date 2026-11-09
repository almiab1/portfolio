// ABOUTME: Checks Markdown structure and link safety for assistant replies.
// ABOUTME: Keeps formatted content and validated navigation separate.
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import AssistantReply from './AssistantReply';

afterEach(cleanup);

test('renders an introduction, list items, emphasis and an ordered list', () => {
  render(
    <AssistantReply
      text={'Trayectoria:\n\n- **GuruSup** · IA\n- *AIJU* · investigación\n\n1. CV\n2. Proyectos'}
    />,
  );

  const [companies, destinations] = screen.getAllByRole('list');
  expect(within(companies).getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('GuruSup').tagName).toBe('STRONG');
  expect(screen.getByText('AIJU').tagName).toBe('EM');
  expect(destinations.tagName).toBe('OL');
});

test('keeps labels while suppressing model links, images and raw HTML', () => {
  const { container } = render(
    <AssistantReply
      text={
        'Lee **[GLIO-IA](/glio)** https://example.com/glio\n\n![Photo](https://example.com/p.png)\n\n<script>alert(1)</script>'
      }
    />,
  );

  expect(screen.getByText('GLIO-IA')).toBeVisible();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(container.querySelector('script')).toBeNull();
  expect(container).not.toHaveTextContent('example.com');
});
