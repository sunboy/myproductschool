// Report content for /go/spot-the-flaw — filled in by its page build.
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'

export function buildSpotTheFlawReport(result: MagnetResultPayload, name?: string | null): ReportContent {
  void result
  void name
  return { title: 'Your report', sections: [] }
}
