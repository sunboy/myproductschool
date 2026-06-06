'use client'

// SharedAnalyticsArtifact — the client body of a public analytics share. The server
// share page fetches serializable data (markdown + graded dimensions) and hands it
// here; this component runs the recharts-based charts and the markdown renderer,
// keeping recharts out of any server module. Renders: analyst scorecard → report
// charts → the full markdown report.

import { ReportCharts } from './ReportCharts'
import { AnalystDimensionChart } from './AnalystDimensionChart'
import { Md } from '@/components/ui/Md'
import type { AnalystDimensionView } from '@/lib/coding-grading/analyst-rubric'

interface SharedAnalyticsArtifactProps {
  reportMarkdown: string
  dimensions: AnalystDimensionView[] | null
  overallNote: string | null
}

export function SharedAnalyticsArtifact({
  reportMarkdown,
  dimensions,
  overallNote,
}: SharedAnalyticsArtifactProps) {
  return (
    <div className="space-y-5">
      {dimensions && dimensions.length > 0 && (
        <AnalystDimensionChart dimensions={dimensions} overallNote={overallNote} variant="share" />
      )}

      <ReportCharts markdown={reportMarkdown} variant="share" />

      <article className="rounded-xl bg-[#f8f3ea] p-6 text-[#233028] shadow-2xl">
        <Md variant="default">{reportMarkdown}</Md>
      </article>
    </div>
  )
}
