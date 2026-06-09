import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLeadMagnet } from '@/lib/lead-magnets/config'
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'

export const alt = 'Your HackProduct report'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function humanizeDimKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params

  const magnet = getLeadMagnet(slug)

  // Generic fallback card when slug is invalid or has no report
  if (!magnet || !magnet.hasReport || !UUID_RE.test(token)) {
    return genericCard('HackProduct', 'Practice your product thinking')
  }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('leads')
    .select('source_slug, magnet_result')
    .eq('report_token', token)
    .maybeSingle()

  if (!row || row.source_slug !== slug || !row.magnet_result) {
    return genericCard(magnet.label, 'Your personal report')
  }

  const result = row.magnet_result as MagnetResultPayload

  const dims = result.dimensions
    ? Object.entries(result.dimensions)
        .slice(0, 5)
        .map(([key, value]) => ({ key, label: humanizeDimKey(key), value }))
    : []

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#1e3528',
          color: '#f3ede0',
          fontFamily: 'Arial, sans-serif',
          padding: 0,
        }}
      >
        {/* Left panel — cream */}
        <div
          style={{
            width: 440,
            height: '100%',
            background: '#faf6f0',
            color: '#1e1b14',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 48,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: '#4a7c59',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              H
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#4a7c59' }}>HackProduct</div>
          </div>

          {/* Band */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#78715f', letterSpacing: 1 }}>
              {magnet.label.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 0.95,
                color: '#4a7c59',
                display: 'flex',
              }}
            >
              {result.band}
            </div>
          </div>

          {/* Domain */}
          <div style={{ display: 'flex', fontSize: 18, color: '#78715f', fontWeight: 700 }}>
            hackproduct.com
          </div>
        </div>

        {/* Right panel — forest */}
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 28,
            padding: 56,
          }}
        >
          <div
            style={{
              color: '#c4a66a',
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 3,
              display: 'flex',
            }}
          >
            PERSONAL REPORT
          </div>

          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              lineHeight: 1.05,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {magnet.label}
          </div>

          {dims.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dims.map((dim) => {
                const pct = Math.min(Math.round((dim.value / 100) * 100), 100)
                return (
                  <div
                    key={dim.key}
                    style={{ display: 'flex', alignItems: 'center', gap: 16 }}
                  >
                    <div
                      style={{
                        width: 220,
                        fontSize: 17,
                        fontWeight: 800,
                        display: 'flex',
                      }}
                    >
                      {dim.label}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 14,
                        borderRadius: 99,
                        background: 'rgba(243, 237, 224, 0.18)',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 99,
                          background: pct >= 70 ? '#8ecf9e' : pct >= 45 ? '#c4a66a' : 'rgba(243,237,224,0.4)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: 'rgba(243, 237, 224, 0.76)',
                display: 'flex',
              }}
            >
              Your personal score, scored and explained.
            </div>
          )}
        </div>
      </div>
    ),
    size,
  )
}

function genericCard(label: string, sub: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#1e3528',
          color: '#f3ede0',
          fontFamily: 'Arial, sans-serif',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: '#4a7c59',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 900,
          }}
        >
          H
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, display: 'flex' }}>{label}</div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(243, 237, 224, 0.7)',
            display: 'flex',
          }}
        >
          {sub}
        </div>
        <div style={{ fontSize: 20, color: '#8ecf9e', fontWeight: 700, display: 'flex' }}>
          hackproduct.com
        </div>
      </div>
    ),
    size,
  )
}
