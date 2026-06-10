import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSharedFitReport } from '@/lib/careerops/public/share'

export const alt = 'HackProduct job fit report'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

// Two deliberate card designs (the OG card is the growth artifact):
// - resume_roast leads with the grade letter and the quotable verdict line
//   (self-deprecating humor is safe to share).
// - job_fit leads with the role-demands analysis, with the personal score as
//   an opt-in badge — nobody posts "I'm a 54% fit for Stripe" to a feed their
//   manager reads.
export default async function Image({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params
  const report = await getSharedFitReport(createAdminClient(), shareId)

  const isRoast = report?.mode === 'resume_roast'
  const showScore = Boolean(report?.includeScore && report?.score != null && report?.grade)
  const role = [report?.roleTitle, report?.company].filter(Boolean).join(' at ')
  const demanded = (report?.readinessMap ?? []).filter((r) => r.demanded).slice(0, 4)
  const findings = (report?.roast?.sections ?? []).slice(0, 3)

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
              width: 430,
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isRoast && showScore ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, color: '#4a7c59' }}>
                  <span style={{ fontSize: 130, lineHeight: 0.9, fontWeight: 900 }}>{report?.grade}</span>
                  <span style={{ fontSize: 34, fontWeight: 900, paddingBottom: 12, color: '#2d5a3d' }}>
                    {report?.score}/100
                  </span>
                </div>
              ) : showScore ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, color: '#4a7c59' }}>
                  <span style={{ fontSize: 100, lineHeight: 0.9, fontWeight: 900 }}>{report?.grade}</span>
                  <span style={{ fontSize: 30, fontWeight: 900, paddingBottom: 10, color: '#2d5a3d' }}>
                    {report?.score}/100 fit
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 54, lineHeight: 1.05, fontWeight: 900, color: '#4a7c59', display: 'flex' }}>
                  {isRoast ? 'Resume roast' : 'The bar behind the listing'}
                </div>
              )}
              <div style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 800, display: 'flex' }}>
                {isRoast ? 'A resume, read honestly.' : role || 'Job fit report'}
              </div>
              <div style={{ fontSize: 19, color: '#647064', fontWeight: 700, display: 'flex' }}>
                {isRoast ? 'Graded line by line by Hatch' : 'What the interview loop actually tests'}
              </div>
            </div>

            <div style={{ display: 'flex', fontSize: 17, color: '#8a8274', fontWeight: 900, letterSpacing: 2 }}>
              HACKPRODUCT.COM/JOB-FIT
            </div>
          </div>

          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 26,
              padding: 50,
            }}
          >
            <div style={{ color: '#c4a66a', fontSize: 21, fontWeight: 900, letterSpacing: 3, display: 'flex' }}>
              {isRoast ? 'RESUME ROAST' : 'JOB FIT REPORT'}
            </div>

            {isRoast ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div style={{ fontSize: 40, lineHeight: 1.15, fontWeight: 900, display: 'flex' }}>
                  {report?.roast?.verdict_line
                    ? `"${report.roast.verdict_line.slice(0, 120)}"`
                    : 'Every finding points at a fixable line.'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {findings.map((section, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          letterSpacing: 1,
                          padding: '4px 14px',
                          borderRadius: 99,
                          background: section.severity === 'fatal' ? '#b83230' : section.severity === 'major' ? '#c4a66a' : 'rgba(248,243,234,0.25)',
                          color: section.severity === 'minor' ? '#f8f3ea' : '#1f2a23',
                          display: 'flex',
                        }}
                      >
                        {section.severity.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, display: 'flex' }}>{section.title.slice(0, 60)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div style={{ fontSize: 42, lineHeight: 1.1, fontWeight: 900, display: 'flex' }}>
                  {role ? `What it takes to clear the ${role} loop.` : 'What it takes to clear this interview loop.'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(demanded.length > 0 ? demanded : null)?.map((row) => (
                    <div key={row.discipline} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 200,
                          fontSize: 19,
                          fontWeight: 900,
                          color: '#8ecf9e',
                          display: 'flex',
                          textTransform: 'capitalize',
                        }}
                      >
                        {row.discipline.replaceAll('_', ' ')}
                      </div>
                      <div style={{ flex: 1, fontSize: 19, lineHeight: 1.25, color: 'rgba(248,243,234,0.82)', display: 'flex' }}>
                        {(row.bar || 'Demanded by this loop').slice(0, 90)}
                      </div>
                    </div>
                  )) ?? (
                    <div style={{ fontSize: 24, color: 'rgba(248,243,234,0.76)', display: 'flex' }}>
                      Per-discipline readiness, read from the job description.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
