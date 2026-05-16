'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const DISCIPLINES = [
  { name: 'Product Sense', short: 'PS', score: 86, color: '#4a7c59' },
  { name: 'System Design', short: 'SD', score: 79, color: '#6b6358' },
  { name: 'Data Modeling', short: 'DM', score: 72, color: '#705c30' },
  { name: 'SQL', short: 'SQL', score: 81, color: '#c9933a' },
  { name: 'Coding', short: 'CODE', score: 76, color: '#2f7a4a' },
  { name: 'AI Native', short: 'AI', score: 68, color: '#8b5cf6' },
]

const TASKS = [
  { title: 'Spotify session drop', type: 'Product Sense', state: 'Live coach' },
  { title: '50M notification service', type: 'System Design', state: 'Rubric ready' },
  { title: 'Cohort retention query', type: 'SQL', state: 'Needs rewrite' },
  { title: 'Multi-tenant billing model', type: 'Data Modeling', state: 'Strong frame' },
]

export function ProductCommandCenter() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % TASKS.length)
    }, 2400)
    return () => window.clearInterval(timer)
  }, [])

  const task = TASKS[active]

  return (
    <div className="hp-product hp-product--hero" aria-label="HackProduct product preview">
      <div className="hp-product-top">
        <div className="hp-product-brand">
          <span className="hp-brand-mark">H</span>
          <span>HackProduct</span>
        </div>
        <div className="hp-command-input">Ask Hatch to build my interview plan</div>
        <div className="hp-status-dot">Live</div>
      </div>

      <div className="hp-product-shell">
        <aside className="hp-product-rail">
          {['Home', 'Practice', 'Coach', 'Review', 'Progress'].map((item, index) => (
            <div key={item} className={`hp-rail-item ${index === 1 ? 'is-active' : ''}`}>
              <span />
              {item}
            </div>
          ))}
        </aside>

        <div className="hp-product-main">
          <div className="hp-hero-grid">
            <section className="hp-coach-card">
              <div className="hp-coach-orb">
                <span />
                <span />
                <span />
                <HatchGlyph size={54} state="speaking" />
              </div>
              <div>
                <p className="hp-mini-label">Hatch is running</p>
                <h3>{task.title}</h3>
                <p>{task.type} practice, live follow-ups, and receipts on every answer.</p>
              </div>
              <div className="hp-mini-progress">
                <span style={{ width: `${64 + active * 7}%` }} />
              </div>
            </section>

            <section className="hp-task-stack">
              <div className="hp-section-title">Interview queue</div>
              {TASKS.map((item, index) => (
                <button
                  key={item.title}
                  className={`hp-task-row ${active === index ? 'is-active' : ''}`}
                  onClick={() => setActive(index)}
                >
                  <span className="hp-task-index">{index + 1}</span>
                  <span>
                    <b>{item.title}</b>
                    <small>{item.type}</small>
                  </span>
                  <em>{item.state}</em>
                </button>
              ))}
            </section>
          </div>

          <div className="hp-discipline-strip">
            {DISCIPLINES.map((discipline, index) => (
              <div key={discipline.name} className="hp-discipline-mini" style={{ animationDelay: `${index * 90}ms` }}>
                <span style={{ background: discipline.color }}>{discipline.short}</span>
                <b>{discipline.score}</b>
                <small>{discipline.name}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrchestrationMap() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % DISCIPLINES.length)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="hp-orchestration-art" aria-label="AI coach orchestration map">
      <div className="hp-orbit-center">
        <div className="hp-orbit-avatar">
          <HatchGlyph size={48} state="reviewing" />
        </div>
        <p>Hatch coach</p>
        <span>shared memory + rubric</span>
      </div>

      <div className="hp-orbit-ring" />
      {DISCIPLINES.map((discipline, index) => (
        <button
          key={discipline.name}
          className={`hp-orbit-node hp-orbit-node--${index + 1} ${active === index ? 'is-active' : ''}`}
          onClick={() => setActive(index)}
          style={{ '--node-color': discipline.color } as CSSProperties}
        >
          <span>{discipline.short}</span>
          <b>{discipline.name}</b>
        </button>
      ))}

      <div className="hp-orbit-note">
        <b>{DISCIPLINES[active].name}</b>
        <span>Next prompt, rubric, and follow-up generated from your weak move.</span>
      </div>
    </div>
  )
}

export function CurriculumStack() {
  const chapters = [
    ['Rep I', 'Pick the career moment', 'Interview loop, promotion packet, role transition, or proof of level.'],
    ['Rep II', 'Answer in the workspace', 'Work through product, systems, data, SQL, coding, or AI-native prompts.'],
    ['Rep III', 'Let Hatch follow up', 'Pressure-test assumptions, missed segments, and shallow trade-offs.'],
    ['Rep IV', 'Score FLOW and queue the drill', 'See the weak move, save the receipt, and train the next rep.'],
  ]

  return (
    <div className="hp-curriculum-art">
      {chapters.map(([label, title, body], index) => (
        <article key={label} className="hp-chapter-card" style={{ '--chapter-index': index } as CSSProperties}>
          <div>
            <span>{label}</span>
            <h3>{title}</h3>
          </div>
          <p>{body}</p>
          <Link href={index === 0 ? '/interview-prep' : index === 1 ? '/practice' : index === 2 ? '/flow' : '/login?returnTo=/progress'}>
            {index === 0 ? 'Choose goal' : index === 1 ? 'Browse reps' : index === 2 ? 'See FLOW' : 'Save progress'}
          </Link>
        </article>
      ))}
    </div>
  )
}

export function RoadmapPreview() {
  const stages = [
    { name: 'Diagnostic', done: 3, total: 3 },
    { name: 'Product Sense', done: 4, total: 6 },
    { name: 'Systems', done: 2, total: 5 },
    { name: 'Proof Ready', done: 0, total: 4 },
  ]

  return (
    <div className="hp-preview hp-roadmap-preview">
      <div className="hp-preview-head">
        <span>Career roadmap</span>
        <b>Staff-ready judgment</b>
      </div>
      <div className="hp-roadmap-lanes">
        {stages.map((stage, index) => (
          <div key={stage.name} className="hp-roadmap-stage">
            <div className="hp-roadmap-count">{stage.done}/{stage.total}</div>
            <h4>{stage.name}</h4>
            <div className="hp-roadmap-bars">
              {Array.from({ length: stage.total }).map((_, itemIndex) => (
                <span key={itemIndex} className={itemIndex < stage.done ? 'is-done' : ''} />
              ))}
            </div>
            <p>{index === 0 ? 'Baseline complete' : index === 1 ? 'Weakest move: List' : index === 2 ? 'Trade-offs queued' : 'Artifacts locked'}</p>
          </div>
        ))}
      </div>
      <div className="hp-roadmap-footer">
        <span>Next task</span>
        <b>Write the recommendation your promotion packet needs</b>
        <button>Start rep</button>
      </div>
    </div>
  )
}

export function PracticeWorkbench() {
  const fullAnswer = "I would frame this as a discovery quality problem first: session length moved while DAU stayed stable, so I need to split users by entry point, intent, and recommendation surface before naming a fix."
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (typed.length >= fullAnswer.length) {
      const reset = window.setTimeout(() => setTyped(''), 1800)
      return () => window.clearTimeout(reset)
    }
    const timer = window.setTimeout(() => {
      setTyped(fullAnswer.slice(0, typed.length + 1))
    }, 22)
    return () => window.clearTimeout(timer)
  }, [typed, fullAnswer])

  return (
    <div className="hp-preview hp-practice-preview">
      <div className="hp-practice-prompt">
        <span>Product Sense</span>
        <h4>Spotify session length dropped 15%</h4>
        <p>DAU is flat. No incidents. Premium conversion is unchanged. Where do you start?</p>
        <div className="hp-signal-row">
          <b>-15%</b>
          <b>6 weeks</b>
          <b>0 incidents</b>
        </div>
      </div>
      <div className="hp-practice-answer">
        <div className="hp-answer-label">Your live answer</div>
        <p>{typed}<span className="hp-caret" /></p>
        <div className="hp-coach-nudge">
          <HatchGlyph size={24} state="reviewing" />
          <span>Good frame. Now list three hypotheses in priority order.</span>
        </div>
      </div>
    </div>
  )
}

