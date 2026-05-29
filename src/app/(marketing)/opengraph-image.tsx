import { ImageResponse } from 'next/og'
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/seo/site'

export const alt = 'HackProduct AI-native learning platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
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
          <div style={{ color: '#8a8274', fontSize: 20, fontWeight: 800 }}>hackproduct.dev</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
          <div style={{ color: '#c4a66a', fontSize: 24, fontWeight: 900, letterSpacing: 4 }}>
            AI-NATIVE LEARNING
          </div>
          <div style={{ fontSize: 76, lineHeight: 0.95, fontWeight: 900 }}>
            Practice product thinking with Hatch.
          </div>
          <div style={{ maxWidth: 850, color: '#647064', fontSize: 28, lineHeight: 1.32 }}>
            {DEFAULT_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Product sense', 'System design', 'SQL', 'Live interviews'].map(label => (
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
