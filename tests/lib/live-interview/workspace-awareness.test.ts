import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  LIVE_INTERVIEW_DISCIPLINE_CONTRACTS,
  buildDisciplinePromptBlock,
} from '../../../src/lib/live-interview/discipline-contracts'
import { LiveInterviewArtifactSnapshotSchema } from '../../../src/lib/live-interview/snapshot-schema'
import {
  buildDeterministicWorkspaceReply,
  buildLiveWorkspaceSignal,
} from '../../../src/lib/live-interview/workspace-adapters'
import { assertNoOpusModel, liveInterviewModel } from '../../../src/lib/live-interview/model-policy'
import { shouldRunLiveInterviewRetrieval } from '../../../src/lib/live-interview/context-pack'
import { buildLiveInterviewSystemPrompt } from '../../../src/lib/live-interview/system-prompt'
import type { LiveInterviewDiscipline } from '../../../src/lib/live-interview/disciplines'

const DISCIPLINES: LiveInterviewDiscipline[] = [
  'product_sense',
  'system_design',
  'data_modeling',
  'coding',
  'sql',
]

function basePrompt(discipline: LiveInterviewDiscipline) {
  return buildLiveInterviewSystemPrompt({
    archetype: 'Analyst',
    archetypeDescription: 'methodical and curious',
    moveLevels: { frame: 2, list: 3, optimize: 2, win: 2 },
    failurePatterns: [],
    competencies: [],
    hatchContext: '',
    roleId: discipline === 'coding' ? 'SWE' : discipline === 'sql' ? 'Data Scientist' : 'PM',
    discipline,
  })
}

describe('live interview discipline contracts', () => {
  it('defines the required contract fields for all supported disciplines', () => {
    for (const discipline of DISCIPLINES) {
      const contract = LIVE_INTERVIEW_DISCIPLINE_CONTRACTS[discipline]
      assert.equal(contract.discipline, discipline)
      assert.ok(contract.minimumUsefulArtifact.length > 20)
      assert.ok(contract.watchedSignals.length >= 5)
      assert.ok(contract.emptyReply.length > 20)
      assert.ok(contract.thinReply.length > 20)
      assert.ok(contract.probeDimensions.length >= 5)
      assert.ok(contract.debriefDimensions.length >= 4)
      assert.ok(contract.doneCriteria.length >= 3)
    }
  })

  it('uses discipline-specific prompt blocks instead of product-only coaching', () => {
    const systemDesign = buildDisciplinePromptBlock('system_design')
    assert.match(systemDesign, /components/i)
    assert.match(systemDesign, /failure/i)

    const dataModeling = buildDisciplinePromptBlock('data_modeling')
    assert.match(dataModeling, /primary keys/i)
    assert.match(dataModeling, /cardinality/i)

    const coding = buildDisciplinePromptBlock('coding')
    assert.match(coding, /runnable code/i)
    assert.match(coding, /edge/i)

    const sql = buildDisciplinePromptBlock('sql')
    assert.match(sql, /result grain/i)
    assert.match(sql, /joins/i)
  })
})

describe('live interview snapshot schema', () => {
  it('accepts current canvas and editor payloads', () => {
    const canvas = LiveInterviewArtifactSnapshotSchema.parse({
      type: 'canvas',
      discipline: 'system_design',
      elementCount: 3,
      elementTypes: { rectangle: 2, arrow: 1 },
      textLabels: ['API', 'DB'],
      sceneSummary: {
        elementCount: 3,
        entities: [{
          id: 'api',
          label: 'API',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 120,
          height: 80,
          columns: [],
        }],
        connections: [],
        groups: [],
        freeText: ['scale: 1k qps'],
        foreignKeys: [],
      },
    })
    assert.equal(canvas.type, 'canvas')

    const editor = LiveInterviewArtifactSnapshotSchema.parse({
      type: 'editor',
      discipline: 'sql',
      language: 'sql',
      code: 'select user_id, count(*) from events group by 1',
      runResult: { testsPassed: 1, testsTotal: 1 },
    })
    assert.equal(editor.language, 'sql')
  })

  it('rejects invalid or oversized payloads', () => {
    assert.throws(() => LiveInterviewArtifactSnapshotSchema.parse({ type: 'audio' }))
    assert.throws(() => LiveInterviewArtifactSnapshotSchema.parse({
      type: 'editor',
      code: 'x'.repeat(40001),
    }))
    assert.throws(() => LiveInterviewArtifactSnapshotSchema.parse({
      type: 'canvas',
      textLabels: Array.from({ length: 1001 }, (_, i) => `label-${i}`),
    }))
  })

  it('truncates oversized run output before persistence', () => {
    const snapshot = LiveInterviewArtifactSnapshotSchema.parse({
      type: 'editor',
      discipline: 'coding',
      language: 'python',
      code: 'def solution():\n    return 1',
      runResult: { output: 'x'.repeat(8000), nested: { value: 'kept only in preview' } },
    })
    assert.equal(typeof snapshot.runResult, 'object')
    assert.equal((snapshot.runResult as { truncated?: boolean }).truncated, true)
    assert.ok(((snapshot.runResult as { preview?: string }).preview ?? '').length <= 4000)
  })
})

