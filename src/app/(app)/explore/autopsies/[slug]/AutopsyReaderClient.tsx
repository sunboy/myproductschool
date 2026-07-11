'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { AutopsyProductDetail, AarrrStageContent } from '@/lib/types'
import { BackCrumb } from '@/components/navigation/BackButton'
import { ResumeBanner } from '@/components/showcase/reader/ResumeBanner'
import { ProgressRing } from '@/components/redesign/ProgressRing'
import { NoteCard } from '@/components/redesign/NoteCard'
import { useReaderResume } from '@/hooks/useReaderResume'
import { trackEvent } from '@/lib/posthog/client'
import {
  EVENT_AUTOPSY_OPENED,
  EVENT_AUTOPSY_SECTION_VIEWED,
  EVENT_AUTOPSY_FINISHED,
} from '@/lib/posthog/events'

// ─── Local content types ──────────────────────────────────────────────────────

interface HeroContent {
  product_name: string
  tagline: string
  meta: string
  accent_color: string
}

interface ClosingContent {
  headline: string
  summary: string
  cta_text: string
  cta_path: string
}

export interface PracticeLinkCard {
  id: string
  title: string
  href: string
  disciplineLabel: string
  difficultyLabel: string | null
}

// ─── Stage data extracted from sections ──────────────────────────────────────

function getStages(product: AutopsyProductDetail): AarrrStageContent[] {
  const story = product.stories?.[0]
  if (!story) return []
  return story.sections
    .filter((s): s is typeof s & { layout: 'aarrr_stage' } => s.layout === 'aarrr_stage')
    .map(s => (s as { layout: 'aarrr_stage'; content: AarrrStageContent }).content)
}

function getHero(product: AutopsyProductDetail): HeroContent | null {
  const story = product.stories?.[0]
  if (!story) return null
  const sec = story.sections.find(s => s.layout === 'aarrr_hero')
  return sec ? (sec as { layout: 'aarrr_hero'; content: HeroContent }).content : null
}

function getClosing(product: AutopsyProductDetail): ClosingContent | null {
  const story = product.stories?.[0]
  if (!story) return null
  const sec = story.sections.find(s => s.layout === 'aarrr_closing')
  return sec ? (sec as { layout: 'aarrr_closing'; content: ClosingContent }).content : null
}

// ─── Metric count-up ──────────────────────────────────────────────────────────

