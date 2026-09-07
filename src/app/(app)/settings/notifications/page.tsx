'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import type { NotificationPreferenceKey } from '@/lib/notifications/unsubscribe'

type NotificationPrefs = Record<NotificationPreferenceKey, boolean>

type PreferenceResponse = NotificationPrefs & {
  user_id: string
  updated_at: string | null
}

const DEFAULT_PREFS: NotificationPrefs = {
  streak_reminder: true,
  weekly_digest: true,
  completion_email: true,
  marketing: false,
  lifecycle: true,
  push_enabled: false,
  discussion_reply: true,
  billing_alerts: true,
}

const PREF_ITEMS: Array<{
  key: NotificationPreferenceKey
  label: string
  detail: string
}> = [
  {
    key: 'streak_reminder',
    label: 'Streak reminders',
    detail: 'Daily email when an active streak is waiting.',
  },
  {
    key: 'weekly_digest',
    label: 'Weekly digest',
    detail: 'Sunday summary with XP, progress, and the next drill.',
  },
  {
    key: 'completion_email',
    label: 'Completion emails',
    detail: 'Challenge results and feedback links after practice.',
  },
  {
    key: 'lifecycle',
    label: 'Reminders and tips',
    detail: 'Nudges to pick up something you started and ways to get more out of HackProduct.',
  },
  {
    key: 'discussion_reply',
    label: 'Discussion replies',
    detail: 'Replies on threads you started or joined.',
  },
  {
    key: 'billing_alerts',
    label: 'Billing alerts',
    detail: 'Receipts, failed payments, and subscription changes.',
  },
  {
    key: 'marketing',
    label: 'Product updates',
    detail: 'Launches, announcements, and occasional offers.',
  },
  // push_enabled intentionally omitted: browser push is not implemented yet.
  // The DB column and preference key stay so the toggle can return with the feature.
]

function mergePrefs(data: Partial<PreferenceResponse> | null): NotificationPrefs {
  return {
    ...DEFAULT_PREFS,
    ...Object.fromEntries(
      PREF_ITEMS.map(item => [
        item.key,
        typeof data?.[item.key] === 'boolean' ? data[item.key] : DEFAULT_PREFS[item.key],
      ])
    ) as NotificationPrefs,
  }
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<NotificationPreferenceKey | null>(null)
  const [savedKey, setSavedKey] = useState<NotificationPreferenceKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    fetch('/api/notifications/preferences')
      .then(res => res.ok ? res.json() : null)
      .then((data: PreferenceResponse | null) => {
        if (!mounted) return
        if (data) setPrefs(mergePrefs(data))
      })
      .catch(() => {
        if (mounted) setError('Could not load notification preferences.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  async function updatePreference(key: NotificationPreferenceKey, value: boolean) {
    const previous = prefs[key]
    setPrefs(current => ({ ...current, [key]: value }))
    setSavingKey(key)
    setSavedKey(null)
    setError(null)

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      const data = await res.json().catch(() => null) as PreferenceResponse | { error?: string } | null
      if (!res.ok) throw new Error(data && 'error' in data ? data.error : 'Could not save preference.')
      setPrefs(mergePrefs(data as PreferenceResponse))
      setSavedKey(key)
    } catch (saveError) {
      setPrefs(current => ({ ...current, [key]: previous }))
      setError(saveError instanceof Error ? saveError.message : 'Could not save preference.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <main className="mx-auto max-w-[880px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* ── Light page header ─────────────────────────────────────────────── */}
      <div className="mb-5">
        <Link href="/settings" className="inline-flex items-center gap-1.5 font-label text-xs font-bold text-ink-secondary transition-colors hover:text-ink-strong">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
          Settings
        </Link>
        <p className="mt-4 font-label text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">
          Notifications
        </p>
        <h1 className="mt-1 font-headline text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink-strong">
          Email preferences
        </h1>
        <p className="mt-1 font-body text-[13.5px] text-ink-secondary">
          Changes save automatically.
        </p>
      </div>

      <section className="rounded-2xl border border-hairline bg-card-bright">
        <div className="divide-y divide-hairline">
          {PREF_ITEMS.map(item => {
            const checked = prefs[item.key]
            const saving = savingKey === item.key
            const saved = savedKey === item.key

            return (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-body text-[13.5px] font-bold text-ink-strong">{item.label}</p>
                  <p className="mt-0.5 font-body text-[13px] text-ink-secondary">{item.detail}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin text-ink-muted" strokeWidth={1.8} />
                  )}
                  {saved && !saving && (
                    <Check className="h-4 w-4 text-forest-600" strokeWidth={2.2} />
                  )}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={loading || savingKey !== null}
                    onClick={() => updatePreference(item.key, !checked)}
                    className="relative flex h-11 w-14 items-center justify-center rounded-full bg-transparent transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`${checked ? 'Disable' : 'Enable'} ${item.label}`}
                  >
                    <span className={`absolute inset-x-1.5 top-1/2 h-6 -translate-y-1/2 rounded-full transition-colors ${checked ? 'bg-forest-800' : 'bg-hairline'}`} aria-hidden="true" />
                    <span
                      className={`absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {loading && (
        <p className="mt-4 font-body text-sm text-ink-secondary">Loading notification preferences.</p>
      )}
      {error && (
        <p className="mt-4 rounded-[8px] bg-error/10 px-3 py-2 font-body text-sm text-error">{error}</p>
      )}
    </main>
  )
}
