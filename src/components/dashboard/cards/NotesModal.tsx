'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createNote, deleteNote, updateNote } from '@/app/actions/notes'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface Note {
  id: string
  content: string
  color: string
  pinned: boolean
  created_at: string
}

interface NotesModalProps {
  notes: Note[]
  onClose: () => void
}

const colorCard: Record<string, string> = {
  default: 'bg-surface-container',
  yellow: 'bg-tertiary-container',
  green: 'bg-primary-fixed',
  blue: 'bg-secondary-container',
}

const colorDot: Record<string, string> = {
  default: 'bg-on-surface-variant',
  yellow: 'bg-tertiary',
  green: 'bg-primary',
  blue: 'bg-blue-500',
}

const COLORS = ['default', 'yellow', 'green', 'blue'] as const

export function NotesModal({ notes, onClose }: NotesModalProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [localNotes, setLocalNotes] = useState(notes)
  const [content, setContent] = useState('')
  const [selectedColor, setSelectedColor] = useState<string>('default')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSave() {
    const text = content.trim()
    if (!text) return
    const color = selectedColor
    // Optimistic update — prepend immediately
    const tempId = `temp-${Date.now()}`
    const optimisticNote: Note = { id: tempId, content: text, color, pinned: false, created_at: new Date().toISOString() }
    setLocalNotes(prev => [optimisticNote, ...prev])
    setContent('')
    setSelectedColor('default')
    startTransition(async () => {
      await createNote(text, color)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    setLocalNotes(prev => prev.filter(n => n.id !== id))
    startTransition(async () => {
      await deleteNote(id)
      router.refresh()
    })
  }

  function handlePinToggle(note: Note) {
    setLocalNotes(prev => prev.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n))
    startTransition(async () => {
      await updateNote(note.id, note.content, note.color, !note.pinned)
      router.refresh()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-lg flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LumaGlyph size={28} state="listening" className="text-primary" />
            <h2 className="font-headline font-semibold text-lg text-on-surface">Notes</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Notes list */}
        <div className="flex flex-col gap-2">
          {localNotes.length === 0 && (
            <p className="text-sm text-on-surface-variant italic text-center py-4">
              No notes yet. Add one below.
            </p>
          )}
          {localNotes.map((note) => (
            <div
              key={note.id}
              className={`group flex items-start gap-3 rounded-xl p-3 ${colorCard[note.color] ?? colorCard.default}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface leading-snug">{note.content}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handlePinToggle(note)}
                  className={`transition-opacity text-tertiary ${note.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                  aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                >
                  <span className="material-symbols-outlined text-sm">push_pin</span>
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
                  aria-label="Delete note"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add form */}
        <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note..."
            className="bg-surface-container-high rounded-lg p-3 text-sm text-on-surface resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary font-body placeholder:text-on-surface-variant/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          <div className="flex items-center justify-between">
            {/* Color picker */}
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  aria-label={`Color ${c}`}
                  className={`w-5 h-5 rounded-full transition-transform ${colorDot[c]} ${selectedColor === c ? 'ring-2 ring-on-surface ring-offset-1 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="text-sm bg-primary text-on-primary font-label font-semibold px-4 py-1.5 rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
