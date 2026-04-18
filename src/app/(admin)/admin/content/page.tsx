'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GenerationJob } from '@/lib/types'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'hackproduct-admin-dev'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-secondary-container text-on-secondary-container',
  scraping: 'bg-tertiary-container text-on-surface',
  generating: 'bg-tertiary-container text-on-surface',
  review: 'bg-primary-container text-on-primary-container',
  published: 'bg-primary text-on-primary',
  failed: 'bg-surface-container-high text-error',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-label font-medium ${STATUS_COLORS[status] ?? 'bg-surface-container-high text-on-surface'}`}>
      {status}
    </span>
  )
}

function AuthoringDrawer({ open, onClose, onJobCreated }: {
  open: boolean
  onClose: () => void
  onJobCreated: () => void
}) {
  const [tab, setTab] = useState<'url' | 'text' | 'question'>('url')
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'local' | 'api'>('local')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/content/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify({ input_type: tab, input_raw: input.trim(), mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create job')
      onJobCreated()
      setInput('')
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-surface rounded-t-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-headline text-xl text-on-surface mb-4">New Challenge</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['url', 'text', 'question'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full font-label text-sm ${tab === t ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Input */}
        {tab === 'url' ? (
          <input
            type="url"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="https://stratechery.com/..."
            className="w-full bg-surface-container rounded-lg px-4 py-3 font-body text-on-surface border border-outline-variant outline-none focus:border-primary mb-4"
          />
        ) : (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={tab === 'text' ? 'Paste article text...' : 'Enter a PM question or scenario...'}
            rows={5}
            className="w-full bg-surface-container rounded-lg px-4 py-3 font-body text-on-surface border border-outline-variant outline-none focus:border-primary mb-4 resize-none"
          />
        )}

        {/* Mode toggle */}
        <div className="flex gap-3 mb-6">
          {(['local', 'api'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full font-label text-sm ${mode === m ? 'bg-secondary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {m === 'local' ? 'Local (Claude Code)' : 'API'}
            </button>
          ))}
        </div>

        {error && <p className="text-error text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Generate Challenge'}
          </button>
          <button onClick={onClose} className="text-on-surface-variant font-label px-4">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    const res = await fetch('/api/admin/content/jobs', {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (res.ok) {
      const data = await res.json()
      setJobs(data.jobs ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 3000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-2xl text-on-surface">Content</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-primary text-on-primary rounded-full px-5 py-2 font-label font-semibold text-sm"
        >
          + New Challenge
        </button>
      </div>

      {loading ? (
        <p className="text-on-surface-variant font-body">Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="bg-surface-container rounded-xl p-8 text-center">
          <p className="text-on-surface-variant font-body">No jobs yet. Generate your first challenge.</p>
        </div>
      ) : (
        <div className="bg-surface-container rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Input</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Type</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Mode</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Status</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-t border-outline-variant">
                  <td className="px-4 py-3 font-body text-sm text-on-surface max-w-xs truncate">
                    {job.input_raw.slice(0, 60)}{job.input_raw.length > 60 ? '...' : ''}
                  </td>
                  <td className="px-4 py-3 font-label text-sm text-on-surface-variant">{job.input_type}</td>
                  <td className="px-4 py-3 font-label text-sm text-on-surface-variant">{job.mode}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3 font-label text-sm text-on-surface-variant">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {job.status === 'review' && (
                      <a
                        href={`/admin/content/review/${job.id}`}
                        className="text-primary font-label text-sm hover:underline"
                      >
                        Review →
                      </a>
                    )}
                    {job.status === 'published' && job.result_challenge_id && (
                      <a
                        href={`/admin/content/challenges/${job.result_challenge_id}`}
                        className="text-on-surface-variant font-label text-sm hover:text-primary"
                      >
                        Edit Tags →
                      </a>
                    )}
                    {job.status === 'failed' && (
                      <span className="text-error font-label text-xs" title={job.error_message ?? ''}>
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AuthoringDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onJobCreated={fetchJobs}
      />
    </div>
  )
}
