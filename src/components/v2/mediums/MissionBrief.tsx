'use client'

// MissionBrief — the per-session start screen. Replaces the mechanics-only
// onboarding overlay ("the stepper shows where you are") with the mission itself:
// the business question as the headline, a preview of the artifact the learner will
// walk out with (report + skill named as promised outcomes), a readiness indicator,
// and the literal first prompt, visible before it runs. This is the "here is your
// goal and your first move" moment the session was missing.

import { useState } from 'react'
import { HatchImage } from '@/components/redesign/HatchImage'

interface MissionBriefProps {
  question: string
  /** Composed scenario context/trigger, shown as the brief body if present. */
  briefBody?: string
  /** True once the sandbox is live and the analyst REPL is running. */
  ready: boolean
  /** The first prompt to run, shown verbatim. */
  firstPrompt: string
  /** Start the sandbox (if not started) — the brief's primary CTA before ready. */
  onStart: () => void
  /** Run the first prompt into the live terminal (enabled once ready). */
  onRunFirstPrompt: () => void
  /** Dismiss the brief and go straight to the workspace. */
  onDismiss: () => void
}

export function MissionBrief({
  question,
  briefBody,
  ready,
  firstPrompt,
  onStart,
  onRunFirstPrompt,
  onDismiss,
}: MissionBriefProps) {
  const [starting, setStarting] = useState(false)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(30,27,20,0.65)', backdropFilter: 'blur(6px)',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 20,
        padding: '20px 22px 16px',
        maxWidth: 560, width: '100%',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: '0 24px 60px -12px rgba(30,27,20,0.28)',
      }}>
      {/* Scrollable content — the action row below stays pinned so the CTAs
          are always visible without scrolling. */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {/* Header: Hatch + mission label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HatchImage size={36} state="idle" />
          <div>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.09em',
              textTransform: 'uppercase', color: 'var(--color-primary)',
            }}>
              Your mission
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-on-surface-variant)', marginTop: 1 }}>
              A live Claude Code session against real BigQuery data.
            </div>
          </div>
        </div>

        {/* The question — the headline */}
        <h2 style={{
          fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 800,
          lineHeight: 1.25, color: 'var(--color-on-surface)', margin: 0,
          letterSpacing: '-0.01em',
        }}>
          {question}
        </h2>

        {briefBody && (
          <p style={{
            fontSize: 13, lineHeight: 1.55, color: 'var(--color-on-surface-variant)', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {briefBody}
          </p>
        )}

        {/* What you'll walk out with — the promised artifact */}
        <div style={{
          background: 'var(--color-surface-container-low)',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 12, padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--color-on-surface-variant)',
          }}>
            You will walk out with
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <PromiseRow icon="verified" text="A proven answer, backed by a real number from the data" />
            <PromiseRow icon="description" text="A report you can share, written to the workspace" accent />
            <PromiseRow icon="construction" text="A reusable skill that teaches the agent this analysis for next time" accent />
          </div>
        </div>

        {/* Readiness + first move */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11.5, fontWeight: 800, padding: '4px 11px', borderRadius: 99,
              background: ready ? 'rgba(74,124,89,0.14)' : 'var(--color-surface-container-high)',
              color: ready ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 99, background: 'currentColor',
                boxShadow: ready ? '0 0 0 3px rgba(74,124,89,0.22)' : 'none',
              }} />
              {ready ? 'Sandbox live · BigQuery connected' : 'Sandbox not started yet'}
            </span>
          </div>

          <div style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--color-on-surface-variant)',
          }}>
            Your first move
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
            color: '#e8e4dc', background: '#1c1f1e',
            borderRadius: 10, padding: '9px 11px',
          }}>
            <span style={{ color: '#8ecf9e' }}>› </span>{firstPrompt}
          </div>
        </div>

        </div>

        {/* Actions — pinned outside the scroll region */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', flexShrink: 0, paddingTop: 2 }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '9px 16px', borderRadius: 99,
              background: 'transparent', color: 'var(--color-on-surface-variant)',
              border: '1px solid var(--color-outline-variant)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            I&apos;ll drive myself
          </button>
          {ready ? (
            <button
              onClick={() => { onRunFirstPrompt(); onDismiss() }}
              style={primaryBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>play_arrow</span>
              Run first prompt
            </button>
          ) : (
            <button
              onClick={() => { setStarting(true); onStart() }}
              disabled={starting}
              style={{ ...primaryBtn, opacity: starting ? 0.7 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                {starting ? 'progress_activity' : 'rocket_launch'}
              </span>
              {starting ? 'Starting…' : 'Start the sandbox'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px', borderRadius: 99,
  background: 'var(--color-primary)', color: 'var(--color-on-primary)',
  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
}

function PromiseRow({ icon, text, accent }: { icon: string; text: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
      <span className="material-symbols-outlined" style={{
        fontSize: 17, flexShrink: 0, marginTop: 1,
        color: accent ? 'var(--color-tertiary)' : 'var(--color-primary)',
        fontVariationSettings: "'FILL' 1, 'wght' 500",
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-on-surface)', fontWeight: 500 }}>
        {text}
      </span>
    </div>
  )
}

// ── Per-challenge gate ───────────────────────────────────────────────────────
// The brief shows once per challenge (localStorage), replacing the old
// one-time mechanics overlay. Dismissing or starting marks it seen.

const BRIEF_KEY_PREFIX = 'cc-analytics-brief:'

export function shouldShowMissionBrief(challengeId: string): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(`${BRIEF_KEY_PREFIX}${challengeId}`)
}

export function markMissionBriefSeen(challengeId: string): void {
  try {
    localStorage.setItem(`${BRIEF_KEY_PREFIX}${challengeId}`, '1')
  } catch { /* no storage */ }
}
