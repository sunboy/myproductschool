'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NotificationSettings {
  weekly_summary: boolean
  streak_reminder: boolean
  new_challenges: boolean
  cohort_updates: boolean
}

interface UserSettings {
  id: string | null
  user_id: string
  notifications: NotificationSettings
  daily_goal_count: number
  preferred_role: string | null
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
        enabled ? 'bg-primary' : 'bg-outline-variant'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
          enabled ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  )
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  weekly_summary: true,
  streak_reminder: true,
  new_challenges: true,
  cohort_updates: true,
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [dailyGoal, setDailyGoal] = useState(3)
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS)
  const [saving, setSaving] = useState(false)
  // Profile edits
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileInitial, setProfileInitial] = useState('?')
  const [preferredRole, setPreferredRole] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Learning preferences — synced to backend + localStorage
  const [flowFocus, setFlowFocus] = useState<string>('List')
  const [difficulty, setDifficulty] = useState<string>('Mixed')
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: UserSettings & { flow_focus?: string; difficulty?: string; timezone?: string }) => {
        setSettings(data)
        setDailyGoal(data.daily_goal_count ?? 3)
        setNotifications(data.notifications ?? DEFAULT_NOTIFICATIONS)
        // Prefer API values over localStorage
        setFlowFocus(data.flow_focus ?? localStorage.getItem('hackproduct_flow_focus') ?? 'List')
        setDifficulty(data.difficulty ?? localStorage.getItem('hackproduct_difficulty') ?? 'Mixed')
        setTimezone(data.timezone ?? localStorage.getItem('hackproduct_timezone') ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
      })
      .catch(() => {})

    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then((data: { display_name?: string; preferred_role?: string; avatar_url?: string } | null) => {
        if (data?.display_name) {
          setDisplayName(data.display_name)
          setProfileInitial(data.display_name[0]?.toUpperCase() ?? '?')
        }
        if (data?.preferred_role) setPreferredRole(data.preferred_role)
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
      .catch(() => {})
  }, [])

  const saveDisplayName = async () => {
    if (!displayName.trim()) return
    setProfileSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName.trim() }),
      })
      setProfileInitial(displayName.trim()[0]?.toUpperCase() ?? '?')
      setEditingName(false)
    } catch {
      // ignore
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.avatar_url)
      }
    } catch {
      // ignore
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const patchSettings = useCallback(async (patch: Partial<{ notifications: NotificationSettings; daily_goal_count: number; flow_focus: string; difficulty: string; timezone: string }>) => {
    setSaving(true)
    try {
      const resp = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (resp.ok) {
        const updated: UserSettings = await resp.json()
        setSettings(updated)
        if (updated.notifications) setNotifications(updated.notifications)
        if (updated.daily_goal_count) setDailyGoal(updated.daily_goal_count)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }, [])

  const toggleNotification = (key: keyof NotificationSettings) => {
    const next = { ...notifications, [key]: !notifications[key] }
    setNotifications(next)
    patchSettings({ notifications: next })
  }

  const updateDailyGoal = (newVal: number) => {
    setDailyGoal(newVal)
    patchSettings({ daily_goal_count: newVal })
  }

  return (
    <div className="flex flex-col">
      {/* Top App Bar — settings-specific */}
      <header className="flex justify-between items-center w-full px-8 py-6 sticky top-0 z-40 bg-surface border-b border-on-surface/10">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="material-symbols-outlined text-primary hover:opacity-70 transition-all">arrow_back</button>
          <h2 className="font-headline text-2xl text-primary-container">Settings</h2>
        </div>
        <div className="flex items-center space-x-4">
          {(saving || profileSaving) && <span className="text-xs text-outline animate-pulse">Saving…</span>}
          <button className="material-symbols-outlined text-outline hover:opacity-70">more_vert</button>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="max-w-4xl w-full mx-auto px-8 py-12 flex flex-col space-y-12">
        {/* 1. ACCOUNT */}
        <section className="bg-surface-container-high rounded-xl p-8 transition-all hover:bg-surface-container-highest">
          <h3 className="font-nunito text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">ACCOUNT</h3>
          <div className="flex items-center space-x-6 mb-10">
            <div
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-headline font-bold relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
              suppressHydrationWarning
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span suppressHydrationWarning>{profileInitial}</span>
              }
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl animate-spin">progress_activity</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-end justify-center pb-1 transition-colors">
                <span className="material-symbols-outlined text-white text-sm opacity-0 hover:opacity-100">photo_camera</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Click avatar to upload photo</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Max 2MB, image files only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="space-y-6">
            {/* Name Row */}
            <div className="flex justify-between items-center py-4 border-b border-outline-variant/20">
              <div className="flex-1 mr-4">
                <label className="block text-xs text-outline font-bold mb-1">Display name</label>
                {editingName ? (
                  <input
                    autoFocus
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="font-nunito text-lg border border-primary rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-1 ring-primary"
                  />
                ) : (
                  <p className="font-nunito text-lg">{displayName || 'Add your name'}</p>
                )}
              </div>
              <button
                onClick={() => editingName ? saveDisplayName() : setEditingName(true)}
                className="material-symbols-outlined text-outline hover:text-primary transition-colors"
              >
                {editingName ? 'check' : 'edit'}
              </button>
            </div>
            {/* Email Row */}
            <div className="flex justify-between items-center py-4 border-b border-outline-variant/20">
              <div>
                <label className="block text-xs text-outline font-bold mb-1">Email</label>
                <p className="font-nunito text-lg text-on-surface-variant">Managed by your auth provider</p>
              </div>
              <span className="material-symbols-outlined text-outline-variant">lock</span>
            </div>
            {/* Role Row */}
            <div className="flex justify-between items-center py-4 border-b border-outline-variant/20">
              <div>
                <label className="block text-xs text-outline font-bold mb-1">Role</label>
                <p className="font-nunito text-lg italic" suppressHydrationWarning>{preferredRole ?? settings?.preferred_role ?? 'Not set'}</p>
              </div>
              <Link href="/onboarding/role" className="material-symbols-outlined text-outline hover:text-primary transition-colors">edit</Link>
            </div>
          </div>
          <div className="mt-10">
            <button
              onClick={saveDisplayName}
              disabled={profileSaving}
              className="bg-primary-container text-on-primary px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              Save changes
            </button>
          </div>
        </section>

        {/* 2. NOTIFICATIONS */}
        <section className="bg-surface-container-high rounded-xl p-8">
          <h3 className="font-nunito text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">NOTIFICATIONS</h3>
          <div className="space-y-2">
            {/* Item 1 */}
            <div className="flex justify-between items-center h-16 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <span className="font-nunito">New challenge alerts</span>
                <span className="bg-primary-container/10 text-primary-container text-xs px-2 py-1 rounded font-bold">9:00 AM</span>
              </div>
              <Toggle enabled={notifications.new_challenges} onToggle={() => toggleNotification('new_challenges')} />
            </div>
            {/* Item 2 */}
            <div className="flex justify-between items-center h-20 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <div>
                <p className="font-nunito">Streak at-risk alert</p>
                <p className="text-xs text-outline">6:00 PM if not practiced</p>
              </div>
              <Toggle enabled={notifications.streak_reminder} onToggle={() => toggleNotification('streak_reminder')} />
            </div>
            {/* Item 3 */}
            <div className="flex justify-between items-center h-16 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <span className="font-nunito">Weekly cohort results</span>
              <Toggle enabled={notifications.weekly_summary} onToggle={() => toggleNotification('weekly_summary')} />
            </div>
            {/* Item 4 */}
            <div className="flex justify-between items-center h-16 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <span className="font-nunito">Level up celebrations</span>
              <Toggle enabled={notifications.cohort_updates} onToggle={() => toggleNotification('cohort_updates')} />
            </div>
          </div>
        </section>

        {/* 3. LEARNING */}
        <section className="bg-surface-container-high rounded-xl p-8">
          <h3 className="font-nunito text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">LEARNING</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Daily Goal */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Daily goal</label>
              <div className="flex items-center justify-between">
                <span className="font-headline text-xl">{dailyGoal} challenges</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => updateDailyGoal(Math.max(1, dailyGoal - 1))}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <button
                    onClick={() => updateDailyGoal(Math.min(10, dailyGoal + 1))}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Flow Focus */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Preferred FLOW focus</label>
              <select
                value={flowFocus}
                onChange={e => {
                  const v = e.target.value
                  setFlowFocus(v)
                  localStorage.setItem('hackproduct_flow_focus', v)
                  patchSettings({ flow_focus: v })
                }}
                className="font-headline text-xl bg-transparent w-full border-none outline-none cursor-pointer text-on-surface"
              >
                <option value="All">All</option>
                <option value="Frame">Frame</option>
                <option value="List">List</option>
                <option value="Optimize">Optimize</option>
                <option value="Win">Win</option>
              </select>
            </div>
            {/* Difficulty */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Challenge difficulty</label>
              <select
                value={difficulty}
                onChange={e => {
                  const v = e.target.value
                  setDifficulty(v)
                  localStorage.setItem('hackproduct_difficulty', v)
                  patchSettings({ difficulty: v })
                }}
                className="font-headline text-xl bg-transparent w-full border-none outline-none cursor-pointer text-on-surface"
              >
                <option value="Mixed">Mixed</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            {/* Timezone */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Reminder timezone</label>
              <select
                value={timezone}
                onChange={e => {
                  const v = e.target.value
                  setTimezone(v)
                  localStorage.setItem('hackproduct_timezone', v)
                  patchSettings({ timezone: v })
                }}
                className="font-headline text-xl bg-transparent w-full border-none outline-none cursor-pointer text-on-surface"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. PLAN */}
        <section className="bg-surface-container-high rounded-xl p-8 border-l-4 border-primary">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="font-nunito text-xs font-bold uppercase tracking-[0.2em] text-outline mb-4">PLAN</h3>
              <div className="flex items-center space-x-3">
                <span className="font-headline text-3xl">Current plan</span>
                <span className="bg-outline-variant/30 text-on-surface text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest">Free</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Link
                href="/pricing"
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all flex items-center space-x-2"
              >
                <span>Upgrade to Pro</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link href="/settings/billing" className="text-xs text-outline font-bold hover:text-primary transition-colors">View billing history</Link>
            </div>
          </div>
        </section>

        {/* 5. PRIVACY & SECURITY */}
        <section className="bg-surface-container-high rounded-xl p-8">
          <h3 className="font-nunito text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">PRIVACY &amp; SECURITY</h3>
          <div className="flex flex-col md:flex-row gap-8">
            <button
              onClick={async () => {
                const res = await fetch('/api/profile/export')
                if (!res.ok) { return }
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'hackproduct-data.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="flex items-center space-x-2 text-primary-container font-bold hover:opacity-70 transition-all group"
            >
              <span className="material-symbols-outlined">download</span>
              <span>Export my data</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                  window.location.href = '/api/profile/delete-account'
                }
              }}
              className="flex items-center space-x-2 text-error font-bold hover:opacity-70 transition-all group"
            >
              <span className="material-symbols-outlined">delete_forever</span>
              <span>Delete account</span>
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto px-8 py-12 flex flex-col md:flex-row justify-between items-center border-t border-on-surface/5 bg-surface-container-low">
        <div className="text-outline font-nunito text-[10px] uppercase tracking-[0.25em] mb-4 md:mb-0">
          HackProduct v2.0 &middot; Sunboy Labs
        </div>
        <div className="flex space-x-6 text-outline font-nunito text-[10px] uppercase tracking-[0.25em]">
          <Link className="hover:text-primary transition-colors" href="/privacy">Privacy Policy</Link>
          <Link className="hover:text-primary transition-colors" href="/terms">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
