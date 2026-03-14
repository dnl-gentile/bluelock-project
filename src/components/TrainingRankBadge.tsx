interface TrainingRankBadgeProps {
  position: number;
  level: string;
  className?: string;
}

export default function TrainingRankBadge({
  position,
  level,
  className = '',
}: TrainingRankBadgeProps) {
  return (
    <div className={`relative aspect-[0.88] w-[160px] ${className}`}>
      <svg viewBox="0 0 200 228" className="h-full w-full drop-shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
        <polygon
          points="100,12 184,74 166,220 34,220 16,74"
          fill="#f8fafc"
          stroke="#050505"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <line x1="32" y1="112" x2="168" y2="112" stroke="#050505" strokeWidth="6" strokeLinecap="round" />
        <text
          x="100"
          y="87"
          fill="#050505"
          fontSize="56"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="-3"
          fontFamily="Outfit, Inter, system-ui, sans-serif"
        >
          {position}
        </text>
        <text
          x="100"
          y="192"
          fill="#050505"
          fontSize="76"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="-6"
          fontFamily="Outfit, Inter, system-ui, sans-serif"
        >
          {level}
        </text>
      </svg>
    </div>
  );
}
