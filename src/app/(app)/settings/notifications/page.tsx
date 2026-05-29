'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  push_enabled: false,
  discussion_reply: true,
  billing_alerts: true,
}

const PREF_ITEMS: Array<{
  key: NotificationPreferenceKey
  label: string
  detail: string
  icon: string
}> = [
  {
    key: 'streak_reminder',
    label: 'Streak reminders',
    detail: 'Daily email when an active streak is waiting.',
    icon: 'local_fire_department',
  },
  {
    key: 'weekly_digest',
    label: 'Weekly digest',
    detail: 'Sunday summary with XP, progress, and the next drill.',
    icon: 'summarize',
  },
  {
    key: 'completion_email',
    label: 'Completion emails',
    detail: 'Challenge results and feedback links after practice.',
    icon: 'task_alt',
  },
  {
    key: 'discussion_reply',
    label: 'Discussion replies',
    detail: 'Replies on threads you started or joined.',
    icon: 'forum',
  },
  {
    key: 'billing_alerts',
    label: 'Billing alerts',
    detail: 'Receipts, failed payments, and subscription changes.',
    icon: 'receipt_long',
  },
  {
    key: 'marketing',
    label: 'Product updates',
    detail: 'Launches, announcements, and occasional offers.',
    icon: 'campaign',
  },
  {
    key: 'push_enabled',
    label: 'Push notifications',
    detail: 'Browser push controls for supported devices.',
    icon: 'notifications_active',
  },
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
    <main className="mx-auto max-w-[980px] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs font-label font-bold text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Settings
          </Link>
          <p className="mt-5 font-label text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
            Notifications
          </p>
          <h1 className="mt-1 font-headline text-[32px] font-bold leading-none text-on-surface" style={{ letterSpacing: '-0.03em' }}>
            Email and push preferences
          </h1>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low px-3 py-1.5 text-xs font-label font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            tune
          </span>
          Saves automatically
        </div>
      </div>

      <section className="rounded-[22px] border border-outline-variant/45 bg-surface-container-low p-5 shadow-[0_18px_50px_rgba(56,47,33,0.07)]">
        <div className="divide-y divide-outline-variant/45 overflow-hidden rounded-2xl border border-outline-variant/45 bg-background/70">
          {PREF_ITEMS.map(item => {
            const checked = prefs[item.key]
            const saving = savingKey === item.key
            const saved = savedKey === item.key

            return (
              <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-container text-[20px] text-on-surface-variant">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-label font-bold text-on-surface">{item.label}</p>
                    <p className="mt-0.5 text-sm font-body text-on-surface-variant">{item.detail}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {saving && (
                    <span className="material-symbols-outlined animate-spin text-[17px] text-on-surface-variant">progress_activity</span>
                  )}
                  {saved && !saving && (
                    <span className="material-symbols-outlined text-[17px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={loading || savingKey !== null}
                    onClick={() => updatePreference(item.key, !checked)}
                    className={`relative h-7 w-12 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${checked ? 'bg-primary' : 'bg-outline-variant'}`}
                    aria-label={`${checked ? 'Disable' : 'Enable'} ${item.label}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {loading && (
          <p className="mt-4 text-sm font-body text-on-surface-variant">Loading notification preferences.</p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-error/10 px-3 py-2 text-sm font-body text-error">{error}</p>
        )}
      </section>
    </main>
  )
}
