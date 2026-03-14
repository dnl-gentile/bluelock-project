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
    <div className={`relative aspect-[0.88] w-[168px] ${className}`}>
      <svg viewBox="0 0 180 205" className="h-full w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
        <polygon
          points="90,8 170,64 154,196 26,196 10,64"
          fill="#f8fafc"
          stroke="#050505"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <line x1="23" y1="101" x2="157" y2="101" stroke="#050505" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-[3.2rem] font-black leading-none tracking-[-0.06em] text-black">
          {position}
        </span>
        <span className="mt-5 text-[4.2rem] font-black leading-none tracking-[-0.08em] text-black">
          {level}
        </span>
      </div>
    </div>
  );
}
