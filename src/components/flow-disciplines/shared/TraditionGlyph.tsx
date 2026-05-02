'use client'

interface TraditionGlyphProps {
  index: 0 | 1 | 2 | 3 | 4 | 5 | 6
  size?: number
  className?: string
}

// 7 abstract glyphs extracted exactly from flow-disciplines-explorer.html
// Using currentColor so they inherit the surrounding text color
export function TraditionGlyph({ index, size = 22, className = '' }: TraditionGlyphProps) {
  return (
    <svg
      viewBox="-14 -14 28 28"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {index === 0 && (
        <g>
          <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="0" r="3" fill="currentColor" />
        </g>
      )}
      {index === 1 && (
        <g>
          <path d="M0 -13L12 9H-12Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="2.5" r="2.2" fill="currentColor" />
        </g>
      )}
      {index === 2 && (
        <g>
          <path d="M0 -13L11.3 -6.5V6.5L0 13L-11.3 6.5V-6.5Z" fill="none" stroke="currentColor" strokeWidth="1" />
        </g>
      )}
      {index === 3 && (
        <g>
          <path d="M0 -13L13 0L0 13L-13 0Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="0" r="2.2" fill="currentColor" />
        </g>
      )}
      {index === 4 && (
        <g>
          <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="0" r="6.5" fill="none" stroke="currentColor" strokeWidth="1" />
        </g>
      )}
      {index === 5 && (
        <g>
          <rect x="-3" y="-12" width="6" height="24" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="-6" r="1.4" fill="currentColor" />
          <circle cx="0" cy="6" r="1.4" fill="currentColor" />
        </g>
      )}
      {index === 6 && (
        <g>
          <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="-7" x2="0" y2="7" stroke="currentColor" strokeWidth="1" />
          <line x1="-7" y1="0" x2="7" y2="0" stroke="currentColor" strokeWidth="1" />
        </g>
      )}
    </svg>
  )
}
