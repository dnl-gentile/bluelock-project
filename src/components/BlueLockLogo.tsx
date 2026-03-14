interface BlueLockLogoProps {
  className?: string;
  size?: number;
}

export default function BlueLockLogo({ className = '', size = 48 }: BlueLockLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      {/* Top piece */}
      <path d="M50 5 L64 28 L50 37 L36 28 Z" fill="currentColor"/>
      {/* Top-right piece */}
      <path d="M64 28 L92 20 L87 54 L64 48 Z" fill="currentColor"/>
      {/* Bottom-right piece */}
      <path d="M87 54 L76 82 L53 66 L64 48 Z" fill="currentColor"/>
      {/* Bottom-left piece */}
      <path d="M47 66 L24 82 L13 54 L36 48 Z" fill="currentColor"/>
      {/* Top-left piece */}
      <path d="M8 20 L36 28 L36 48 L13 54 Z" fill="currentColor"/>
      {/* Center star cutout (transparent/white) */}
      <path d="M50 37 L64 48 L53 66 L47 66 L36 48 Z" fill="white"/>
    </svg>
  );
}