function animateMetric(el: HTMLElement, rawValue: string) {
  const num = parseFloat(rawValue.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return
  const prefix = rawValue.match(/^[^0-9]*/)?.[0] ?? ''
  const suffix = rawValue.match(/[^0-9.]+$/)?.[0] ?? ''
  const proxy = { val: 0 }
  gsap.to(proxy, {
    val: num,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate() {
      const display = num < 10 ? proxy.val.toFixed(1) : Math.round(proxy.val).toString()
      el.textContent = prefix + display + suffix
    },
  })
}

// ─── Go Deeper collapsible ────────────────────────────────────────────────────

function GoDeeper({ stage, accentColor }: { stage: AarrrStageContent; accentColor: string }) {
  const [open, setOpen] = useState(false)
  const gd = stage.go_deeper
  if (!gd) return null

  return (
    <div className="mt-9 overflow-hidden rounded-[14px] border border-hairline bg-page-field">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-[22px] py-[18px] text-left"
      >
        {open ? (
          <ChevronUp size={18} strokeWidth={1.8} color={accentColor} />
        ) : (
          <ChevronDown size={18} strokeWidth={1.8} color={accentColor} />
        )}
        <span className="font-label text-[13px] font-bold tracking-[0.04em] text-ink-strong">Go Deeper</span>
        <span className="ml-auto font-label text-[11px] text-ink-muted">
          Metrics &middot; System Design &middot; Do&apos;s &amp; Don&apos;ts
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-7 px-[22px] pb-6">
          {(gd.metric_definitions ?? []).length > 0 && (
            <div>
              <div className="mb-3 border-b border-hairline pb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-muted">
                Key Metric Definitions
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-forest-950">
                      {['Metric', 'Definition', 'How to Calculate', 'Healthy Range'].map(col => (
                        <th
                          key={col}
                          className="whitespace-nowrap px-3 py-2 text-left font-label text-[10px] font-bold uppercase tracking-[0.08em] text-white"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(gd.metric_definitions ?? []).map((m, i) => (
                      <tr key={i} className={cn('border-b border-hairline', i % 2 === 0 ? 'bg-card-bright' : 'bg-page-field')}>
                        <td className="whitespace-nowrap px-3 py-2.5 font-label text-xs font-semibold text-ink-strong">{m.metric}</td>
                        <td className="px-3 py-2.5 font-body leading-[1.5] text-ink-secondary">{m.definition}</td>
                        <td className="px-3 py-2.5 font-body leading-[1.5] text-ink-secondary">{m.how_to_calculate}</td>
                        <td className="px-3 py-2.5 font-body leading-[1.5] text-ink-secondary">{m.healthy_range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {gd.system_design && (
            <div>
              <div className="mb-3 border-b border-hairline pb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-muted">
                System Design
              </div>
              <div className="flex flex-col gap-2.5">
                {(gd.system_design.components ?? []).map((c, i) => (
                  <div key={i} className="rounded-[10px] border border-hairline bg-card-bright px-4 py-3.5">
                    <div className="mb-1.5 font-label text-xs font-bold text-ink-strong">{c.component}</div>
                    <div className="mb-1.5 font-body text-[12.5px] leading-[1.55] text-ink-secondary">{c.what_it_does}</div>
                    <div className="font-body text-xs italic leading-[1.5] text-ink-muted">{c.key_technologies}</div>
                  </div>
                ))}
              </div>
              {(gd.system_design.links ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(gd.system_design.links ?? []).map((lk, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card-bright px-3 py-1.5 font-label text-[11px] text-ink-strong"
                    >
                      <span className="rounded bg-surface-container-highest px-1.5 py-px font-label text-[10px] font-bold text-ink-secondary">
                        {lk.tag}
                      </span>
                      {lk.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {(gd.failures ?? []).length > 0 && (
            <div>
              <div className="mb-3 border-b border-[#ffd5d6] pb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-error">
                What Didn&apos;t Work
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                {(gd.failures ?? []).map((f, i) => (
                  <div key={i} className="rounded-xl bg-[#fff5f5] px-[18px] py-4">
                    <div className="mb-1.5 font-label text-[10px] font-bold uppercase tracking-[0.08em] text-error">{f.name}</div>
                    <div className="mb-2 font-body text-[12.5px] leading-[1.55] text-ink-strong">{f.what}</div>
                    <div className="border-t border-[#ffd5d6] pt-2 font-body text-[11.5px] leading-[1.5] text-ink-secondary">
                      <strong className="text-error">Lesson: </strong>{f.lesson}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gd.do_dont && (
            <div>
              <div className="mb-3 border-b border-hairline pb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-muted">
                Do&apos;s &amp; Don&apos;ts
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border-t-4 border-forest-600 bg-card-bright px-5 py-[18px]">
                  <div className="mb-3 font-label text-[11px] font-extrabold tracking-[0.08em] text-forest-600">DO</div>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {(gd.do_dont.dos ?? []).map((item, i) => (
                      <li
                        key={i}
                        className={cn(
                          'font-body text-[12.5px] leading-[1.55] text-ink-secondary pb-2',
                          i < (gd.do_dont!.dos ?? []).length - 1 && 'border-b border-hairline'
                        )}
                      >
                        <Check size={13} strokeWidth={2.4} className="mr-1.5 inline text-forest-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border-t-4 border-error bg-card-bright px-5 py-[18px]">
                  <div className="mb-3 font-label text-[11px] font-extrabold tracking-[0.08em] text-error">DON&apos;T</div>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {(gd.do_dont.donts ?? []).map((item, i) => (
                      <li
                        key={i}
                        className={cn(
                          'font-body text-[12.5px] leading-[1.55] text-ink-secondary pb-2',
                          i < (gd.do_dont!.donts ?? []).length - 1 && 'border-b border-hairline'
                        )}
                      >
                        <span className="mr-1.5 font-bold text-error">&times;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {gd.competitor_table && (
            <div>
              <div className="mb-3 border-b border-[#d8e4f5] pb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1a4a8a]">
                vs. The Competition
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#d8e4f5]">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-[#1a4a8a]">
                      {(gd.competitor_table.columns ?? []).map((col, i) => (
                        <th key={i} className="px-3.5 py-2.5 text-left font-label text-[11px] font-semibold text-white">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(gd.competitor_table.rows ?? []).map((row, ri) => (
                      <tr key={ri} className={cn('border-b border-[#e8eef8]', ri % 2 === 0 ? 'bg-card-bright' : 'bg-[#f5f8ff]')}>
                        <td className="px-3.5 py-2.5 font-label text-xs font-semibold text-[#1a4a8a]">{row.dimension}</td>
                        {(row.values ?? []).map((v, vi) => (
                          <td
                            key={vi}
                            className={cn(
                              'px-3.5 py-2.5 font-body',
                              v.outcome === 'win' ? 'text-forest-600 font-semibold' : v.outcome === 'loss' ? 'font-semibold text-error' : 'text-[#8a6a00]'
                            )}
                          >
                            {v.text}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Practice Prompts (on-the-job / interview-prep, per-stage real content) ──

function PracticePrompts({ stage }: { stage: AarrrStageContent }) {
  const pp = stage.practice_prompts
  if (!pp) return null

  return (
    <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      {[
        { label: 'On the job', card: pp.on_the_job },
        { label: 'Interview prep', card: pp.interview_prep },
      ].map(({ label, card }) => (
        <div key={label} className="rounded-2xl bg-forest-950 px-7 py-[26px]">
          <div className="mb-2.5 font-label text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">{label}</div>
          <div className="mb-3 font-body text-sm font-bold leading-[1.5] text-white">{card.question}</div>
          <div className="font-body text-[13px] leading-[1.6] text-white/55">{card.guidance}</div>
          <div className="mt-3.5 border-t border-white/10 pt-3.5 font-body text-xs italic leading-[1.5] text-white/30">{card.hint}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Stage Section (light 3-zone reading column content) ────────────────────

interface StageSectionProps {
  stage: AarrrStageContent
  stageIndex: number
  totalStages: number
  accentColor: string
  sectionRef: (el: HTMLDivElement | null) => void
  sectionId: string
  onNextStage?: () => void
}

function StageSection({ stage, stageIndex, totalStages, accentColor, sectionRef, sectionId, onNextStage }: StageSectionProps) {
  const narrativeRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const warRoomRef = useRef<HTMLDivElement>(null)
  const metricValueRefs = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const sectionEl = narrativeRef.current?.closest('[data-stage-section]') as HTMLElement | null
    if (!sectionEl) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionEl, start: 'top 75%', once: true },
      })
      if (narrativeRef.current) {
        tl.fromTo(narrativeRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      }
      if (metricsRef.current) {
        const cards = metricsRef.current.querySelectorAll('[data-metric-cell]')
        tl.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, 0.1)
        tl.call(() => {
          metricValueRefs.current.forEach(el => { if (el) animateMetric(el, el.dataset.raw ?? '') })
        }, [], 0.15)
      }
      if (warRoomRef.current) {
        const rows = warRoomRef.current.querySelectorAll('[data-war-row]')
        tl.fromTo(rows, { x: -12, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out' }, 0.3)
      }
    })
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      data-stage-section
      data-section-id={sectionId}
      data-hatch-context={`Reading teardown stage: ${stage.stage_name}`}
      ref={sectionRef}
      className="reading-col min-w-0"
    >
      <div className="mb-3.5 font-label text-[11px] font-extrabold uppercase tracking-[0.08em] tabular-nums text-forest-700">
        Stage {stage.stage_number} of {totalStages}
      </div>
      <h2 className="mb-1.5 font-headline text-[30px] font-bold leading-[1.15] tracking-[-0.01em] text-ink-strong">
        {stage.stage_name}
      </h2>
      <p className="mb-[26px] font-headline text-lg italic leading-[1.4] text-forest-700">{stage.question}</p>

      {(stage.narrative_paragraphs ?? []).length > 0 && (
        <div ref={narrativeRef} className="story-body">
          {(stage.narrative_paragraphs ?? []).map((para, i) => (
            <p
              key={i}
              className="mb-[22px] max-w-[68ch] font-headline text-[17px] leading-[1.7] text-ink-strong"
              dangerouslySetInnerHTML={{ __html: para }}
            />
          ))}
        </div>
      )}

      {stage.callout && (
        <NoteCard tint="amber" className="mb-9 max-w-[68ch] rounded-xl px-[22px] py-[18px]">
          {stage.callout.label && (
            <div className="mb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ color: accentColor }}>
              {stage.callout.label}
            </div>
          )}
          <p className="m-0 font-body text-sm leading-[1.65] text-ink-strong">{stage.callout.text}</p>
        </NoteCard>
      )}

      {(stage.data_tables ?? []).map((tbl, ti) => (
        <div key={ti} className="mb-9 max-w-[68ch]">
          <div className="mb-2.5 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-muted">{tbl.label}</div>
          <div className="overflow-x-auto rounded-[10px] border border-hairline">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-forest-950">
                  {(tbl.columns ?? []).map((col, ci) => (
                    <th key={ci} className="whitespace-nowrap px-3.5 py-2.5 text-left font-label text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tbl.rows ?? []).map((row, ri) => (
                  <tr key={ri} className={cn('border-b border-hairline', ri % 2 === 0 ? 'bg-card-bright' : 'bg-page-field')}>
                    {(row ?? []).map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn('px-3.5 py-2.5 font-body leading-[1.5]', ci === 0 ? 'font-semibold text-ink-strong' : 'text-ink-secondary')}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Metrics strip — 3-up bordered cells, per preview .metrics-strip */}
      {stage.metrics && stage.metrics.length > 0 && (
        <div
          ref={metricsRef}
          className="metrics-strip mb-11 grid overflow-hidden rounded-2xl border border-hairline bg-card-bright shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]"
          style={{ gridTemplateColumns: `repeat(${Math.min(stage.metrics.length, 3)}, 1fr)` }}
        >
          {(stage.metrics ?? []).map((m, i) => (
            <div
              key={i}
              data-metric-cell
              className={cn('flex flex-col gap-1 px-[22px] py-5', i > 0 && 'border-l border-hairline')}
            >
              <span
                ref={el => { metricValueRefs.current[i] = el! }}
                data-raw={m.value}
                className="font-headline text-[26px] font-bold leading-[1.1] tabular-nums text-forest-800"
              >
                {m.value}
              </span>
              <span className="font-label text-xs font-semibold text-ink-muted">{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* War Room — dark card, role-labeled quotes */}
      {stage.war_room && stage.war_room.length > 0 && (
        <div ref={warRoomRef} className="war-room mb-9 rounded-2xl bg-gradient-to-br from-forest-950 to-forest-800 px-[30px] py-7 shadow-[0_1px_2px_rgba(5,35,22,.2),0_20px_40px_-24px_rgba(5,35,22,.5)]">
          <div className="mb-5 flex items-center gap-2.5">
            <h4 className="m-0 font-body text-base font-bold text-[#f9faf5]">War Room</h4>
            <span className="ml-auto font-label text-xs font-semibold uppercase tracking-[0.04em] tabular-nums text-white/55">
              {stage.war_room.length} perspective{stage.war_room.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {(stage.war_room ?? []).map((row, i) => (
              <div key={i}>
                <div data-war-row className="flex items-start gap-3.5">
                  <span className="w-14 shrink-0 pt-0.5 font-label text-[11px] font-extrabold uppercase tracking-[0.04em] text-mint-glow">
                    {row.role}
                  </span>
                  <p className="m-0 font-headline text-[15px] italic leading-[1.55] text-[#eef2ec] before:content-['\201C'] after:content-['\201D']">
                    {row.insight}
                  </p>
                </div>
                {i < stage.war_room!.length - 1 && <div className="mt-4 h-px bg-white/10" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <GoDeeper stage={stage} accentColor={accentColor} />
      <PracticePrompts stage={stage} />

      {stage.transition && (
        <p className="mx-0 mb-0 mt-12 text-center font-body text-[15px] italic leading-[1.6] text-ink-muted">
          {stage.transition.text}
        </p>
      )}

      {/* Section footer — matches preview's next-stage-btn pattern */}
      {onNextStage && (
        <div className="section-footer mt-11 flex items-center justify-between border-t border-hairline pt-6">
          <span className="font-label text-[13px] font-semibold tabular-nums text-ink-muted">
            Stage {stage.stage_number} of {totalStages} &middot; {stage.stage_name}
          </span>
          <button
            onClick={onNextStage}
            className="flex items-center gap-2 rounded-lg bg-forest-950 px-[22px] py-3 font-body text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            Next stage
            <ArrowRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Left stage rail (sticky, ring + numbered list per preview) ─────────────

interface StageRailProps {
  stages: AarrrStageContent[]
  activeStageIdx: number
  scrollProgress: number
  accentColor: string
  productName: string
  backHref: string
  backLabel: string
  onNavigate: (idx: number) => void
}

function StageRail({ stages, activeStageIdx, scrollProgress, accentColor, productName, backHref, backLabel, onNavigate }: StageRailProps) {
  const totalWithHero = stages.length + 1
  const currentPosition = activeStageIdx + 1 // 1 = hero
  const ringPct = Math.round((currentPosition / totalWithHero) * 100)
  const circumference = 2 * Math.PI * 18

  return (
    <aside className="hidden lg:flex" style={{ width: 220, flexShrink: 0, position: 'sticky', top: 67, height: 'calc(100vh - 67px)', overflowY: 'auto', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
      <Link
        href={backHref}
        aria-label={`Back to ${backLabel}`}
        className="inline-flex items-center gap-1.5 font-label text-[11.5px] font-bold text-forest-700 no-underline"
      >
        <ArrowLeft size={14} strokeWidth={1.8} />
        {backLabel}
      </Link>

      <div className="flex items-center gap-3 border-b border-hairline pb-3.5">
        <div className="relative size-11 shrink-0">
          <ProgressRing percent={ringPct} size={44} strokeWidth={5} trackColor="#eee9df" color={accentColor}>
            <span className="font-body text-xs font-bold tabular-nums text-ink-strong">
              {currentPosition}/{totalWithHero}
            </span>
          </ProgressRing>
        </div>
        <div>
          <div className="text-[12.5px] font-extrabold leading-[1.3] text-ink-strong">
            Stage {currentPosition} of {totalWithHero}
          </div>
          <div className="font-label text-[11px] font-semibold text-ink-muted">Reading progress</div>
        </div>
      </div>

      <nav className="flex flex-col gap-px">
        {['Hero', ...stages.map(s => s.stage_name)].map((name, idx) => {
          const status = idx < activeStageIdx ? 'done' : idx === activeStageIdx ? 'current' : 'upcoming'
          return (
            <button
              key={`${name}-${idx}`}
              onClick={() => onNavigate(idx)}
              className={cn('flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-left', status === 'current' && 'bg-[#eef4ec]')}
            >
              {status === 'done' && (
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
                  <Check size={12} strokeWidth={2.2} />
                </span>
              )}
              {status === 'current' && (
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.4px] text-[10.5px] font-bold tabular-nums"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  {idx + 1}
                </span>
              )}
              {status === 'upcoming' && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.4px] border-hairline text-[10.5px] font-bold tabular-nums text-ink-muted">
                  {idx + 1}
                </span>
              )}
              <span
                className={cn(
                  'text-[13.5px]',
                  status === 'current' ? 'font-bold text-forest-800' : status === 'done' ? 'font-semibold text-ink-strong' : 'font-semibold text-ink-muted'
                )}
              >
                {name}
              </span>
            </button>
          )
        })}
      </nav>
      <div className="sr-only" aria-live="polite">{Math.round(scrollProgress * 100)}% read</div>
    </aside>
  )
}

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ')
}

// ─── Right rail: Practice what you read + mini-TOC ───────────────────────────

interface RightRailProps {
  practiceCards: PracticeLinkCard[]
  stages: AarrrStageContent[]
  activeStageIdx: number
  onNavigate: (idx: number) => void
}

function RightRail({ practiceCards, stages, activeStageIdx, onNavigate }: RightRailProps) {
  return (
    <aside className="hidden lg:flex" style={{ width: 272, flexShrink: 0, position: 'sticky', top: 67, maxHeight: 'calc(100vh - 67px)', overflowY: 'auto', flexDirection: 'column', gap: 12, paddingTop: 4, paddingBottom: 24 }}>
      {practiceCards.length > 0 && (
        <NoteCard tint="mint" className="rounded-2xl px-4 py-4">
          <h3 className="m-0 mb-1 font-body text-[15px] font-bold text-ink-strong">Practice what you read</h3>
          <p className="mb-3 font-body text-xs leading-[1.45] text-ink-secondary">
            {practiceCards.length === 1 ? 'One rep' : `${practiceCards.length} reps`} built on this story&apos;s decisions.
          </p>
          <div className="flex flex-col">
            {practiceCards.map((card, i) => (
              <Link
                key={card.id}
                href={card.href}
                className={cn('block py-2.5 no-underline', i > 0 && 'border-t border-forest-600/20')}
              >
                <p className="m-0 mb-1.5 font-body text-[13.5px] font-bold leading-[1.35] text-ink-strong">{card.title}</p>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="rounded-full bg-white/70 px-2.5 py-0.5 font-label text-[10.5px] font-bold text-forest-800">
                    {card.disciplineLabel}
                  </span>
                  {card.difficultyLabel && (
                    <span className="font-label text-[11px] font-semibold text-ink-secondary">{card.difficultyLabel}</span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 font-label text-[12.5px] font-bold text-forest-700">
                  Start
                  <ArrowRight size={12} strokeWidth={2.2} />
                </span>
              </Link>
            ))}
          </div>
        </NoteCard>
      )}

      <div className="rounded-2xl border border-hairline bg-card-bright px-4 py-4">
        <h3 className="m-0 mb-1 font-body text-[15px] font-bold text-ink-strong">In this story</h3>
        <p className="mb-3 font-body text-xs leading-[1.45] text-ink-secondary">{stages.length}-stage AARRR walkthrough</p>
        <div className="flex flex-col gap-px">
          {['Hero', ...stages.map(s => s.stage_name)].map((name, idx) => {
            const active = idx === activeStageIdx
            return (
              <button
                key={`${name}-${idx}`}
                onClick={() => onNavigate(idx)}
                className={cn(
                  'flex items-center gap-2.5 py-[7px] text-left font-body text-[13px] font-semibold',
                  active ? 'font-bold text-forest-800' : 'text-ink-muted'
                )}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-current" />
                {name}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  product: AutopsyProductDetail
  backHref?: string
  backLabel?: string
  closingHref?: string
  practiceCards?: PracticeLinkCard[]
}

export function AutopsyReaderClient({
  product,
  backHref = '/explore/autopsies',
  backLabel = 'All autopsies',
  closingHref,
  practiceCards = [],
}: Props) {
  const stages = getStages(product)
  const hero = getHero(product)
  const closing = getClosing(product)
  const accentColor = (hero?.accent_color ?? product.cover_color) || '#4a7c59'

  const [activeStageIdx, setActiveStageIdx] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const heroRef = useRef<HTMLDivElement>(null)
  const heroBgRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroMetaRef = useRef<HTMLDivElement>(null)
  const heroTaglineRef = useRef<HTMLParagraphElement>(null)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const closingRef = useRef<HTMLDivElement>(null)
  const closingTextRef = useRef<HTMLParagraphElement>(null)
  const closingCtaRef = useRef<HTMLAnchorElement>(null)
  const scrollBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
  }, [])

  // ── Analytics: autopsy_opened ─────────────────────────────────────────────
  useEffect(() => {
    trackEvent(EVENT_AUTOPSY_OPENED, { slug: product.slug })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // "Practice what you read" cards arrive resolved from the server page
  // (resolvePracticeCards) — the rail panel omits itself when empty.

  useEffect(() => {
    if (!heroRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (heroBgRef.current) {
        tl.fromTo(heroBgRef.current, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.7 }, 0)
      }
      if (heroTitleRef.current) {
        tl.fromTo(heroTitleRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 0.2)
      }
      if (heroTaglineRef.current) {
        tl.fromTo(heroTaglineRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.4)
      }
      if (heroMetaRef.current) {
        const chips = heroMetaRef.current.querySelectorAll('[data-chip]')
        tl.fromTo(chips, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.06 }, 0.1)
      }
    }, heroRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (sectionRefs.current.length === 0) return
    const slug = product.slug
    const ctx = gsap.context(() => {
      sectionRefs.current.forEach((el, idx) => {
        if (!el) return
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => {
            setActiveStageIdx(idx)
            const bodyTrigger = ScrollTrigger.getById('autopsy-body')
            const pct = bodyTrigger ? Math.round(bodyTrigger.progress * 100) : 0
            trackEvent(EVENT_AUTOPSY_SECTION_VIEWED, { slug, section_index: idx, pct })
          },
          onEnterBack: () => setActiveStageIdx(idx),
        })
      })

      if (scrollBodyRef.current) {
        ScrollTrigger.create({
          id: 'autopsy-body',
          trigger: scrollBodyRef.current,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: self => setScrollProgress(self.progress),
          onLeave: () => {
            trackEvent(EVENT_AUTOPSY_FINISHED, { slug })
          },
        })
      }
    })
    return () => ctx.revert()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages.length])

  useEffect(() => {
    if (!closingRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: closingRef.current, start: 'top 75%', once: true },
      })
      if (closingTextRef.current) {
        tl.fromTo(closingTextRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0)
      }
      if (closingCtaRef.current) {
        tl.fromTo(closingCtaRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, 0.3)
      }
    })
    return () => ctx.revert()
  }, [])

  function jumpToStage(idx: number) {
    if (idx === -1) {
      gsap.to(window, { scrollTo: { y: heroRef.current ?? 0, offsetY: 68 }, duration: 0.85, ease: 'power3.inOut' })
      return
    }
    const el = sectionRefs.current[idx]
    if (!el) return
    gsap.to(window, { scrollTo: { y: el, offsetY: 68 }, duration: 0.85, ease: 'power3.inOut' })
  }

  // Rail index 0 = hero. Stage index N maps to rail index N+1.
  function navigateToRailIndex(railIdx: number) {
    if (railIdx === 0) {
      gsap.to(window, { scrollTo: { y: 0 }, duration: 0.85, ease: 'power3.inOut' })
      return
    }
    jumpToStage(railIdx - 1)
  }

  const productName = hero?.product_name ?? product.name
  const story = product.stories?.[0]
  const railItemIds = ['hero', ...stages.map((_, i) => `stage-${i}`)]
  const activeSectionId = `stage-${activeStageIdx}`

  const [persistReady, setPersistReady] = useState(false)
  const { resumeSection, resumeScrollPct, showResumeBanner, dismissBanner, clearResume, restored } =
    useReaderResume({
      storyKey: `${product.slug}/${story?.slug ?? 'aarrr'}`,
      sectionIds: railItemIds,
      activeId: activeSectionId,
      scrollPct: scrollProgress * 100,
      canPersist: persistReady,
    })

  const didRestoreRef = useRef(false)
  useEffect(() => {
    if (didRestoreRef.current) return
    if (!restored) return
    if (resumeScrollPct == null) {
      const t = setTimeout(() => setPersistReady(true), 0)
      return () => clearTimeout(t)
    }
    didRestoreRef.current = true
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    if (maxScroll > 0) {
      window.scrollTo({ top: Math.round((resumeScrollPct / 100) * maxScroll), behavior: 'auto' })
    }
    const t = setTimeout(() => setPersistReady(true), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeScrollPct, restored])

  const resumeLabel = (() => {
    if (resumeSection === 'hero') return 'Hero'
    const idx = stages.findIndex((_, i) => `stage-${i}` === resumeSection)
    return idx >= 0 ? stages[idx].stage_name : 'where you left off'
  })()

  const heroChips = [
    'Product Autopsy',
    `${stages.length} Stages`,
    hero?.meta?.split('·').pop()?.trim() ?? story?.read_time ?? null,
  ].filter((c): c is string => Boolean(c))

  return (
    <div className="min-h-screen bg-page-field font-body">
      {/* Back bar — desktop-only; the sticky stage rail also carries a back link. */}
      <div className="hidden items-center gap-2 border-b border-hairline bg-surface-container-low px-4 py-2 lg:flex">
        <BackCrumb href={`/explore/autopsies/${product.slug}`} label={product.name} />
      </div>

      {/* Mobile sticky progress header */}
      <div
        className="sticky z-30 flex items-center gap-3 border-b border-hairline bg-page-field px-5 pb-2 pt-2.5 lg:hidden"
        style={{ top: 48 }}
      >
        <Link
          href={`/explore/autopsies/${product.slug}`}
          aria-label={`Back to ${product.name}`}
          className="inline-flex shrink-0 items-center gap-1 font-label text-[13px] font-extrabold no-underline"
          style={{ color: accentColor }}
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          {product.name}
        </Link>
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-hairline">
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{ background: accentColor, width: `${scrollProgress * 100}%` }}
          />
        </div>
        <span className="shrink-0 font-label text-[11px] text-ink-secondary">
          {activeStageIdx + 1}/{stages.length}
        </span>
      </div>

      {/* 3-zone reader shell */}
      <div ref={scrollBodyRef} className="mx-auto flex max-w-[1400px] items-start gap-8 px-6 pb-24 pt-7">
        <StageRail
          stages={stages}
          activeStageIdx={activeStageIdx}
          scrollProgress={scrollProgress}
          accentColor={accentColor}
          productName={productName}
          backHref={backHref}
          backLabel={backLabel}
          onNavigate={navigateToRailIndex}
        />

        <main className="min-w-0 flex-1">
          {showResumeBanner && resumeLabel && (
            <ResumeBanner
              variant="aarrr"
              label={resumeLabel}
              onBackToTop={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                clearResume()
              }}
              onDismiss={dismissBanner}
            />
          )}

          {/* Hero */}
          <div ref={heroRef} className="relative mb-11 flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl">
            <div
              ref={heroBgRef}
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 60%, ${accentColor}88 100%)`,
                transformOrigin: 'left',
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
                WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 80% 50%, black 20%, transparent 80%)',
                maskImage: 'radial-gradient(ellipse 100% 100% at 80% 50%, black 20%, transparent 80%)',
              }}
            />
            <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.35) 100%)' }} />

            <div className="relative px-9 py-9">
              <div ref={heroMetaRef} className="mb-4 flex flex-wrap gap-2">
                {heroChips.map(chip => (
                  <span
                    key={chip}
                    data-chip
                    className="rounded-full bg-white/20 px-3 py-1 font-label text-[11px] font-bold text-white backdrop-blur-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <h1
                ref={heroTitleRef}
                className="m-0 mb-3 font-headline font-black leading-[1.05] tracking-[-0.02em] text-white"
                style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
              >
                {hero?.product_name ?? product.name}
              </h1>

              <p ref={heroTaglineRef} className="m-0 max-w-[560px] font-body text-[15px] leading-[1.6] text-white/85">
                {hero?.tagline}
              </p>
            </div>
          </div>

          {/* Stage sections */}
          {stages.map((stage, idx) => (
            <div key={stage.stage_name} className={idx < stages.length - 1 ? 'mb-2' : undefined}>
              <StageSection
                stage={stage}
                stageIndex={idx}
                totalStages={stages.length}
                accentColor={accentColor}
                sectionId={`stage-${idx}`}
                sectionRef={el => { sectionRefs.current[idx] = el }}
                onNextStage={idx < stages.length - 1 ? () => jumpToStage(idx + 1) : undefined}
              />
              {idx < stages.length - 1 && <div className="my-11 h-px bg-hairline" />}
            </div>
          ))}

          {/* Closing */}
          {closing && (
            <div ref={closingRef} className="relative mt-11 overflow-hidden rounded-2xl bg-[#0c0c0e] px-9 py-14">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 size-[400px] rounded-full"
                style={{ background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)` }}
              />
              <div className="mb-6 font-label text-[11px] font-extrabold uppercase tracking-[0.15em]" style={{ color: accentColor }}>
                {closing.headline}
              </div>
              <p
                ref={closingTextRef}
                className="mb-10 max-w-[720px] font-headline font-bold leading-[1.55] text-[#f0ede8]"
                style={{ fontSize: 'clamp(20px, 2.5vw, 30px)' }}
              >
                {closing.summary}
              </p>
              <Link
                ref={closingCtaRef}
                href={closingHref ?? closing.cta_path}
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] px-6 py-3 font-label text-sm font-bold no-underline"
                style={{ color: accentColor, background: `${accentColor}18`, borderColor: `${accentColor}44` }}
              >
                <ArrowLeft size={16} strokeWidth={1.8} />
                {closing.cta_text}
              </Link>
            </div>
          )}
        </main>

        <RightRail
          practiceCards={practiceCards}
          stages={stages}
          activeStageIdx={activeStageIdx}
          onNavigate={navigateToRailIndex}
        />
      </div>

    </div>
  )
}
