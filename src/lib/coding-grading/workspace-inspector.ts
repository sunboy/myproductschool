// lib/coding-grading/workspace-inspector.ts — server-side only.
//
// Downloads a session's workspace tarball from Supabase Storage and extracts the
// evidence the analyst grader needs: the .claude/skills/*.md files the user
// wrote (for the skill_construction dimension) plus any SQL / notes artifacts.
//
// Uses node's built-in zlib + a minimal tar reader so we don't add a `tar`
// dependency. The tarball is small (a fresh /workspace), so reading it fully in
// memory is fine. Tolerates a missing/corrupt tarball: returns empty evidence
// rather than throwing, so grading still runs.

import { gunzipSync } from 'zlib'
import { createAdminClient } from '@/lib/supabase/admin'

export interface WorkspaceSkill {
  filename: string
  preview: string // first ~600 chars
}

export interface WorkspaceArtifact {
  filename: string
  preview: string
}

export interface WorkspaceEvidence {
  skills: WorkspaceSkill[]
  artifacts: WorkspaceArtifact[]
  fileCount: number
  /** True if the tarball was downloaded and parsed; false on any failure. */
  ok: boolean
}

const EMPTY: WorkspaceEvidence = { skills: [], artifacts: [], fileCount: 0, ok: false }

interface TarEntry {
  name: string
  content: Buffer
}

/**
 * Minimal tar reader for the snapshots GNU `tar -czf` produces. Handles regular
 * files, the ustar `prefix` field (paths up to 255 bytes split across
 * prefix+name), and GNU `L` long-name blocks (paths > 255 bytes), so deeply
 * nested skill files are not silently truncated and lost from the evidence.
 */
function readTar(buf: Buffer): TarEntry[] {
  const entries: TarEntry[] = []
  let offset = 0
  let pendingLongName: string | null = null

  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512)
    if (header.every((b) => b === 0)) break // end-of-archive (zero block)

    const rawName = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '')
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '')
    const sizeStr = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim()
    const size = parseInt(sizeStr, 8) || 0
    const typeFlag = String.fromCharCode(header[156])
    const blocks = Math.ceil(size / 512) * 512

    offset += 512

    if (typeFlag === 'L') {
      // GNU long-name: this block's content IS the next entry's full name.
      pendingLongName = buf.subarray(offset, offset + size).toString('utf8').replace(/\0.*$/, '')
      offset += blocks
      continue
    }
    if (typeFlag === 'x' || typeFlag === 'g' || typeFlag === 'K') {
      // PAX extended / GNU long-link headers — skip their payload.
      offset += blocks
      continue
    }

    if (typeFlag === '0' || typeFlag === '\0' || typeFlag === '') {
      const name = pendingLongName ?? (prefix ? `${prefix}/${rawName}` : rawName)
      const content = buf.subarray(offset, offset + size)
      if (name) entries.push({ name, content: Buffer.from(content) })
    }
    pendingLongName = null
    offset += blocks
  }
  return entries
}

function preview(content: Buffer, max = 600): string {
  return content.toString('utf8').slice(0, max)
}

/**
 * Downloads and inspects the latest workspace snapshot for a session.
 * @param transcriptUri storage path within the `cc-sessions` bucket
 *   (e.g. "<sessionId>/workspace-<ts>.tar.gz"), from claude_code_sessions.transcript_uri.
 */
export async function inspectWorkspace(transcriptUri: string | null): Promise<WorkspaceEvidence> {
  if (!transcriptUri) return EMPTY

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.from('cc-sessions').download(transcriptUri)
    if (error || !data) return EMPTY

    const gz = Buffer.from(await data.arrayBuffer())
    let tarBuf: Buffer
    try {
      tarBuf = gunzipSync(gz)
    } catch {
      return EMPTY // not gzipped / corrupt
    }

    const entries = readTar(tarBuf)
    const skills: WorkspaceSkill[] = []
    const artifacts: WorkspaceArtifact[] = []

    for (const e of entries) {
      const lower = e.name.toLowerCase()
      // Skills the user wrote — the skill_construction evidence.
      if (lower.includes('.claude/skills/') && lower.endsWith('.md')) {
        skills.push({ filename: e.name.replace(/^.*\.claude\/skills\//, '.claude/skills/'), preview: preview(e.content) })
      } else if (
        (lower.endsWith('.sql') || lower.endsWith('.py') || lower.endsWith('.md'))
        // Exclude the seeded brief (CLAUDE.md) so the grader sees the user's
        // OWN artifacts (queries, notes, report), not the instructions it was given.
        && !lower.endsWith('/claude.md')
        && lower !== 'claude.md'
      ) {
        artifacts.push({ filename: e.name.replace(/^.*workspace\//, ''), preview: preview(e.content) })
      }
    }

    return { skills, artifacts, fileCount: entries.length, ok: true }
  } catch {
    return EMPTY
  }
}

/**
 * Read the FULL content of one workspace file from the latest snapshot tarball
 * (the inspector previews are truncated). Returns the matched file's name +
 * full text, or null. Used to serve/share the report.md.
 */
export async function readWorkspaceFile(
  transcriptUri: string | null,
  match: (name: string) => boolean,
): Promise<{ filename: string; content: string } | null> {
  if (!transcriptUri) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.from('cc-sessions').download(transcriptUri)
    if (error || !data) return null
    const gz = Buffer.from(await data.arrayBuffer())
    const tarBuf = gunzipSync(gz)
    const entries = readTar(tarBuf)
    const hit = entries.find((e) => match(e.name.toLowerCase()))
    if (!hit) return null
    return {
      filename: hit.name.replace(/^.*workspace\//, ''),
      content: hit.content.toString('utf8'),
    }
  } catch {
    return null
  }
}
