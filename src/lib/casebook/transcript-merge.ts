// Casebook Loop — merges a case attempt's Claude Code transcript(s) into one
// chronological turn list for grading, plus the raw content blocks in the
// same order for structured query extraction (query-extraction.ts).
//
// WHY THIS EXISTS (read before touching move-diff or the grader)
// A single Challenge attempt runs inside ONE claude_code_sessions row (case/start
// mints a fresh session only on a genuinely new attempt; a WebSocket drop and
// reconnect reuses the same session via provision's "already live" branch — see
// src/lib/sandbox/provision-session.ts). But INSIDE that one session, a container
// restart (dropped connection, container respawn) starts Claude Code fresh, which
// begins a NEW .jsonl transcript file under ~/.claude/projects/<project>/. The
// entrypoint's 30-second autosave stages ALL of them into
// /workspace/.cc-transcripts/<project>/ via a non-deleting `cp -r` merge (see
// infra/claude-code-sandbox/entrypoint.sh), so ONE workspace tarball can contain
// MULTIPLE .jsonl files for the same attempt.
//
// Each .jsonl file's lines carry the file's own Claude Code session id in a
// `sessionId` field (confirmed against real transcripts under
// ~/.claude/projects/**/*.jsonl) — this is Claude Code's OWN session id, NOT this
// product's `claude_code_sessions.id`. We never assume "the one jsonl in the
// dir": we parse every .jsonl entry found in the tarball, group lines by that
// embedded sessionId, dedupe lines within a session (the non-deleting merge can
// re-copy identical lines across autosave cycles — dedupe by the line's own
// `uuid` field when present, else a hash of the raw line), then concatenate
// sessions ordered by each session's first line. This reconstructs the full
// reconnect-spanning conversation instead of grading a fragment.

import { createHash } from 'crypto'
import type { NativeContentBlock } from './query-extraction'

/** One raw JSONL line as Claude Code writes it. Only the fields we read are typed. */
export interface RawTranscriptLine {
  sessionId?: string
  uuid?: string
  type?: string
  timestamp?: string
  message?: {
    role?: string
    content?: unknown
  }
  [key: string]: unknown
}

/** One normalized turn used by the grader and move-diff extraction. */
export interface MergedTurn {
  sessionId: string
  /** ISO timestamp if present on the line, else null. */
  timestamp: string | null
  role: 'user' | 'assistant' | 'tool' | 'other'
  /** Flattened text content, best-effort. */
  text: string
}

/** Result of merging: normalized turns (for grading) plus the raw content
 * blocks in the same deduped, chronological order (for structured query
 * extraction — see query-extraction.ts's doc comment on why extraction must
 * run on blocks, not on flattened turn text). */
export interface MergeResult {
  turns: MergedTurn[]
  blocks: Array<{ block: NativeContentBlock; timestamp: string | null }>
}

export interface TranscriptFile {
  /** The .jsonl path within the tarball, e.g. '.cc-transcripts/-workspace/abc123.jsonl'. */
  path: string
  /** Raw file content, one JSON object per line. */
  content: string
}

/** Parses one JSONL file's lines, skipping malformed ones rather than throwing. */
function parseLines(content: string): RawTranscriptLine[] {
  const out: RawTranscriptLine[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const parsed = JSON.parse(trimmed) as RawTranscriptLine
      out.push(parsed)
    } catch {
      // Malformed/truncated line (e.g. a snapshot caught mid-write) — skip it,
      // never let one bad line drop the whole file.
    }
  }
  return out
}

