import type { PublicReportPayload } from '@/lib/casebook/public-report-projection'

interface ReportSnapshotProps {
  report: PublicReportPayload
}

/**
 * Presentational card for the public report page. Its prop type is
 * PublicReportPayload — the already-projected, allowlisted shape — not the
 * raw snapshot. There is no code path in this component that can reach
 * expert move labels, missed-move detail, or rubric text: those fields do
 * not exist on PublicReportPayload. See public-report-projection.ts.
 */
export function ReportSnapshot({ report }: ReportSnapshotProps) {
  const hasMoveCounts = report.moves_matched_count !== null && report.moves_total_count !== null

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6 shadow-sm">
      <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Challenge report
      </p>
      <h1 className="mt-2 font-headline text-2xl font-bold text-on-surface">{report.case_title}</h1>
      {report.hook && <p className="mt-2 font-body text-sm italic text-on-surface-variant">{report.hook}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {report.grade_label && (
          <span className="rounded-full bg-primary-container px-4 py-1.5 font-label text-sm font-semibold text-on-primary-container">
            {report.grade_label}
          </span>
        )}
        {report.total_score !== null && (
          <span className="rounded-full bg-secondary-container px-4 py-1.5 font-label text-sm font-semibold text-on-secondary-container">
            {report.total_score}/100
          </span>
        )}
        {hasMoveCounts && (
          <span className="rounded-full bg-tertiary-container px-4 py-1.5 font-label text-sm font-semibold text-on-surface">
            Matched {report.moves_matched_count} of {report.moves_total_count} expert moves
          </span>
        )}
      </div>

      {report.verdict_cause && (
        <div className="mt-6 border-t border-outline-variant pt-4">
          <h2 className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Verdict
          </h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-on-surface">{report.verdict_cause}</p>
          {report.verdict_confidence && (
            <p className="mt-1 font-body text-xs text-on-surface-variant">
              Confidence: {report.verdict_confidence}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
