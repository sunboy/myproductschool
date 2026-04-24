'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { addInterview } from '@/app/actions/dashboard'

interface InterviewSetupModalProps {
  onClose: () => void
  onSave?: () => void
}

const ROUND_OPTIONS = [
  { value: '', label: 'Select round (optional)' },
  { value: 'Phone screen', label: 'Phone screen' },
  { value: 'Technical screen', label: 'Technical screen' },
  { value: 'Onsite', label: 'Onsite' },
  { value: 'Final round', label: 'Final round' },
]

export function InterviewSetupModal({ onClose, onSave }: InterviewSetupModalProps) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [company, setCompany] = useState('')
  const [round, setRound] = useState('')
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSave() {
    if (!date) return
    setSaving(true)
    try {
      const meta: { company?: string; round?: string } = {}
      if (company.trim()) meta.company = company.trim()
      if (round) meta.round = round
      await addInterview(date, meta)
      onSave?.()
      router.refresh()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-surface rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <HatchGlyph size={28} state="listening" />
          <p className="font-headline font-bold text-base text-on-surface flex-1">Set your interview</p>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-1.5">
              Interview date <span className="text-error">*</span>
            </label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface font-label focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-1.5">
              Company <span className="text-on-surface-variant font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Meta, Stripe"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface font-label placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-1.5">
              Round <span className="text-on-surface-variant font-normal">(optional)</span>
            </label>
            <select
              value={round}
              onChange={e => setRound(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface font-label focus:outline-none focus:border-primary transition-colors"
            >
              {ROUND_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-surface-container text-on-surface rounded-full px-4 py-2.5 text-sm font-label font-semibold hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!date || saving}
            className="flex-1 bg-primary text-on-primary rounded-full px-4 py-2.5 text-sm font-label font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Start countdown'}
          </button>
        </div>
      </div>
    </div>
  )
}
