'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'hackproduct-admin-dev'

const PARADIGMS = ['traditional', 'ai_assisted', 'agentic', 'ai_native'] as const
const DIFFICULTIES = ['warmup', 'standard', 'advanced', 'staff_plus'] as const
const COMPETENCIES = ['motivation_theory', 'cognitive_empathy', 'taste', 'strategic_thinking', 'creative_execution', 'domain_expertise'] as const
const ROLES = ['swe', 'data_eng', 'ml_eng', 'devops', 'founding_eng', 'em', 'tech_lead', 'pm', 'designer', 'data_scientist'] as const

interface ChallengeTagData {
  id: string
  title: string
  paradigm: string
  industry: string
  sub_vertical: string
  difficulty: string
  estimated_minutes: number
  primary_competencies: string[]
  secondary_competencies: string[]
  frameworks: string[]
  relevant_roles: string[]
  company_tags: string[]
  tags: string[]
  is_premium: boolean
}

function TagInput({ label, values, onChange }: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
}) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  return (
    <div>
      <p className="font-label text-xs text-on-surface-variant mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container rounded-full px-2.5 py-0.5 font-label text-xs">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="opacity-60 hover:opacity-100 ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Type and press Enter"
          className="flex-1 bg-surface-container-low rounded-lg px-3 py-1.5 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
        />
        <button onClick={add} className="bg-surface-container-high text-on-surface rounded-lg px-3 py-1.5 font-label text-xs">Add</button>
      </div>
    </div>
  )
}

function CheckboxGroup({ label, options, values, onChange }: {
  label: string
  options: readonly string[]
  values: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(values.includes(opt) ? values.filter(x => x !== opt) : [...values, opt])
  }
  return (
    <div>
      <p className="font-label text-xs text-on-surface-variant mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={values.includes(opt)}
              onChange={() => toggle(opt)}
              className="accent-primary"
            />
            <span className="font-label text-sm text-on-surface">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function ChallengeTagsPage() {
  const { challenge_id } = useParams<{ challenge_id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ChallengeTagData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChallenge = useCallback(async () => {
    const res = await fetch(`/api/admin/content/challenges/${challenge_id}`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (res.ok) {
      const d = await res.json()
      setData(d.challenge)
    }
  }, [challenge_id])

  useEffect(() => { fetchChallenge() }, [fetchChallenge])

  async function handleSave() {
    if (!data) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch(`/api/admin/content/challenges/${challenge_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({
        paradigm: data.paradigm,
        industry: data.industry,
        sub_vertical: data.sub_vertical,
        difficulty: data.difficulty,
        estimated_minutes: data.estimated_minutes,
        primary_competencies: data.primary_competencies,
        secondary_competencies: data.secondary_competencies,
        frameworks: data.frameworks,
        relevant_roles: data.relevant_roles,
        company_tags: data.company_tags,
        tags: data.tags,
        is_premium: data.is_premium,
      }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Save failed')
    }
    setSaving(false)
  }

  if (!data) return <div className="p-6 text-on-surface-variant font-body">Loading...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto pb-24">
      <button onClick={() => router.back()} className="text-on-surface-variant font-label text-sm mb-4 hover:text-on-surface">← Back</button>
      <h1 className="font-headline text-2xl text-on-surface mb-1">Edit Tags</h1>
      <p className="font-body text-sm text-on-surface-variant mb-6">{data.id} · {data.title}</p>

      <div className="space-y-6">
        {/* Paradigm + Difficulty */}
        <div className="bg-surface-container rounded-2xl p-6 space-y-4">
          <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-label text-xs text-on-surface-variant mb-1">Paradigm</p>
              <select
                value={data.paradigm}
                onChange={e => setData({ ...data, paradigm: e.target.value })}
                className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
              >
                {PARADIGMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p className="font-label text-xs text-on-surface-variant mb-1">Difficulty</p>
              <select
                value={data.difficulty}
                onChange={e => setData({ ...data, difficulty: e.target.value })}
                className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <p className="font-label text-xs text-on-surface-variant mb-1">Industry</p>
              <input
                value={data.industry ?? ''}
                onChange={e => setData({ ...data, industry: e.target.value })}
                className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
              />
            </div>
            <div>
              <p className="font-label text-xs text-on-surface-variant mb-1">Sub-vertical</p>
              <input
                value={data.sub_vertical ?? ''}
                onChange={e => setData({ ...data, sub_vertical: e.target.value })}
                className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
              />
            </div>
            <div>
              <p className="font-label text-xs text-on-surface-variant mb-1">Estimated minutes</p>
              <input
                type="number"
                value={data.estimated_minutes ?? 20}
                onChange={e => setData({ ...data, estimated_minutes: Number(e.target.value) })}
                className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="is_premium"
                checked={!!data.is_premium}
                onChange={e => setData({ ...data, is_premium: e.target.checked })}
                className="accent-primary"
              />
              <label htmlFor="is_premium" className="font-label text-sm text-on-surface cursor-pointer">Premium only</label>
            </div>
          </div>
        </div>

        {/* Competencies */}
        <div className="bg-surface-container rounded-2xl p-6 space-y-4">
          <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Competencies</h2>
          <CheckboxGroup
            label="Primary (2–3)"
            options={COMPETENCIES}
            values={data.primary_competencies ?? []}
            onChange={v => setData({ ...data, primary_competencies: v })}
          />
          <CheckboxGroup
            label="Secondary (1–2)"
            options={COMPETENCIES}
            values={data.secondary_competencies ?? []}
            onChange={v => setData({ ...data, secondary_competencies: v })}
          />
        </div>

        {/* Roles */}
        <div className="bg-surface-container rounded-2xl p-6">
          <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide mb-4">Relevant Roles</h2>
          <CheckboxGroup
            label=""
            options={ROLES}
            values={data.relevant_roles ?? []}
            onChange={v => setData({ ...data, relevant_roles: v })}
          />
        </div>

        {/* Free-form tags */}
        <div className="bg-surface-container rounded-2xl p-6 space-y-4">
          <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Tags</h2>
          <TagInput label="Frameworks (e.g. Jobs-to-be-Done, RICE)" values={data.frameworks ?? []} onChange={v => setData({ ...data, frameworks: v })} />
          <TagInput label="Company tags (e.g. stripe, notion)" values={data.company_tags ?? []} onChange={v => setData({ ...data, company_tags: v })} />
          <TagInput label="Freeform tags" values={data.tags ?? []} onChange={v => setData({ ...data, tags: v })} />
        </div>
      </div>

      {error && <p className="text-error font-body text-sm mt-4">{error}</p>}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant px-6 py-4 flex gap-3 justify-end items-center">
        {saved && <span className="text-primary font-label text-sm">✓ Saved</span>}
        <button
          onClick={() => router.back()}
          className="bg-surface-container text-on-surface font-label font-semibold px-5 py-2 rounded-full text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-on-primary font-label font-semibold px-5 py-2 rounded-full text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Tags'}
        </button>
      </div>
    </div>
  )
}
