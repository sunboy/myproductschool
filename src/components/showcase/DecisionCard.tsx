'use client'
import type { AutopsyDecision } from '@/lib/types'

interface DecisionCardProps {
  decision: AutopsyDecision
  isSelected: boolean
  onClick: () => void
}

const AREA_COLORS: Record<string, string> = {
  'Monetization': 'bg-tertiary-container',
  'Growth': 'bg-primary-container',
  'Collaboration': 'bg-secondary-container',
  'Developer Experience': 'bg-primary-container',
  'Performance': 'bg-surface-container-highest',
  'Architecture': 'bg-secondary-container',
  'Onboarding': 'bg-primary-container',
  'Workflow': 'bg-secondary-container',
  'UX': 'bg-surface-container-highest',
  'Distribution': 'bg-tertiary-container',
  'Network Effects': 'bg-primary-container',
  'Security': 'bg-surface-container-highest',
  'Expansion': 'bg-tertiary-container',
  'AI Growth': 'bg-primary-container',
}

const AREA_ICONS: Record<string, string> = {
  'Monetization': 'payments',
  'Growth': 'trending_up',
  'Collaboration': 'group',
  'Developer Experience': 'code',
  'Performance': 'speed',
  'Architecture': 'view_agenda',
  'Onboarding': 'grid_view',
  'Workflow': 'cycle',
  'UX': 'tag',
  'Distribution': 'open_in_browser',
  'Network Effects': 'widgets',
  'Security': 'lock',
  'Expansion': 'dashboard',
  'AI Growth': 'auto_awesome',
}

const DIFFICULTY_STYLES: Record<string, string> = {
  warmup: 'bg-primary-container text-on-primary-container',
  standard: 'bg-secondary-container text-on-secondary-container',
  advanced: 'bg-tertiary-container text-on-tertiary-container',
}

export function DecisionCard({ decision, isSelected, onClick }: DecisionCardProps) {
  const areaColor = AREA_COLORS[decision.area] ?? 'bg-surface-container-high'
  const areaIcon = decision.icon ?? AREA_ICONS[decision.area] ?? 'lightbulb'
  const difficultyStyle = DIFFICULTY_STYLES[decision.difficulty] ?? DIFFICULTY_STYLES.standard

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary-container/10'
          : 'border-transparent bg-surface-container hover:bg-surface-container-high'
      }`}
    >
      {/* Screenshot placeholder */}
      <div className={`h-28 w-full ${areaColor} relative flex items-center justify-center`}>
        <span
          className="material-symbols-outlined text-3xl text-on-surface/30"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 40" }}
        >
          {areaIcon}
        </span>
        <span className="absolute top-2 right-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40">
          {decision.area}
        </span>
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-label font-bold bg-surface-container-high text-on-surface-variant rounded-full px-2 py-0.5">
            {decision.area}
          </span>
          <span className={`text-[10px] font-label font-bold rounded-full px-2 py-0.5 ${difficultyStyle}`}>
            {decision.difficulty}
          </span>
        </div>
        {/* Title */}
        <p className="font-label text-sm font-bold text-on-surface">{decision.title}</p>
        {/* Challenge question teaser */}
        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 italic">
          {decision.challenge_question}
        </p>
      </div>
    </button>
  )
}
