import { GeoArt } from '@/components/density/GeoArt'

export function HeroImageSlot({ src, alt, seed, height = 180 }: { src?: string | null; alt?: string; seed: string; height?: number }) {
  return src ? (
    <img
      src={src}
      alt={alt ?? ''}
      width={700}
      height={height}
      className="mb-5 w-full rounded-2xl object-cover"
      style={{ height }}
      data-testid="reader-hero"
    />
  ) : (
    <GeoArt seed={seed} height={height} className="mb-5 rounded-2xl" data-testid="reader-hero">
      <i className="absolute block rounded-xl" style={{ left: 60, top: 30, width: 280, height: 100, background: '#9db8a0', transform: 'rotate(-12deg)' }} />
      <i className="absolute block rounded-xl" style={{ left: 30, top: 80, width: 220, height: 80, background: '#eae3cf', transform: 'rotate(-12deg)' }} />
    </GeoArt>
  )
}
