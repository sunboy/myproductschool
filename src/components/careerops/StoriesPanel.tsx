'use client'
// Interview story bank — STAR + Reflection. Lightweight list + inline editor.

import { useCallback, useEffect, useState } from 'react'

interface Story {
  id: string
  title: string | null
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
  reflection: string | null
}

const EMPTY: Omit<Story, 'id'> = {
  title: '', situation: '', task: '', action: '', result: '', reflection: '',
}

export function StoriesPanel() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Omit<Story, 'id'> & { id?: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/career-ops/stories')
      if (res.ok) setStories((await res.json()).stories ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!editing) return
    setSaving(true)
    try {
      const isEdit = Boolean(editing.id)
      const res = await fetch(
        isEdit ? `/api/career-ops/stories/${editing.id}` : '/api/career-ops/stories',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(editing),
        },
      )
      if (res.status === 402) { window.dispatchEvent(new Event('open-upgrade-modal')); return }
      if (res.ok) { setEditing(null); await load() }
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setStories((cur) => cur.filter((s) => s.id !== id))
    await fetch(`/api/career-ops/stories/${id}`, { method: 'DELETE' })
  }

  const field = (key: keyof typeof EMPTY, label: string, rows = 2) => (
    <label className="block">
      <span className="font-label text-xs font-semibold text-on-surface-variant">{label}</span>
      <textarea
        value={(editing?.[key] as string) ?? ''}
        onChange={(e) => setEditing((cur) => (cur ? { ...cur, [key]: e.target.value } : cur))}
        rows={rows}
        className="mt-1 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
      />
    </label>
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-sm text-on-surface-variant">Bank reusable STAR stories for interviews.</p>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-label text-sm font-semibold text-on-primary"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden>add</span>
          New story
        </button>
      </div>

      {editing && (
        <div className="mb-4 rounded-2xl bg-surface-container-low p-4">
          <input
            value={editing.title ?? ''}
            onChange={(e) => setEditing((cur) => (cur ? { ...cur, title: e.target.value } : cur))}
            placeholder="Story title (e.g. Shipped the migration under deadline)"
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {field('situation', 'Situation')}
            {field('task', 'Task')}
            {field('action', 'Action')}
            {field('result', 'Result')}
          </div>
          <div className="mt-3">{field('reflection', 'Reflection (what you would do differently)')}</div>
          <div className="mt-3 flex gap-2">
            <button onClick={save} disabled={saving} className="rounded-full bg-primary px-5 py-2 font-label text-sm font-semibold text-on-primary disabled:opacity-60">
              {saving ? 'Saving...' : 'Save story'}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-full bg-surface-container-high px-5 py-2 font-label text-sm font-semibold text-on-surface">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-surface-container" aria-busy />
      ) : stories.length === 0 && !editing ? (
        <div className="rounded-2xl bg-surface-container p-6 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant" aria-hidden>history_edu</span>
          <p className="mt-2 font-body text-sm text-on-surface-variant">No stories yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stories.map((s) => (
            <div key={s.id} className="rounded-xl bg-surface-container p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-headline text-base font-semibold text-on-surface">{s.title || 'Untitled story'}</h4>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(s)} aria-label="Edit" className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>edit</span>
                  </button>
                  <button onClick={() => remove(s.id)} aria-label="Delete" className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>delete</span>
                  </button>
                </div>
              </div>
              {s.situation && <p className="mt-1 line-clamp-2 font-body text-sm text-on-surface-variant">{s.situation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
