import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo/site'

export const alt = 'HackProduct level readiness checker result'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

// Inlined lookups so this server-rendered image never pulls the client checker
// into its bundle. Kept in sync with READINESS_ROLES / READINESS_LEVELS.
const ROLE_LABELS: Record<string, string> = {
  swe: 'Software Engineer',
  data_eng: 'Data Engineer',
  ml_eng: 'ML Engineer',
  devops: 'DevOps / Platform',
  em: 'Eng Manager',
  founding_eng: 'Founding Engineer',
  tech_lead: 'Tech Lead',
  pm: 'Product Manager',
}

const LEVELS: Array<{ id: string; label: string; bar: string }> = [
  { id: 'mid', label: 'Mid', bar: 'Pick a reasonable option and make it work.' },
  { id: 'senior', label: 'Senior', bar: 'Weigh a real tradeoff and defend the call.' },
  { id: 'staff', label: 'Staff', bar: 'Name the criterion, own the sacrifice, make the bet measurable.' },
  { id: 'principal', label: 'Principal', bar: 'Set the criterion others reuse and make the decision reversible.' },
]

const FALLBACK_TITLE = 'Are you reasoning at the level you want?'
const FALLBACK_LINE =
  'Pick your role and target level. See the reasoning bar you have to clear on one real prompt.'

export default async function Image({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; level?: string }>
}) {
  const { role, level } = await searchParams
  const roleLabel = role ? ROLE_LABELS[role] : undefined
  const levelEntry = level ? LEVELS.find((l) => l.id === level) : undefined
  const targetIndex = levelEntry ? LEVELS.findIndex((l) => l.id === levelEntry.id) : -1
  const hasResult = Boolean(roleLabel && levelEntry)

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }}>
          <div style={{ color: '#c4a66a', fontSize: 24, fontWeight: 900, letterSpacing: 4 }}>
            {hasResult
              ? `${roleLabel!.toUpperCase()} AIMING FOR ${levelEntry!.label.toUpperCase()}`
              : 'LEVEL READINESS CHECKER'}
          </div>
          <div style={{ fontSize: hasResult ? 64 : 62, lineHeight: 1.02, fontWeight: 900, color: '#4a7c59' }}>
            {hasResult ? `The bar at ${levelEntry!.label}` : FALLBACK_TITLE}
          </div>
          <div style={{ maxWidth: 980, color: '#647064', fontSize: 27, lineHeight: 1.35 }}>
            {hasResult ? levelEntry!.bar : FALLBACK_LINE}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {LEVELS.map((l, i) => {
            const isTarget = hasResult && i === targetIndex
            return (
              <div
                key={l.id}
                style={{
                  borderRadius: 999,
                  background: isTarget ? '#4a7c59' : '#e7e0d5',
                  color: isTarget ? '#f8f3ea' : '#2d5a3d',
                  padding: '16px 26px',
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                {l.label}
              </div>
            )
          })}
        </div>
      </div>
    ),
    size
  )
}
