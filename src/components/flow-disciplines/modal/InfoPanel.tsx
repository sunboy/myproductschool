'use client'

import type { Discipline } from '@/lib/data/flow-framework/types'

interface InfoPanelProps {
  discipline: Discipline
  selectedId: string | null
  selectedType: 'tradition' | 'competency' | 'step' | null
}

export function InfoPanel({ discipline, selectedId, selectedType }: InfoPanelProps) {
  if (!selectedId || !selectedType) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(212,164,116,0.15)', border: '1px solid rgba(212,164,116,0.3)' }}
        >
          <span
            className="text-lg font-label font-semibold"
            style={{ color: '#d4a574' }}
          >
            ↖
          </span>
        </div>
        <p className="font-label text-[17.5px]" style={{ color: 'rgba(245,240,230,0.45)' }}>
          Click any node in the circuit to explore it
        </p>
      </div>
    )
  }

  if (selectedType === 'tradition') {
    const tradition = discipline.traditions.find((t) => t.id === selectedId)
    if (!tradition) return null
    return (
      <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
        <div
          className="pl-4 py-1"
          style={{ borderLeft: '3px solid #d4a574' }}
        >
          <p
            className="font-label text-[15px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(212,164,116,0.65)' }}
          >
            Tradition
          </p>
          <h3
            className="font-headline text-[20px] font-bold leading-snug"
            style={{ color: '#ffc580' }}
          >
            {tradition.label}
          </h3>
        </div>

        <p className="font-body text-[17.5px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.65)' }}>
          {tradition.body}
        </p>

        {tradition.contribution && (
          <div
            className="rounded-lg p-4"
            style={{ background: 'rgba(212,164,116,0.08)', border: '1px solid rgba(212,164,116,0.18)' }}
          >
            <p
              className="font-label text-[15px] uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(212,164,116,0.65)' }}
            >
              What it contributes
            </p>
            <p className="font-body text-[17.5px] leading-relaxed" style={{ color: '#e8c99a' }}>
              {tradition.contribution}
            </p>
          </div>
        )}

        {tradition.absorbed && tradition.absorbed.length > 0 && (
          <div>
            <p
              className="font-label text-[15px] uppercase tracking-wider mb-2"
              style={{ color: 'rgba(212,164,116,0.65)' }}
            >
              Absorbed
            </p>
            <div className="flex flex-wrap gap-2">
              {tradition.absorbed.map((item) => (
                <span
                  key={item}
                  className="font-label text-[15px] px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(212,164,116,0.12)', color: '#d4a574', border: '1px solid rgba(212,164,116,0.25)' }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {tradition.leftBehind && (
          <div>
            <p
              className="font-label text-[15px] uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(212,164,116,0.65)' }}
            >
              Left behind
            </p>
            <p className="font-body text-[17.5px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.65)' }}>
              {tradition.leftBehind}
            </p>
          </div>
        )}

        {tradition.reasoningMove && (
          <div
            className="rounded-lg p-4 mt-auto"
            style={{ background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.25)' }}
          >
            <p className="font-label text-[15px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(142,207,158,0.7)' }}>
              Reasoning move
            </p>
            <p className="font-body text-[17.5px] leading-relaxed" style={{ color: '#8ecf9e' }}>
              {tradition.reasoningMove}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (selectedType === 'competency') {
    const competency = discipline.competencies.find((c) => c.id === selectedId)
    if (!competency) return null
    return (
      <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
        <div
          className="pl-4 py-1"
          style={{ borderLeft: '3px solid #d4a574' }}
        >
          <p
            className="font-label text-[15px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(212,164,116,0.65)' }}
          >
            Competency
          </p>
          <h3
            className="font-headline text-[20px] font-bold leading-snug"
            style={{ color: '#ffc580' }}
          >
            {competency.label.replace(/_/g, ' ')}
          </h3>
        </div>

        {competency.what && (
          <p className="font-body text-[17.5px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.65)' }}>
            {competency.what}
          </p>
        )}

        <p className="font-body text-[17.5px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.65)' }}>
          {competency.body}
        </p>

        {competency.measuredIn && (
          <div
            className="rounded-lg p-4"
            style={{ background: 'rgba(212,164,116,0.08)', border: '1px solid rgba(212,164,116,0.18)' }}
          >
            <p
              className="font-label text-[15px] uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(212,164,116,0.65)' }}
            >
              Measured in
            </p>
            <p className="font-body text-[17.5px] leading-relaxed" style={{ color: '#e8c99a' }}>
              {competency.measuredIn}
            </p>
          </div>
        )}

        {competency.coaching && (
          <div>
            <p
              className="font-label text-[15px] uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(212,164,116,0.65)' }}
            >
              Coaching signal
            </p>
            <p className="font-body text-[17.5px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.65)' }}>
              {competency.coaching}
            </p>
          </div>
        )}

        {competency.failureMode && (
          <div
            className="rounded-lg p-4"
            style={{ background: 'rgba(184,50,48,0.08)', border: '1px solid rgba(184,50,48,0.2)' }}
          >
            <p className="font-label text-[15px] uppercase tracking-wider mb-1.5 text-error opacity-70">
              Failure mode
            </p>
            <p className="font-body text-[17.5px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.65)' }}>
              {competency.failureMode}
            </p>
          </div>
        )}

        {competency.reasoningMove && (
          <div
            className="rounded-lg p-4 mt-auto"
            style={{ background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.25)' }}
          >
            <p className="font-label text-[15px] uppercase tracking-wider mb-1.5 text-primary opacity-70">
              Reasoning move
            </p>
            <p className="font-body text-[17.5px] leading-relaxed text-primary">
              {competency.reasoningMove}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (selectedType === 'step') {
    const step = discipline.steps.find((s) => s.id === selectedId)
    if (!step) return null
    return (
      <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
        <div
          className="pl-4 py-1"
          style={{ borderLeft: '3px solid #ffc580' }}
        >
          <p
            className="font-label text-[15px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,197,128,0.65)' }}
          >
            FLOW Step · {step.id}
          </p>
          <h3
            className="font-headline text-[20px] font-bold leading-snug"
            style={{ color: '#ffc580' }}
          >
            {step.name}
          </h3>
        </div>

        <p className="font-label text-[17.5px] leading-relaxed" style={{ color: '#ffc580', opacity: 0.8 }}>
          {step.label}
        </p>

        <p className="font-body text-[17.5px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.65)' }}>
          {step.body}
        </p>

        {step.criteriaList && step.criteriaList.length > 0 && (
          <div>
            <p
              className="font-label text-[15px] uppercase tracking-wider mb-3"
              style={{ color: 'rgba(212,164,116,0.65)' }}
            >
              Criteria
            </p>
            <div className="flex flex-col gap-3">
              {step.criteriaList.map((item) => (
                <div
                  key={item.code}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(212,164,116,0.06)', border: '1px solid rgba(212,164,116,0.14)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-label text-[15px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(212,164,116,0.2)', color: '#d4a574' }}
                    >
                      {item.code}
                    </span>
                    <span className="font-label text-[15px] font-semibold" style={{ color: '#e8c99a' }}>
                      {item.title}
                    </span>
                  </div>
                  <p className="font-body text-[15px] leading-relaxed" style={{ color: 'rgba(245,240,230,0.55)' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step.antiPatterns && step.antiPatterns.length > 0 && (
          <div>
            <p
              className="font-label text-[15px] uppercase tracking-wider mb-2"
              style={{ color: 'rgba(184,50,48,0.7)' }}
            >
              Anti-patterns
            </p>
            <ul className="flex flex-col gap-1.5">
              {step.antiPatterns.map((ap, i) => (
                <li
                  key={i}
                  className="font-body text-[15px] leading-relaxed flex gap-2" style={{ color: 'rgba(245,240,230,0.55)' }}
                >
                  <span style={{ color: 'rgba(184,50,48,0.6)' }}>–</span>
                  {ap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step.reasoningMove && (
          <div
            className="rounded-lg p-4 mt-auto"
            style={{ background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.25)' }}
          >
            <p className="font-label text-[15px] uppercase tracking-wider mb-1.5 text-primary opacity-70">
              Reasoning move
            </p>
            <p className="font-body text-[17.5px] leading-relaxed text-primary">
              {step.reasoningMove}
            </p>
          </div>
        )}
      </div>
    )
  }

  return null
}
