'use client'

// SkillsLibraryPanel — the in-session Skills Library. Lists the .claude/skills the
// user has accumulated across sessions (from /api/claude-code/skills, read from
// their cc-user-state tarball) and lets them reload one into the live session with
// one click. "Load" injects a heredoc that recreates the skill file in the
// workspace via the same terminal mechanism SuggestedPromptRail uses; it does NOT
// auto-run, so the user reviews and presses Enter. This makes the rubric's
// "skills compound" promise visible and reusable.

import { useEffect, useState, type RefObject } from 'react'
import type { ClaudeCodeTerminalHandle } from './types'

interface UserSkill {
  filename: string
  title: string
  preview: string
  content: string
}

interface SkillsLibraryPanelProps {
  terminalRef: RefObject<ClaudeCodeTerminalHandle | null>
  /** Skills already present in THIS session (badge them, avoid implying a reload is needed). */
  sessionSkills: string[]
  /** Whether the `claude` REPL is running — loading must happen in bash, not the REPL. */
  replRunning?: boolean
  /** Called when a skill is loaded into the session, so the medium can mark it written. */
  onLoaded?: (filename: string) => void
}

/** Random hex so the heredoc delimiter never collides with the skill body. */
function randomDelimiter(): string {
  let hex = ''
  for (let i = 0; i < 8; i++) hex += Math.floor(Math.random() * 16).toString(16)
  return `HACKPRODUCT_SKILL_${hex}`
}

function shortName(filename: string): string {
  return filename.replace(/^\.claude\/skills\//, '')
}

export function SkillsLibraryPanel({
  terminalRef,
  sessionSkills,
  replRunning = false,
  onLoaded,
}: SkillsLibraryPanelProps) {
  const [skills, setSkills] = useState<UserSkill[] | null>(null)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/claude-code/skills')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { skills?: UserSkill[] }) => {
        if (!cancelled) setSkills(Array.isArray(data.skills) ? data.skills : [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function loadSkill(skill: UserSkill) {
    const path = skill.filename.startsWith('.claude/')
      ? skill.filename
      : `.claude/skills/${skill.filename}`
    const dir = path.replace(/\/[^/]+$/, '')
    const delim = randomDelimiter()
    const body = skill.content.replace(/\r/g, '')
    // Quoted delimiter prevents $/backtick expansion inside the skill body.
    const cmd = `mkdir -p ${dir} && cat > ${path} <<'${delim}'\n${body}\n${delim}\n`
    terminalRef.current?.insertText(cmd)
    terminalRef.current?.focus()
    onLoaded?.(path)
  }

  // Don't render anything heavy until we know there's something to show. The panel
  // collapses to a slim empty/error state otherwise.
  const hasSkills = skills && skills.length > 0

  return (
    <div
      style={{
        borderRadius: 10,
        background: 'var(--color-surface-container-low)',
        border: '1px solid var(--color-outline-variant)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 15, color: 'var(--color-tertiary)', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
        >
          construction
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
          Your skills library
        </span>
      </div>

      {skills === null && !error && (
        <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', margin: 0 }}>Loading…</p>
      )}

      {error && (
        <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', margin: 0 }}>
          Could not load your skills right now.
        </p>
      )}

      {skills && !hasSkills && (
        <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--color-on-surface-variant)', margin: 0 }}>
          Skills you build get saved here and compound across sessions. Write your first one in the skill step.
        </p>
      )}

      {hasSkills && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {skills.map((skill) => {
            const name = shortName(skill.filename)
            const inSession = sessionSkills.some((s) => shortName(s) === name)
            const isOpen = expanded === skill.filename
            return (
              <div
                key={skill.filename}
                style={{
                  borderRadius: 8,
                  background: 'var(--color-surface-container)',
                  border: '1px solid var(--color-outline-variant)',
                  padding: '8px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {skill.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}
                    </div>
                  </div>
                  {inSession ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', padding: '3px 7px', borderRadius: 999, background: 'var(--color-primary-fixed)', whiteSpace: 'nowrap' }}>
                      In session
                    </span>
                  ) : (
                    <button
                      onClick={() => loadSkill(skill)}
                      title={replRunning ? 'Exit claude to the shell first, then load' : 'Inserts a command into the terminal. You review and run it.'}
                      style={{
                        fontSize: 11, fontWeight: 700,
                        color: 'var(--color-on-primary)',
                        background: 'var(--color-primary)',
                        border: 'none', borderRadius: 999,
                        padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Load
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(isOpen ? null : skill.filename)}
                    aria-label={isOpen ? 'Hide preview' : 'Show preview'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex', padding: 2 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
                {isOpen && (
                  <pre
                    style={{
                      marginTop: 8, marginBottom: 0,
                      fontSize: 10.5, lineHeight: 1.5,
                      color: 'var(--color-on-surface-variant)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      maxHeight: 160, overflow: 'auto',
                      fontFamily: 'monospace',
                    }}
                  >
                    {skill.preview}
                    {skill.content.length > skill.preview.length ? '\n…' : ''}
                  </pre>
                )}
              </div>
            )
          })}
          {replRunning && (
            <p style={{ fontSize: 10.5, color: 'var(--color-on-surface-variant)', margin: '2px 0 0' }}>
              Loading writes a file. Run it from the shell, not inside claude.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
