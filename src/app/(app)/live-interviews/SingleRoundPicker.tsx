'use client'

import { useMemo, useState } from 'react'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from './page'
import {
  DISCIPLINE_META,
  LIVE_INTERVIEW_DISCIPLINES,
  type LiveInterviewDiscipline,
} from '@/lib/live-interview/disciplines'
import StartInterviewButton from './StartInterviewButton'

// Match the design tokens used in LiveInterviewsShell so the picker fits in.
const T = {
  surface: '#fdfbf6',
  surfaceContainerLow: '#f4eee2',
  surfaceContainer: '#ede6d6',
  surfaceContainerHigh: '#e4dcc8',
  outlineFaint: '#e7dfc9',
  outlineVariant: '#d5cab1',
  onSurface: '#1e1b14',
  onSurfaceVariant: '#4e4a3f',
  onSurfaceMuted: '#78715f',
  primary: '#4a7c59',
  primaryContainer: '#cfe3d3',
  primaryContainerStrong: '#b6d3bc',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#0f3d1f',
  amber: '#c9933a',
  amberSoft: '#f3e2b9',
  tertiary: '#705c30',
  danger: '#b23a2a',
}

const DIFF_LABEL: Record<string, string> = {
  standard: 'Standard',
  advanced: 'Advanced',
  staff_plus: 'Staff+',
}

const DIFF_DOT: Record<string, string> = {
  standard: T.primary,
  advanced: T.amber,
  staff_plus: T.danger,
}

interface CompanyEntry {
  companyId: string
  companyName: string
  slug: string
  icon: string
  roles: LiveInterviewPersona[]
}

function groupPersonasByCompany(personas: LiveInterviewPersona[]): CompanyEntry[] {
  const map = new Map<string, CompanyEntry>()
  for (const p of personas) {
    const key = p.companyId || p.slug
    const existing = map.get(key)
    if (existing) {
      existing.roles.push(p)
    } else {
      map.set(key, {
        companyId: p.companyId,
        companyName: p.companyName,
        slug: p.slug,
        icon: p.icon,
        roles: [p],
      })
    }
  }
  return Array.from(map.values())
}

