'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { DraftChallenge, ChallengeJson, DraftFlowStep, FlowStep } from '@/lib/types'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'hackproduct-admin-dev'

const THEME_COLORS: Record<string, string> = {
  T1: 'bg-primary-container text-on-primary-container',
  T2: 'bg-secondary-container text-on-secondary-container',
  T3: 'bg-tertiary-container text-on-surface',
  T4: 'bg-primary-container text-on-primary-container',
  T5: 'bg-secondary-container text-on-secondary-container',
  T6: 'bg-tertiary-container text-on-surface',
  T7: 'bg-primary-container text-on-primary-container',
}

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  best:                 { label: '3 · Best', color: 'text-primary' },
  good_but_incomplete:  { label: '2 · Good', color: 'text-tertiary' },
  surface:              { label: '1 · Surface', color: 'text-on-surface-variant' },
  plausible_wrong:      { label: '0 · Wrong', color: 'text-error' },
}

function EditableText({
  value, onChange, multiline = false, className = '',
}: { value: string; onChange: (v: string) => void; multiline?: boolean; className?: string }) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className={`w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary resize-none ${className}`}
      />
    )
  }
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary ${className}`}
    />
  )
}

function OptionCard({
  option, onChange,
}: {
  option: DraftFlowStep['questions'][0]['options'][0]
  onChange: (updated: typeof option) => void
}) {
  const ql = QUALITY_LABELS[option.quality]
  return (
    <div className="bg-surface-container rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-label font-semibold text-on-surface">{option.label}</span>
        <span className={`font-label text-xs font-medium ${ql.color}`}>{ql.label}</span>
      </div>
      <EditableText
        value={option.text}
        onChange={v => onChange({ ...option, text: v })}
        multiline
      />
      <p className="font-label text-xs text-on-surface-variant">{option.explanation}</p>
    </div>
  )
}

function FlowStepPanel({
  draftStep, approved, onApprove, onRegenerate, onUpdate,
}: {
  draftStep: DraftFlowStep
  approved: boolean
  onApprove: () => void
  onRegenerate: () => void
  onUpdate: (updated: DraftFlowStep) => void
}) {
  return (
    <div className={`bg-surface-container-low rounded-2xl p-6 space-y-4 border-2 ${approved ? 'border-primary' : 'border-transparent'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full font-label text-xs font-semibold ${THEME_COLORS[draftStep.theme]}`}>
            {draftStep.theme} · {draftStep.theme_name}
          </span>
          <span className="font-headline text-base text-on-surface capitalize">{draftStep.step}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRegenerate}
            className="text-on-surface-variant font-label text-xs px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest"
          >
            Regenerate
          </button>
          <button
            onClick={onApprove}
            className={`font-label text-xs px-3 py-1.5 rounded-full ${approved ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}
          >
            {approved ? '✓ Approved' : 'Approve Step'}
          </button>
        </div>
      </div>

      <div>
        <p className="font-label text-xs text-on-surface-variant mb-1">Step nudge</p>
        <EditableText
          value={draftStep.step_nudge}
          onChange={v => onUpdate({ ...draftStep, step_nudge: v })}
        />
      </div>

      {draftStep.questions.map((q, qi) => (
        <div key={qi} className="space-y-3">
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Question</p>
            <EditableText
              value={q.question_text}
              onChange={v => {
                const updatedQs = [...draftStep.questions]
                updatedQs[qi] = { ...q, question_text: v }
                onUpdate({ ...draftStep, questions: updatedQs })
              }}
              multiline
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt, oi) => (
              <OptionCard
                key={opt.label}
                option={opt}
                onChange={updated => {
                  const updatedOpts = [...q.options]
                  updatedOpts[oi] = updated
                  const updatedQs = [...draftStep.questions]
                  updatedQs[qi] = { ...q, options: updatedOpts }
                  onUpdate({ ...draftStep, questions: updatedQs })
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ReviewPage() {
  const { job_id } = useParams<{ job_id: string }>()
  const router = useRouter()
  const [draft, setDraft] = useState<DraftChallenge | null>(null)
  const [json, setJson] = useState<ChallengeJson | null>(null)
  const [approvals, setApprovals] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDraft = useCallback(async () => {
    const res = await fetch(`/api/admin/content/jobs/${job_id}`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (!res.ok) return
    const data = await res.json()
    if (data.draft) {
      setDraft(data.draft)
      setJson(data.draft.challenge_json)
      setApprovals(data.draft.step_approvals ?? {})
    }
  }, [job_id])

  useEffect(() => { fetchDraft() }, [fetchDraft])

  async function saveEdits(updatedJson: ChallengeJson) {
    if (!draft) return
    setSaving(true)
    await fetch(`/api/admin/content/drafts/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ challenge_json: updatedJson }),
    })
    setSaving(false)
  }

  function updateJson(updated: ChallengeJson) {
    setJson(updated)
    saveEdits(updated)
  }

  async function approveStep(step: string) {
    if (!draft) return
    const res = await fetch(`/api/admin/content/drafts/${draft.id}/approve-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ step }),
    })
    const data = await res.json()
    setApprovals(data.step_approvals ?? { ...approvals, [step]: true })
  }

  async function approveAll() {
    if (!draft) return
    await fetch(`/api/admin/content/drafts/${draft.id}/approve-all`, {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    setApprovals({ frame: true, list: true, optimize: true, win: true })
  }

  async function handlePublish() {
    if (!draft) return
    setPublishing(true)
    setError(null)
    const res = await fetch(`/api/admin/content/drafts/${draft.id}/publish`, {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (res.ok) {
      router.push('/admin/content')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Publish failed')
      setPublishing(false)
    }
  }

  async function handleRegenerate(step: FlowStep) {
    if (!draft || !json) return
    setRegenerating(step)
    const res = await fetch(`/api/admin/content/drafts/${draft.id}/regenerate-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ step }),
    })
    if (res.ok) {
      const data = await res.json()
      const updatedSteps = json.flow_steps.map(s => s.step === step ? data.step : s)
      const updatedJson = { ...json, flow_steps: updatedSteps }
      setJson(updatedJson)
      setApprovals(prev => ({ ...prev, [step]: false }))
    }
    setRegenerating(null)
  }

  if (!json) {
    return (
      <div className="p-6 text-on-surface-variant font-body">
        Loading draft...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-32">
      <h1 className="font-headline text-2xl text-on-surface mb-6">Review Challenge</h1>

      {/* Scenario */}
      <div className="bg-surface-container rounded-2xl p-6 space-y-4 mb-6">
        <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Scenario</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Role</p>
            <EditableText value={json.scenario.role} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, role: v } })} />
          </div>
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Trigger</p>
            <EditableText value={json.scenario.trigger} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, trigger: v } })} />
          </div>
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Context</p>
          <EditableText value={json.scenario.context} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, context: v } })} multiline />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Core Question</p>
          <EditableText value={json.scenario.question} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, question: v } })} multiline />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Explanation (why this matters)</p>
          <EditableText value={json.scenario.explanation} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, explanation: v } })} multiline />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Engineer Standout</p>
          <EditableText value={json.scenario.engineer_standout} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, engineer_standout: v } })} multiline />
        </div>

        {json.scenario.data_points && json.scenario.data_points.length > 0 && (
          <details>
            <summary className="font-label text-xs text-on-surface-variant cursor-pointer">Data Points ({json.scenario.data_points.length})</summary>
            <ul className="mt-2 space-y-1">
              {json.scenario.data_points.map((dp, i) => (
                <li key={i} className="font-body text-sm text-on-surface bg-surface-container-low rounded px-3 py-1">{dp}</li>
              ))}
            </ul>
          </details>
        )}

        {json.scenario.visuals && json.scenario.visuals.length > 0 && (
          <details>
            <summary className="font-label text-xs text-on-surface-variant cursor-pointer">Visuals ({json.scenario.visuals.length})</summary>
            <div className="mt-2 space-y-2">
              {json.scenario.visuals.map((v, i) => (
                <div key={i} className="bg-surface-container-low rounded p-3 font-body text-sm overflow-auto"
                  dangerouslySetInnerHTML={{ __html: v.startsWith('<') ? v : `<pre>${v}</pre>` }}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Metadata / Tags */}
      <div className="bg-surface-container rounded-2xl p-6 space-y-4 mb-6">
        <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Taxonomy &amp; Tags</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Paradigm</p>
            <select
              value={json.metadata.paradigm ?? 'traditional'}
              onChange={e => updateJson({ ...json, metadata: { ...json.metadata, paradigm: e.target.value } })}
              className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
            >
              {['traditional','ai_assisted','agentic','ai_native'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Difficulty</p>
            <select
              value={json.metadata.difficulty ?? 'standard'}
              onChange={e => updateJson({ ...json, metadata: { ...json.metadata, difficulty: e.target.value as ChallengeJson['metadata']['difficulty'] } })}
              className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
            >
              {['warmup','standard','advanced','staff_plus'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Industry</p>
            <EditableText value={json.metadata.industry ?? ''} onChange={v => updateJson({ ...json, metadata: { ...json.metadata, industry: v } })} />
          </div>
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Sub-vertical</p>
            <EditableText value={json.metadata.sub_vertical ?? ''} onChange={v => updateJson({ ...json, metadata: { ...json.metadata, sub_vertical: v } })} />
          </div>
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Frameworks (comma-separated)</p>
          <EditableText
            value={(json.metadata.frameworks ?? []).join(', ')}
            onChange={v => updateJson({ ...json, metadata: { ...json.metadata, frameworks: v.split(',').map(s => s.trim()).filter(Boolean) } })}
          />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Company tags (comma-separated)</p>
          <EditableText
            value={(json.metadata.company_tags ?? []).join(', ')}
            onChange={v => updateJson({ ...json, metadata: { ...json.metadata, company_tags: v.split(',').map(s => s.trim()).filter(Boolean) } })}
          />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Tags (comma-separated)</p>
          <EditableText
            value={(json.metadata.tags ?? []).join(', ')}
            onChange={v => updateJson({ ...json, metadata: { ...json.metadata, tags: v.split(',').map(s => s.trim()).filter(Boolean) } })}
          />
        </div>
      </div>

      {/* FLOW Steps */}
      <div className="space-y-4 mb-6">
        {json.flow_steps.map(step => (
          <FlowStepPanel
            key={step.step}
            draftStep={step}
            approved={!!approvals[step.step]}
            onApprove={() => approveStep(step.step)}
            onRegenerate={() => handleRegenerate(step.step as FlowStep)}
            onUpdate={updated => {
              const updatedSteps = json.flow_steps.map(s => s.step === step.step ? updated : s)
              updateJson({ ...json, flow_steps: updatedSteps })
            }}
          />
        ))}
      </div>

      {error && <p className="text-error font-body text-sm mb-4">{error}</p>}
      {saving && <p className="text-on-surface-variant font-label text-xs mb-2">Saving...</p>}
      {regenerating && <p className="text-on-surface-variant font-label text-xs mb-2">Regenerating {regenerating} step...</p>}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant px-6 py-4 flex gap-3 justify-end">
        <button
          onClick={approveAll}
          className="bg-surface-container text-on-surface font-label font-semibold px-5 py-2 rounded-full text-sm"
        >
          Bulk Approve All
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="bg-primary text-on-primary font-label font-semibold px-6 py-2 rounded-full text-sm disabled:opacity-50"
        >
          {publishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}
