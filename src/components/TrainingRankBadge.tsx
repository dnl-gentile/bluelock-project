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
    <div className={`relative shrink-0 ${className}`}>
      <svg viewBox="0 0 200 200" className="h-auto w-full drop-shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
        <polygon
          points="100,10 190,85 160,190 40,190 10,85"
          fill="#f8fafc"
          stroke="#050505"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <line x1="22" y1="120" x2="178" y2="120" stroke="#050505" strokeWidth="6" strokeLinecap="round" />
        <text
          x="100"
          y="95"
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
          y="180"
          fill="#050505"
          fontSize="64"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="-3"
          fontFamily="Outfit, Inter, system-ui, sans-serif"
        >
          {level}
        </text>
      </svg>
    </div>
  );
}
