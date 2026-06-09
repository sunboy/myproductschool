import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLeadMagnet } from '@/lib/lead-magnets/config'
import { getReportContent } from '@/lib/lead-magnets/reports'
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { MagnetReport } from '@/components/landing-v3/lead-magnet/MagnetReport'
import { IS_MOCK } from '@/lib/mock'
import { captureServerImmediate } from '@/lib/posthog/server'

// UUID v4 pattern (8-4-4-4-12 hex groups)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MOCK_RESULT: MagnetResultPayload = {
  magnet: 'answer-fix',
  version: 1,
  answers: {},
  band: 'Needs structure',
  score: 62,
  dimensions: {
    frame: 55,
    list: 60,
    optimize: 45,
    win: 70,
  },
}

interface PageProps {
  params: Promise<{ slug: string; token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const magnet = getLeadMagnet(slug)
  const label = magnet?.label ?? 'Your report'
  return {
    title: `Your ${label} report`,
    robots: { index: false, follow: false },
  }
}

export default async function MagnetReportPage({ params }: PageProps) {
  const { slug, token } = await params

  const magnet = getLeadMagnet(slug)
  if (!magnet || !magnet.hasReport) notFound()

  // Mock mode: skip DB lookup and render demo content
  if (IS_MOCK) {
    const content = getReportContent(slug, MOCK_RESULT, 'Demo')
    return (
      <LeadMagnetShell>
        {content ? (
          <MagnetReport
            slug={slug}
            magnetLabel={magnet.label}
            result={MOCK_RESULT}
            name="Demo"
            content={content}
          />
        ) : (
          <FallbackReport
            magnetLabel={magnet.label}
            result={MOCK_RESULT}
          />
        )}
      </LeadMagnetShell>
    )
  }

  // Validate token shape before hitting the DB
  if (!UUID_RE.test(token)) notFound()

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('leads')
    .select('id, name, source_slug, magnet_result')
    .eq('report_token', token)
    .maybeSingle()

  if (error || !row || row.source_slug !== slug) notFound()

  const result = row.magnet_result as MagnetResultPayload | null
  if (!result) notFound()

  // Fire analytics without blocking render and without ever throwing
  void captureServerImmediate({
    distinctId: row.id as string,
    event: 'lead_magnet_report_viewed',
    properties: { slug, band: result.band },
  })

  const content = getReportContent(slug, result, row.name as string | null)

  return (
    <LeadMagnetShell>
      {content ? (
        <MagnetReport
          slug={slug}
          magnetLabel={magnet.label}
          result={result}
          name={row.name as string | null}
          content={content}
        />
      ) : (
        <FallbackReport
          magnetLabel={magnet.label}
          result={result}
        />
      )}
    </LeadMagnetShell>
  )
}

// ── Graceful fallback when no report builder exists yet ───────────────────────

interface FallbackProps {
  magnetLabel: string
  result: MagnetResultPayload
}

function FallbackReport({ magnetLabel, result }: FallbackProps) {
  const dimensions = result.dimensions
    ? Object.entries(result.dimensions).map(([key, value]) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
      }))
    : null

  return (
    <div className="v3">
      <div className="lm-report">
        <div className="lm-report-header">
          <div className="shell">
            <p className="lm-report-eyebrow">Your report</p>
            <h1 className="lm-report-title">{magnetLabel}</h1>
          </div>
        </div>

        <div className="lm-result-band">
          <div className="shell">
            <p className="lm-result-band-label">{result.band}</p>
          </div>
        </div>

        {dimensions && dimensions.length > 0 && (
          <div className="lm-section">
            <div className="shell">
              {dimensions.map((dim) => {
                const pct = Math.min(Math.round((dim.value / 100) * 100), 100)
                return (
                  <div key={dim.key} className="lm-score-row">
                    <span className="lm-score-label">{dim.label}</span>
                    <span className="lm-score-val">{dim.value}</span>
                    <div className="lm-score-bar">
                      <div className="lm-score-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="lm-section lm-no-print">
          <div className="shell">
            <a href="/challenges" className="lm-btn lm-btn-primary">
              Practice on a real challenge
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
