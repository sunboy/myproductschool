import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from '@/lib/lead-magnets/reports'
import { PrintButton } from './PrintButton'

interface MagnetReportProps {
  slug: string
  magnetLabel: string
  result: MagnetResultPayload
  name?: string | null
  content: ReportContent
  recommendedNext?: { label: string; href: string }
}

/** Human-readable label for a dimension key. */
function humanizeDimKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Generic printable report frame for /go/{slug}/r/{token}.
 *
 * Server component. The print button is extracted to a small client child to
 * keep the rest of the tree server-renderable.
 */
export function MagnetReport({
  magnetLabel,
  result,
  content,
  recommendedNext,
}: MagnetReportProps) {
  const dimensions = result.dimensions
    ? Object.entries(result.dimensions).map(([key, value]) => ({
        key,
        label: humanizeDimKey(key),
        value,
      }))
    : null

  const ctaHref = recommendedNext?.href ?? '/challenges'
  const ctaLabel = recommendedNext?.label ?? 'Practice it on a real challenge'

  return (
    <div className="v3">
      <div className="lm-report">
        {/* Header */}
        <div className="lm-report-header lm-no-print-cta">
          <div className="shell">
            <p className="lm-report-eyebrow">Your report</p>
            <h1 className="lm-report-title">{content.title}</h1>
          </div>
        </div>

        {/* Band */}
        <div className="lm-result-band">
          <div className="shell">
            <p className="lm-result-band-meta">{magnetLabel}</p>
            <p className="lm-result-band-label">{result.band}</p>
          </div>
        </div>

        {/* Dimension bars */}
        {dimensions && dimensions.length > 0 && (
          <div className="lm-section">
            <div className="shell">
              {dimensions.map((dim) => {
                // Dimensions stored as 0-100 or raw score. Treat max as 100
                // unless the value exceeds 100, in which case cap the bar at 100%.
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

        {/* Intro */}
        {content.intro && (
          <div className="lm-section">
            <div className="shell">
              <p className="lm-report-intro">{content.intro}</p>
            </div>
          </div>
        )}

        {/* Sections */}
        {content.sections.map((section) => (
          <div key={section.id} className="lm-section lm-report-section-card">
            <div className="shell">
              <h2 className="lm-report-section-title">{section.title}</h2>
              <div className="lm-report-section-body">{section.body}</div>
            </div>
          </div>
        ))}

        {/* Footer CTA row */}
        <div className="lm-section lm-no-print">
          <div className="shell lm-report-footer-row">
            <PrintButton />
            <a href={ctaHref} className="lm-btn lm-btn-primary">
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
