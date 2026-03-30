'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteInterview } from '@/app/actions/dashboard'
import { InterviewSetupModal } from './InterviewSetupModal'
import type { UserInterview } from '@/lib/data/dashboard'

interface InterviewCountdownCardProps {
  interviews: UserInterview[]
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function InterviewCountdownCard({ interviews }: InterviewCountdownCardProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteInterview(id)
      router.refresh()
    })
  }

  // ── Empty state ──────────────────────────────────────────────
  if (interviews.length === 0) {
    return (
      <>
        <div className="bg-surface-container rounded-xl p-5 flex flex-col items-center gap-3 text-center h-full justify-center">
          <span className="material-symbols-outlined text-5xl text-primary">event</span>
          <p className="font-headline font-bold text-base text-on-surface">Interview coming up?</p>
          <p className="text-sm text-on-surface-variant">Track your countdown and hit your daily prep targets.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold hover:opacity-90 transition-opacity"
          >
            Set up countdown →
          </button>
        </div>
        {isModalOpen && <InterviewSetupModal onClose={() => setIsModalOpen(false)} />}
      </>
    )
  }

  // ── Single interview — ring countdown ────────────────────────
  if (interviews.length === 1) {
    const interview = interviews[0]
    const days = daysUntil(interview.interview_date)
    const r = 48
    const circumference = 2 * Math.PI * r
    const totalDays = 30
    const progress = Math.min(1, Math.max(0, (totalDays - days) / totalDays))
    const strokeDashoffset = circumference * (1 - progress)
    const dailyTarget = Math.max(1, Math.ceil(days / 5))
    const chipParts: string[] = []
    if (interview.company) chipParts.push(interview.company)
    if (interview.round) chipParts.push(interview.round)
    const chipText = chipParts.length > 0 ? `for ${chipParts.join(' · ')}` : null

    return (
      <>
        <div className="bg-surface-container rounded-xl p-5 flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-label font-bold text-xs uppercase tracking-wider text-outline">Interview Countdown</h3>
            <button
              onClick={() => handleDelete(interview.id)}
              className="text-on-surface-variant hover:text-error transition-colors text-xs opacity-60 hover:opacity-100"
              aria-label="Remove interview"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#e4e0d8" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={r} fill="none" stroke="#4a7c59" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${strokeDashoffset}`}
              transform="rotate(-90 60 60)"
            />
          </svg>

          <div className="flex flex-col items-center -mt-[88px] mb-[68px] pointer-events-none select-none">
            <span className="font-headline text-5xl font-bold text-primary leading-none">{days}</span>
            <span className="text-xs text-on-surface-variant font-label mt-0.5">days to go</span>
          </div>

          {chipText && (
            <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 text-xs font-label">
              {chipText}
            </span>
          )}

          <div className="flex items-center gap-1.5 bg-primary-fixed rounded-full px-3 py-1">
            <span className="material-symbols-outlined text-sm text-primary">target</span>
            <span className="text-xs text-on-surface font-label">
              Do <span className="font-semibold">{dailyTarget} challenge{dailyTarget !== 1 ? 's' : ''}/day</span>
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-primary hover:underline font-label"
          >
            + Add another interview
          </button>
        </div>
        {isModalOpen && <InterviewSetupModal onClose={() => setIsModalOpen(false)} />}
      </>
    )
  }

  // ── Multiple interviews — compact list ───────────────────────
  return (
    <>
      <div className="bg-surface-container rounded-xl p-5 flex flex-col gap-3">
        <h3 className="font-label font-bold text-xs uppercase tracking-wider text-outline">Upcoming Interviews</h3>

        <div className="flex flex-col gap-2">
          {interviews.map((interview) => {
            const days = daysUntil(interview.interview_date)
            const chipParts: string[] = []
            if (interview.round) chipParts.push(interview.round)
            if (interview.company) chipParts.push(interview.company)
            const label = chipParts.join(' at ') || 'Interview'

            return (
              <div key={interview.id} className="flex items-center gap-3 bg-surface-container-high rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-label font-semibold text-on-surface truncate">{label}</p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(interview.interview_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="font-headline font-bold text-lg text-primary leading-none">{days}</span>
                    <span className="text-xs text-on-surface-variant font-label">days</span>
                  </div>
                  <button
                    onClick={() => handleDelete(interview.id)}
                    className="text-on-surface-variant hover:text-error transition-colors opacity-40 hover:opacity-100"
                    aria-label="Remove interview"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs text-primary hover:underline font-label text-center mt-1"
        >
          + Add interview
        </button>
      </div>
      {isModalOpen && <InterviewSetupModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
