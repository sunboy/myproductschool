// lib/sandbox/spend-alerts.ts — server-side only.
//
// Observability + alerting for Claude Code Analytics spend. Emits PostHog events
// and (deduped) admin emails when a user's rolling-30d spend crosses a reference
// threshold, or a single session runs hot. NO enforcement here — this is purely
// "tell me when something is expensive". The future monthly cap will read the same
// rolling sum (getUsedQuantity 'cc_claude_spend_cents').

import { captureServerImmediate } from '@/lib/posthog/server'
import { getResendClient, configuredFromEmail } from '@/lib/email/client'

// Reference budget the alert thresholds are measured against (NOT a cap — alerts
// only). Defaults to $10 so we get an early read on who would hit the planned cap.
const REFERENCE_BUDGET_CENTS = parseInt(process.env.CC_REFERENCE_BUDGET_CENTS ?? '1000', 10)
// A single session should never exceed the per-session gateway budget ($0.50) by
// much; this many cents flags a runaway (gateway budget miss / abuse).
const SESSION_RUNAWAY_CENTS = parseInt(process.env.CC_SESSION_RUNAWAY_CENTS ?? '80', 10)
const ALERT_EMAIL = process.env.CC_ALERT_EMAIL?.trim() || 'sandeeptnvs@gmail.com'

// In-process dedup so one cron run (or a burst) doesn't fire the same alert many
// times. Keyed by `${bucket}:${userId|sessionId}:${YYYY-MM-DD}`. Best-effort —
// resets on cold start, which is fine (at most one extra email per deploy/day).
const sentAlerts = new Set<string>()
function dayKey(): string {
  // Avoid Date.now()/new Date() with no arg is fine here (server runtime, not a
  // workflow). Use UTC date for a stable per-day bucket.
  return new Date().toISOString().slice(0, 10)
}
function once(key: string): boolean {
  const k = `${key}:${dayKey()}`
  if (sentAlerts.has(k)) return false
  sentAlerts.add(k)
  return true
}

async function emailAdmin(subject: string, lines: string[]): Promise<void> {
  const resend = getResendClient()
  if (!resend) return
  try {
    await resend.emails.send({
      from: configuredFromEmail(),
      to: ALERT_EMAIL,
      subject,
      text: lines.join('\n'),
    })
  } catch (err) {
    console.error('[cc-spend-alert] email send failed:', err)
  }
}

export interface UserSpendAlertInput {
  userId: string
  spentCents: number
  /** Optional label of who they are (plan / beta), for the email body. */
  cohort?: string
}

/**
 * Fire user-level spend alerts when rolling-30d spend crosses 80% / 100% / 150%
 * of the reference budget. Idempotent per user per threshold per day. PostHog
 * event always; email at >=100%.
 */
export async function alertUserSpend({ userId, spentCents, cohort }: UserSpendAlertInput): Promise<void> {
  const pct = REFERENCE_BUDGET_CENTS > 0 ? spentCents / REFERENCE_BUDGET_CENTS : 0
  const thresholds: Array<{ name: string; at: number }> = [
    { name: '150', at: 1.5 },
    { name: '100', at: 1.0 },
    { name: '80', at: 0.8 },
  ]
  const crossed = thresholds.find((t) => pct >= t.at)
  if (!crossed) return
  if (!once(`user_spend_${crossed.name}:${userId}`)) return

  await captureServerImmediate({
    distinctId: userId,
    event: 'cc_user_spend_threshold',
    properties: {
      threshold_pct: crossed.name,
      spend_usd: +(spentCents / 100).toFixed(2),
      reference_budget_usd: +(REFERENCE_BUDGET_CENTS / 100).toFixed(2),
      cohort: cohort ?? 'unknown',
    },
  })

  // Email only at the cap and above — 80% is a heads-up event, 100%+ pings me.
  if (pct >= 1.0) {
    await emailAdmin(
      `CC spend: user at $${(spentCents / 100).toFixed(2)} (${crossed.name}% of $${(REFERENCE_BUDGET_CENTS / 100).toFixed(0)})`,
      [
        `User ${userId} has spent $${(spentCents / 100).toFixed(2)} on Claude Code Analytics in the last 30 days.`,
        `That is ${crossed.name}% of the $${(REFERENCE_BUDGET_CENTS / 100).toFixed(0)} reference budget.`,
        cohort ? `Cohort: ${cohort}` : '',
        '',
        'This is observability only — no cap is enforced yet.',
      ].filter(Boolean),
    )
  }
}

export interface SessionRunawayInput {
  userId: string
  sessionId: string
  spentCents: number
}

/**
 * Fire a runaway alert when a SINGLE session's observed spend exceeds the runaway
 * threshold (should be impossible given the $0.50 per-session gateway budget — so
 * it signals a budget-enforcement miss or abuse). Idempotent per session per day.
 */
export async function alertSessionRunaway({ userId, sessionId, spentCents }: SessionRunawayInput): Promise<void> {
  if (spentCents < SESSION_RUNAWAY_CENTS) return
  if (!once(`session_runaway:${sessionId}`)) return

  await captureServerImmediate({
    distinctId: userId,
    event: 'cc_session_runaway',
    properties: {
      session_id: sessionId,
      spend_usd: +(spentCents / 100).toFixed(2),
      runaway_threshold_usd: +(SESSION_RUNAWAY_CENTS / 100).toFixed(2),
    },
  })

  await emailAdmin(
    `CC RUNAWAY session: $${(spentCents / 100).toFixed(2)} on one session`,
    [
      `Session ${sessionId} (user ${userId}) spent $${(spentCents / 100).toFixed(2)} — above the $${(SESSION_RUNAWAY_CENTS / 100).toFixed(2)} runaway threshold.`,
      `The per-session gateway budget is meant to cap this at ~$0.50, so this suggests a budget-enforcement miss or abuse. Investigate.`,
    ],
  )
}
