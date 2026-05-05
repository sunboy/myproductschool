'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  DISCIPLINES, TOPICS, TECHNIQUES, COMPANIES,
  type Discipline, type TopicEntry, type TechniqueEntry,
} from '@/lib/data/taxonomy'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'hackproduct-admin-dev'

const PARADIGMS = ['traditional', 'ai_assisted', 'agentic', 'ai_native'] as const
const DIFFICULTIES = ['warmup', 'standard', 'advanced', 'staff_plus'] as const
const COMPETENCIES = ['motivation_theory', 'cognitive_empathy', 'taste', 'strategic_thinking', 'creative_execution', 'domain_expertise'] as const
const ROLES = ['swe', 'data_eng', 'ml_eng', 'devops', 'founding_eng', 'em', 'tech_lead', 'pm', 'designer', 'data_scientist'] as const

// Map challenge_type to Discipline for scoping pickers
const TYPE_TO_DISCIPLINE: Record<string, Discipline> = {
  flow: 'product_sense',
  freeform: 'product_sense',
  quick_take: 'product_sense',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
  sql: 'sql',
  algorithm: 'coding',
}

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
  is_published: boolean
  challenge_type?: string
  // New taxonomy fields
  topic_tags: string[]
  technique_tags: string[]
  topic_tags_suggested: string[]
  technique_tags_suggested: string[]
  is_real_interview: boolean
  source_url: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

