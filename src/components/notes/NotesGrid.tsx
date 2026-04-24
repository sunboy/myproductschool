'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNote } from '@/app/actions/notes'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { NoteCard } from '@/components/notes/NoteCard'
import type { UserNote } from '@/lib/data/dashboard'

const COLOR_OPTIONS: UserNote['color'][] = ['default', 'yellow', 'green', 'blue']

const colorDotClasses: Record<string, string> = {
  default: 'bg-outline-variant',
  yellow: 'bg-tertiary',
  green: 'bg-primary',
  blue: 'bg-blue-500',
}

interface NotesGridProps {
  initialNotes: UserNote[]
}

export function NotesGrid({ initialNotes }: NotesGridProps) {
  const router = useRouter()
  const [notes, setNotes] = useState<UserNote[]>(initialNotes)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newColor, setNewColor] = useState<UserNote['color']>('default')

  // Filter notes by search
  const filtered = search.trim()
    ? notes.filter((n) => n.content.toLowerCase().includes(search.toLowerCase()))
    : notes

  // Sort: pinned first, then by updated_at descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  async function handleCreate() {
    const text = newContent.trim()
    if (!text) { setAdding(false); return }

    // Optimistic: add temp note
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const tempNote: UserNote = {
      id: tempId,
      content: text,
      color: newColor,
      pinned: false,
      created_at: now,
      updated_at: now,
    }
    setNotes((prev) => [tempNote, ...prev])
    setNewContent('')
    setNewColor('default')
    setAdding(false)

    await createNote(text, newColor)
    router.refresh()
  }

  function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  function handleUpdate(id: string, updates: Partial<Pick<UserNote, 'content' | 'color' | 'pinned'>>) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n
      )
    )
  }

  return (
    <>
      {/* Search + New Note bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-surface-container-high rounded-full pl-10 pr-4 py-2.5 text-sm text-on-surface font-body placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setAdding(true)}
          className="bg-primary text-on-primary rounded-full px-5 py-2.5 text-sm font-label font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Note
        </button>
      </div>

      {/* Creation form */}
      {adding && (
        <div className="bg-surface-container rounded-xl p-4 space-y-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Jot something down..."
            className="w-full bg-surface-container-high rounded-lg p-3 text-sm text-on-surface resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary font-body placeholder:text-on-surface-variant/50"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreate() }
            }}
          />
          <div className="flex items-center justify-between">
            {/* Color picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-label">Color:</span>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-4 h-4 rounded-full border-2 transition-transform ${colorDotClasses[c]} ${
                    newColor === c ? 'border-on-surface scale-110' : 'border-transparent hover:scale-110'
                  }`}
                  aria-label={`Set color to ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setAdding(false); setNewContent(''); setNewColor('default') }}
                className="text-sm text-on-surface-variant font-label px-3 py-1.5 hover:bg-surface-container-high rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="text-sm bg-primary text-on-primary font-label font-semibold px-5 py-1.5 rounded-full hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes grid or empty state */}
      {sorted.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <HatchGlyph size={64} state="celebrating" className="text-primary" />
          <p className="text-on-surface-variant text-sm max-w-xs">
            Your notes become Hatch&apos;s memory &mdash; jot anything down.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 text-sm font-label font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add your first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </>
  )
}
