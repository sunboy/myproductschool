'use client'

import { cn } from '@/lib/utils'
import StartInterviewButton from './StartInterviewButton'
import type { ScenarioBrief } from './page'

const DIFFICULTY_COLORS: Record<string, string> = {
  warmup: 'bg-green-100 text-green-800',
  standard: 'bg-secondary-container text-on-secondary-container',
  advanced: 'bg-tertiary-container text-on-tertiary-container',
  staff_plus: 'bg-error/10 text-error',
}

interface ScenarioPickerSheetProps {
  companyId: string
  companyName: string
  role: string
  scenarios: ScenarioBrief[]
  onClose: () => void
}

export default function ScenarioPickerSheet({
  companyId,
  companyName,
  role,
  scenarios,
  onClose,
}: ScenarioPickerSheetProps) {
  // Filter scenarios to those relevant to this role
  const roleKey = role.toLowerCase().replace(/\s+/g, '_')
  const filtered = scenarios.filter((s) => {
    if (s.relevantRoles.length === 0) return true
    return s.relevantRoles.some(
      (r) => r.toLowerCase().replace(/\s+/g, '_') === roleKey
        || r.toLowerCase() === role.toLowerCase()
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] bg-surface rounded-t-2xl sm:rounded-2xl shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <div>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {companyName} &middot; {role}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Choose a scenario or go free-form</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Free-form option */}
          <div className="flex items-center justify-between p-4 bg-primary-fixed/30 rounded-xl border border-primary/20">
            <div className="flex-1 min-w-0 mr-3">
              <p className="font-label font-semibold text-sm text-on-surface">Free-form Interview</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Hatch picks the scenario. No predefined case.
              </p>
            </div>
            <StartInterviewButton companyId={companyId} roleId={role} />
          </div>

          {/* Divider */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-xs text-on-surface-variant font-label">Or pick a scenario</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
          )}

          {/* Scenario cards */}
          {filtered.map((scenario) => (
            <div
              key={scenario.id}
              className="p-4 bg-surface-container rounded-xl border border-outline-variant hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-label font-semibold text-sm text-on-surface">{scenario.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                    {scenario.scenarioQuestion}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={cn(
                      'rounded-full text-xs px-2 py-0.5 font-label',
                      DIFFICULTY_COLORS[scenario.difficulty] ?? DIFFICULTY_COLORS.standard
                    )}>
                      {scenario.difficulty === 'staff_plus' ? 'Staff+' : scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      ~{scenario.estimatedMinutes} min
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StartInterviewButton
                    companyId={companyId}
                    roleId={role}
                    challengeId={scenario.id}
                  />
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-4">
              No scenarios available for this role yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
