import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractQueries, type NativeContentBlock } from '../../../src/lib/casebook/query-extraction'
import { mergeTranscript, type TranscriptFile } from '../../../src/lib/casebook/transcript-merge'

function block(b: NativeContentBlock, timestamp: string | null = null) {
  return { block: b, timestamp }
}

describe('extractQueries', () => {
  it('MCP tool-call form: extracts SQL from a tool_use input.query field', () => {
    const blocks = [
      block({ type: 'tool_use', id: 'tu1', name: 'mcp__bigquery__bq_query', input: { query: 'SELECT step_name, COUNT(*) FROM funnel_events GROUP BY step_name;' } }, '2026-08-18T00:00:00Z'),
      block({ type: 'tool_result', tool_use_id: 'tu1', content: 'step_name | sessions\ncart_view | 41200\ncheckout_start | 18900' }),
    ]
    const result = extractQueries(blocks)
    assert.equal(result.length, 1)
    assert.match(result[0].sql, /^SELECT step_name/)
    assert.equal(result[0].resultText, 'step_name | sessions\ncart_view | 41200\ncheckout_start | 18900')
    assert.equal(result[0].timestamp, '2026-08-18T00:00:00Z')
  })

  it('MCP tool-call form: extracts SQL from a Bash tool_use input.command running bq query', () => {
    const blocks = [
      block({
        type: 'tool_use',
        id: 'tu2',
        name: 'Bash',
        input: { command: '$ bq query "SELECT payment_provider, COUNT(*) AS attempts FROM payment_attempts GROUP BY payment_provider;"' },
      }),
      block({ type: 'tool_result', tool_use_id: 'tu2', content: 'payment_provider | attempts\nstripe_card | 9100\nstripe_ach | 1200' }),
    ]
    const result = extractQueries(blocks)
    assert.equal(result.length, 1)
    assert.match(result[0].sql, /^SELECT payment_provider/)
    assert.ok(result[0].resultText?.includes('stripe_ach'))
  })

  it('CLI-echo text form: extracts SQL from a plain text block with a $ bq query prefix', () => {
    const blocks = [
      block({
        type: 'text',
        text: '$ bq query\nSELECT step_name, COUNT(DISTINCT session_id) AS sessions\nFROM funnel_events\nGROUP BY step_name;',
      }),
    ]
    const result = extractQueries(blocks)
    assert.equal(result.length, 1)
    assert.match(result[0].sql, /^SELECT step_name/)
    // No structural tool_result pairing available for the legacy text form.
    assert.equal(result[0].resultText, null)
  })

  it('pairs tool_use and tool_result BY id, not by adjacency (result arrives several lines later)', () => {
    const blocks = [
      block({ type: 'tool_use', id: 'tu1', name: 'mcp__bigquery__bq_query', input: { sql: 'SELECT 1 AS a;' } }),
      block({ type: 'tool_use', id: 'tu2', name: 'mcp__bigquery__bq_query', input: { sql: 'SELECT 2 AS a;' } }),
      block({ type: 'tool_result', tool_use_id: 'tu2', content: 'a\n2' }),
      block({ type: 'tool_result', tool_use_id: 'tu1', content: 'a\n1' }),
    ]
    const result = extractQueries(blocks)
    assert.equal(result.length, 2)
    const q1 = result.find((r) => r.sql.includes('SELECT 1'))
    const q2 = result.find((r) => r.sql.includes('SELECT 2'))
    assert.equal(q1?.resultText, 'a\n1')
    assert.equal(q2?.resultText, 'a\n2')
  })

  it('sets nondeterministicOrder true when the query has no ORDER BY', () => {
    const blocks = [block({ type: 'tool_use', id: 'tu1', input: { query: 'SELECT * FROM t;' } })]
    const result = extractQueries(blocks)
    assert.equal(result[0].nondeterministicOrder, true)
  })

  it('sets nondeterministicOrder false when the query has an ORDER BY', () => {
    const blocks = [block({ type: 'tool_use', id: 'tu1', input: { query: 'SELECT * FROM t ORDER BY id;' } })]
    const result = extractQueries(blocks)
    assert.equal(result[0].nondeterministicOrder, false)
  })

  it('does not fabricate a query from a tool_use with no SQL-shaped input', () => {
    const blocks = [block({ type: 'tool_use', id: 'tu1', name: 'Read', input: { file_path: '/workspace/notes.md' } })]
    const result = extractQueries(blocks)
    assert.equal(result.length, 0)
  })

  it('preserves SQL verbatim, including a leading comment line', () => {
    const sql = '-- Tuesday gap\nSELECT day_of_week, COUNT(*) FROM events GROUP BY day_of_week;'
    const blocks = [block({ type: 'tool_use', id: 'tu1', input: { query: sql } })]
    const result = extractQueries(blocks)
    assert.equal(result[0].sql, sql.replace(/;?$/, ';'))
  })

  it('REGRESSION for pipeline bug #5: extraction from a merged multi-jsonl transcript covers MCP tool_use spanning a reconnect, not just CLI-echo text', () => {
    // File 1 (pre-reconnect): a CLI-echoed query in plain assistant text.
    const preReconnect: TranscriptFile = {
      path: '.cc-transcripts/proj/session-pre.jsonl',
      content: JSON.stringify({
        sessionId: 'session-pre',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: '$ bq query\nSELECT day_of_week, COUNT(*) AS signups FROM events GROUP BY day_of_week;' }],
        },
      }),
    }
    // File 2 (post-reconnect): a real MCP tool_use + its tool_result.
    const postReconnect: TranscriptFile = {
      path: '.cc-transcripts/proj/session-post.jsonl',
      content: [
        JSON.stringify({
          sessionId: 'session-post',
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'tu-post-1', name: 'mcp__bigquery__bq_query', input: { query: 'SELECT payment_provider, COUNT(*) AS failures FROM payment_attempts WHERE status = \'failed\' GROUP BY payment_provider;' } }],
          },
        }),
        JSON.stringify({
          sessionId: 'session-post',
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: 'tu-post-1', content: 'payment_provider | failures\nstripe_ach | 640' }],
          },
        }),
      ].join('\n'),
    }

    const { blocks } = mergeTranscript([preReconnect, postReconnect])
    const result = extractQueries(blocks)

    // Both forms must be found — a CLI-only extractor would return exactly 1
    // (the pre-reconnect line) and silently miss the MCP tool_use in the
    // post-reconnect file, reproducing bug #5.
    assert.equal(result.length, 2)
    assert.ok(result.some((r) => r.sql.includes('GROUP BY day_of_week')))
    const mcpResult = result.find((r) => r.sql.includes('payment_provider'))
    assert.ok(mcpResult)
    assert.equal(mcpResult?.resultText, 'payment_provider | failures\nstripe_ach | 640')
  })
})