/** Multi-select picker sourced from taxonomy entries. */
function TaxonomyPicker({ label, entries, selected, onChange }: {
  label: string
  entries: ReadonlyArray<TopicEntry | TechniqueEntry>
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(slug: string) {
    onChange(selected.includes(slug) ? selected.filter(x => x !== slug) : [...selected, slug])
  }

  return (
    <div>
      <p className="font-label text-xs text-on-surface-variant mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(e => {
          const active = selected.includes(e.slug)
          return (
            <button
              key={e.slug}
              onClick={() => toggle(e.slug)}
              className={`inline-flex items-center rounded-full px-3 py-1 font-label text-xs transition-colors ${
                active
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              {e.label}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="font-label text-xs text-on-surface-variant mt-1.5">
          {selected.length} selected: {selected.join(', ')}
        </p>
      )}
    </div>
  )
}

/** Suggested tags panel — amber-tinted with Accept / Edit / Reject actions. */
function SuggestedTagsPanel({
  label,
  suggestions,
  liveValues,
  onAccept,
  onEdit,
  onReject,
}: {
  label: string
  suggestions: string[]
  liveValues: string[]
  onAccept: (slug: string) => void
  onEdit: (slug: string) => void
  onReject: (slug: string) => void
}) {
  if (suggestions.length === 0) return null

  return (
    <div className="rounded-xl border border-dashed border-tertiary-container bg-tertiary-container/20 p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-base text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        <p className="font-label text-xs font-semibold text-tertiary uppercase tracking-wide">{label} — Suggested</p>
      </div>
      <div className="space-y-1.5">
        {suggestions.map(slug => {
          const alreadyLive = liveValues.includes(slug)
          return (
            <div
              key={slug}
              className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2"
            >
              <span className="font-label text-sm text-on-surface flex-1 font-mono">{slug}</span>
              {alreadyLive && (
                <span className="font-label text-xs text-primary mr-1">already live</span>
              )}
              <button
                onClick={() => onAccept(slug)}
                className="bg-primary text-on-primary rounded-full px-2.5 py-0.5 font-label text-xs"
              >
                Accept
              </button>
              <button
                onClick={() => onEdit(slug)}
                className="bg-secondary-container text-on-secondary-container rounded-full px-2.5 py-0.5 font-label text-xs"
              >
                Edit
              </button>
              <button
                onClick={() => onReject(slug)}
                className="bg-surface-container-highest text-on-surface-variant rounded-full px-2.5 py-0.5 font-label text-xs hover:text-error"
              >
                Reject
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
      setData({
        ...d.challenge,
        topic_tags: d.challenge.topic_tags ?? [],
        technique_tags: d.challenge.technique_tags ?? [],
        topic_tags_suggested: d.challenge.topic_tags_suggested ?? [],
        technique_tags_suggested: d.challenge.technique_tags_suggested ?? [],
        is_real_interview: d.challenge.is_real_interview ?? false,
        source_url: d.challenge.source_url ?? '',
      })
    }
  }, [challenge_id])

  useEffect(() => { fetchChallenge() }, [fetchChallenge])

  // Derive discipline for scoping pickers
  const discipline: Discipline = (
    data?.challenge_type ? TYPE_TO_DISCIPLINE[data.challenge_type] : undefined
  ) ?? 'coding'

  const topicEntries = TOPICS[discipline] as ReadonlyArray<TopicEntry>
  const techniqueEntries = TECHNIQUES[discipline] as ReadonlyArray<TechniqueEntry>

  // ── Suggested tags handlers (PATCH immediately, optimistic UI) ─────────────

  async function patchStagingField(field: 'topic_tags_suggested' | 'technique_tags_suggested', newValue: string[]) {
    await fetch(`/api/admin/content/challenges/${challenge_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ [field]: newValue }),
    })
  }

  function handleAcceptTopic(slug: string) {
    if (!data) return
    const newLive = data.topic_tags.includes(slug) ? data.topic_tags : [...data.topic_tags, slug]
    const newSuggested = data.topic_tags_suggested.filter(s => s !== slug)
    setData({ ...data, topic_tags: newLive, topic_tags_suggested: newSuggested })
    patchStagingField('topic_tags_suggested', newSuggested)
  }

  function handleEditTopic(slug: string) {
    if (!data) return
    // Pull into live picker for manual editing — also remove from suggested
    const newLive = data.topic_tags.includes(slug) ? data.topic_tags : [...data.topic_tags, slug]
    const newSuggested = data.topic_tags_suggested.filter(s => s !== slug)
    setData({ ...data, topic_tags: newLive, topic_tags_suggested: newSuggested })
    patchStagingField('topic_tags_suggested', newSuggested)
  }

  function handleRejectTopic(slug: string) {
    if (!data) return
    const newSuggested = data.topic_tags_suggested.filter(s => s !== slug)
    setData({ ...data, topic_tags_suggested: newSuggested })
    patchStagingField('topic_tags_suggested', newSuggested)
  }

  function handleAcceptTechnique(slug: string) {
    if (!data) return
    const newLive = data.technique_tags.includes(slug) ? data.technique_tags : [...data.technique_tags, slug]
    const newSuggested = data.technique_tags_suggested.filter(s => s !== slug)
    setData({ ...data, technique_tags: newLive, technique_tags_suggested: newSuggested })
    patchStagingField('technique_tags_suggested', newSuggested)
  }

  function handleEditTechnique(slug: string) {
    if (!data) return
    const newLive = data.technique_tags.includes(slug) ? data.technique_tags : [...data.technique_tags, slug]
    const newSuggested = data.technique_tags_suggested.filter(s => s !== slug)
    setData({ ...data, technique_tags: newLive, technique_tags_suggested: newSuggested })
    patchStagingField('technique_tags_suggested', newSuggested)
  }

  function handleRejectTechnique(slug: string) {
    if (!data) return
    const newSuggested = data.technique_tags_suggested.filter(s => s !== slug)
    setData({ ...data, technique_tags_suggested: newSuggested })
    patchStagingField('technique_tags_suggested', newSuggested)
  }

  // ── Main save ──────────────────────────────────────────────────────────────

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
        is_published: data.is_published,
        // New taxonomy fields
        topic_tags: data.topic_tags,
        technique_tags: data.technique_tags,
        topic_tags_suggested: data.topic_tags_suggested,
        technique_tags_suggested: data.technique_tags_suggested,
        is_real_interview: data.is_real_interview,
        source_url: data.source_url || null,
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
      <p className="font-body text-sm text-on-surface-variant mb-6">
        {data.id} · {data.title}
        {data.challenge_type && (
          <span className="ml-2 inline-flex items-center bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 font-label text-xs">
            {data.challenge_type}
          </span>
        )}
      </p>

      <div className="space-y-6">
        {/* Classification */}
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
            <div className="flex flex-col gap-2 pt-5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={!!data.is_published}
                  onChange={e => setData({ ...data, is_published: e.target.checked })}
                  className="accent-primary"
                />
                <label htmlFor="is_published" className="font-label text-sm text-on-surface cursor-pointer">Published</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_premium"
                  checked={!!data.is_premium}
                  onChange={e => setData({ ...data, is_premium: e.target.checked })}
                  className="accent-primary"
                />
                <label htmlFor="is_premium" className="font-label text-sm text-on-surface cursor-pointer">Premium only</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_real_interview"
                  checked={!!data.is_real_interview}
                  onChange={e => setData({ ...data, is_real_interview: e.target.checked })}
                  className="accent-primary"
                />
                <label htmlFor="is_real_interview" className="font-label text-sm text-on-surface cursor-pointer">Real interview</label>
              </div>
            </div>
          </div>

          {/* Source URL */}
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Source URL</p>
            <input
              type="url"
              value={data.source_url ?? ''}
              onChange={e => setData({ ...data, source_url: e.target.value })}
              placeholder="https://glassdoor.com/..."
              className="w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Taxonomy: Topic Tags */}
        <div className="bg-surface-container rounded-2xl p-6 space-y-4">
          <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">
            Topic Tags
            <span className="ml-2 font-normal normal-case text-on-surface-variant">
              scoped to <span className="font-mono text-primary">{discipline}</span>
            </span>
          </h2>

          {/* Suggested first */}
          <SuggestedTagsPanel
            label="Topic Tags"
            suggestions={data.topic_tags_suggested}
            liveValues={data.topic_tags}
            onAccept={handleAcceptTopic}
            onEdit={handleEditTopic}
            onReject={handleRejectTopic}
          />

          <TaxonomyPicker
            label="Select topic tags"
            entries={topicEntries}
            selected={data.topic_tags}
            onChange={v => setData({ ...data, topic_tags: v })}
          />
        </div>

        {/* Taxonomy: Technique Tags */}
        <div className="bg-surface-container rounded-2xl p-6 space-y-4">
          <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">
            Technique Tags
            <span className="ml-2 font-normal normal-case text-on-surface-variant">
              scoped to <span className="font-mono text-primary">{discipline}</span>
            </span>
          </h2>

          {/* Suggested first */}
          <SuggestedTagsPanel
            label="Technique Tags"
            suggestions={data.technique_tags_suggested}
            liveValues={data.technique_tags}
            onAccept={handleAcceptTechnique}
            onEdit={handleEditTechnique}
            onReject={handleRejectTechnique}
          />

          <TaxonomyPicker
            label="Select technique tags"
            entries={techniqueEntries}
            selected={data.technique_tags}
            onChange={v => setData({ ...data, technique_tags: v })}
          />
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

        {/* Legacy free-form tags */}
        <div className="bg-surface-container rounded-2xl p-6 space-y-4">
          <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Legacy Tags</h2>
          <TagInput label="Frameworks (e.g. Jobs-to-be-Done, RICE)" values={data.frameworks ?? []} onChange={v => setData({ ...data, frameworks: v })} />
          <TagInput
            label="Company tags"
            values={data.company_tags ?? []}
            onChange={v => setData({ ...data, company_tags: v })}
          />
          <p className="font-label text-xs text-on-surface-variant -mt-2">
            Canonical companies: {COMPANIES.slice(0, 8).map(c => c.slug).join(', ')}, …
          </p>
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
