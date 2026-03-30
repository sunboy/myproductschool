'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteNote } from '@/app/actions/notes'
import { useRouter } from 'next/navigation'
import { NotesModal } from './NotesModal'

interface Note {
  id: string
  content: string
  color: string
  pinned: boolean
  created_at: string
}

interface NotesCardProps {
  notes: Note[]
}

const colorDot: Record<string, string> = {
  default: 'bg-outline-variant',
  yellow: 'bg-tertiary',
  green: 'bg-primary',
  blue: 'bg-blue-500',
}

export function NotesCard({ notes }: NotesCardProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  async function handleDelete(id: string) {
    await deleteNote(id)
    router.refresh()
  }

  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">sticky_note_2</span>
          <h3 className="font-headline font-semibold text-base text-on-surface">Notes</h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-on-primary text-sm hover:opacity-90 transition-opacity"
          aria-label="Open notes"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      </div>

      <div
        className="flex flex-col gap-1.5 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {notes.length === 0 && (
          <p className="text-xs text-on-surface-variant italic text-center py-2">
            Add a note...
          </p>
        )}
        {notes.slice(0, 3).map((note) => (
          <div
            key={note.id}
            className="group flex items-start gap-2 py-1.5 border-b border-outline-variant/20 last:border-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colorDot[note.color] ?? colorDot.default}`} />
            <p className="flex-1 text-sm text-on-surface leading-snug line-clamp-2">{note.content}</p>
            {note.pinned && (
              <span className="material-symbols-outlined text-xs text-tertiary flex-shrink-0">push_pin</span>
            )}
            <button
              onClick={() => handleDelete(note.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error flex-shrink-0"
              aria-label="Delete note"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>

      {notes.length > 3 && (
        <Link
          href="/notes"
          className="text-xs text-primary font-label font-semibold hover:underline self-start"
        >
          See all {notes.length} notes
        </Link>
      )}

      {isModalOpen && (
        <NotesModal notes={notes} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