export function FeedbackConsole() {
  const tabs = [
    { id: 'frame', label: 'Frame', score: 86, color: '#2563eb' },
    { id: 'list', label: 'List', score: 62, color: '#16a34a' },
    { id: 'optimize', label: 'Optimize', score: 74, color: '#d97706' },
    { id: 'win', label: 'Win', score: 69, color: '#7c3aed' },
  ]
  const [active, setActive] = useState(tabs[0].id)
  const tab = tabs.find((item) => item.id === active) ?? tabs[0]

  return (
    <div className="hp-preview hp-feedback-preview">
      <div className="hp-feedback-ring" style={{ '--score-color': tab.color } as CSSProperties}>
        <svg viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r="50" />
          <circle cx="60" cy="60" r="50" style={{ strokeDasharray: `${tab.score * 3.14} 314` }} />
        </svg>
        <div>
          <b>{tab.score}</b>
          <span>{tab.label}</span>
        </div>
      </div>
      <div className="hp-feedback-main">
        <div className="hp-feedback-tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={item.id === active ? 'is-active' : ''}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="hp-receipt-list">
          <div className="is-good">
            <span />
            <b>Defined the metric before jumping to ideas.</b>
            <small>Line 2 earned the point.</small>
          </div>
          <div>
            <span />
            <b>Missed a seasonality check.</b>
            <small>World Cup week needs a counterfactual.</small>
          </div>
          <div className="is-good">
            <span />
            <b>Clear recommendation.</b>
            <small>Specific owner, date, and kill criteria.</small>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AnalyticsBoard() {
  const bars = [72, 88, 56, 81, 68, 92, 77, 63]

  return (
    <div className="hp-preview hp-analytics-preview">
      <div className="hp-analytics-score">
        <span>ProductIQ</span>
        <b>784</b>
        <small>+92 this month</small>
      </div>
      <div className="hp-analytics-chart">
        {bars.map((height, index) => (
          <span key={index} style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }} />
        ))}
      </div>
      <div className="hp-analytics-table">
        {DISCIPLINES.slice(0, 4).map((discipline) => (
          <div key={discipline.name}>
            <span style={{ background: discipline.color }} />
            <b>{discipline.name}</b>
            <em>{discipline.score}</em>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ToolsSystemPreview() {
  const tools = ['Goal', 'Rep', 'Hatch', 'FLOW score', 'Weak move', 'Receipt', 'Next drill', 'Proof']

  return (
    <div className="hp-tools-art">
      <div className="hp-tool-rail">
        {tools.map((tool, index) => (
          <button key={tool} style={{ animationDelay: `${index * 70}ms` }}>{tool}</button>
        ))}
      </div>
      <div className="hp-tool-window hp-tool-window--primary">
        <div className="hp-tool-window-head">
          <span />
          <span />
          <span />
          <b>Hatch task</b>
        </div>
        <h3>Create a five-day sprint for promotion-ready product judgment</h3>
        <div className="hp-tool-steps">
          <span className="is-done">Pull recent FLOW receipts</span>
          <span className="is-done">Select weakest career signal</span>
          <span>Generate systems and product reps</span>
          <span>Save promotion-ready artifacts</span>
        </div>
      </div>
      <div className="hp-tool-window hp-tool-window--secondary">
        <b>Approval needed</b>
        <p>Replace tomorrow&apos;s SQL drill with staff-level trade-off practice?</p>
        <div>
          <button>Approve</button>
          <button>Adjust</button>
        </div>
      </div>
    </div>
  )
}

const ROLE_GRID = [
  'STAFFREADY',
  'SQLAIDATAQ',
  'PRODUCTPM',
  'PROMOTIONX',
  'SYSTEMFLOW',
  'SALARYPROOF',
  'MARKETDEEP',
  'FOUNDEROPS',
]

const WORD_CELLS = new Set([
  '0-0', '0-1', '0-2', '0-3', '0-4', '0-5', '0-6',
  '1-0', '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
  '2-0', '2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7',
  '3-0', '3-1', '3-2', '3-3', '3-4', '3-5',
  '4-0', '4-1', '4-2', '4-3', '4-4', '4-5',
  '5-0', '5-1', '5-2', '5-3', '5-4', '5-5',
  '6-0', '6-1', '6-2', '6-3', '6-4', '6-5',
  '7-0', '7-1', '7-2', '7-3', '7-4', '7-5', '7-6',
])

export function RoleWordSearch() {
  const cells = useMemo(() => ROLE_GRID.flatMap((row, rowIndex) => (
    row.split('').map((letter, colIndex) => ({
      id: `${rowIndex}-${colIndex}`,
      letter,
    }))
  )), [])

  return (
    <div className="hp-wordsearch-art">
      <div className="hp-word-grid" aria-label="Role and industry word search">
        {cells.map((cell, index) => (
          <span
            key={cell.id}
            className={WORD_CELLS.has(cell.id) ? 'is-highlighted' : ''}
            style={{ animationDelay: `${index * 18}ms` }}
          >
            {cell.letter}
          </span>
        ))}
      </div>
      <div className="hp-word-tags">
        {['Staff-ready', 'SQL + Data', 'Product', 'Promotion', 'Systems', 'Salary proof', 'Marketplace', 'Founder'].map((word) => (
          <b key={word}>{word}</b>
        ))}
      </div>
    </div>
  )
}

export const LivePreview_Practice = PracticeWorkbench
export const LivePreview_LiveInterview = PracticeWorkbench
export const LivePreview_StudyPlans = RoadmapPreview
export const LivePreview_HatchCoach = ToolsSystemPreview
export const LivePreview_Grading = FeedbackConsole
