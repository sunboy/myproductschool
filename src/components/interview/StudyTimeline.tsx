interface Challenge {
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Phase {
  name: string
  duration: string
  difficulty: string
  status: 'completed' | 'current' | 'locked'
  challenges: Challenge[]
}

interface StudyTimelineProps {
  phases: Phase[]
}

export function StudyTimeline({ phases }: StudyTimelineProps) {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-outline-variant" />

      <div className="space-y-6">
        {phases.map((phase, i) => (
          <div key={i} className="relative flex gap-6">
            {/* Status indicator */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                phase.status === 'completed'
                  ? 'bg-primary text-on-primary'
                  : phase.status === 'current'
                  ? 'bg-primary-container text-on-primary-container border-2 border-primary'
                  : 'bg-surface-container-highest text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                {phase.status === 'completed'
                  ? 'check'
                  : phase.status === 'current'
                  ? 'play_arrow'
                  : 'lock'}
              </span>
            </div>

            {/* Phase card */}
            <div
              className={`flex-1 rounded-2xl p-5 ${
                phase.status === 'current'
                  ? 'bg-primary-fixed border border-primary'
                  : phase.status === 'completed'
                  ? 'bg-surface-container'
                  : 'bg-surface-container opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-headline text-lg text-on-surface">{phase.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-surface-container-highest text-on-surface-variant rounded-full px-2 py-0.5 text-xs">
                      {phase.duration}
                    </span>
                    <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-xs">
                      {phase.difficulty}
                    </span>
                    {phase.status === 'current' && (
                      <span className="bg-primary text-on-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                        Next Up
                      </span>
                    )}
                  </div>
                </div>
                {phase.status === 'completed' && (
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                  >
                    check_circle
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {phase.challenges.map((challenge, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3 py-2 border-t border-outline-variant first:border-0"
                  >
                    <span className="material-symbols-outlined text-base text-on-surface-variant">
                      {phase.status === 'completed' ? 'task_alt' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-sm text-on-surface flex-1">{challenge.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        challenge.difficulty === 'hard'
                          ? 'bg-error-container text-on-error-container'
                          : challenge.difficulty === 'medium'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-primary-fixed text-on-primary-fixed'
                      }`}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
