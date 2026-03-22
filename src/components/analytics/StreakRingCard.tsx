interface Props {
  streakDays: number
  totalAttempts: number
}

const CIRCUMFERENCE = 427 // 2π × 68 ≈ 427
const MAX_STREAK = 30

export function StreakRingCard({ streakDays, totalAttempts }: Props) {
  const cappedDays = Math.min(streakDays, MAX_STREAK)
  const strokeDashoffset = CIRCUMFERENCE - (cappedDays / MAX_STREAK) * CIRCUMFERENCE

  return (
    <div className="bg-surface-container rounded-xl p-8 flex flex-col items-center justify-center text-center h-full">
      <p className="text-xs font-bold uppercase tracking-wider text-tertiary mb-6">Streak</p>

      {/* Ring */}
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 160 160" className="w-full h-full">
          {/* Background track */}
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="transparent"
            stroke="#e4e0d8"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="transparent"
            stroke="#4a7c59"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold font-headline text-on-surface leading-none">
            {streakDays}
          </span>
          <span className="text-xs text-on-surface-variant uppercase mt-1">days</span>
        </div>
      </div>

      <p className="text-sm font-medium text-on-surface-variant mt-4">current streak</p>
      <p className="text-xs text-on-surface-variant mt-2">{totalAttempts} total sessions</p>
    </div>
  )
}
