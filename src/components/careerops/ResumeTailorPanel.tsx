'use client'
// Résumé tailoring — sharpen bullets to a specific JD, surface ATS keywords.
// Operates on a linked application (application_id) or a standalone jd_text.

import { useState } from 'react'
import { Md } from '@/components/ui/Md'

interface AtsNotes { missing?: string[]; strong?: string[] }
interface ResumeResult { tailored_md: string; keywords: string[]; ats_notes: AtsNotes | null }

export function ResumeTailorPanel({ applicationId, jdText }: { applicationId?: string; jdText?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResumeResult | null>(null)

  async function tailor() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/career-ops/resume/tailor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, jd_text: jdText }),
      })
      if (res.status === 402) { window.dispatchEvent(new Event('open-upgrade-modal')); setError('Résumé tailoring limit reached. Upgrade for more.'); return }
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'tailor_failed')
      }
      setResult((await res.json()).resume as ResumeResult)
    } catch (e) {
      setError((e as Error).message === 'tailor_failed' ? 'Tailoring failed. Try again.' : (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-surface-container-low p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-headline text-base font-semibold text-on-surface">Tailor your résumé</h3>
          <p className="font-body text-sm text-on-surface-variant">Sharpen bullets and surface ATS keywords for this role.</p>
        </div>
        <button
          onClick={tailor}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden>auto_fix_high</span>
          {loading ? 'Tailoring...' : 'Tailor'}
        </button>
      </div>

      {error && <p className="mt-3 font-body text-sm text-error">{error}</p>}

      {result && (
        <div className="mt-4 space-y-4">
          {result.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.map((k, i) => (
                <span key={i} className="rounded-full bg-secondary-container px-2.5 py-0.5 font-label text-xs text-on-secondary-container">{k}</span>
              ))}
            </div>
          )}
          {result.ats_notes?.missing && result.ats_notes.missing.length > 0 && (
            <div className="rounded-xl bg-surface-container p-3">
              <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Missing from your résumé</p>
              <p className="mt-1 font-body text-sm text-on-surface">{result.ats_notes.missing.join(', ')}</p>
            </div>
          )}
          <div className="rounded-xl bg-surface p-4">
            <Md variant="compact">{result.tailored_md}</Md>
          </div>
        </div>
      )}
    </div>
  )
}
