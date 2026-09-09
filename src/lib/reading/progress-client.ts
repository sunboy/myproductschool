export type ReadingContentType = 'module_chapter' | 'autopsy_story'

export interface ReadingProgressRow {
  content_type: ReadingContentType
  parent_id: string
  content_id: string
  progress: number
  last_heading: string | null
  updated_at?: string
}

export function readingProgressKey(type: ReadingContentType, parentId: string, contentId: string) {
  return `hp:reading:${type}:${parentId}/${contentId}`
}

export function readLocalProgress(type: ReadingContentType, parentId: string, contentId: string): { progress: number; last_heading: string | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(readingProgressKey(type, parentId, contentId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function createProgressReporter(opts: {
  contentType: ReadingContentType
  parentId: string
  contentId: string
  fetcher?: typeof fetch
  delayMs?: number
}) {
  const fetcher = opts.fetcher ?? fetch
  const delay = opts.delayMs ?? 1500
  let timer: ReturnType<typeof setTimeout> | null = null
  let latest: { progress: number; last_heading: string | null } | null = null
  const flush = async () => {
    timer = null
    if (!latest) return
    const body: ReadingProgressRow = { content_type: opts.contentType, parent_id: opts.parentId, content_id: opts.contentId, progress: latest.progress, last_heading: latest.last_heading }
    try { await fetcher('/api/reading-progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) } catch { /* ignore */ }
  }
  return (progress: number, lastHeading: string | null) => {
    const clamped = Math.max(0, Math.min(1, Number(progress.toFixed(3))))
    latest = { progress: clamped, last_heading: lastHeading }
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(readingProgressKey(opts.contentType, opts.parentId, opts.contentId), JSON.stringify(latest)) } catch { /* ignore */ }
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }
}

export async function fetchRecentReading(limit = 6): Promise<ReadingProgressRow[]> {
  const res = await fetch(`/api/reading-progress?limit=${limit}`, { cache: 'no-store' })
  if (!res.ok) return []
  const body = await res.json() as { rows?: ReadingProgressRow[] }
  return body.rows ?? []
}
