import { describe, expect, it } from 'vitest'
import { findWrittenReportPath } from '@/components/v2/mediums/terminalSignals'

describe('Claude Code report write detection', () => {
  it.each([
    ['Wrote /workspace/report.md', '/workspace/report.md'],
    ['Wrote 42 lines to /workspace/funnel-report.md', '/workspace/funnel-report.md'],
    ['Created /workspace/analysis_report.md', '/workspace/analysis_report.md'],
    ['● Write(/workspace/report.md)', '/workspace/report.md'],
    ['Saved report.md', '/workspace/report.md'],
  ])('recognizes completed write output: %s', (output, expected) => {
    expect(findWrittenReportPath(output)).toBe(expected)
  })

  it('ignores instructions that merely mention a report path', () => {
    expect(findWrittenReportPath('Please write the answer to /workspace/report.md next.')).toBeNull()
    expect(findWrittenReportPath('I wrote some notes earlier. Next, create /workspace/report.md.')).toBeNull()
  })

  it('honors a lab-specific absolute report pattern', () => {
    expect(findWrittenReportPath('Created /workspace/debug-summary.md', '\\/workspace\\/debug-summary\\.md'))
      .toBe('/workspace/debug-summary.md')
  })
})
