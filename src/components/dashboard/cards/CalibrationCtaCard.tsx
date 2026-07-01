'use client'

import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { useOnboardingModal } from '@/context/OnboardingModalContext'

// Deferred-calibration entry point for the value-first onboarding variant
// (onboarding_value_first flag). Users who took the one-tap role path skip
// straight to a rep; this card is how they come back for the full FLOW
// calibration whenever they want a personalized plan. Opens the existing
// CalibrationFlow modal unchanged — nothing about calibration itself is
// duplicated here.
export function CalibrationCtaCard() {
  const { openModal } = useOnboardingModal()

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-[0_16px_34px_-34px_rgba(30,27,20,0.45)]">
      <div className="flex items-start gap-3">
        <HatchGlyph size={36} state="listening" className="text-primary flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-[15px] font-semibold leading-snug text-on-surface">
            Calibrate for a personalized plan
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-on-surface-variant">
            Four quick scenarios. Hatch scores your FLOW moves and routes every challenge after that around your weakest one.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => openModal('hero')}
        className="mt-3 w-full rounded-full bg-primary px-4 py-2 text-center font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 active:scale-95"
      >
        Start calibration
      </button>
    </div>
  )
}
