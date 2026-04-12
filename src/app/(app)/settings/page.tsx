'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileInitial, setProfileInitial] = useState('?')
  const [preferredRole, setPreferredRole] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [plan, setPlan] = useState<string>('free')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then((data: { display_name?: string; preferred_role?: string; avatar_url?: string; plan?: string } | null) => {
        if (!data) return
        if (data.display_name) {
          setDisplayName(data.display_name)
          setProfileInitial(data.display_name[0]?.toUpperCase() ?? '?')
        }
        if (data.preferred_role) setPreferredRole(data.preferred_role)
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
        if (data.plan) setPlan(data.plan)
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
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isPro = plan === 'pro'

  return (
    <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

      <h1 className="font-headline font-bold text-lg text-on-surface" style={{ letterSpacing: '-0.02em' }}>
        Settings
      </h1>

      {/* ── PROFILE ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#eae6de' }}>

        {/* Avatar + name header */}
        <div className="flex items-center gap-4 px-5 py-5">
          <div
            className="relative w-14 h-14 rounded-full bg-primary flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-lg font-bold text-on-primary font-label" suppressHydrationWarning>{profileInitial}</span>
            }
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base opacity-0 group-hover:opacity-100 transition-opacity">photo_camera</span>
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg animate-spin">progress_activity</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
                  className="font-body text-sm border border-primary rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:ring-1 ring-primary bg-white"
                />
                <button
                  onClick={saveDisplayName}
                  disabled={profileSaving}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50 shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-black/10 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="font-body font-semibold text-sm text-on-surface truncate">{displayName || 'Add your name'}</p>
                <button onClick={() => setEditingName(true)} className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
              </div>
            )}
            <p className="text-xs text-on-surface-variant mt-0.5 font-body truncate" suppressHydrationWarning>
              {preferredRole ?? 'Role not set'}
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-outline-variant/30" />

        {/* Email row */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="text-sm font-body text-on-surface">Email</p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">Managed by your auth provider</p>
          </div>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lock</span>
        </div>

        <div className="mx-5 h-px bg-outline-variant/30" />

        {/* Role row */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <p className="text-sm font-body text-on-surface">Role</p>
          <Link
            href="/onboarding/role"
            className="flex items-center gap-0.5 text-xs font-semibold text-primary font-label hover:opacity-70 transition-opacity"
          >
            Change
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          </Link>
        </div>
      </div>

      {/* ── PLAN ── */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{
          background: isPro
            ? 'linear-gradient(135deg, #2d5a3d 0%, #4a7c59 100%)'
            : '#eae6de',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1", color: isPro ? '#fbbf24' : '#74796e' }}
          >
            workspace_premium
          </span>
          <div>
            <p className={`font-label font-bold text-sm ${isPro ? 'text-white' : 'text-on-surface'}`}>
              {isPro ? 'HackProduct Pro' : 'Free plan'}
            </p>
            <p className={`text-xs font-body mt-0.5 ${isPro ? 'text-white/60' : 'text-on-surface-variant'}`}>
              {isPro ? 'Unlimited · full coaching · Learner DNA' : '3 challenges/day · basic feedback'}
            </p>
          </div>
        </div>
        {!isPro && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold font-label text-white shrink-0 transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)', boxShadow: '0 2px 8px rgba(74,124,89,0.30)' }}
          >
            Upgrade
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </button>
        )}
      </div>

      {/* ── ACCOUNT ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#eae6de' }}>
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="text-sm font-body text-on-surface">Export my data</p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">Download your progress and history</p>
          </div>
          <button
            onClick={async () => {
              const res = await fetch('/api/profile/export')
              if (!res.ok) return
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'hackproduct-data.json'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-1 text-xs font-semibold text-primary font-label hover:opacity-70 transition-opacity shrink-0"
          >
            Export
            <span className="material-symbols-outlined text-[13px]">download</span>
          </button>
        </div>

        <div className="mx-5 h-px bg-outline-variant/30" />

        <div className="flex items-center justify-between px-5 py-3.5">
          <p className="text-sm font-body text-on-surface">Sign out</p>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-on-surface-variant font-label hover:text-on-surface transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── DANGER ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#eae6de' }}>
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="text-sm font-body text-on-surface">Delete account</p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">Permanently removes your account and all data</p>
          </div>
          <button
            onClick={() => {
              if (confirm('Delete your account? This cannot be undone.')) {
                window.location.href = '/api/profile/delete-account'
              }
            }}
            className="text-xs font-semibold text-error font-label hover:opacity-70 transition-opacity shrink-0"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pb-8 pt-2">
        <p className="text-[10px] text-on-surface-variant/40 font-label uppercase tracking-widest">HackProduct · Sunboy Labs</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="text-[10px] text-on-surface-variant/40 font-label hover:text-on-surface-variant transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[10px] text-on-surface-variant/40 font-label hover:text-on-surface-variant transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  )
}
