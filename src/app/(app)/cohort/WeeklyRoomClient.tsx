'use client'

import { useEffect, useState } from 'react'

interface WeeklyRoomPayload {
  room: {
    id: string
    cohort_challenge_id: string | null
    title: string
    prompt_text: string
    difficulty: string
    move_tag: string | null
    week_end: string
  } | null
  submission: { id: string; response_text: string; score: number | null; submitted_at: string } | null
  days_remaining: number
  participants: number
  highlights: Array<{ label: string; submission_id: string; display_name: string; score: number | null; excerpt: string }>
  hatch_digest: string | null
}

export function WeeklyRoomClient() {
  const [data, setData] = useState<WeeklyRoomPayload | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadRoom() {
    const res = await fetch('/api/community/weekly-room')
    if (!res.ok) {
      setError('Weekly Room is not available right now.')
      return
    }
    const payload = await res.json() as WeeklyRoomPayload
    setData(payload)
    setResponseText(payload.submission?.response_text ?? '')
  }

  useEffect(() => {
    void loadRoom()
  }, [])

  async function submit() {
    if (!data?.room?.cohort_challenge_id || !responseText.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/cohort/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort_challenge_id: data.room.cohort_challenge_id,
          response_text: responseText,
        }),
      })
      if (!res.ok) throw new Error('Submit failed')
      await loadRoom()
    } catch {
      setError('Your room answer did not save yet.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!data && !error) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface p-6 text-sm text-on-surface-variant">
        Loading Weekly Room...
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface p-6 text-sm text-on-surface-variant">
        {error}
      </div>
    )
  }

  if (!data?.room) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface p-8">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Weekly Room</div>
        <h1 className="mt-2 font-headline text-3xl font-bold text-on-surface">No room is active this week.</h1>
        <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
          The next curated prompt will appear here when it opens.
        </p>
      </div>
    )
  }

  const alreadySubmitted = Boolean(data.submission)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-outline-variant bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Weekly Room</div>
            <h1 className="mt-2 font-headline text-3xl font-bold text-on-surface">{data.room.title}</h1>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-primary-fixed px-3 py-1.5 text-xs font-bold text-primary">
              {data.days_remaining} days left
            </span>
            <span className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface-variant">
              {data.participants} participating
            </span>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-background p-4 text-base leading-7 text-on-surface">
          {data.room.prompt_text}
        </p>

        <div className="mt-5">
          <label className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant" htmlFor="weekly-room-response">
            Your approach
          </label>
          <textarea
            id="weekly-room-response"
            value={responseText}
            onChange={event => setResponseText(event.target.value)}
            className="mt-2 min-h-48 w-full rounded-xl border border-outline-variant bg-background px-4 py-3 text-sm leading-6 text-on-surface outline-none focus:border-primary"
            placeholder="Write the answer you would be willing to compare against peers."
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-on-surface-variant">
              {alreadySubmitted ? 'Saved. You can refine until the room closes.' : 'Submit once, then compare against highlighted approaches.'}
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !responseText.trim() || !data.room.cohort_challenge_id}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
            >
              {alreadySubmitted ? 'Update answer' : 'Submit to room'}
            </button>
          </div>
          {error && <div className="mt-3 text-xs font-semibold text-error">{error}</div>}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-2xl border border-outline-variant bg-surface p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-primary">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            Hatch digest
          </div>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            {data.hatch_digest ?? 'Digest appears once enough answers land.'}
          </p>
        </section>

        <section className="rounded-2xl border border-outline-variant bg-surface p-5">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Highlights</div>
          <div className="mt-4 space-y-3">
            {data.highlights.length === 0 && (
              <p className="text-sm text-on-surface-variant">No highlights yet.</p>
            )}
            {data.highlights.map(item => (
              <div key={item.submission_id} className="rounded-xl bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-on-surface">{item.label}</span>
                  {typeof item.score === 'number' && (
                    <span className="text-xs font-bold text-primary">{item.score}</span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">{item.excerpt}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}
