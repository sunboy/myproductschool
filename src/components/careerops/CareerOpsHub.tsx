'use client'
// The /career-ops landing. Discovery feed LEADS (the cold-start aha), then the
// score CTA, then the pipeline and story bank in tabs. Each section is gated by
// its own flag and degrades gracefully.

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { HatchMascotSprite } from '@/components/hatch/HatchMascotSprite'
import { DiscoveryFeed } from './DiscoveryFeed'
import { CareerPipelineBoard } from './CareerPipelineBoard'
import { StoriesPanel } from './StoriesPanel'
import { HubStatsRow } from './HubStatsRow'
import { useCareerApplications } from './useCareerApplications'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { motionSprings, motionVariants } from '@/components/motion/tokens'

type LowerTab = 'pipeline' | 'stories'

export function CareerOpsHub() {
  const discoveryOn = isCareerOpsFeatureEnabled('discovery')
  const scorerOn = isCareerOpsFeatureEnabled('scorer')
  const trackerOn = isCareerOpsFeatureEnabled('tracker')
  const storiesOn = isCareerOpsFeatureEnabled('stories')

  const [tab, setTab] = useState<LowerTab>(trackerOn ? 'pipeline' : 'stories')

  const { applications, loading, changeStatus, remove } = useCareerApplications()

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <HatchMascotSprite state="idle" size={72} ariaLabel="Hatch" className="shrink-0" />
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

      {/* Stats row — only when tracker is on */}
      {trackerOn && (
        <div className="mt-6">
          <HubStatsRow applications={applications} loading={loading} />
        </div>
      )}

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
          {/* Animated segmented control */}
          <div className="relative mb-4 flex gap-1 rounded-full bg-surface-container-low p-1">
            {trackerOn && (
              <TabButton
                active={tab === 'pipeline'}
                onClick={() => setTab('pipeline')}
                icon="view_kanban"
                label="Pipeline"
                layoutId="careerops-tab-pill"
              />
            )}
            {storiesOn && (
              <TabButton
                active={tab === 'stories'}
                onClick={() => setTab('stories')}
                icon="history_edu"
                label="Stories"
                layoutId="careerops-tab-pill"
              />
            )}
          </div>

          {/* Animated tab panels */}
          <AnimatePresence mode="wait">
            {tab === 'pipeline' && trackerOn && (
              <motion.div
                key="pipeline"
                variants={motionVariants.panel}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <CareerPipelineBoard
                  applications={applications}
                  loading={loading}
                  changeStatus={changeStatus}
                  remove={remove}
                />
              </motion.div>
            )}
            {tab === 'stories' && storiesOn && (
              <motion.div
                key="stories"
                variants={motionVariants.panel}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <StoriesPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  layoutId,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  layoutId: string
}) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-label text-sm font-semibold"
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-primary"
          transition={motionSprings.layout}
        />
      )}
      <span
        className={`relative z-10 material-symbols-outlined text-[18px] ${active ? 'text-on-primary' : 'text-on-surface-variant'}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className={`relative z-10 ${active ? 'text-on-primary' : 'text-on-surface-variant'}`}>
        {label}
      </span>
    </button>
  )
}
