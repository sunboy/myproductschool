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
import { MotionList, MotionListItem, PresencePanel } from '@/components/motion'
import { coerceDifficulty, DIFFICULTY_LABELS, type PracticeDifficulty } from '@/lib/practice/difficulty'

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

const DIFF_LABEL: Record<PracticeDifficulty, string> = {
  easy: DIFFICULTY_LABELS.easy,
  medium: DIFFICULTY_LABELS.medium,
  hard: DIFFICULTY_LABELS.hard,
}

const DIFF_DOT: Record<PracticeDifficulty, string> = {
  easy: T.primary,
  medium: T.amber,
  hard: T.danger,
}

/** Step-3 swap: pure opacity + slight y fade. No scale/height animation so the panel never reads as a clipped frame mid-transition. */
const OPTIONS_SWAP_VARIANTS = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.14, ease: [0.7, 0, 0.84, 0] as const } },
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
  const [selectedDiscipline, setSelectedDiscipline] = useState<LiveInterviewDiscipline | null>(null)

  const selectedCompany = companies.find((c) => c.companyId === selectedCompanyId) ?? null
  const selectedPersona = selectedCompany ? selectedCompany.roles[selectedRoleIdx] ?? selectedCompany.roles[0] : null
  const filteredScenarios = useMemo(
    () => selectedDiscipline ? scenarios.filter((s) => s.discipline === selectedDiscipline).slice(0, 8) : [],
    [scenarios, selectedDiscipline]
  )

  function handleSelectCompany(companyId: string) {
    setSelectedCompanyId(companyId)
    setSelectedRoleIdx(0)
    setSelectedDiscipline(null)
  }

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${T.outlineFaint}`,
        background: T.surface,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.86fr) minmax(0, 1fr) minmax(0, 1.18fr)',
        }}
        className="max-lg:!grid-cols-1"
      >
        <CompanyPanel
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={handleSelectCompany}
        />

        <DisciplinePanel
          company={selectedCompany}
          selectedRoleIdx={selectedRoleIdx}
          selectedDiscipline={selectedDiscipline}
          scenarios={scenarios}
          onSelectRole={setSelectedRoleIdx}
          onSelectDiscipline={setSelectedDiscipline}
        />

        <OptionsPanel
          company={selectedCompany}
          persona={selectedPersona}
          discipline={selectedDiscipline}
          scenarios={filteredScenarios}
        />
      </div>
    </div>
  )
}

function CompanyPanel({
  companies,
  selectedCompanyId,
  onSelectCompany,
}: {
  companies: CompanyEntry[]
  selectedCompanyId: string | null
  onSelectCompany: (companyId: string) => void
}) {
  return (
    <aside
      style={{
        borderRight: `1px solid ${T.outlineFaint}`,
        background: T.surfaceContainerLow,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="max-h-[620px] overflow-y-auto max-lg:max-h-[360px] max-lg:!border-r-0 max-lg:!border-b"
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          padding: '18px 18px 14px',
          background: T.surfaceContainerLow,
          borderBottom: `1px solid ${T.outlineFaint}`,
        }}
      >
        <SectionEyebrow step="1" label="Company" />
        <p style={{ margin: '8px 0 0', color: T.onSurfaceVariant, fontSize: 14, lineHeight: 1.45 }}>
          Choose the context you want to practice.
        </p>
      </div>

      <MotionList layoutKey="live-company-panel" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14 }}>
        {companies.map((company) => (
          <CompanyButton
            key={company.companyId}
            company={company}
            active={company.companyId === selectedCompanyId}
            onClick={() => onSelectCompany(company.companyId)}
          />
        ))}
        {companies.length === 0 && (
          <div
            role="status"
            style={{
              border: `1px dashed ${T.outlineVariant}`,
              borderRadius: 14,
              padding: 16,
              color: T.onSurfaceVariant,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            No company interview profiles are available right now.
          </div>
        )}
      </MotionList>
    </aside>
  )
}

function CompanyButton({
  company,
  active,
  onClick,
}: {
  company: CompanyEntry
  active: boolean
  onClick: () => void
}) {
  return (
    <MotionListItem>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Select ${company.companyName}`}
        data-testid={`live-interview-company-${company.companyId}`}
        data-hatch-sound={active ? undefined : 'nudge'}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '34px 1fr auto',
          alignItems: 'center',
          gap: 11,
          padding: '12px 12px',
          borderRadius: 16,
          border: `1px solid ${active ? T.primary : T.outlineFaint}`,
          background: active ? T.primaryContainer : T.surface,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 180ms ease, background 180ms ease, transform 180ms ease',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: active ? T.primaryContainerStrong : T.surfaceContainerLow,
            color: active ? T.primary : T.onSurfaceMuted,
            fontSize: 19,
            fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          {company.icon}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', color: active ? T.onPrimaryContainer : T.onSurface, fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>
            {company.companyName}
          </span>
          <span style={{ display: 'block', marginTop: 3, color: T.onSurfaceMuted, fontSize: 12 }}>
            {company.roles.length === 1 ? company.roles[0].role : `${company.roles.length} roles`}
          </span>
        </span>
        <span
          className="material-symbols-outlined"
          style={{ color: active ? T.primary : T.outlineVariant, fontSize: 18 }}
        >
          chevron_right
        </span>
      </button>
    </MotionListItem>
  )
}