export default function SingleRoundPicker({
  personas,
  scenarios,
}: {
  personas: LiveInterviewPersona[]
  scenarios: ScenarioBrief[]
}) {
  const companies = useMemo(() => groupPersonasByCompany(personas), [personas])

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0)
  const [selectedDiscipline, setSelectedDiscipline] = useState<LiveInterviewDiscipline>('product_sense')

  const selectedCompany = companies.find((c) => c.companyId === selectedCompanyId) ?? null
  const selectedPersona = selectedCompany ? selectedCompany.roles[selectedRoleIdx] ?? selectedCompany.roles[0] : null

  function handleSelectCompany(companyId: string) {
    setSelectedCompanyId(companyId)
    setSelectedRoleIdx(0)
  }

  const filteredScenarios = useMemo(
    () => scenarios.filter((s) => s.discipline === selectedDiscipline).slice(0, 8),
    [scenarios, selectedDiscipline]
  )

  // Auto-pick the first scenario (already sorted by difficulty) for the
  // "Start a random interview" CTA. This is deterministic per discipline
  // change which keeps render pure.
  const autoPickScenario = filteredScenarios[0] ?? null

  return (
    <div
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        border: `1px solid ${T.outlineFaint}`,
        background: T.surface,
        minHeight: 480,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Step 1: Company grid */}
      <section>
        <SectionEyebrow step="1" label="Pick a company" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            marginTop: 12,
          }}
        >
          {companies.map((c) => {
            const active = c.companyId === selectedCompanyId
            return (
              <button
                key={c.companyId}
                onClick={() => handleSelectCompany(c.companyId)}
                data-hatch-sound={active ? undefined : 'nudge'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 16,
                  border: `1px solid ${active ? T.primary : T.outlineVariant}`,
                  background: active ? T.primaryContainer : T.surfaceContainerLow,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 120ms ease',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 24,
                    color: active ? T.primary : T.onSurfaceMuted,
                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {c.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: active ? T.onPrimaryContainer : T.onSurface,
                      lineHeight: 1.2,
                    }}
                  >
                    {c.companyName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: active ? T.onPrimaryContainer : T.onSurfaceMuted,
                      marginTop: 2,
                    }}
                  >
                    {c.roles.length === 1 ? c.roles[0].role : `${c.roles.length} roles`}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Step 1.5: Role chip row (only if company has multiple roles) */}
      {selectedCompany && selectedCompany.roles.length > 1 && (
        <section>
          <SectionEyebrow step="·" label={`Role at ${selectedCompany.companyName}`} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {selectedCompany.roles.map((r, i) => {
              const active = i === selectedRoleIdx
              return (
                <button
                  key={`${r.slug}-${r.role}`}
                  onClick={() => setSelectedRoleIdx(i)}
                  data-hatch-sound={active ? undefined : 'nudge'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: `1px solid ${active ? T.primary : T.outlineVariant}`,
                    background: active ? T.primary : 'transparent',
                    color: active ? T.onPrimary : T.onSurfaceVariant,
                    cursor: 'pointer',
                  }}
                >
                  {r.role}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Step 2: Discipline tabs */}
      {selectedCompany && (
        <section>
          <SectionEyebrow step="2" label="Pick a discipline" />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 12,
              padding: 6,
              borderRadius: 14,
              background: T.surfaceContainerLow,
              border: `1px solid ${T.outlineFaint}`,
            }}
          >
            {LIVE_INTERVIEW_DISCIPLINES.map((d) => {
              const meta = DISCIPLINE_META[d]
              const active = d === selectedDiscipline
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDiscipline(d)}
                  data-hatch-sound={active ? undefined : 'nudge'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    background: active ? T.primary : 'transparent',
                    color: active ? T.onPrimary : T.onSurfaceVariant,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 18,
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {meta.icon}
                  </span>
                  {meta.shortLabel}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Step 3: Discipline pane */}
      {selectedCompany && selectedPersona && (
        <DisciplinePane
          persona={selectedPersona}
          companyName={selectedCompany.companyName}
          discipline={selectedDiscipline}
          scenarios={filteredScenarios}
          autoPickScenario={autoPickScenario}
        />
      )}

      {!selectedCompany && (
        <div
          style={{
            padding: '48px 16px',
            textAlign: 'center',
            color: T.onSurfaceMuted,
            fontSize: 13.5,
            fontStyle: 'italic',
          }}
        >
          Pick a company above to see disciplines and scenarios.
        </div>
      )}
    </div>
  )
}

function SectionEyebrow({ step, label }: { step: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: T.primary,
          color: T.onPrimary,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {step}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.onSurfaceMuted,
        }}
      >
        {label}
      </span>
    </div>
  )
}

function DisciplinePane({
  persona,
  companyName,
  discipline,
  scenarios,
  autoPickScenario,
}: {
  persona: LiveInterviewPersona
  companyName: string
  discipline: LiveInterviewDiscipline
  scenarios: ScenarioBrief[]
  autoPickScenario: ScenarioBrief | null
}) {
  const meta = DISCIPLINE_META[discipline]

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionEyebrow step="3" label={`${meta.label} at ${companyName}`} />

      {/* Hero CTA */}
      <div
        style={{
          padding: 20,
          borderRadius: 20,
          background: T.surfaceContainerLow,
          border: `1px solid ${T.outlineFaint}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {autoPickScenario ? (
          <StartInterviewButton
            variant="hero"
            label="Start a random interview"
            companyId={persona.companyId}
            roleId={persona.role}
            challengeId={autoPickScenario.id}
            companyName={persona.companyName}
            discipline={discipline}
          />
        ) : (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: T.surfaceContainer,
              color: T.onSurfaceVariant,
              fontSize: 13.5,
              textAlign: 'center',
            }}
          >
            No published {meta.label} scenarios yet. Try another discipline.
          </div>
        )}

        <div
          style={{
            fontSize: 12.5,
            color: T.onSurfaceMuted,
            textAlign: 'center',
          }}
        >
          Hatch picks a published scenario for you.
        </div>

        {/* Persona blurb */}
        <div
          style={{
            borderLeft: `2px solid ${T.primary}`,
            paddingLeft: 12,
            fontSize: 13,
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: T.onSurfaceVariant,
          }}
        >
          {persona.interviewStyle}
        </div>
      </div>

      {/* Scenario list */}
      {scenarios.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: T.onSurfaceMuted,
              marginBottom: 10,
              padding: '0 4px',
            }}
          >
            Or pick a scenario
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: T.surface,
                  border: `1px solid ${T.outlineFaint}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: T.onSurface,
                      lineHeight: 1.3,
                    }}
                  >
                    {sc.title}
                  </div>
                  <div style={{ fontSize: 12, color: T.onSurfaceMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: DIFF_DOT[sc.difficulty] ?? T.primary,
                        display: 'inline-block',
                      }}
                    />
                    {DIFF_LABEL[sc.difficulty] ?? sc.difficulty} · ~{sc.estimatedMinutes} min
                  </div>
                </div>
                <StartInterviewButton
                  companyId={persona.companyId}
                  roleId={persona.role}
                  challengeId={sc.id}
                  companyName={persona.companyName}
                  discipline={discipline}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
