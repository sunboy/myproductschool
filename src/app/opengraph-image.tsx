import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'HackProduct — Practice Gym for Product and Technical Judgment'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#faf6f0',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#4a7c59',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
            }}
          >
            🎓
          </div>
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#4a7c59',
              letterSpacing: '-1px',
            }}
          >
            HackProduct
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#2e3230',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          The AI-native practice gym for product and technical judgment
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 18,
            color: '#4a4e4a',
          }}
        >
          hackproduct.dev
        </div>
      </div>
    ),
    size
  )
}