function DisciplinePanel({
  company,
  selectedRoleIdx,
  selectedDiscipline,
  scenarios,
  onSelectRole,
  onSelectDiscipline,
}: {
  company: CompanyEntry | null
  selectedRoleIdx: number
  selectedDiscipline: LiveInterviewDiscipline | null
  scenarios: ScenarioBrief[]
  onSelectRole: (index: number) => void
  onSelectDiscipline: (discipline: LiveInterviewDiscipline) => void
}) {
  return (
    <section
      style={{
        borderRight: `1px solid ${T.outlineFaint}`,
        background: T.surface,
        padding: 20,
      }}
      className="max-lg:!border-r-0 max-lg:!border-b"
    >
      <PresencePanel isOpen={!company} mode="wait">
        <DefaultDisciplineState />
      </PresencePanel>

      <PresencePanel isOpen={Boolean(company)} mode="wait">
        {company && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <SectionEyebrow step="2" label={`Discipline at ${company.companyName}`} />
              {company.roles.length > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {company.roles.map((role, index) => {
                    const active = index === selectedRoleIdx
                    return (
                      <button
                        key={`${role.slug}-${role.role}`}
                        type="button"
                        onClick={() => onSelectRole(index)}
                        aria-label={`Use ${role.role} role`}
                        data-hatch-sound={active ? undefined : 'nudge'}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          border: `1px solid ${active ? T.primary : T.outlineVariant}`,
                          background: active ? T.primary : 'transparent',
                          color: active ? T.onPrimary : T.onSurfaceVariant,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {role.role}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <MotionList layoutKey={`live-disciplines-${company.companyId}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LIVE_INTERVIEW_DISCIPLINES.map((discipline) => {
                const meta = DISCIPLINE_META[discipline]
                const active = discipline === selectedDiscipline
                const count = scenarios.filter((scenario) => scenario.discipline === discipline).length
                return (
                  <MotionListItem key={discipline}>
                    <button
                      type="button"
                      onClick={() => onSelectDiscipline(discipline)}
                      aria-label={`Select ${meta.label}`}
                      data-testid={`live-interview-discipline-${discipline}`}
                      data-hatch-sound={active ? undefined : 'nudge'}
                      style={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '38px 1fr auto',
                        gap: 12,
                        alignItems: 'center',
                        padding: '13px 14px',
                        borderRadius: 18,
                        border: `1px solid ${active ? T.primary : T.outlineFaint}`,
                        background: active ? T.primaryContainer : T.surfaceContainerLow,
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 14,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: active ? T.primaryContainerStrong : T.surface,
                          color: active ? T.primary : T.onSurfaceMuted,
                          fontSize: 20,
                          fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        {meta.icon}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', color: T.onSurface, fontSize: 14, fontWeight: 850 }}>{meta.label}</span>
                        <span style={{ display: 'block', color: T.onSurfaceMuted, fontSize: 12, marginTop: 3 }}>
                          {count > 0 ? `${count} scenario${count === 1 ? '' : 's'}` : 'Persona-only interview'}
                        </span>
                      </span>
                      <span className="material-symbols-outlined" style={{ color: active ? T.primary : T.outlineVariant, fontSize: 18 }}>
                        {active ? 'check_circle' : 'arrow_forward'}
                      </span>
                    </button>
                  </MotionListItem>
                )
              })}
            </MotionList>
          </div>
        )}
      </PresencePanel>
    </section>
  )
}

function OptionsPanel({
  company,
  persona,
  discipline,
  scenarios,
}: {
  company: CompanyEntry | null
  persona: LiveInterviewPersona | null
  discipline: LiveInterviewDiscipline | null
  scenarios: ScenarioBrief[]
}) {
  return (
    <section style={{ background: T.surfaceContainerLow, padding: 20 }}>
      <PresencePanel isOpen={!company || !persona || !discipline} mode="wait" variants={OPTIONS_SWAP_VARIANTS}>
        <DefaultOptionsState hasCompany={Boolean(company)} />
      </PresencePanel>

      <PresencePanel isOpen={Boolean(company && persona && discipline)} mode="wait" variants={OPTIONS_SWAP_VARIANTS}>
        {company && persona && discipline && (
          <InterviewOptions
            company={company}
            persona={persona}
            discipline={discipline}
            scenarios={scenarios}
          />
        )}
      </PresencePanel>
    </section>
  )
}

function InterviewOptions({
  company,
  persona,
  discipline,
  scenarios,
}: {
  company: CompanyEntry
  persona: LiveInterviewPersona
  discipline: LiveInterviewDiscipline
  scenarios: ScenarioBrief[]
}) {
  const meta = DISCIPLINE_META[discipline]
  const autoPickScenario = scenarios[0] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionEyebrow step="3" label={`${meta.shortLabel} options`} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ color: T.onSurface, fontSize: 18, fontWeight: 850, lineHeight: 1.15 }}>
              {company.companyName} · {persona.role}
            </div>
            <div style={{ marginTop: 4, color: T.onSurfaceMuted, fontSize: 14 }}>
              {meta.label} · {persona.estimatedMins ?? 35} min
            </div>
          </div>
          <span
            className="material-symbols-outlined"
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: T.primaryContainer,
              color: T.primary,
              fontSize: 21,
              fontVariationSettings: "'FILL' 1",
            }}
          >
            {meta.icon}
          </span>
        </div>

        {persona.interviewStyle && (
          <p style={{ margin: 0, color: T.onSurfaceVariant, fontSize: 14, lineHeight: 1.55 }}>
            {persona.interviewStyle}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, lineHeight: 1.45, color: T.onSurfaceVariant }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: T.onSurfaceMuted }}>mic</span>
          Voice or chat, your choice. The microphone is optional and can be enabled after the session opens.
        </div>

        <StartInterviewButton
          variant="hero"
          label={autoPickScenario ? 'Start recommended scenario' : 'Start persona interview'}
          companyId={persona.companyId}
          roleId={persona.role}
          challengeId={autoPickScenario?.id}
          companyName={persona.companyName}
          discipline={discipline}
        />
      </div>

      {scenarios.length > 0 ? (
        <div style={{ borderTop: `1px solid ${T.outlineFaint}`, paddingTop: 16 }}>
          <div style={{ color: T.onSurfaceMuted, fontSize: 12, fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Pick a specific prompt
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ maxHeight: 320, overflowY: 'auto', paddingBottom: 20 }}>
              <MotionList layoutKey={`live-options-${company.companyId}-${discipline}`} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {scenarios.map((scenario) => (
                  <ScenarioRow
                    key={scenario.id}
                    scenario={scenario}
                    persona={persona}
                    discipline={discipline}
                  />
                ))}
              </MotionList>
            </div>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 24,
                pointerEvents: 'none',
                background: `linear-gradient(to bottom, rgba(244,238,226,0), ${T.surfaceContainerLow})`,
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 18, padding: 16, background: T.surface, border: `1px dashed ${T.outlineVariant}`, color: T.onSurfaceMuted, fontSize: 14, lineHeight: 1.5 }}>
          No published {meta.label.toLowerCase()} scenarios yet. Hatch can still run a persona-led interview for this company.
        </div>
      )}
    </div>
  )
}

function ScenarioRow({
  scenario,
  persona,
  discipline,
}: {
  scenario: ScenarioBrief
  persona: LiveInterviewPersona
  discipline: LiveInterviewDiscipline
}) {
  return (
    <MotionListItem>
      <div
        data-testid={`live-interview-scenario-${scenario.id}`}
        style={{
          padding: '13px 14px',
          borderRadius: 16,
          background: T.surface,
          border: `1px solid ${T.outlineFaint}`,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 12,
          alignItems: 'center',
        }}
        className="max-sm:!grid-cols-1"
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: T.onSurface, fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>
            {scenario.title}
          </div>
          <div style={{ color: T.onSurfaceMuted, fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {(() => {
              const canon = coerceDifficulty(scenario.difficulty)
              return (
                <>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: canon ? DIFF_DOT[canon] : T.primary, display: 'inline-block' }} />
                  {canon ? DIFF_LABEL[canon] : scenario.difficulty}
                </>
              )
            })()}
            <span>~{scenario.estimatedMinutes} min</span>
          </div>
        </div>
        <StartInterviewButton
          companyId={persona.companyId}
          roleId={persona.role}
          challengeId={scenario.id}
          companyName={persona.companyName}
          discipline={discipline}
        />
      </div>
    </MotionListItem>
  )
}

function DefaultDisciplineState() {
  return (
    <div>
      <div>
        <SectionEyebrow step="2" label="Discipline" />
        <div style={{ marginTop: 28 }}>
          <h2 style={{ margin: 0, color: T.onSurface, fontSize: 24, fontWeight: 850, lineHeight: 1.1 }}>
            Choose a company first.
          </h2>
          <p style={{ margin: '10px 0 0', color: T.onSurfaceVariant, fontSize: 14, lineHeight: 1.65 }}>
            Hatch tunes the pressure to the company. Once you pick one, the available disciplines and roles appear here.
          </p>
        </div>
      </div>
    </div>
  )
}

function DefaultOptionsState({ hasCompany }: { hasCompany: boolean }) {
  return (
    <div
      style={{
        borderRadius: 22,
        border: `1px dashed ${T.outlineVariant}`,
        background: T.surface,
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div>
        <SectionEyebrow step="3" label="Interview options" />
        <div style={{ marginTop: 30 }}>
          <div
            aria-hidden
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              background: T.primaryContainer,
              color: T.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
              video_chat
            </span>
          </div>
          <h2 style={{ margin: 0, color: T.onSurface, fontSize: 24, fontWeight: 850, lineHeight: 1.1 }}>
            {hasCompany ? 'Pick a discipline to see options.' : 'Your interview room is waiting.'}
          </h2>
          <p style={{ margin: '10px 0 0', color: T.onSurfaceVariant, fontSize: 14, lineHeight: 1.65 }}>
            {hasCompany
              ? 'Choose a discipline to see recommended scenarios, persona-led starts, and specific prompts.'
              : 'Select a company on the left, then choose a discipline. Hatch will show the best next start point here.'}
          </p>
        </div>
      </div>
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
          fontSize: 12,
          fontWeight: 850,
        }}
      >
        {step}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 850,
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