describe('live workspace adapter', () => {
  it('classifies empty, thin, started, substantive, failed, and passing work', () => {
    assert.equal(buildLiveWorkspaceSignal(null, 'coding').state, 'missing')
    assert.equal(buildLiveWorkspaceSignal({ type: 'canvas', discipline: 'system_design', elementCount: 0 }, null).state, 'empty')
    assert.equal(buildLiveWorkspaceSignal({ type: 'editor', discipline: 'coding', code: 'x=1', language: 'python' }, null).state, 'thin')
    assert.equal(buildLiveWorkspaceSignal({
      type: 'canvas',
      discipline: 'system_design',
      elementCount: 4,
      textLabels: ['Client', 'API', 'DB'],
    }, null).state, 'started')
    assert.equal(buildLiveWorkspaceSignal({
      type: 'canvas',
      discipline: 'data_modeling',
      elementCount: 6,
      textLabels: ['grain: one row per order', 'orders PK order_id FK user_id', 'users PK user_id', '1:n'],
    }, null).state, 'substantive')
    assert.equal(buildLiveWorkspaceSignal({
      type: 'editor',
      discipline: 'coding',
      code: 'def solution(nums):\n    return nums[0]\n',
      language: 'python',
      runResult: { testsPassed: 1, testsTotal: 3 },
    }, null).state, 'failed_tests')
    assert.equal(buildLiveWorkspaceSignal({
      type: 'editor',
      discipline: 'sql',
      code: 'select user_id from users',
      language: 'sql',
      runResult: { testsPassed: 2, testsTotal: 2 },
    }, null).state, 'passing_signal')
  })

  it('returns concise discipline-specific deterministic replies', () => {
    const emptySystemDesign = buildLiveWorkspaceSignal({ type: 'canvas', discipline: 'system_design', elementCount: 0 }, null)
    assert.match(buildDeterministicWorkspaceReply(emptySystemDesign, 'done') ?? '', /core components/i)

    const thinSql = buildLiveWorkspaceSignal({ type: 'editor', discipline: 'sql', language: 'sql', code: 'select *' }, null)
    assert.match(buildDeterministicWorkspaceReply(thinSql, 'done') ?? '', /result grain/i)
  })
})

describe('live interview retrieval and model policy', () => {
  it('skips normal turns but allows explicit study/recommendation and debrief triggers', () => {
    assert.equal(shouldRunLiveInterviewRetrieval({ trigger: 'normal_turn', message: 'I would use a cache.' }), false)
    assert.equal(shouldRunLiveInterviewRetrieval({ trigger: 'normal_turn', message: 'What should I practice next?' }), true)
    assert.equal(shouldRunLiveInterviewRetrieval({ trigger: 'debrief' }), true)
  })

  it('maps live routes to Sonnet/Haiku and rejects Opus through the guard', () => {
    assert.match(liveInterviewModel('chat'), /sonnet/i)
    assert.match(liveInterviewModel('debrief'), /sonnet/i)
    assert.match(liveInterviewModel('analyze'), /haiku/i)
    assert.match(liveInterviewModel('grade_turn'), /haiku/i)
    assert.throws(() => assertNoOpusModel('claude-opus-4-6', 'test'))
  })
})

describe('live interview prompts', () => {
  it('keeps product sense conversational and FLOW-led', () => {
    const prompt = basePrompt('product_sense')
    assert.match(prompt, /Frame, List, Optimize, Win/)
    assert.match(prompt, /user segment/i)
  })

  it('watches system design canvas details', () => {
    const prompt = basePrompt('system_design')
    assert.match(prompt, /components/i)
    assert.match(prompt, /APIs\/events/i)
    assert.match(prompt, /data flow/i)
    assert.match(prompt, /failure modes/i)
    assert.doesNotMatch(prompt, /This is a product interview practice session/)
  })

  it('watches data modeling, coding, and SQL details', () => {
    assert.match(basePrompt('data_modeling'), /PK\/FK/i)
    assert.match(basePrompt('data_modeling'), /cardinality/i)
    assert.match(basePrompt('coding'), /test coverage/i)
    assert.match(basePrompt('coding'), /edge cases/i)
    assert.match(basePrompt('sql'), /result grain/i)
    assert.match(basePrompt('sql'), /nulls\/duplicates/i)
  })
})

describe('artifact grader consumes the structured canvas scene', () => {
  it('buildUserContent grades against sceneSummary entities, not just counts', async () => {
    const { buildUserContent } = await import('@/lib/live-interview/artifact-grader')
    const { summarizeScene } = await import('@/lib/hatch/canvas-scene')
    const scene = summarizeScene([
      { type: 'rectangle', id: 'r1', x: 0, y: 0, width: 200, height: 120, boundElements: [{ id: 't1', type: 'text' }] },
      { type: 'text', id: 't1', containerId: 'r1', text: 'orders\nid [PK]\nuser_id [FK users.id]', x: 10, y: 10, width: 180, height: 100 },
    ] as never[])
    const content = buildUserContent({
      type: 'canvas',
      discipline: 'data_modeling',
      elementCount: scene.elementCount,
      sceneSummary: scene,
    })
    assert.ok(content.includes('orders'), 'entity label must reach the grader prompt')
    assert.ok(/primary evidence|Structured canvas scene/.test(content))
    // The count-inference fallback must NOT be active when the scene is present.
    assert.ok(!content.includes('infer from the count'))
  })

  it('falls back to count inference when no scene is captured (legacy snapshots)', async () => {
    const { buildUserContent } = await import('@/lib/live-interview/artifact-grader')
    const content = buildUserContent({ type: 'canvas', elementCount: 4 })
    assert.ok(content.includes('infer from the count'))
  })
})
