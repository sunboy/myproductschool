import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSharedAttemptScorecard, type MoveKey } from '@/lib/share/attempt-scorecard'

export const alt = 'HackProduct practice scorecard'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

const MOVE_ORDER: MoveKey[] = ['frame', 'list', 'optimize', 'win']

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string; shareId: string }>
}) {
  const { id, shareId } = await params
  const scorecard = await getSharedAttemptScorecard(createAdminClient(), { challengeId: id, shareId })
  const levels = MOVE_ORDER.map(move => (
    scorecard?.moveLevels.find(level => level.move === move) ?? { move, level: 1, progressPct: 0 }
  ))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#1f2a23',
          color: '#f8f3ea',
          fontFamily: 'Arial, sans-serif',
          padding: 56,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            border: '2px solid rgba(248, 243, 234, 0.2)',
            borderRadius: 32,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 420,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#f8f3ea',
              color: '#233028',
              padding: 42,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: '#4a7c59',
                  color: '#f8f3ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  fontWeight: 900,
                }}
              >
                H
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#4a7c59' }}>{SITE_NAME}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', color: '#4a7c59' }}>
                <span style={{ fontSize: 88, lineHeight: 0.9, fontWeight: 900 }}>
                  {scorecard?.scoreLabel ?? 'Score'}
                </span>
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 800 }}>
                {scorecard?.challengeTitle ?? 'HackProduct challenge'}
              </div>
              <div style={{ fontSize: 20, color: '#647064', fontWeight: 700 }}>
                {scorecard?.gradeLabel ?? 'Shared product practice result'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {levels.map(level => (
                <div
                  key={level.move}
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 18,
                    background: '#e7e0d5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#647064' }}>{titleCase(level.move)}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#2d5a3d' }}>L{level.level}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 34,
              padding: 54,
            }}
          >
            <div style={{ color: '#c4a66a', fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>
              SHARED SCORECARD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontSize: 58, lineHeight: 1, fontWeight: 900 }}>
                Product thinking, scored across FLOW.
              </div>
              <div style={{ fontSize: 26, lineHeight: 1.35, color: 'rgba(248, 243, 234, 0.76)' }}>
                Frame the problem, list the signals, optimize tradeoffs, and win stakeholder confidence.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {levels.map(level => (
                <div key={level.move} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 106, fontSize: 22, fontWeight: 900 }}>{titleCase(level.move)}</div>
                  <div style={{ flex: 1, height: 18, borderRadius: 99, background: 'rgba(248, 243, 234, 0.18)' }}>
                    <div
                      style={{
                        width: `${level.progressPct}%`,
                        height: '100%',
                        borderRadius: 99,
                        background: '#c4a66a',
                      }}
                    />
                  </div>
                  <div style={{ width: 48, fontSize: 22, fontWeight: 900 }}>L{level.level}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
