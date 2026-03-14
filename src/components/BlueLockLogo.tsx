import { useId, type CSSProperties } from 'react';

const PIECES = [
  'M50 5 L62 30 L50 38 L38 30 Z',
  'M62 30 L90 22 L85 52 L62 48 Z',
  'M85 52 L75 80 L52 65 L62 48 Z',
  'M48 65 L25 80 L15 52 L38 48 Z',
  'M10 22 L38 30 L38 48 L15 52 Z',
];

const CENTER_CUTOUT = 'M50 38 L62 48 L52 65 L48 65 L38 48 Z';

interface BlueLockLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  title?: string;
  baseColor?: string;
  highlightColor?: string;
  durationMs?: number;
}

export default function BlueLockLogo({
  className = '',
  size = 48,
  animated = false,
  title,
  baseColor = '#1d4ed8',
  highlightColor = '#60a5fa',
  durationMs = 1800,
}: BlueLockLogoProps) {
  const maskId = useId().replace(/:/g, '');
  const pieceDelay = durationMs / PIECES.length;
  const label = title ?? (animated ? 'Blue Lock carregando' : 'Blue Lock');

  const svgStyle = {
    '--blue-lock-piece-base': baseColor,
    '--blue-lock-piece-light': highlightColor,
    '--blue-lock-duration': `${durationMs}ms`,
  } as CSSProperties;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={svgStyle}
      role="img"
      aria-label={label}
      shapeRendering="geometricPrecision"
    >
      <title>{label}</title>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="white" />
          <path d={CENTER_CUTOUT} fill="black" />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {PIECES.map((d, index) => (
          <path
            key={d}
            d={d}
            fill={baseColor}
            className={animated ? 'blue-lock-piece--animated' : undefined}
            style={
              animated
                ? ({
                    animationDelay: `${pieceDelay * index}ms`,
                  } as CSSProperties)
                : undefined
            }
          />
        ))}
      </g>
    </svg>
  );
}
