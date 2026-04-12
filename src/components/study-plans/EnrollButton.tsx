'use client'

import { useState } from 'react'

interface EnrollButtonProps {
  slug: string
  initialEnrolled: boolean
  hasProgress: boolean
}

export function EnrollButton({ slug, initialEnrolled, hasProgress }: EnrollButtonProps) {
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [loading, setLoading] = useState(false)

  async function toggleEnrollment() {
    setLoading(true)
    try {
      const method = enrolled ? 'DELETE' : 'POST'
      const res = await fetch(`/api/study-plans/${slug}/enroll`, { method })
      if (res.ok) setEnrolled(!enrolled)
    } finally {
      setLoading(false)
    }
  }

  if (enrolled) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={`/explore/plans/${slug}`}
          className="bg-primary text-on-primary rounded-full px-6 py-2.5 text-sm font-label font-semibold text-center hover:opacity-90 transition-opacity"
        >
          {hasProgress ? 'Resume Plan' : 'Begin Plan'}
        </a>
        <button
          onClick={toggleEnrollment}
          disabled={loading}
          className="text-xs text-on-surface-variant hover:text-error transition-colors text-center disabled:opacity-50"
        >
          {loading ? 'Removing...' : 'Remove from my plans'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={toggleEnrollment}
      disabled={loading}
      className="w-full bg-primary text-on-primary rounded-full px-6 py-2.5 text-sm font-label font-semibold text-center hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? 'Enrolling...' : 'Enroll in Plan'}
    </button>
  )
}
