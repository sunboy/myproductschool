// Report content for /go/salary — filled in by its page build.
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'

export function buildSalaryReport(result: MagnetResultPayload, name?: string | null): ReportContent {
  void result
  void name
  return { title: 'Your report', sections: [] }
}
