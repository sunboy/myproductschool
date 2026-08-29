import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mergeTranscript, mergeTranscriptFiles, type TranscriptFile } from '../../../src/lib/casebook/transcript-merge'

function line(obj: Record<string, unknown>): string {
  return JSON.stringify(obj)
}

describe('mergeTranscript', () => {
  it('merges turns from a single .jsonl file in order', () => {
    const file: TranscriptFile = {
      path: '.cc-transcripts/proj/session-a.jsonl',
      content: [
        line({ type: 'mode', mode: 'normal', sessionId: 'session-a' }),
        line({ sessionId: 'session-a', type: 'user', message: { role: 'user', content: 'What caused the dip?' } }),
        line({ sessionId: 'session-a', type: 'assistant', message: { role: 'assistant', content: 'Let me check the schema.' } }),
      ].join('\n'),
    }

    const { turns } = mergeTranscript([file])
    assert.equal(turns.length, 2)
    assert.equal(turns[0].role, 'user')
    assert.equal(turns[0].text, 'What caused the dip?')
    assert.equal(turns[1].role, 'assistant')
  })

  it('drops bookkeeping lines (mode, permission-mode) with no gradable content', () => {
    const file: TranscriptFile = {
      path: 'a.jsonl',
      content: [
        line({ type: 'mode', mode: 'normal', sessionId: 'session-a' }),
        line({ type: 'permission-mode', permissionMode: 'bypassPermissions', sessionId: 'session-a' }),
        line({ sessionId: 'session-a', type: 'user', message: { role: 'user', content: 'hello' } }),
      ].join('\n'),
    }
    const { turns } = mergeTranscript([file])
    assert.equal(turns.length, 1)
  })

  it('DISAMBIGUATES MULTIPLE .jsonl FILES for the same attempt (reconnect case): merges by embedded sessionId, ordered by file arrival, and never assumes a single file', () => {
    // Simulates the exact scenario the Phase 4 brief warns about: a
    // WebSocket drop mid-attempt restarts Claude Code, producing a SECOND
    // .jsonl file with its own sessionId. The non-deleting `cp -r` autosave
    // merge means BOTH files land in the workspace tarball.
    const preReconnect: TranscriptFile = {
      path: '.cc-transcripts/proj/session-pre.jsonl',
      content: [
        line({ sessionId: 'session-pre', uuid: 'u1', type: 'user', message: { role: 'user', content: 'We saw a dip.' } }),
        line({ sessionId: 'session-pre', uuid: 'u2', type: 'assistant', message: { role: 'assistant', content: 'Pulling the funnel counts.' } }),
      ].join('\n'),
    }
    const postReconnect: TranscriptFile = {
      path: '.cc-transcripts/proj/session-post.jsonl',
      content: [
        line({ sessionId: 'session-post', uuid: 'u3', type: 'assistant', message: { role: 'assistant', content: 'Continuing after reconnect: segmenting by provider.' } }),
        line({ sessionId: 'session-post', uuid: 'u4', type: 'user', message: { role: 'user', content: 'What did you find?' } }),
      ].join('\n'),
    }

    const { turns } = mergeTranscript([preReconnect, postReconnect])

    // Both files' content survives — a fragment-only read would show 2, not 4.
    assert.equal(turns.length, 4)
    assert.deepEqual(
      turns.map((t) => t.text),
      [
        'We saw a dip.',
        'Pulling the funnel counts.',
        'Continuing after reconnect: segmenting by provider.',
        'What did you find?',
      ],
    )
    // Sessions grouped and kept internally coherent, ordered earliest file first.
    assert.deepEqual(
      turns.map((t) => t.sessionId),
      ['session-pre', 'session-pre', 'session-post', 'session-post'],
    )
  })

  it('dedupes lines re-copied across autosave cycles by uuid', () => {
    const cycle1: TranscriptFile = {
      path: '.cc-transcripts/proj/s.jsonl',
      content: [
        line({ sessionId: 's', uuid: 'u1', type: 'user', message: { role: 'user', content: 'hello' } }),
      ].join('\n'),
    }
    // A later autosave re-copies the same file content (non-deleting cp -r merge)
    // plus one new line — same uuid u1 must not be double-counted.
    const cycle2: TranscriptFile = {
      path: '.cc-transcripts/proj/s.jsonl',
      content: [
        line({ sessionId: 's', uuid: 'u1', type: 'user', message: { role: 'user', content: 'hello' } }),
        line({ sessionId: 's', uuid: 'u2', type: 'assistant', message: { role: 'assistant', content: 'hi there' } }),
      ].join('\n'),
    }

    const { turns } = mergeTranscript([cycle1, cycle2])
    // Because both are keyed under the same file path with no sessionId
    // collision issue, dedupe operates within the session group by uuid.
    const helloCount = turns.filter((t) => t.text === 'hello').length
    assert.equal(helloCount, 1)
  })

  it('dedupes lines with no uuid by content hash', () => {
    const file: TranscriptFile = {
      path: 'a.jsonl',
      content: [
        line({ sessionId: 's', type: 'user', message: { role: 'user', content: 'repeated line' } }),
        line({ sessionId: 's', type: 'user', message: { role: 'user', content: 'repeated line' } }),
      ].join('\n'),
    }
    const { turns } = mergeTranscript([file])
    assert.equal(turns.length, 1)
  })

  it('skips malformed JSON lines without dropping the rest of the file', () => {
    const file: TranscriptFile = {
      path: 'a.jsonl',
      content: [
        line({ sessionId: 's', type: 'user', message: { role: 'user', content: 'ok before' } }),
        '{not valid json',
        line({ sessionId: 's', type: 'assistant', message: { role: 'assistant', content: 'ok after' } }),
      ].join('\n'),
    }
    const { turns } = mergeTranscript([file])
    assert.equal(turns.length, 2)
  })

  it('mergeTranscriptFiles back-compat helper returns turns only', () => {
    const file: TranscriptFile = {
      path: 'a.jsonl',
      content: line({ sessionId: 's', type: 'user', message: { role: 'user', content: 'x' } }),
    }
    const turns = mergeTranscriptFiles([file])
    assert.equal(turns.length, 1)
  })

  it('extracts raw content blocks alongside turns, for structured query extraction', () => {
    const file: TranscriptFile = {
      path: 'a.jsonl',
      content: line({
        sessionId: 's',
        type: 'assistant',
        timestamp: '2026-08-18T00:00:10.000Z',
        message: {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'tu1', name: 'mcp__bigquery__bq_query', input: { query: 'SELECT 1;' } }],
        },
      }),
    }
    const { blocks } = mergeTranscript([file])
    assert.equal(blocks.length, 1)
    assert.equal(blocks[0].block.type, 'tool_use')
    assert.equal(blocks[0].timestamp, '2026-08-18T00:00:10.000Z')
  })
})
