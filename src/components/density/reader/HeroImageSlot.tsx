import { GeoArt } from '@/components/density/GeoArt'

/** Chapter/story hero: real image when present, geometric placeholder otherwise. Aspect-ratio, not a pixel height. */
export function HeroImageSlot({ src, alt, seed, ratio = '700/180' }: { src?: string | null; alt?: string; seed: string; ratio?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ''} width={700} height={180} className="mb-5 w-full rounded-card object-cover" style={{ aspectRatio: ratio }} data-testid="reader-hero" />
  ) : (
    <GeoArt seed={seed} height="auto" style={{ aspectRatio: ratio }} className="mb-5 rounded-card" data-testid="reader-hero">
      <i className="absolute block rounded-xl" style={{ left: '8%', top: '17%', width: '40%', height: '55%', background: '#9db8a0', transform: 'rotate(-12deg)' }} />
      <i className="absolute block rounded-xl" style={{ left: '4%', top: '45%', width: '32%', height: '45%', background: '#eae3cf', transform: 'rotate(-12deg)' }} />
    </GeoArt>
  )
}
