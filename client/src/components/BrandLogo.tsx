interface BrandLogoProps {
  variant?: 'dark-bg' | 'light-bg';
  className?: string;
}

export function BrandLogo({ variant = 'dark-bg', className = 'h-9' }: BrandLogoProps) {
  const src = variant === 'dark-bg' ? '/brand-3.png' : '/logo.png';
  return (
    <img
      src={src}
      alt="FusionLabz"
      className={`w-auto object-contain select-none ${className}`}
      draggable={false}
    />
  );
}
