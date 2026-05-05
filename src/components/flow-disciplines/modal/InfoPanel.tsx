'use client'

import type { Discipline, FlowStepId } from '@/lib/data/flow-framework/types'

interface InfoPanelProps {
  discipline: Discipline
  selectedId: string | null
  selectedType: 'tradition' | 'competency' | 'step' | null
}

const FLOW_STEPS: FlowStepId[] = ['F', 'L', 'O', 'W']

function formatLabel(label: string) {
  return label.replace(/_/g, ' ')
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-label text-[13px] uppercase tracking-wider mb-2"
      style={{ color: 'rgba(212,164,116,0.68)' }}
    >
      {children}
    </p>
  )
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="font-label text-[13px] px-2.5 py-1 rounded-full leading-snug"
          style={{ background: 'rgba(212,164,116,0.12)', color: '#d4a574', border: '1px solid rgba(212,164,116,0.25)' }}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function PlainList({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="font-body text-[15px] leading-relaxed flex gap-2" style={{ color: 'rgba(245,240,230,0.62)' }}>
          <span aria-hidden="true" style={{ color: 'rgba(212,164,116,0.7)' }}>-</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ReasoningMove({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-4 mt-auto"
      style={{ background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.25)' }}
    >
      <p className="font-label text-[13px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(142,207,158,0.72)' }}>
        Reasoning move
      </p>
      <p className="font-body text-[16px] leading-relaxed" style={{ color: '#8ecf9e' }}>
        {children}
      </p>
    </div>
  )
}

function PanelHeader({
  eyebrow,
  title,
  accent = '#d4a574',
}: {
  eyebrow: string
  title: string
  accent?: string
}) {
  return (
    <div className="pl-4 py-1" style={{ borderLeft: `3px solid ${accent}` }}>
      <p
        className="font-label text-[13px] uppercase tracking-widest mb-1"
        style={{ color: 'rgba(212,164,116,0.68)' }}
      >
        {eyebrow}
      </p>
      <h3
        className="font-headline text-[20px] font-bold leading-snug capitalize"
        style={{ color: '#ffc580' }}
      >
        {title}
      </h3>
    </div>
  )
}

export function InfoPanel({ discipline, selectedId, selectedType }: InfoPanelProps) {
  if (!selectedId || !selectedType) {
    return (
      <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
        <PanelHeader
          eyebrow="Map overview"
          title={`How ${discipline.name} uses FLOW`}
        />

        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,164,116,0.08)', border: '1px solid rgba(212,164,116,0.18)' }}
        >
          <SectionLabel>What this trains</SectionLabel>
          <p className="font-body text-[16px] leading-relaxed" style={{ color: '#e8c99a' }}>
            {discipline.learnerExplanation.plainPurpose}
          </p>
        </div>

        <div>
          <SectionLabel>Example prompt</SectionLabel>
          <p className="font-body text-[16px] leading-relaxed italic" style={{ color: 'rgba(245,240,230,0.72)' }}>
            &quot;{discipline.learnerExplanation.examplePrompt}&quot;
          </p>
        </div>

        <div>
          <SectionLabel>How FLOW shows up</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {FLOW_STEPS.map((stepId) => {
              const step = discipline.steps.find((candidate) => candidate.id === stepId)
              if (!step) return null
              return (
                <div
                  key={stepId}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(245,240,230,0.035)', border: '1px solid rgba(212,164,116,0.12)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-label text-[13px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(212,164,116,0.2)', color: '#d4a574' }}
                    >
                      {step.id}
                    </span>
                    <span className="font-label text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#e8c99a' }}>
                      {step.name}
                    </span>
                  </div>
                  <p className="font-body text-[14px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.62)' }}>
                    {discipline.learnerExplanation.stepMeanings[step.id]}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.25)' }}
        >
          <SectionLabel>Practice outcome</SectionLabel>
          <p className="font-body text-[16px] leading-relaxed" style={{ color: '#8ecf9e' }}>
            {discipline.learnerExplanation.practiceOutcome}
          </p>
        </div>

        <p className="font-label text-[13px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.48)' }}>
          Click any node to see which source idea, trainable skill, or scored FLOW move it represents.
        </p>
      </div>
    )
  }

  if (selectedType === 'tradition') {
    const tradition = discipline.traditions.find((t) => t.id === selectedId)
    if (!tradition) return null
    return (
      <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
        <PanelHeader eyebrow="Source idea" title={tradition.label.toLowerCase()} />

        <p className="font-body text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.68)' }}>
          {tradition.body}
        </p>

        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,164,116,0.08)', border: '1px solid rgba(212,164,116,0.18)' }}
        >
          <SectionLabel>What it contributes</SectionLabel>
          <p className="font-body text-[16px] leading-relaxed" style={{ color: '#e8c99a' }}>
            {tradition.contribution}
          </p>
        </div>

        <div>
          <SectionLabel>What FLOW keeps</SectionLabel>
          <ChipList items={tradition.absorbed} />
        </div>

        <div>
          <SectionLabel>What stays out</SectionLabel>
          <PlainList items={tradition.leftBehind} />
        </div>

        <ReasoningMove>{tradition.reasoningMove}</ReasoningMove>
      </div>
    )
  }

  if (selectedType === 'competency') {
    const competency = discipline.competencies.find((c) => c.id === selectedId)
    if (!competency) return null
    return (
      <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
        <PanelHeader eyebrow="Skill you practice" title={formatLabel(competency.label)} />

        <p className="font-body text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.72)' }}>
          {competency.what}
        </p>

        <p className="font-body text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.62)' }}>
          {competency.body}
        </p>

        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,164,116,0.08)', border: '1px solid rgba(212,164,116,0.18)' }}
        >
          <SectionLabel>Scored in</SectionLabel>
          <ChipList items={competency.measuredIn} />
        </div>

        <div>
          <SectionLabel>Coaching signal</SectionLabel>
          <p className="font-body text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.66)' }}>
            {competency.coaching}
          </p>
        </div>

        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(184,50,48,0.08)', border: '1px solid rgba(184,50,48,0.2)' }}
        >
          <SectionLabel>Failure mode</SectionLabel>
          <p className="font-body text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.64)' }}>
            {competency.failureMode}
          </p>
        </div>

        <ReasoningMove>{competency.reasoningMove}</ReasoningMove>
      </div>
    )
  }

  if (selectedType === 'step') {
    const step = discipline.steps.find((s) => s.id === selectedId)
    if (!step) return null
    return (
      <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
        <PanelHeader eyebrow={`FLOW move - ${step.id}`} title={step.name.toLowerCase()} accent="#ffc580" />

        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,164,116,0.08)', border: '1px solid rgba(212,164,116,0.18)' }}
        >
          <SectionLabel>Plain meaning</SectionLabel>
          <p className="font-body text-[16px] leading-relaxed" style={{ color: '#e8c99a' }}>
            {discipline.learnerExplanation.stepMeanings[step.id]}
          </p>
        </div>

        <p className="font-body text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.66)' }}>
          {step.body}
        </p>

        {step.criteriaList.length > 0 && (
          <div>
            <SectionLabel>Scoring criteria</SectionLabel>
            <div className="flex flex-col gap-3">
              {step.criteriaList.map((item) => (
                <div
                  key={item.code}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(212,164,116,0.06)', border: '1px solid rgba(212,164,116,0.14)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-label text-[13px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(212,164,116,0.2)', color: '#d4a574' }}
                    >
                      {item.code}
                    </span>
                    <span className="font-label text-[13px] font-semibold" style={{ color: '#e8c99a' }}>
                      {item.title}
                    </span>
                  </div>
                  <p className="font-body text-[14px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.58)' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step.antiPatterns.length > 0 && (
          <div>
            <SectionLabel>Common misses</SectionLabel>
            <PlainList items={step.antiPatterns} />
          </div>
        )}

        <ReasoningMove>{step.reasoningMove}</ReasoningMove>
      </div>
    )
  }

  return null
}
