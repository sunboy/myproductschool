'use client'

import { motion } from 'framer-motion'
import { motionSprings } from '@/components/motion/tokens'
import type { PublicFitMode } from '@/lib/careerops/public/types'

const MODES: { key: PublicFitMode; label: string; icon: string }[] = [
  { key: 'job_fit', label: 'Job fit score', icon: 'target' },
  { key: 'resume_roast', label: 'Resume roast', icon: 'local_fire_department' },
]

interface ModeToggleProps {
  mode: PublicFitMode
  onChange: (mode: PublicFitMode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex justify-center gap-2">
      {MODES.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="relative inline-flex items-center gap-1.5 rounded-full px-5 py-2 font-label text-sm font-semibold"
        >
          {mode === tab.key && (
            <motion.span
              layoutId="fit-mode-pill"
              className="absolute inset-0 rounded-full bg-primary"
              transition={motionSprings.layout}
            />
          )}
          <span
            className={`relative z-10 material-symbols-outlined text-[18px] ${
              mode === tab.key ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
            aria-hidden
          >
            {tab.icon}
          </span>
          <span
            className={`relative z-10 ${
              mode === tab.key ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
