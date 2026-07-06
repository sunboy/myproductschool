'use client'

// MissionBookend — the "You asked / You proved" card extracted from
// AnalyticsSessionMirror, generalized so any feedback surface can close the
// loop its brief opened (question → what the learner demonstrated).

export function MissionBookend({ askedLabel = 'You asked', asked, provedLabel = 'You proved', proved }: {
  askedLabel?: string
  asked: string
  provedLabel?: string
  proved?: string | null
}) {
  return (
    <div className="rounded-[14px] bg-primary-fixed px-4 py-3.5 flex flex-col gap-2.5">
      <div>
        <p className="font-label text-[10px] font-bold uppercase tracking-wide text-primary">{askedLabel}</p>
        <p className="font-headline text-[15px] font-bold leading-snug mt-0.5 text-on-surface">{asked}</p>
      </div>
      {proved && (
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-wide text-primary">{provedLabel}</p>
          <p className="font-body text-[13.5px] font-semibold leading-relaxed mt-0.5 text-on-surface">{proved}</p>
        </div>
      )}
    </div>
  )
}
