'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import type { AutopsyProductDetail, AarrrStageContent } from '@/lib/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitWords(text: string): string[] {
  return text.split(' ')
}

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

// ─── Role color map ───────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  PM:     { bg: '#ede9fe', text: '#5b21b6' },
  ENG:    { bg: '#dbeafe', text: '#1e40af' },
  DATA:   { bg: '#d1fae5', text: '#065f46' },
  DESIGN: { bg: '#fce7f3', text: '#9d174d' },
  OPS:    { bg: '#ffedd5', text: '#c2410c' },
}

// ─── Rail Item ────────────────────────────────────────────────────────────────

interface RailItemProps {
  stage: AarrrStageContent
  idx: number
  activeIdx: number
  accentColor: string
  onClick: () => void
  dotRef: (el: HTMLDivElement | null) => void
  totalStages: number
}

function RailItem({ stage, idx, activeIdx, accentColor, onClick, dotRef, totalStages }: RailItemProps) {
  const isDone = idx < activeIdx
  const isActive = idx === activeIdx

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '6px 16px 6px 20px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 200ms',
      }}
      onClick={onClick}
    >
      {idx < totalStages - 1 && (
        <div
          style={{
            position: 'absolute',
            left: 28,
            top: 22,
            width: 2,
            height: 28,
            background: isDone ? accentColor : '#e0d8c8',
            transition: 'background 400ms',
            borderRadius: 1,
          }}
        />
      )}

      <div
        ref={dotRef}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          flexShrink: 0,
          marginTop: 2,
          zIndex: 1,
          background: isDone ? '#4a7c59' : isActive ? accentColor : '#e0d8c8',
          border: isActive ? `3px solid ${accentColor}33` : '2px solid transparent',
          boxShadow: isActive ? `0 0 0 3px ${accentColor}22` : 'none',
          transition: 'background 300ms, box-shadow 300ms, border 300ms',
        }}
      />

      <div style={{ paddingBottom: 14 }}>
        <div
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: 11,
            fontWeight: isActive ? 800 : 600,
            color: isActive ? accentColor : isDone ? '#4a7c59' : '#78715f',
            transition: 'color 300ms, font-weight 300ms',
            lineHeight: 1.2,
          }}
        >
          {stage.stage_name}
        </div>
        {isActive && (
          <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, color: '#9c9589', marginTop: 2 }}>
            Stage {stage.stage_number}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Go Deeper collapsible ────────────────────────────────────────────────────

