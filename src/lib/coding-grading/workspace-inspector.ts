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

/** Minimal POSIX/ustar tar reader. Handles regular files; skips the rest. */
function readTar(buf: Buffer): TarEntry[] {
  const entries: TarEntry[] = []
  let offset = 0
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512)
    // End of archive: two zero blocks.
    if (header.every((b) => b === 0)) break

    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '')
    const sizeStr = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim()
    const size = parseInt(sizeStr, 8) || 0
    const typeFlag = String.fromCharCode(header[156])

    offset += 512
    if (typeFlag === '0' || typeFlag === '\0' || typeFlag === '') {
      // Regular file.
      const content = buf.subarray(offset, offset + size)
      if (name) entries.push({ name, content: Buffer.from(content) })
    }
    // Advance past the file content, padded to a 512-byte boundary.
    offset += Math.ceil(size / 512) * 512
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
      } else if (lower.endsWith('.sql') || lower.endsWith('notes.md') || lower.endsWith('.py')) {
        artifacts.push({ filename: e.name.replace(/^.*workspace\//, ''), preview: preview(e.content) })
      }
    }

    return { skills, artifacts, fileCount: entries.length, ok: true }
  } catch {
    return EMPTY
  }
}
