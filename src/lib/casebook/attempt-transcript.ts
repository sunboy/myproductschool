// lib/casebook/attempt-transcript.ts — server-side only.
//
// Resolves a cc_case_attempts row to its Claude Code transcript(s) and returns
// the merged, chronological turn list ready for grading.
//
// JOIN PATH (there is no direct FK from cc_case_attempts to challenge_attempts
// or claude_code_sessions — see the file route's doc comment for why):
//   cc_case_attempts (user_id, case_id, started_at)
//     -> challenge_attempts (user_id, challenge_id = case_id): the row
//        case/start inserts in the SAME request as the cc_case_attempts row,
//        so its created_at is within a couple seconds of started_at. We take
//        the closest challenge_attempts row at or after started_at (bounded
//        above by started_at + 60s, matching case/start's own maxDuration, so
//        a later unrelated attempt is never picked up).
//     -> claude_code_sessions (attempt_id): UNIQUE per challenge_attempts row,
//        so this is a single row, not a list. A WebSocket drop/reconnect
//        reuses this SAME session row (provisionSession's "already live"
//        branch) rather than mint a new one — so ONE cc_case_attempts row
//        maps to exactly ONE claude_code_sessions row today. Multiple .jsonl
//        FILES still arrive inside that one row's tarball (see
//        transcript-merge.ts's doc comment) whenever the container itself
//        restarts mid-session; that is what mergeTranscriptFiles handles.
//     -> transcript_uri: the LATEST autosave tarball, which (per the
//        entrypoint's non-deleting cp -r merge) already holds the union of
//        every .cc-transcripts/**/*.jsonl file written across the session's
//        lifetime, including pre-reconnect ones.

import { createAdminClient } from '@/lib/supabase/admin'
import { readTarEntries } from '@/lib/coding-grading/workspace-inspector'
import { mergeTranscript, type MergedTurn, type TranscriptFile } from './transcript-merge'
import { extractQueries, type ExtractedQuery, type NativeContentBlock } from './query-extraction'

// case/start inserts challenge_attempts (step 2) BEFORE cc_case_attempts
// (step 3, see src/app/api/casebook/case/start/route.ts) — so
// challenge_attempts.created_at is a few milliseconds BEFORE
// cc_case_attempts.started_at, not after. The join window must be symmetric
// around started_at, not a forward-only window, or the very row we want is
// excluded on every normal attempt. 60s matches case/start's own
// maxDuration, generous enough to cover the gap between the two inserts.
const JOIN_WINDOW_MS = 60_000

export interface AttemptTranscriptResult {
  turns: MergedTurn[]
  /** Raw content blocks in chronological order, for structured query extraction. */
  blocks: Array<{ block: NativeContentBlock; timestamp: string | null }>
  /** SQL queries extracted from the raw blocks (both MCP tool_use and legacy CLI-echo form). */
  queries: ExtractedQuery[]
  /** True if a transcript tarball was found and at least one .jsonl file was read. */
  ok: boolean
  /** Number of distinct .jsonl files merged (for logging / grading transparency). */
  fileCount: number
}

const EMPTY: AttemptTranscriptResult = { turns: [], blocks: [], queries: [], ok: false, fileCount: 0 }

/**
 * Loads and merges the transcript for one cc_case_attempts row.
 * Never throws — a missing/corrupt tarball grades on an empty transcript
 * rather than 500ing the file/grade route.
 */
export async function loadAttemptTranscript(
  userId: string,
  caseId: string,
  startedAt: string,
): Promise<AttemptTranscriptResult> {
  try {
    const admin = createAdminClient()

    const startedAtMs = new Date(startedAt).getTime()
    const windowStart = new Date(startedAtMs - JOIN_WINDOW_MS).toISOString()
    const windowEnd = new Date(startedAtMs + JOIN_WINDOW_MS).toISOString()

    const attemptResult = await admin
      .from('challenge_attempts')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('challenge_id', caseId)
      .gte('created_at', windowStart)
      .lte('created_at', windowEnd)
      .order('created_at', { ascending: true })

    if (attemptResult.error || !attemptResult.data || attemptResult.data.length === 0) return EMPTY

    // Multiple challenge_attempts rows can fall inside the window (e.g. a
    // stale in_progress row from a prior aborted start, superseded before
    // this attempt's own insert — see case/start's supersede step). Pick the
    // row whose created_at is closest to started_at, not just the earliest
    // in the window.
    const closest = attemptResult.data.reduce((best, row) => {
      const rowDelta = Math.abs(new Date(row.created_at as string).getTime() - startedAtMs)
      const bestDelta = Math.abs(new Date(best.created_at as string).getTime() - startedAtMs)
      return rowDelta < bestDelta ? row : best
    })
    const challengeAttemptId = closest.id as string

    const sessionResult = await admin
      .from('claude_code_sessions')
      .select('transcript_uri')
      .eq('attempt_id', challengeAttemptId)
      .maybeSingle()

    if (sessionResult.error || !sessionResult.data) return EMPTY
    const transcriptUri = sessionResult.data.transcript_uri as string | null
    if (!transcriptUri) return EMPTY

    const entries = await readTarEntries('cc-sessions', transcriptUri)
    if (entries.length === 0) return EMPTY

    const jsonlFiles: TranscriptFile[] = entries
      .filter((e) => e.name.includes('.cc-transcripts/') && e.name.toLowerCase().endsWith('.jsonl'))
      .map((e) => ({ path: e.name, content: e.content.toString('utf8') }))

    if (jsonlFiles.length === 0) return EMPTY

    const { turns, blocks } = mergeTranscript(jsonlFiles)
    const queries = extractQueries(blocks)
    return { turns, blocks, queries, ok: turns.length > 0, fileCount: jsonlFiles.length }
  } catch {
    return EMPTY
  }
}