function GoDeeper({ stage, accentColor }: { stage: AarrrStageContent; accentColor: string }) {
  const [open, setOpen] = useState(false)
  const gd = stage.go_deeper
  if (!gd) return null

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-label)',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#9c9589',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #e7dfc9',
  }

  return (
    <div
      style={{
        border: '1px solid #e7dfc9',
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 36,
        background: '#f8f5ef',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 22px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: accentColor }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700, color: '#2e3230', letterSpacing: '0.04em' }}>
          Go Deeper
        </span>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: '#9c9589', marginLeft: 'auto' }}>
          Metrics · System Design · Do&apos;s &amp; Don&apos;ts
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Metric definitions */}
          {gd.metric_definitions && gd.metric_definitions.length > 0 && (
            <div>
              <div style={sectionLabelStyle}>Key Metric Definitions</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#2e3230' }}>
                      {['Metric', 'Definition', 'How to Calculate', 'Healthy Range'].map(col => (
                        <th key={col} style={{ padding: '8px 12px', color: '#fff', fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, textAlign: 'left', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gd.metric_definitions.map((m, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8f5ef', borderBottom: '1px solid #e7dfc9' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: '#2e3230', fontFamily: 'var(--font-label)', fontSize: 12, whiteSpace: 'nowrap' }}>{m.metric}</td>
                        <td style={{ padding: '9px 12px', color: '#4a4e4a', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{m.definition}</td>
                        <td style={{ padding: '9px 12px', color: '#4a4e4a', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{m.how_to_calculate}</td>
                        <td style={{ padding: '9px 12px', color: '#4a4e4a', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{m.healthy_range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System design */}
          {gd.system_design && (
            <div>
              <div style={sectionLabelStyle}>System Design</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gd.system_design.components.map((c, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e7dfc9' }}>
                    <div style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700, color: '#2e3230', marginBottom: 6 }}>{c.component}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#4a4e4a', lineHeight: 1.55, marginBottom: 6 }}>{c.what_it_does}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#78715f', lineHeight: 1.5, fontStyle: 'italic' }}>{c.key_technologies}</div>
                  </div>
                ))}
              </div>
              {gd.system_design.links.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {gd.system_design.links.map((lk, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e7dfc9', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontFamily: 'var(--font-label)', color: '#2e3230' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#e4e0d8', borderRadius: 4, padding: '1px 6px', color: '#4a4e4a' }}>{lk.tag}</span>
                      {lk.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Failures */}
          {gd.failures && gd.failures.length > 0 && (
            <div>
              <div style={{ ...sectionLabelStyle, color: '#b83230', borderBottomColor: '#ffd5d6' }}>What Didn&apos;t Work</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {gd.failures.map((f, i) => (
                  <div key={i} style={{ background: '#fff5f5', borderRadius: 12, padding: '16px 18px', borderLeft: '4px solid #b83230' }}>
                    <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, color: '#b83230', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{f.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#2e3230', marginBottom: 8, lineHeight: 1.55 }}>{f.what}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: '#6b6358', lineHeight: 1.5, borderTop: '1px solid #ffd5d6', paddingTop: 8 }}>
                      <strong style={{ color: '#b83230' }}>Lesson: </strong>{f.lesson}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Do / Don't */}
          {gd.do_dont && (
            <div>
              <div style={sectionLabelStyle}>Do&apos;s &amp; Don&apos;ts</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', borderTop: '4px solid #27ae60' }}>
                  <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, color: '#27ae60', marginBottom: 12, letterSpacing: '0.08em' }}>DO</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {gd.do_dont.dos.map((item, i) => (
                      <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#4a4e4a', lineHeight: 1.55, paddingBottom: 8, borderBottom: i < gd.do_dont!.dos.length - 1 ? '1px solid #f0ece4' : 'none' }}>
                        <span style={{ color: '#27ae60', fontWeight: 700, marginRight: 6 }}>✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', borderTop: '4px solid #e74c3c' }}>
                  <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, color: '#e74c3c', marginBottom: 12, letterSpacing: '0.08em' }}>DON&apos;T</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {gd.do_dont.donts.map((item, i) => (
                      <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#4a4e4a', lineHeight: 1.55, paddingBottom: 8, borderBottom: i < gd.do_dont!.donts.length - 1 ? '1px solid #f0ece4' : 'none' }}>
                        <span style={{ color: '#e74c3c', fontWeight: 700, marginRight: 6 }}>✗</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Competitor table */}
          {gd.competitor_table && (
            <div>
              <div style={{ ...sectionLabelStyle, color: '#1a4a8a', borderBottomColor: '#d8e4f5' }}>vs. The Competition</div>
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #d8e4f5' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#1a4a8a' }}>
                      {gd.competitor_table.columns.map((col, i) => (
                        <th key={i} style={{ padding: '10px 14px', color: '#fff', fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gd.competitor_table.rows.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f5f8ff', borderBottom: '1px solid #e8eef8' }}>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#1a4a8a', fontFamily: 'var(--font-label)', fontSize: 12 }}>{row.dimension}</td>
                        {row.values.map((v, vi) => (
                          <td key={vi} style={{ padding: '9px 14px', fontFamily: 'var(--font-body)', color: v.outcome === 'win' ? '#1a7a3a' : v.outcome === 'loss' ? '#b0192a' : '#8a6a00', fontWeight: v.outcome === 'tie' ? 400 : 600 }}>
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

// ─── Practice Prompts ─────────────────────────────────────────────────────────

function PracticePrompts({ stage }: { stage: AarrrStageContent }) {
  const pp = stage.practice_prompts
  if (!pp) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 36 }}>
      {[
        { label: '🏢 On the Job', card: pp.on_the_job, bg: '#1e3a2f' },
        { label: '🎯 Interview Prep', card: pp.interview_prep, bg: '#2e3230' },
      ].map(({ label, card, bg }) => (
        <div key={label} style={{ background: bg, borderRadius: 16, padding: '26px 28px' }}>
          <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.5, marginBottom: 12 }}>{card.question}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 0 }}>{card.guidance}</div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', lineHeight: 1.5 }}>{card.hint}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Stage Section ────────────────────────────────────────────────────────────

interface StageSectionProps {
  stage: AarrrStageContent
  accentColor: string
  isEven: boolean
  sectionRef: (el: HTMLDivElement | null) => void
}

function StageSection({ stage, accentColor, isEven, sectionRef }: StageSectionProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const questionRef = useRef<HTMLParagraphElement>(null)
  const narrativeRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const warRoomRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const metricValueRefs = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const sectionEl = headerRef.current?.closest('[data-stage-section]') as HTMLElement
      if (!sectionEl) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top 72%',
          once: true,
        },
      })

      if (dividerRef.current) {
        tl.fromTo(dividerRef.current, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 0)
      }
      if (labelRef.current) {
        tl.fromTo(labelRef.current, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.1)
      }
      if (questionRef.current) {
        tl.fromTo(questionRef.current, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.22)
      }
      if (narrativeRef.current) {
        tl.fromTo(narrativeRef.current, { y: 12, opacity: 0, filter: 'blur(6px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' }, 0.4)
      }
      if (metricsRef.current) {
        const cards = metricsRef.current.querySelectorAll('[data-metric-card]')
        tl.fromTo(cards, { y: 28, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.09, ease: 'back.out(1.4)' }, 0.5)
        tl.call(() => {
          metricValueRefs.current.forEach(el => { if (el) animateMetric(el, el.dataset.raw ?? '') })
        }, [], 0.55)
      }
      if (warRoomRef.current) {
        const rows = warRoomRef.current.querySelectorAll('[data-war-row]')
        tl.fromTo(rows, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' }, 0.65)
      }
    })
    return () => ctx.revert()
  }, [])

  return (
    <div data-stage-section ref={sectionRef} style={{ background: isEven ? '#ffffff' : '#faf6f0' }}>
      {/* Top divider */}
      <div
        ref={dividerRef}
        style={{ height: 2, background: `linear-gradient(to right, ${accentColor}, ${accentColor}22, transparent)`, transformOrigin: 'left' }}
      />

      <div style={{ padding: '48px 56px 56px' }}>
        {/* Stage header */}
        <div ref={headerRef} style={{ marginBottom: 32 }}>
          <span
            ref={labelRef}
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accentColor,
              marginBottom: 12,
            }}
          >
            Stage {stage.stage_number} · {stage.stage_name}
          </span>

          <p
            ref={questionRef}
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#1a1612',
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            {stage.question}
          </p>
        </div>

        {/* Narrative paragraphs */}
        <div
          ref={narrativeRef}
          style={{ marginBottom: 40, maxWidth: 700 }}
        >
          {(stage.narrative_paragraphs ?? []).map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                color: '#4a4e4a',
                lineHeight: 1.8,
                margin: '0 0 18px',
              }}
              dangerouslySetInnerHTML={{ __html: para }}
            />
          ))}
        </div>

        {/* Callout */}
        {stage.callout && (
          <div
            style={{
              background: '#fff9e6',
              borderLeft: `4px solid ${accentColor}`,
              borderRadius: '0 10px 10px 0',
              padding: '18px 22px',
              marginBottom: 36,
              maxWidth: 700,
            }}
          >
            {stage.callout.label && (
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                {stage.callout.label}
              </div>
            )}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#3a3520', lineHeight: 1.65, margin: 0 }}>
              {stage.callout.text}
            </p>
          </div>
        )}

        {/* Data tables */}
        {stage.data_tables && stage.data_tables.map((tbl, ti) => (
          <div key={ti} style={{ marginBottom: 36, maxWidth: 700 }}>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9c9589', marginBottom: 10 }}>
              {tbl.label}
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e7dfc9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#2e3230' }}>
                    {tbl.columns.map((col, ci) => (
                      <th key={ci} style={{ padding: '9px 14px', color: '#fff', fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, textAlign: 'left', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tbl.rows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#faf6f0', borderBottom: '1px solid #f0ece4' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '9px 14px', fontFamily: 'var(--font-body)', color: ci === 0 ? '#2e3230' : '#4a4e4a', lineHeight: 1.5, fontWeight: ci === 0 ? 600 : 400 }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Metrics */}
        {stage.metrics && stage.metrics.length > 0 && (
          <div
            ref={metricsRef}
            style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}
          >
            {stage.metrics.map((m, i) => (
              <div
                key={i}
                data-metric-card
                style={{
                  background: '#fff',
                  border: '1.5px solid #e7dfc9',
                  borderRadius: 16,
                  padding: '20px 24px',
                  minWidth: 140,
                  flex: '1 1 140px',
                  borderTop: `3px solid ${accentColor}`,
                }}
              >
                <span
                  ref={el => { metricValueRefs.current[i] = el! }}
                  data-raw={m.value}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-headline)',
                    fontSize: 28,
                    fontWeight: 800,
                    color: accentColor,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {m.value}
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-label)', fontSize: 11, color: '#78715f', marginTop: 6, lineHeight: 1.4 }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* War Room */}
        {stage.war_room && stage.war_room.length > 0 && (
          <div ref={warRoomRef} style={{ marginBottom: 36, maxWidth: 700 }}>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4c8bc', marginBottom: 14 }}>
              War Room
            </div>
            <div style={{ background: '#f5f1ea', borderRadius: 12, overflow: 'hidden', border: '1px solid #e7dfc9' }}>
              {stage.war_room.map((row, i) => {
                const roleStyle = ROLE_COLORS[row.role] ?? { bg: '#e4e0d8', text: '#4a4e4a' }
                return (
                  <div
                    key={i}
                    data-war-row
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '12px 18px',
                      borderBottom: i < stage.war_room!.length - 1 ? '1px solid #e7dfc9' : 'none',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: 9,
                        fontWeight: 800,
                        background: roleStyle.bg,
                        color: roleStyle.text,
                        padding: '3px 7px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginTop: 2,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {row.role}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#3a3d38', lineHeight: 1.55 }}>
                      {row.insight}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Go Deeper (collapsible) */}
        <GoDeeper stage={stage} accentColor={accentColor} />

        {/* Practice Prompts */}
        <PracticePrompts stage={stage} />

        {/* Transition text */}
        {stage.transition && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontStyle: 'italic',
              color: '#9c9589',
              textAlign: 'center',
              margin: '48px 0 -8px',
              lineHeight: 1.6,
            }}
          >
            {stage.transition.text}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  product: AutopsyProductDetail
}

export function AutopsyReaderClient({ product }: Props) {
  const stages = getStages(product)
  const hero = getHero(product)
  const closing = getClosing(product)
  const accentColor = (hero?.accent_color ?? product.cover_color) || '#FF5A5F'

  const [activeStageIdx, setActiveStageIdx] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const heroRef = useRef<HTMLDivElement>(null)
  const heroBgRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroMetaRef = useRef<HTMLDivElement>(null)
  const heroTaglineRef = useRef<HTMLParagraphElement>(null)
  const railRef = useRef<HTMLElement>(null)
  const railDotRefs = useRef<(HTMLDivElement | null)[]>([])
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const closingRef = useRef<HTMLDivElement>(null)
  const closingTextRef = useRef<HTMLParagraphElement>(null)
  const closingCtaRef = useRef<HTMLAnchorElement>(null)
  const scrollBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
  }, [])

  useEffect(() => {
    if (!heroRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (heroBgRef.current) {
        tl.fromTo(heroBgRef.current, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.7 }, 0)
      }
      if (heroTitleRef.current) {
        const words = heroTitleRef.current.querySelectorAll('[data-word]')
        tl.fromTo(words, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.04 }, 0.35)
      }
      if (heroTaglineRef.current) {
        tl.fromTo(heroTaglineRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.6)
      }
      if (heroMetaRef.current) {
        const chips = heroMetaRef.current.querySelectorAll('[data-chip]')
        tl.fromTo(chips, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.07 }, 0.75)
      }
      if (railRef.current) {
        tl.fromTo(railRef.current, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, 0.8)
      }
    }, heroRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (sectionRefs.current.length === 0) return
    const ctx = gsap.context(() => {
      sectionRefs.current.forEach((el, idx) => {
        if (!el) return
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveStageIdx(idx),
          onEnterBack: () => setActiveStageIdx(idx),
        })
      })

      if (scrollBodyRef.current) {
        ScrollTrigger.create({
          trigger: scrollBodyRef.current,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: self => setScrollProgress(self.progress),
        })
      }
    })
    return () => ctx.revert()
  }, [stages.length])

  useEffect(() => {
    if (!closingRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: closingRef.current, start: 'top 75%', once: true },
      })
      if (closingTextRef.current) {
        const words = closingTextRef.current.querySelectorAll('[data-word]')
        tl.fromTo(words, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.018, ease: 'power2.out' }, 0)
      }
      if (closingCtaRef.current) {
        tl.fromTo(closingCtaRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, 0.8)
      }
    })
    return () => ctx.revert()
  }, [])

  function jumpToStage(idx: number) {
    const el = sectionRefs.current[idx]
    if (!el) return
    gsap.to(window, { scrollTo: { y: el, offsetY: 68 }, duration: 0.85, ease: 'power3.inOut' })
  }

  const heroWords = splitWords(hero?.product_name ?? product.name)
  const closingWords = closing ? splitWords(closing.summary) : []

  return (
    <div style={{ minHeight: '100vh', background: '#faf6f0', fontFamily: 'var(--font-body)' }}>
      {/* Mobile sticky progress header */}
      <div
        style={{
          position: 'sticky',
          top: 48,
          zIndex: 30,
          background: '#faf6f0',
          borderBottom: '1px solid #e7dfc9',
          padding: '10px 20px 8px',
          alignItems: 'center',
          gap: 12,
        }}
        className="flex lg:hidden"
      >
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 800, color: accentColor }}>
          {product.name}
        </span>
        <div style={{ flex: 1, height: 3, background: '#e7dfc9', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: accentColor, width: `${scrollProgress * 100}%`, borderRadius: 99, transition: 'width 100ms linear' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: '#78715f', flexShrink: 0 }}>
          {activeStageIdx + 1}/{stages.length}
        </span>
      </div>

      {/* Layout wrapper */}
      <div ref={scrollBodyRef} style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Left sticky rail (desktop only) */}
        <aside
          ref={railRef}
          className="hidden lg:flex"
          style={{
            width: 168,
            flexShrink: 0,
            position: 'sticky',
            top: 48,
            height: 'calc(100vh - 48px)',
            overflowY: 'auto',
            background: '#f0ece4',
            borderRight: '1px solid #e0d8c8',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #e0d8c8' }}>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 800, color: accentColor, letterSpacing: '-0.01em' }}>
              {product.name}
            </div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, color: '#9c9589', marginTop: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Product Autopsy
            </div>
            <div style={{ marginTop: 12, height: 3, background: '#e0d8c8', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: accentColor, width: `${scrollProgress * 100}%`, borderRadius: 99, transition: 'width 80ms linear' }} />
            </div>
          </div>

          <div style={{ padding: '12px 0', flex: 1 }}>
            {stages.map((stage, idx) => (
              <RailItem
                key={stage.stage_name}
                stage={stage}
                idx={idx}
                activeIdx={activeStageIdx}
                accentColor={accentColor}
                onClick={() => jumpToStage(idx)}
                dotRef={el => { railDotRefs.current[idx] = el }}
                totalStages={stages.length}
              />
            ))}
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid #e0d8c8' }}>
            <Link
              href="/explore/showcase"
              style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: '#78715f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
              All autopsies
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Hero */}
          <div
            ref={heroRef}
            style={{ position: 'relative', overflow: 'hidden', minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            <div
              ref={heroBgRef}
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 60%, ${accentColor}88 100%)`,
                transformOrigin: 'left',
              }}
            />
            <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '22px 22px', WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 80% 50%, black 20%, transparent 80%)', maskImage: 'radial-gradient(ellipse 100% 100% at 80% 50%, black 20%, transparent 80%)' }} />
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.35) 100%)' }} />

            <div style={{ position: 'relative', padding: '60px 56px 52px' }}>
              <div ref={heroMetaRef} style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Product Autopsy', `${stages.length} Stages`, hero?.meta?.split('·').pop()?.trim() ?? '~20 min read'].map(chip => (
                  <span key={chip} data-chip style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: 99, backdropFilter: 'blur(6px)' }}>
                    {chip}
                  </span>
                ))}
              </div>

              <h1
                ref={heroTitleRef}
                style={{ fontFamily: 'var(--font-headline)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 20px' }}
              >
                {heroWords.map((word, i) => (
                  <span key={i} data-word style={{ display: 'inline-block', marginRight: '0.25em' }}>{word}</span>
                ))}
              </h1>

              <p ref={heroTaglineRef} style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
                {hero?.tagline}
              </p>
            </div>
          </div>

          {/* Stage Sections */}
          {stages.map((stage, idx) => (
            <StageSection
              key={stage.stage_name}
              stage={stage}
              accentColor={accentColor}
              isEven={idx % 2 === 0}
              sectionRef={el => { sectionRefs.current[idx] = el }}
            />
          ))}

          {/* Closing Section */}
          {closing && (
            <div
              ref={closingRef}
              style={{ background: '#0c0c0e', padding: '80px 56px 80px', position: 'relative', overflow: 'hidden' }}
            >
              <div aria-hidden style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`, right: -80, top: -80, pointerEvents: 'none' }} />

              <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: accentColor, marginBottom: 24 }}>
                {closing.headline}
              </div>

              <p
                ref={closingTextRef}
                style={{ fontFamily: 'var(--font-headline)', fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 700, color: '#f0ede8', lineHeight: 1.55, maxWidth: 720, marginBottom: 48 }}
              >
                {closingWords.map((word, i) => (
                  <span key={i} data-word style={{ display: 'inline-block', marginRight: '0.28em' }}>{word}</span>
                ))}
              </p>

              <Link
                ref={closingCtaRef}
                href={closing.cta_path}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-label)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: accentColor,
                  background: `${accentColor}18`,
                  border: `1.5px solid ${accentColor}44`,
                  padding: '12px 24px',
                  borderRadius: 99,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                {closing.cta_text}
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
