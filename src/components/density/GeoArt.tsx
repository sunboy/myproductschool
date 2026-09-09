import type { CSSProperties, ReactNode } from 'react'
import { GEO_COMPOSITIONS, geoIndexFor } from './geo-art'

/** Deterministic geometric cover art. `seed` picks one of eight compositions; `index` overrides for explicit rotation. */
export function GeoArt({ seed, index, height = 64, className = '', style, children, ...rest }: { seed?: string; index?: number; height?: number | string; className?: string; style?: CSSProperties; children?: ReactNode } & Record<string, unknown>) {
  const comp = GEO_COMPOSITIONS[(index ?? (seed ? geoIndexFor(seed) : 0)) % GEO_COMPOSITIONS.length]
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height, background: comp.bg, ...style }} data-geo={comp.name} aria-hidden={children ? undefined : true} {...rest}>
      {comp.shapes.map((s, i) => <i key={i} style={s.style} />)}
      {children}
    </div>
  )
}
