interface LumaGlyphProps {
  size?: number
  className?: string
  animated?: boolean
}

export function LumaGlyph({ size = 32, className = '', animated = false }: LumaGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`${animated ? 'animate-luma-glow' : ''} ${className}`}
    >
      {/* Outer ring */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" fill="none"/>
      {/* Middle ring */}
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" fill="none"/>
      {/* Inner ring */}
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1" fill="none"/>
      {/* Diamond */}
      <path d="M16 8 L22 16 L16 24 L10 16 Z" fill="currentColor" fillOpacity="0.9"/>
      {/* Inner diamond accent */}
      <path d="M16 12 L19 16 L16 20 L13 16 Z" fill="currentColor"/>
    </svg>
  )
}
