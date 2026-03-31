'use client'

import { useState, useRef } from 'react'
import { updateNote, deleteNote } from '@/app/actions/notes'
import type { UserNote } from '@/lib/data/dashboard'

interface NoteCardProps {
  note: UserNote
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Pick<UserNote, 'content' | 'color' | 'pinned'>>) => void
}

const colorClasses: Record<string, string> = {
  default: 'bg-surface-container',
  yellow: 'bg-tertiary-container',
  green: 'bg-primary-fixed',
  blue: 'bg-secondary-container',
}

const COLOR_OPTIONS: UserNote['color'][] = ['default', 'yellow', 'green', 'blue']

const colorDotClasses: Record<string, string> = {
  default: 'bg-outline-variant',
  yellow: 'bg-tertiary',
  green: 'bg-primary',
  blue: 'bg-blue-500',
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NoteCard({ note, onDelete, onUpdate }: NoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleBlur() {
    setEditing(false)
    const trimmed = content.trim()
    if (trimmed && trimmed !== note.content) {
      onUpdate(note.id, { content: trimmed })
      updateNote(note.id, trimmed, note.color, note.pinned)
    } else {
      setContent(note.content)
    }
  }

  function handleColorChange(color: UserNote['color']) {
    onUpdate(note.id, { color })
    updateNote(note.id, note.content, color, note.pinned)
  }

  function handlePinToggle() {
    onUpdate(note.id, { pinned: !note.pinned })
    updateNote(note.id, note.content, note.color, !note.pinned)
  }

  function handleDelete() {
    onDelete(note.id)
    deleteNote(note.id)
  }

  return (
    <div className={`${colorClasses[note.color] ?? colorClasses.default} rounded-xl p-4 flex flex-col gap-3 group`}>
      {/* Top row */}
      <div className="flex items-center gap-2">
        {/* Pin */}
        <button
          onClick={handlePinToggle}
          className="text-on-surface-variant hover:text-primary transition-colors"
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: note.pinned ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            push_pin
          </span>
        </button>

        {note.pinned && (
          <span className="text-xs font-label font-semibold text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
            Pinned
          </span>
        )}

        {/* Color dots */}
        <div className="flex items-center gap-1.5 ml-auto">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={`w-4 h-4 rounded-full border-2 transition-transform ${colorDotClasses[c]} ${
                note.color === c ? 'border-on-surface scale-110' : 'border-transparent hover:scale-110'
              }`}
              aria-label={`Set color to ${c}`}
            />
          ))}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error ml-1"
          aria-label="Delete note"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setContent(note.content)
              setEditing(false)
            }
          }}
          className="bg-transparent text-sm text-on-surface resize-none min-h-[60px] focus:outline-none font-body leading-relaxed"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-left text-sm text-on-surface font-body leading-relaxed min-h-[40px] cursor-text"
        >
          {note.content}
        </button>
      )}

      {/* Timestamp */}
      <p className="text-xs text-on-surface-variant mt-auto">
        Updated {timeAgo(note.updated_at)}
      </p>
    </div>
  )
}