/** Best-effort flatten of Claude Code's message.content (string or content-block array) to plain text. */
function flattenContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block
        if (block && typeof block === 'object') {
          const b = block as Record<string, unknown>
          if (typeof b.text === 'string') return b.text
          if (typeof b.input === 'object' && b.input) return JSON.stringify(b.input)
          if (typeof b.content === 'string') return b.content
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function normalizeRole(line: RawTranscriptLine): MergedTurn['role'] {
  const role = line.message?.role ?? line.type
  if (role === 'user') return 'user'
  if (role === 'assistant') return 'assistant'
  if (role === 'tool' || role === 'tool_result' || role === 'tool_use') return 'tool'
  return 'other'
}

/** Stable dedupe key for a line: its own uuid if present, else a hash of the raw JSON. */
function lineKey(line: RawTranscriptLine, raw: string): string {
  if (line.uuid) return `uuid:${line.uuid}`
  return `hash:${createHash('sha1').update(raw).digest('hex')}`
}

/**
 * Merges every .jsonl transcript file found in a workspace tarball into one
 * chronological turn list AND one chronological raw-block list, grouped by
 * Claude Code session id and deduped.
 *
 * Algorithm:
 *   1. Parse every file's lines, tagging each with its file path.
 *   2. Group lines by the line's own `sessionId` (falls back to the file path
 *      when a line carries no sessionId — e.g. the leading `mode` line).
 *   3. Within each session group, dedupe by line uuid (or content hash) and
 *      sort by the line's position (stable — JSONL is already append-order).
 *   4. Order the sessions by their first line's original file order (earliest
 *      file first — reconnects always produce a chronologically later file),
 *      then concatenate.
 *
 * `turns` keeps only lines carrying an assistant/user/tool message with
 * non-empty flattened text; bookkeeping lines (`mode`, `permission-mode`) are
 * dropped since they carry no gradable content. `blocks` carries every raw
 * content block from user/assistant lines (text, tool_use, tool_result,
 * thinking — thinking is filtered by the caller if needed) in the same
 * deduped chronological order, for structured query extraction.
 */
export function mergeTranscript(files: TranscriptFile[]): MergeResult {
  interface SessionGroup {
    sessionId: string
    firstFileIndex: number
    seen: Set<string>
    turns: MergedTurn[]
    blocks: Array<{ block: NativeContentBlock; timestamp: string | null }>
  }
  const groups = new Map<string, SessionGroup>()

  files.forEach((file, fileIndex) => {
    const lines = parseLines(file.content)
    for (const line of lines) {
      const sid = line.sessionId ?? file.path
      let group = groups.get(sid)
      if (!group) {
        group = { sessionId: sid, firstFileIndex: fileIndex, seen: new Set(), turns: [], blocks: [] }
        groups.set(sid, group)
      }

      const key = lineKey(line, JSON.stringify(line))
      if (group.seen.has(key)) continue
      group.seen.add(key)

      const timestamp = line.timestamp ?? null

      // Raw blocks for structured extraction — only real user/assistant
      // message lines carry content blocks worth extracting from.
      if (line.type === 'user' || line.type === 'assistant') {
        const content = line.message?.content
        if (typeof content === 'string') {
          group.blocks.push({ block: { type: 'text', text: content }, timestamp })
        } else if (Array.isArray(content)) {
          for (const b of content) {
            if (b && typeof b === 'object') {
              group.blocks.push({ block: b as NativeContentBlock, timestamp })
            }
          }
        }
      }

      const role = normalizeRole(line)
      if (role === 'other') continue // bookkeeping line, no gradable content

      const text = flattenContent(line.message?.content).trim()
      if (!text) continue

      group.turns.push({
        sessionId: sid,
        timestamp,
        role,
        text,
      })
    }
  })

  const orderedGroups = Array.from(groups.values()).sort((a, b) => a.firstFileIndex - b.firstFileIndex)
  return {
    turns: orderedGroups.flatMap((g) => g.turns),
    blocks: orderedGroups.flatMap((g) => g.blocks),
  }
}

/** Back-compat convenience: turns only. Prefer mergeTranscript() when the
 * caller also needs raw blocks (e.g. for query extraction). */
export function mergeTranscriptFiles(files: TranscriptFile[]): MergedTurn[] {
  return mergeTranscript(files).turns
}

/** Renders merged turns as a plain-text transcript for the grader prompt. */
export function renderMergedTranscript(turns: MergedTurn[], maxChars = 20000): string {
  const rendered = turns.map((t) => `[${t.role}] ${t.text}`).join('\n\n')
  if (rendered.length <= maxChars) return rendered
  // Keep the tail — the conclusion and falsifiable check land at the end of
  // the session and matter most for verdict/grading.
  return `…[truncated ${rendered.length - maxChars} earlier chars]…\n\n${rendered.slice(-maxChars)}`
}
