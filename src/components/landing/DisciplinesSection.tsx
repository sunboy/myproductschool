'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const ACCENT = '#2d6a44'

const TRACKS = [
  {
    name: 'Product Sense',
    tag: 'PM · Eng · IC',
    desc: 'Frame ambiguous problems, identify users, define metrics, and prioritize ruthlessly.',
    sample: {
      prompt: "Spotify's daily active listeners dropped 12% over the last 3 weeks. You're the PM. Walk through how you'd diagnose and respond.",
      hatch: 'Good. Now frame the user segment before you list hypotheses.',
    },
    flow: [
      { l: 'F', step: 'Frame the problem space', sub: "Who's affected? What changed?" },
      { l: 'L', step: 'List hypotheses & signals', sub: 'What data would you pull first?' },
      { l: 'O', step: 'Optimize your response', sub: 'Pick the highest-leverage action' },
      { l: 'W', step: 'Win with a clear recommendation', sub: 'Crisp, time-bound, owned' },
    ],
  },
  {
    name: 'System Design',
    tag: 'Eng · Staff · Arch',
    desc: 'Design systems at scale, from requirements to trade-offs, the way senior engineers think.',
    sample: {
      prompt: 'Design a real-time notification system for 50M users. Start with requirements.',
      hatch: "You mentioned 'fan-out': what's your delivery guarantee and why does that choice constrain your DB?",
    },
    flow: [
      { l: 'F', step: 'Frame requirements & constraints', sub: 'Scale, latency, consistency' },
      { l: 'L', step: 'List components & interfaces', sub: 'Data flows, APIs, storage' },
      { l: 'O', step: 'Optimize for your bottleneck', sub: 'Latency vs. cost vs. reliability' },
      { l: 'W', step: 'Win with explicit trade-offs', sub: 'Defend every key decision' },
    ],
  },
  {
    name: 'Data Modeling',
    tag: 'Eng · Analyst · PM',
    desc: 'Schema design, event taxonomies, and access patterns that hold up under real query loads.',
    sample: {
      prompt: 'Model the data layer for a multi-tenant SaaS with per-tenant billing, usage metering, and audit logs.',
      hatch: 'How does your schema handle tenant isolation: row-level, schema-level, or separate DBs? Show the trade-off.',
    },
    flow: [
      { l: 'F', step: 'Frame the data domain', sub: 'What decisions does this data serve?' },
      { l: 'L', step: 'List entities & relationships', sub: 'Cardinalities, access patterns' },
      { l: 'O', step: 'Optimize for reads & writes', sub: 'Normalization vs. denormalization' },
      { l: 'W', step: 'Win with a justified model', sub: 'Complete, scalable, explainable' },
    ],
  },
  {
    name: 'Coding',
    tag: 'Eng · IC · Senior',
    desc: 'Algorithm thinking and AI-assisted development for the hybrid skills that matter now.',
    sample: {
      prompt: "Given a stream of events with timestamps, return the top-K most frequent events in the last N minutes. What's your approach?",
      hatch: "Your sliding window idea is right. Now: what's the complexity, and how does it change if N is 24 hours?",
    },
    flow: [
      { l: 'F', step: 'Frame the problem & edge cases', sub: 'Inputs, constraints, gotchas' },
      { l: 'L', step: 'List approaches', sub: 'Brute force → optimal path' },
      { l: 'O', step: 'Optimize with AI refinement', sub: 'Use AI to pressure-test' },
      { l: 'W', step: 'Win with clean, explained code', sub: 'Show your reasoning, not just output' },
    ],
  },
  {
    name: 'Product Mgmt',
    tag: 'PM · Lead · Director',
    desc: 'Roadmapping, stakeholder alignment, and go-to-market judgment at every level.',
    sample: {
      prompt: 'Your eng team says the platform needs 6 months of infra work before the next feature. Your VP wants the feature in Q1. How do you handle this?',
      hatch: "Before you pick a side: what does success look like for both stakeholders? Frame that first.",
    },
    flow: [
      { l: 'F', step: 'Frame the business context', sub: 'Stakeholders, constraints, stakes' },
      { l: 'L', step: 'List options & dependencies', sub: 'Risks, sequencing, resourcing' },
      { l: 'O', step: 'Optimize for impact & trust', sub: 'Short-term and long-term' },
      { l: 'W', step: 'Win the room', sub: 'Narrative, not just data' },
    ],
  },
]

export function DisciplinesSection() {
  const [active, setActive] = useState(0)
  const tr = TRACKS[active]

  return (
    <section id="disciplines" className="land-section land-section--alt">
      <div className="land-section-inner">
        <div className="land-section-eyebrow">Challenge tracks</div>
        <h2 className="land-section-h">One framework. <em>Five disciplines.</em></h2>
        <p className="land-section-sub">FLOW (Frame, List, Optimize, Win) is the structured thinking pattern behind every challenge. Tailored to each domain, coached by Hatch.</p>

        <div className="land-disc-tabs">
          {TRACKS.map((t, i) => (
            <button
              key={i}
              className={`land-disc-tab ${active === i ? 'land-disc-tab--active' : ''}`}
              onClick={() => setActive(i)}
            >
              {t.name}
              {t.name === 'Product Mgmt' && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle' }}>Soon</span>
              )}
            </button>
          ))}
        </div>

        <div className="land-disc-body">
          <div className="land-disc-left">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, opacity: 0.35, marginBottom: 8 }}>{tr.tag}</div>
              <p style={{ fontSize: 16, lineHeight: 1.65, opacity: 0.72, margin: 0 }}>{tr.desc}</p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: ACCENT, marginBottom: 20 }}>The FLOW framework</div>
              <div className="land-flow-list">
                {tr.flow.map((f, i) => (
                  <div key={i} className="land-flow-row">
                    <div className="land-flow-badge">{f.l}</div>
                    <div className="land-flow-info">
                      <span className="land-flow-step">{f.step}</span>
                      <span className="land-flow-sub">{f.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="land-disc-right">
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, opacity: 0.4 }}>Sample challenge</div>
            <div className="land-prompt-card">&ldquo;{tr.sample.prompt}&rdquo;</div>
            <div className="land-hatch-row">
              <div className="land-hatch-avatar">
                <HatchGlyph size={36} state="reviewing" />
              </div>
              <div className="land-hatch-bubble">
                <strong style={{ fontWeight: 700, fontSize: 12, display: 'block', marginBottom: 4, opacity: 0.6 }}>Hatch says</strong>
                {tr.sample.hatch}
              </div>
            </div>
            <Link href="/login" style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: ACCENT, color: '#fff', borderRadius: 100, fontSize: 13.5, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
              Try this challenge →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
