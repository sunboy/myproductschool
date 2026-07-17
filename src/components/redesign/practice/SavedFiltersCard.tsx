'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

const STORAGE_KEY = 'practice:saved-filters:v1'

interface SavedFilter {
  id: string
  name: string
  query: string
}

function readPresets(): SavedFilter[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePresets(presets: SavedFilter[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // storage unavailable, best-effort only
  }
}

/** Human-ish subline built from a preset's query string, e.g. "easy · resume only". */
function describeQuery(query: string): string {
  const params = new URLSearchParams(query)
  const parts: string[] = []
  for (const [key, value] of params.entries()) {
    if (!value) continue
    if (key === 'resume' && (value === '1' || value === 'true')) {
      parts.push('resume only')
      continue
    }
    parts.push(value.replace(/[-_]/g, ' '))
  }
  return parts.length > 0 ? parts.join(' · ') : 'All practice'
}

function PresetCountBadge({ query }: { query: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/challenges?${query}&page=1&limit=1`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (cancelled) return
        if (typeof json?.total === 'number') setCount(json.total)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [query])

  if (count == null) return null

  return (
    <span className="shrink-0 rounded-full border border-hairline bg-page-field px-2 py-0.5 text-[11px] font-bold tabular-nums text-ink-secondary">
      {count}
    </span>
  )
}

/** localStorage-backed named filter presets for the Practice list. */
export function SavedFiltersCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [presets, setPresets] = useState<SavedFilter[]>([])
  const [naming, setNaming] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPresets(readPresets())
  }, [])

  useEffect(() => {
    if (naming) nameInputRef.current?.focus()
  }, [naming])

  const pendingQuery = (() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    params.delete('view')
    params.delete('q')
    return params.toString()
  })()

  function applyPreset(query: string) {
    router.push(`/challenges?${query}`)
  }

  function deletePreset(id: string) {
    const next = presets.filter(p => p.id !== id)
    setPresets(next)
    writePresets(next)
  }

  function saveCurrent() {
    const name = nameInput.trim()
    if (!name || !pendingQuery) return
    const next = [...presets, { id: crypto.randomUUID(), name, query: pendingQuery }]
    setPresets(next)
    writePresets(next)
    setNaming(false)
    setNameInput('')
  }

  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
      <div className="mb-3 font-body text-[15.5px] font-bold text-ink-strong">Saved filters</div>

      {presets.length === 0 ? (
        <p className="mb-3 text-[12px] text-ink-secondary">Save a filter combo you keep coming back to.</p>
      ) : (
        <div className="mb-3 flex flex-col gap-1">
          {presets.map(preset => (
            <div
              key={preset.id}
              role="button"
              tabIndex={0}
              onClick={() => applyPreset(preset.query)}
              onKeyDown={e => {
                if (e.key === 'Enter') applyPreset(preset.query)
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-page-field"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-ink-strong">{preset.name}</div>
                <div className="truncate text-[11.5px] text-ink-secondary">{describeQuery(preset.query)}</div>
              </div>
              <PresetCountBadge query={preset.query} />
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  deletePreset(preset.id)
                }}
                aria-label={`Delete ${preset.name}`}
                className="shrink-0 rounded-full p-1 text-ink-muted hover:bg-hairline hover:text-ink-strong"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {naming ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={nameInputRef}
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveCurrent()
              if (e.key === 'Escape') {
                setNaming(false)
                setNameInput('')
              }
            }}
            placeholder="Filter name"
            className="min-w-0 flex-1 rounded-full border border-hairline bg-page-field px-3 py-1.5 text-[12.5px] text-ink-strong outline-none focus:border-forest-600"
          />
          <button
            type="button"
            onClick={saveCurrent}
            disabled={!nameInput.trim()}
            className="shrink-0 rounded-full bg-forest-800 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNaming(true)}
          disabled={!pendingQuery}
          title={pendingQuery ? undefined : 'Set some filters first'}
          className="w-full rounded-full border border-hairline bg-page-field px-3.5 py-2 text-[12px] font-bold text-ink-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save current filters
        </button>
      )}
    </div>
  )
}
