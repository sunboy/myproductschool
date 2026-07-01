import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo/site'

export const alt = 'HackProduct founding member offer for the first 100 engineers'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  // Raw hex is fine here: next/og ImageResponse style objects are not Tailwind.
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1000 }}>
          <div style={{ color: '#c4a66a', fontSize: 24, fontWeight: 900, letterSpacing: 4 }}>
            FOUNDING MEMBER PRICE
          </div>
          <div style={{ fontSize: 76, lineHeight: 1.0, fontWeight: 900, color: '#4a7c59' }}>
            First 100 engineers. Locks in before it goes up.
          </div>
          <div style={{ maxWidth: 940, color: '#647064', fontSize: 27, lineHeight: 1.35 }}>
            Claim the founding rate on HackProduct Pro. Start free, no card, then lock the price you keep.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Start free', 'Claim founding price'].map((label) => (
            <div
              key={label}
              style={{
                borderRadius: 999,
                background: '#e7e0d5',
                color: '#2d5a3d',
                padding: '16px 24px',
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
