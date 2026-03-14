interface BlueLockLogoProps {
  className?: string;
  size?: number;
}

export default function BlueLockLogo({ className = '', size = 48 }: BlueLockLogoProps) {
  return (
    <img
      src="/android-chrome-192x192.png"
      alt="Blue Lock"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

