'use client'

import { useState } from 'react'
import type { CommunityLensTag, CommunitySubmissionStatus } from '@/lib/types'
import { COMMUNITY_LENS_LABELS, formatCommunityDisplayName } from '@/lib/community-shared'

export interface CommunityCurationRow {
  id: string
  display_mode: 'anonymous' | 'named'
  status: CommunitySubmissionStatus
  lens_tag: CommunityLensTag
  excerpt: string
  score: number | null
  challenge_title: string
  display_name: string | null
  created_at: string
}

export function CommunityCurationTable({ rows }: { rows: CommunityCurationRow[] }) {
  const [submissions, setSubmissions] = useState(rows)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function curate(id: string, action: 'feature' | 'hide' | 'publish') {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/community/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: id, action }),
      })
      if (!res.ok) throw new Error('Failed to curate submission')
      const updated = await res.json() as { id: string; status: CommunitySubmissionStatus }
      setSubmissions(current => current.map(row => row.id === id ? { ...row, status: updated.status } : row))
    } finally {
      setBusyId(null)
    }
  }

  if (!submissions.length) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant">
        No community submissions are waiting yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
      <div className="overflow-x-auto">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="bg-surface-container-low text-xs uppercase tracking-[0.08em] text-on-surface-variant">
          <tr>
            <th className="px-4 py-3 font-bold">Answer</th>
            <th className="px-4 py-3 font-bold">Lens</th>
            <th className="px-4 py-3 font-bold">Status</th>
            <th className="px-4 py-3 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60">
          {submissions.map(row => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-4">
                <div className="font-semibold text-on-surface">{row.challenge_title}</div>
                <div className="mt-1 max-w-2xl text-on-surface-variant">{row.excerpt}</div>
                <div className="mt-2 text-xs text-on-surface-variant">
                  {formatCommunityDisplayName(row.display_mode, row.display_name)}
                  {typeof row.score === 'number' && <span> | {Math.round(row.score * 100)}%</span>}
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-bold text-primary">
                  {COMMUNITY_LENS_LABELS[row.lens_tag]}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => curate(row.id, 'feature')}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-on-primary disabled:opacity-50"
                  >
                    Feature
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => curate(row.id, 'publish')}
                    className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface disabled:opacity-50"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => curate(row.id, 'hide')}
                    className="rounded-full border border-error/40 px-3 py-1.5 text-xs font-bold text-error disabled:opacity-50"
                  >
                    Hide
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
