import type { CSSProperties } from 'react';

const PIECES = [
  '/blue-lock-piece-top.png',
  '/blue-lock-piece-top_right.png',
  '/blue-lock-piece-bottom_right.png',
  '/blue-lock-piece-bottom_left.png',
  '/blue-lock-piece-top_left.png',
];

interface BlueLockLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  animationStyle?: 'sequence' | 'pulse';
  title?: string;
  durationMs?: number;
}

export default function BlueLockLogo({
  className = '',
  size = 48,
  animated = false,
  animationStyle = 'sequence',
  title,
  durationMs = 1800,
}: BlueLockLogoProps) {
  const pieceDelay = durationMs / PIECES.length;
  const label = title ?? (animated ? 'Blue Lock carregando' : 'Blue Lock');

  return (
    <div
      className={`relative inline-block align-middle ${className}`}
      style={
        {
          width: size,
          height: size,
          '--blue-lock-duration': `${durationMs}ms`,
        } as CSSProperties
      }
      role="img"
      aria-label={label}
    >
      {PIECES.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full select-none ${
            animated
              ? animationStyle === 'pulse'
                ? 'blue-lock-piece--pulse'
                : 'blue-lock-piece--animated'
              : ''
          }`}
          draggable="false"
          style={
            animated && animationStyle === 'sequence'
              ? ({
                  animationDelay: `${pieceDelay * index}ms`,
                } as CSSProperties)
              : undefined
          }
        />
      ))}
    </div>
  );
}
