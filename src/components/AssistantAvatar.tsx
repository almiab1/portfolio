// ABOUTME: Draws a small original dot character for each assistant avatar preset.
// ABOUTME: Shares the same visual between the assistant header and preset picker.
import type { Avatar } from '@/hooks/use-portfolio-assistant';

interface Props {
  avatar: Avatar;
  size?: number;
}

const PIXELS = [
  [12, 5],
  [20, 5],
  [8, 10],
  [16, 10],
  [24, 10],
  [5, 15],
  [11, 15],
  [21, 15],
  [27, 15],
  [8, 20],
  [16, 20],
  [24, 20],
  [12, 25],
  [20, 25],
];

export default function AssistantAvatar({ avatar, size = 32 }: Props) {
  return (
    <svg
      className="assistant-avatar"
      data-avatar={avatar}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {avatar === 'orbit' && (
        <>
          <circle
            cx="16"
            cy="16"
            r="11"
            fill="none"
            stroke="currentColor"
            strokeDasharray="0.1 3.3"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="12" cy="15" r="1.8" fill="currentColor" />
          <circle cx="20" cy="15" r="1.8" fill="currentColor" />
          <path
            d="M13.5 20q2.5 2 5 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      )}
      {avatar === 'pixel' &&
        PIXELS.map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={x - 1.6}
            y={y - 1.6}
            width="3.2"
            height="3.2"
            rx="0.6"
            fill="currentColor"
          />
        ))}
      {avatar === 'pulse' && (
        <>
          <path
            d="M3 16h5l3-7 5 14 5-14 3 7h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="16" r="2" fill="currentColor" />
          <circle cx="24" cy="16" r="2" fill="currentColor" />
          <circle cx="16" cy="23" r="2" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
