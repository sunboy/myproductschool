export interface GeoComposition {
  name: 'diagonal' | 'ring' | 'diamond' | 'ribbons' | 'chevrons' | 'waveform' | 'stacked-diamonds' | 'halo'
  bg: string
  shapes: Array<{ style: React.CSSProperties }>
}

export const GEO_PALETTES: Record<string, string> = {
  forest: 'linear-gradient(135deg,#1f3d2b,#2f5f3f)',
  amber: 'linear-gradient(160deg,#c4a66a,#705c30)',
  ocean: 'linear-gradient(120deg,#23477a,#2f5fa8)',
  plum: 'linear-gradient(135deg,#6e3a63,#9b4f8a)',
  stripes: 'repeating-linear-gradient(135deg,#1f3d2b 0 14px,#2f5f3f 14px 28px)',
  teal: 'linear-gradient(135deg,#1f4f5c,#2c7a8c)',
  slate: 'linear-gradient(135deg,#2e3230,#5b6a5e)',
  gold: 'linear-gradient(135deg,#b7791f,#d9a441)',
}

const abs = (s: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', display: 'block', ...s })

export const GEO_COMPOSITIONS: GeoComposition[] = [
  { name: 'diagonal', bg: GEO_PALETTES.forest, shapes: [ { style: abs({ right: -16, top: -16, width: 76, height: 76, background: '#8ecf9e', clipPath: 'polygon(0 0,100% 0,0 100%)', opacity: .65 }) }, { style: abs({ right: 40, bottom: -30, width: 60, height: 60, borderRadius: '50%', background: '#c4a66a', opacity: .5 }) } ] },
  { name: 'ring', bg: GEO_PALETTES.amber, shapes: [ { style: abs({ left: 100, top: -30, width: 90, height: 90, borderRadius: '50%', border: '14px solid #f3d27a', opacity: .55 }) }, { style: abs({ left: -10, bottom: -24, width: 70, height: 40, background: '#1f3d2b', borderRadius: 8, transform: 'rotate(-18deg)', opacity: .35 }) } ] },
  { name: 'diamond', bg: GEO_PALETTES.ocean, shapes: [ { style: abs({ right: -6, bottom: -30, width: 80, height: 80, background: '#9dbdf0', transform: 'rotate(45deg)', borderRadius: 12, opacity: .55 }) }, { style: abs({ left: 120, top: 8, width: 26, height: 26, background: '#f3d27a', clipPath: 'polygon(50% 0,100% 100%,0 100%)', opacity: .8 }) } ] },
  { name: 'ribbons', bg: GEO_PALETTES.plum, shapes: [ { style: abs({ left: 70, top: -20, width: 110, height: 22, background: '#d4a5c9', borderRadius: 12, transform: 'rotate(-22deg)', opacity: .6 }) }, { style: abs({ left: 90, top: 12, width: 110, height: 22, background: '#e8d9b5', borderRadius: 12, transform: 'rotate(-22deg)', opacity: .5 }) } ] },
  { name: 'chevrons', bg: GEO_PALETTES.stripes, shapes: [ { style: abs({ right: 10, top: 8, width: 46, height: 46, borderRadius: '50%', background: '#d9a441', opacity: .9 }) } ] },
  { name: 'waveform', bg: GEO_PALETTES.teal, shapes: [ { style: abs({ left: 0, bottom: 0, width: '100%', height: 26, background: 'linear-gradient(90deg,transparent,#8fd0dc)', opacity: .55, clipPath: 'polygon(0 100%,20% 30%,40% 80%,60% 20%,80% 70%,100% 10%,100% 100%)' }) } ] },
  { name: 'stacked-diamonds', bg: GEO_PALETTES.slate, shapes: [ { style: abs({ right: 16, top: -14, width: 54, height: 54, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', opacity: .85 }) }, { style: abs({ right: 52, top: 26, width: 54, height: 54, background: '#dfe9e0', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', opacity: .5 }) } ] },
  { name: 'halo', bg: GEO_PALETTES.gold, shapes: [ { style: abs({ right: -24, bottom: -34, width: 96, height: 96, borderRadius: '50%', border: '18px solid #1f3d2b', opacity: .3 }) }, { style: abs({ left: 110, top: -8, width: 30, height: 70, background: '#fff', opacity: .25, transform: 'skewX(-20deg)' }) } ] },
]

export function geoIndexFor(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h % GEO_COMPOSITIONS.length
}
