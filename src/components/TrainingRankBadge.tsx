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
    <div className={`relative aspect-[0.89] w-[176px] ${className}`}>
      <svg
        viewBox="0 0 210 236"
        className="h-full w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.28)]"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon
          points="105,10 191,73 171,224 39,224 19,73"
          fill="#f8fafc"
          stroke="#050505"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <line x1="34" y1="116" x2="176" y2="116" stroke="#050505" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[18%] text-center">
        <span className="text-[3.25rem] font-black leading-none tracking-[-0.08em] text-black">
          {position}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[14%] text-center">
        <span className="text-[4.4rem] font-black leading-none tracking-[-0.1em] text-black">
          {level}
        </span>
      </div>
    </div>
  );
}
