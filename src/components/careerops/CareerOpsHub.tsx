'use client'
// The /career-ops landing. Discovery feed LEADS (the cold-start aha), then the
// score CTA, then the pipeline and story bank in tabs. Each section is gated by
// its own flag and degrades gracefully.

import { useState } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { DiscoveryFeed } from './DiscoveryFeed'
import { CareerPipelineBoard } from './CareerPipelineBoard'
import { StoriesPanel } from './StoriesPanel'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'

type LowerTab = 'pipeline' | 'stories'

export function CareerOpsHub() {
  const discoveryOn = isCareerOpsFeatureEnabled('discovery')
  const scorerOn = isCareerOpsFeatureEnabled('scorer')
  const trackerOn = isCareerOpsFeatureEnabled('tracker')
  const storiesOn = isCareerOpsFeatureEnabled('stories')

  const [tab, setTab] = useState<LowerTab>(trackerOn ? 'pipeline' : 'stories')

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <HatchGlyph size={48} state="idle" className="shrink-0 text-primary" />
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">Career</h1>
            <p className="font-body text-sm text-on-surface-variant">
              Real openings, scored for you. Every gap turns into a practice rep.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {scorerOn && (
            <Link
              href="/career-ops/score"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-label text-sm font-semibold text-on-primary no-underline"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>auto_awesome</span>
              Score a job
            </Link>
          )}
          <button
            onClick={() => window.dispatchEvent(new Event('open-ask-hatch'))}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-5 py-2.5 font-label text-sm font-semibold text-on-secondary-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>forum</span>
            Ask Hatch
          </button>
        </div>
      </div>

      {/* Discovery feed leads */}
      {discoveryOn && (
        <section className="mt-8">
          <h2 className="mb-3 font-headline text-lg font-semibold text-on-surface">Jobs for you</h2>
          <DiscoveryFeed />
        </section>
      )}

      {/* Lower tabs: pipeline + stories */}
      {(trackerOn || storiesOn) && (
        <section className="mt-10">
          <div className="mb-4 flex gap-1 rounded-full bg-surface-container-low p-1">
            {trackerOn && (
              <TabButton active={tab === 'pipeline'} onClick={() => setTab('pipeline')} icon="view_kanban" label="Pipeline" />
            )}
            {storiesOn && (
              <TabButton active={tab === 'stories'} onClick={() => setTab('stories')} icon="history_edu" label="Stories" />
            )}
          </div>
          {tab === 'pipeline' && trackerOn && <CareerPipelineBoard />}
          {tab === 'stories' && storiesOn && <StoriesPanel />}
        </section>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-label text-sm font-semibold transition-colors ${
        active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden>{icon}</span>
      {label}
    </button>
  )
}
