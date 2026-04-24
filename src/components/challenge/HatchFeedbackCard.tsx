import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

interface Props {
  challengeId: string
  feedbackExcerpt: string
  attemptId?: string
}

export function HatchFeedbackCard({ challengeId, feedbackExcerpt, attemptId: _attemptId }: Props) {
  const hasExcerpt = feedbackExcerpt && feedbackExcerpt.trim().length > 0
  const excerpt = hasExcerpt
    ? feedbackExcerpt.length > 200
      ? feedbackExcerpt.slice(0, 200) + '...'
      : feedbackExcerpt
    : ''

  return (
    <div className="bg-primary-fixed rounded-xl p-6 border border-primary/20">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
          <span className="text-sm font-bold text-primary">Hatch's Feedback</span>
        </div>
        <span className="bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-full">AI Coach</span>
      </div>

      {/* Middle */}
      <div className="mt-4 flex items-start gap-3">
        <HatchGlyph size={24} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-headline font-bold text-on-surface text-sm">Hatch</span>
          {hasExcerpt ? (
            <p className="text-sm text-on-surface-variant italic mt-1 leading-relaxed">{excerpt}</p>
          ) : (
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">Complete a challenge to unlock Hatch's feedback</p>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-4 flex items-center justify-between">
        {hasExcerpt ? (
          <Link
            href={`/challenges/${challengeId}/feedback`}
            className="flex items-center gap-1 text-primary font-bold text-sm hover:underline"
          >
            See Full Feedback
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        ) : (
          <span className="text-sm text-on-surface-variant">Complete a challenge to unlock Hatch's feedback</span>
        )}
      </div>
    </div>
  )
}
