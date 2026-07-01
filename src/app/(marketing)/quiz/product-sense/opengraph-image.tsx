import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo/site'
import { parseResultSlug, moveLabel } from '@/lib/quiz/productSense'

export const alt = 'HackProduct product-sense round result'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

const FALLBACK_TITLE = 'Can you pass a product-sense round?'
const FALLBACK_LINE =
  'One scenario, two taste-checks, one recommendation. Hatch scores it out of nine.'

const VERDICT_HEADLINE = {
  sharp: 'Passed the room',
  solid: 'One move short',
  developing: 'Instinct there, structure not',
} as const

export default async function Image({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>
}) {
  const { r } = await searchParams
  const parsed = parseResultSlug(r)

  const eyebrow = parsed ? 'MY PRODUCT-SENSE RESULT' : 'PRODUCT-SENSE ROUND'
  const title = parsed ? VERDICT_HEADLINE[parsed.verdict] : FALLBACK_TITLE
  const line = parsed
    ? `Strong on ${moveLabel(parsed.strongMove)}. Weak on ${moveLabel(parsed.weakMove)}. Find out where you land.`
    : FALLBACK_LINE

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f8f3ea',
          color: '#233028',
          fontFamily: 'Arial, sans-serif',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: '#4a7c59',
                color: '#f8f3ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 38,
                fontWeight: 900,
              }}
            >
              H
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#4a7c59' }}>{SITE_NAME}</div>
          </div>
          <div style={{ color: '#8a8274', fontSize: 20, fontWeight: 800 }}>hackproduct.com</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 980 }}>
          <div style={{ color: '#c4a66a', fontSize: 24, fontWeight: 900, letterSpacing: 4 }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: parsed ? 82 : 68, lineHeight: 0.98, fontWeight: 900, color: '#4a7c59' }}>
            {title}
          </div>
          <div style={{ maxWidth: 900, color: '#647064', fontSize: 27, lineHeight: 1.35 }}>{line}</div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Frame', 'Optimize', 'Win'].map((label) => (
            <div
              key={label}
              style={{
                borderRadius: 999,
                background: '#e7e0d5',
                color: '#2d5a3d',
                padding: '16px 22px',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
