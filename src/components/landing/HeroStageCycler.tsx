'use client'

import { useState, useEffect } from 'react'
import {
  FeedbackConsole,
  OrchestrationMap,
  PracticeWorkbench,
  ProductCommandCenter,
  RoadmapPreview,
} from './LivePreviews'

const ORDER = ['practice', 'interview', 'plans', 'coach', 'grading'] as const
type StageKey = typeof ORDER[number]

const LABELS: Record<StageKey, string> = {
  practice:  'Practice',
  interview: 'Live AI',
  plans:     'Plans',
  coach:     'Hatch chat',
  grading:   'Grading',
}

function renderStage(key: StageKey) {
  switch (key) {
    case 'practice':  return <PracticeWorkbench />
    case 'interview': return <ProductCommandCenter />
    case 'plans':     return <RoadmapPreview />
    case 'coach':     return <OrchestrationMap />
    case 'grading':   return <FeedbackConsole />
  }
}

interface Props {
  initial?: StageKey
}

export function HeroStageCycler({ initial = 'practice' }: Props) {
  const [active, setActive] = useState<StageKey>(initial)

  useEffect(() => {
    const t = setInterval(() => setActive(a => ORDER[(ORDER.indexOf(a) + 1) % ORDER.length]), 7000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="land-stage-cycler">
      {ORDER.map(k => (
        <div key={k} className={k === active ? 'is-active' : ''}>{renderStage(k)}</div>
      ))}
      <span className="land-live-tag">
        <span className="land-dot-orange" /> Live · click below
      </span>
      <div className="land-stage-tabs">
        {ORDER.map(k => (
          <button
            key={k}
            className={`land-stage-tab ${active === k ? 'land-stage-tab--active' : ''}`}
            onClick={() => setActive(k)}
          >
            {LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  )
}
