// The one skill loader: every AI behavior that a hackproduct-* skill governs
// loads its SKILL.md through here (cached per process), with the inline
// fallback keeping the route alive if the file is missing. This is what makes
// skills the runtime source of truth instead of documentation that drifts.

import { readFileSync } from 'fs'
import { join } from 'path'

const cache = new Map<string, string | null>()

/**
 * Loads ~/.claude/skills/<name>/SKILL.md, cached. Returns `fallback` when the
 * file is missing or unreadable — a missing skill must never 500 a grader.
 */
export function loadSkillPrompt(name: string, fallback: string): string {
  if (!cache.has(name)) {
    try {
      const p = join(process.env.HOME ?? '/root', '.claude/skills', name, 'SKILL.md')
      cache.set(name, readFileSync(p, 'utf-8'))
    } catch {
      cache.set(name, null)
    }
  }
  return cache.get(name) ?? fallback
}
