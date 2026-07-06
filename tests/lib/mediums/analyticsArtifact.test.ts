import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { deriveArtifactRows, artifactProgress, artifactSummaryText } from '@/components/v2/mediums/analyticsArtifact'
import { arcForDifficulty, arcForLearner } from '@/components/v2/mediums/analyticsArc'
import { buildScaffoldStep } from '@/lib/adaptive/branching'

const BASE = {
  scenarioQuestion: 'Where does the funnel leak?',
  mcpConnected: false,
  replRunning: false,
  markedFindings: [],
  reportPath: null,
  skillsWritten: [],
  dimensions: null,
}

describe('deriveArtifactRows', () => {
  it('walks the full arc into the canonical milestones plus bookends', () => {
    const rows = deriveArtifactRows({ ...BASE, subProblems: arcForDifficulty('advanced') })
    assert.deepEqual(
      rows.map((r) => r.key),
      ['question', 'connection', 'schema', 'drop', 'segment', 'verdict', 'report', 'skill', 'grade'],
    )
    assert.equal(rows[0].state, 'filled') // question text present
    assert.equal(rows.find((r) => r.key === 'connection')?.accent, true)
    assert.equal(rows.find((r) => r.key === 'skill')?.accent, true)
  })

  it('drops milestones a beginner arc never runs', () => {
    const rows = deriveArtifactRows({ ...BASE, subProblems: arcForDifficulty('beginner') })
    const keys = rows.map((r) => r.key)
    assert.ok(!keys.includes('segment'))
    assert.ok(!keys.includes('report'))
    assert.ok(keys.includes('schema'))
    assert.ok(keys.includes('verdict'))
  })

  it('open compressed arc still yields one schema row plus the stretch row', () => {
    const arc = arcForLearner('advanced', 'open')
    const rows = deriveArtifactRows({ ...BASE, subProblems: arc })
    assert.equal(rows.filter((r) => r.key === 'schema').length, 1)
    const stretch = rows.find((r) => r.key === 'stretch')
    assert.ok(stretch)
    assert.equal(stretch?.badge, 'Stretch')
    assert.equal(stretch?.ariaTitle, 'Defend the read')
  })

  it('an injected scaffold appears at its arc position and activates by step id', () => {
    const arc = arcForDifficulty('advanced')
    const scaffold = buildScaffoldStep(arc[3]) // before 'analyze'
    const withScaffold = [...arc.slice(0, 3), scaffold, ...arc.slice(3)].map((s, i) => ({ ...s, sequence: i + 1 }))
    const rows = deriveArtifactRows({ ...BASE, subProblems: withScaffold, activeStepId: scaffold.id })
    const regroupIdx = rows.findIndex((r) => r.key === 'regroup')
    const dropIdx = rows.findIndex((r) => r.key === 'drop')
    assert.ok(regroupIdx > 0 && regroupIdx < dropIdx)
    assert.equal(rows[regroupIdx].state, 'active')
    assert.equal(rows[regroupIdx].badge, 'Regroup')
    assert.equal(rows[dropIdx].state, 'pending')
  })

  it('fills evidence rows from pass/partial findings on any backing step', () => {
    const arc = arcForDifficulty('advanced')
    const rows = deriveArtifactRows({
      ...BASE,
      subProblems: arc,
      mcpConnected: true,
      replRunning: true,
      markedFindings: [
        { id: 'data_layout', text: '8M rows, partitioned on event_date', verdict: 'pass' },
        { id: 'analyze', text: 'Cart to checkout drops 42%', verdict: 'retry' },
      ],
      skillsWritten: ['funnel-analyst.md'],
    })
    assert.equal(rows.find((r) => r.key === 'connection')?.state, 'filled')
    assert.equal(rows.find((r) => r.key === 'schema')?.state, 'filled')
    assert.equal(rows.find((r) => r.key === 'schema')?.value, '8M rows, partitioned on event_date')
    assert.equal(rows.find((r) => r.key === 'drop')?.state, 'pending') // retry does not fill
    assert.equal(rows.find((r) => r.key === 'skill')?.state, 'filled')
  })

  it('artifactProgress counts filled rows', () => {
    const rows = deriveArtifactRows({ ...BASE, subProblems: arcForDifficulty('beginner'), mcpConnected: true, replRunning: true })
    const { done, total } = artifactProgress(rows)
    assert.equal(total, rows.length)
    assert.equal(done, 2) // question + connection
  })

  it('artifactSummaryText names milestone states one per line', () => {
    const rows = deriveArtifactRows({ ...BASE, subProblems: arcForDifficulty('beginner') })
    const text = artifactSummaryText(rows)
    assert.ok(text.includes('Question — done'))
    assert.ok(text.split('\n').length === rows.length)
  })
})
