import Link from 'next/link'

interface PrescriptionCardProps {
  mode: string
  challengeTitle: string
  challengeSlug: string
  reason: string
}

const MODE_CONFIG: Record<string, { label: string; icon: string; badgeClass: string }> = {
  spotlight: { label: 'Spotlight', icon: 'timer', badgeClass: 'bg-error-container text-on-error-container' },
  workshop:  { label: 'Workshop', icon: 'build', badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  live:      { label: 'Live', icon: 'record_voice_over', badgeClass: 'bg-primary-container text-on-primary-container' },
  solo:      { label: 'Solo', icon: 'self_improvement', badgeClass: 'bg-secondary-container text-on-secondary-container' },
}

export function PrescriptionCard({ mode, challengeTitle, challengeSlug, reason }: PrescriptionCardProps) {
  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.live
  const href = challengeSlug ? `/challenges/${challengeSlug}?mode=${mode}` : '/challenges'

  return (
    <>
      {/* Card (visible on scroll) */}
      <div className="bg-primary-fixed rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
            {config.icon}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-label font-semibold ${config.badgeClass}`}>
            {config.label}
          </span>
          <span className="text-xs text-on-primary-fixed font-label font-semibold ml-1">Luma&apos;s prescription</span>
        </div>
        <h3 className="font-headline text-lg text-on-primary-fixed">{challengeTitle}</h3>
        <p className="text-sm text-on-primary-fixed italic">{reason}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-semibold font-label"
        >
          Start prescribed session
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

      {/* Floating CTA (mobile sticky) */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-background/90 backdrop-blur-md border-t border-outline-variant p-4 flex items-center justify-between z-40 md:hidden">
        <div>
          <p className="text-xs text-on-surface-variant font-label">Next: {config.label} session</p>
          <p className="text-sm font-semibold text-on-surface truncate max-w-[200px]">{challengeTitle}</p>
        </div>
        <Link
          href={href}
          className="flex items-center gap-2 bg-primary text-on-primary rounded-full px-4 py-2 text-sm font-semibold font-label shrink-0"
        >
          Start
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </>
  )
}
