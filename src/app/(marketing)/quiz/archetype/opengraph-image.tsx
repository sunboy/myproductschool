import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo/site'
import { archetypeBySlug, observationFor } from '@/lib/calibration/deriveArchetype'

export const alt = 'HackProduct product-thinking archetype quiz result'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

const FALLBACK_TITLE = 'What kind of product thinker are you?'
const FALLBACK_LINE = 'Four scenarios. One archetype. Take the quiz and find your blind spot.'

export default async function Image({
  searchParams,
}: {
  searchParams: Promise<{ a?: string }>
}) {
  const { a } = await searchParams
  const archetype = a ? archetypeBySlug(a) : null
  const observation = archetype ? observationFor(archetype.name) : ''

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
            {archetype ? 'YOUR PRODUCT-THINKING ARCHETYPE' : 'PRODUCT-THINKING ARCHETYPE QUIZ'}
          </div>
          <div style={{ fontSize: archetype ? 84 : 68, lineHeight: 0.98, fontWeight: 900, color: '#4a7c59' }}>
            {archetype ? archetype.name : FALLBACK_TITLE}
          </div>
          <div style={{ maxWidth: 900, color: '#647064', fontSize: 27, lineHeight: 1.35 }}>
            {archetype ? observation : FALLBACK_LINE}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Frame', 'List', 'Optimize', 'Win'].map(label => (
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
    size
  )
}
