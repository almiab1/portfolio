// ABOUTME: Draws Mota, the portfolio assistant’s pixel robot, in three color palettes.
// ABOUTME: Shares the same sprite between the assistant header, skin picker and dock.
import type { Avatar } from '@/hooks/use-portfolio-assistant';

interface Props {
  avatar: Avatar;
  size?: number;
  expression?: 'idle' | 'busy';
}

export default function AssistantAvatar({ avatar, size = 32, expression }: Props) {
  return (
    <svg
      className="assistant-avatar"
      data-avatar={avatar}
      data-expression={expression}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path className="assistant-avatar-signal" d="M11 0h2v2h-2z" />
      <path
        className="assistant-avatar-shell"
        d="M10 2h2v2h-2zM4 4h8v1h2v2h1v5h-2v2h-1v1H4v-1H3v-2H1V7h1V5h2z"
      />
      <path className="assistant-avatar-light" d="M4 5h8v1H4zM2 8h1v3H2z" />
      <path className="assistant-avatar-screen" d="M4 7h8v1h1v4h-1v1H4v-1H3V8h1z" />
      {expression === 'busy' ? (
        <path className="assistant-avatar-signal" d="M5 9h1v1H5zM7 9h2v1H7zM10 9h1v1h-1z" />
      ) : (
        <>
          <path
            className="assistant-avatar-light assistant-avatar-eyes"
            d="M5 8h1v2H5zM10 8h1v2h-1z"
          />
          <path className="assistant-avatar-signal" d="M7 11h2v1H7z" />
        </>
      )}
      <path className="assistant-avatar-feet" d="M4 14h3v2H4zM9 14h3v2H9z" />
    </svg>
  );
}
