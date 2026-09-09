'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check, Mic } from 'lucide-react'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from '@/app/(app)/live-interviews/page'
import { groupPersonasByCompany } from '@/app/(app)/live-interviews/SingleRoundPicker'
import StartInterviewButton from '@/app/(app)/live-interviews/StartInterviewButton'
import { LiveInterviewsShellClient } from '@/app/(app)/live-interviews/LiveInterviewsShellClient'
import { DISCIPLINE_META, LIVE_INTERVIEW_DISCIPLINES, type LiveInterviewDiscipline } from '@/lib/live-interview/disciplines'
import { HatchImage } from '@/components/redesign/HatchImage'
import { InterviewBand } from '@/components/density/interviews/InterviewBand'
import { RecentSessionsList } from '@/components/density/interviews/RecentSessionsList'
import { Badge, Button, Card, Chip, Text } from '@/design'
import { cn } from '@/lib/utils'
import { normalizeToTen } from '@/lib/feedback/score'
import type { SessionHistoryRow } from '@/lib/live-interview/history'

export const LAST_SETUP_KEY = 'hp:last-interview-setup'
interface LastSetup { companyId: string; role: number; discipline: LiveInterviewDiscipline; scenario?: string | null; label: string }

type Step = 1 | 2 | 3
const STEPS: Array<{ n: Step; label: string }> = [{ n: 1, label: 'Company & round' }, { n: 2, label: 'Prompt' }, { n: 3, label: 'Review & start' }]
const DIFF_ORDER = ['easy', 'medium', 'hard', 'standard']

interface Props {
  personas: LiveInterviewPersona[]
  scenarios: ScenarioBrief[]
  loopActive: number
  lastSession: { id: string; overallScore: number; disciplineLabel: string | null } | null
  recentSessions: SessionHistoryRow[]
}

/** Three-step guided setup in the onboarding split layout. Step state lives
 *  in the URL (?step, company, role, discipline, scenario) so back/forward and
 *  refresh work; the dark panel carries the step list and Hatch's suggestion. */
export function InterviewWizard({ personas, scenarios, loopActive, lastSession, recentSessions }: Props) {
  const router = useRouter()
  const pathname = usePathname() ?? '/live-interviews'
  const sp = useSearchParams()
  const companies = useMemo(() => groupPersonasByCompany(personas), [personas])

  const mode: 'single' | 'loop' = sp.get('mode') === 'loop' ? 'loop' : 'single'
  const companyId = sp.get('company')
  const roleIdx = Math.max(0, Number(sp.get('role') ?? 0) || 0)
  const discipline = (sp.get('discipline') as LiveInterviewDiscipline | null) ?? null
  const scenarioId = sp.get('scenario')
  const requestedStep = Number(sp.get('step') ?? 1) as Step

  const company = companies.find(c => c.companyId === companyId) ?? null
  const persona = company ? company.roles[roleIdx] ?? company.roles[0] : null
  const validDiscipline = discipline && LIVE_INTERVIEW_DISCIPLINES.includes(discipline) ? discipline : null
  const disciplineScenarios = useMemo(() => validDiscipline ? scenarios.filter(s => s.discipline === validDiscipline) : [], [scenarios, validDiscipline])
  const recommended = disciplineScenarios[0] ?? null
  const scenario = disciplineScenarios.find(s => s.id === scenarioId) ?? null
  // Steps guard themselves: you cannot be on step 2 without a company and round.
  const step: Step = !company || !validDiscipline ? 1 : requestedStep === 3 ? 3 : requestedStep === 2 ? 2 : 1

  const setParams = useCallback((patch: Record<string, string | number | null | undefined>) => {
    const next = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === undefined || v === '') next.delete(k); else next.set(k, String(v)) }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }, [router, pathname, sp])

  const [lastSetup, setLastSetup] = useState<LastSetup | null>(null)
  useEffect(() => { try { const raw = localStorage.getItem(LAST_SETUP_KEY); if (raw) setLastSetup(JSON.parse(raw)) } catch { /* ignore */ } }, [])
  const rememberSetup = () => {
    if (!company || !validDiscipline) return
    const setup: LastSetup = { companyId: company.companyId, role: roleIdx, discipline: validDiscipline, scenario: scenario?.id ?? null, label: `${company.companyName} · ${persona?.role ?? ''} · ${DISCIPLINE_META[validDiscipline].shortLabel}` }
    try { localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(setup)) } catch { /* ignore */ }
  }
  const applySetup = (s: LastSetup) => setParams({ company: s.companyId, role: s.role, discipline: s.discipline, scenario: s.scenario ?? null, step: 3 })

  const [diffFilter, setDiffFilter] = useState<string>('all')
  const difficulties = useMemo(() => Array.from(new Set(disciplineScenarios.map(s => s.difficulty))).sort((a, b) => DIFF_ORDER.indexOf(a) - DIFF_ORDER.indexOf(b)), [disciplineScenarios])
  const visibleScenarios = diffFilter === 'all' ? disciplineScenarios : disciplineScenarios.filter(s => s.difficulty === diffFilter)

  const lastSessionForBand = lastSession ? { id: lastSession.id, scoreLabel: `${normalizeToTen(lastSession.overallScore, 5).toFixed(1)}/10`, disciplineLabel: lastSession.disciplineLabel } : null

  const headline = step === 1 ? 'Where are you interviewing?' : step === 2 ? 'Pick a prompt' : 'Ready when you are.'
  const eyebrow = step === 1 ? 'Interviews' : `${company?.companyName} · ${persona?.role} · ${validDiscipline ? DISCIPLINE_META[validDiscipline].shortLabel : ''}`

  return (
    <div className="flex flex-col gap-4">
      <InterviewBand mode={mode} onModeChange={m => setParams({ mode: m === 'loop' ? 'loop' : null })} loopActive={loopActive} lastSession={lastSessionForBand} />

      {mode === 'loop' ? (
        <Card tone="bright" padding="md" data-testid="interview-setup-panel">
          <LiveInterviewsShellClient personas={personas} scenarios={scenarios} initialMode="loop" hideHeader />
        </Card>
      ) : (
        <Card tone="bright" padding="none" radius="panel" data-testid="interview-wizard" data-step={step} className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Left: step list + Hatch suggestion */}
          <aside className="relative overflow-hidden bg-forest-800 px-6 py-6 text-white">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <i className="absolute block rounded-full" style={{ right: -40, top: -40, width: 160, height: 160, border: '30px solid rgba(255,255,255,0.08)' }} />
              <i className="absolute block" style={{ left: -20, bottom: -30, width: 120, height: 120, background: 'rgba(196,166,106,0.25)', transform: 'rotate(30deg)' }} />
            </div>
            <div className="relative">
              <Text variant="caption" tone="gold" className="truncate">{eyebrow}</Text>
              <Text variant="h3" as="h2" tone="inverse" className="mt-2">{headline}</Text>
              <ol className="mt-5 flex flex-row gap-3 lg:flex-col lg:gap-2.5">
                {STEPS.map(s => {
                  const done = s.n < step; const on = s.n === step
                  return (
                    <li key={s.n} data-testid={`wizard-step-${s.n}`} aria-current={on ? 'step' : undefined} className={cn('flex items-center gap-2.5 text-ui font-ui', on ? 'font-strong opacity-100' : 'opacity-60')}>
                      <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border text-caption font-bold', on ? 'border-white bg-white text-forest-800' : 'border-white/50')}>{done ? <Check size={12} aria-hidden /> : s.n}</span>
                      <span className="hidden lg:inline">{s.label}</span>
                    </li>
                  )
                })}
              </ol>
              {step === 3 && scenario && (
                <div className="mt-6 rounded-card border border-white/15 bg-white/10 p-3"><Text variant="caption" tone="gold">Your interview</Text><div className="mt-1.5 font-headline text-body font-bold leading-snug">{scenario.title}</div><div className="mt-1 text-meta font-ui text-white/80">{persona?.role} · {scenario.difficulty} · Hatch as the interviewer</div></div>
              )}
              {step === 1 && lastSetup && (
                <div className="mt-6 hidden rounded-card border border-white/15 bg-white/10 p-3 lg:block" data-testid="wizard-last-setup">
                  <div className="flex items-center gap-2"><HatchImage state="speaking" size={26} /><Text variant="caption" tone="gold">Hatch suggests</Text></div>
                  <div className="mt-1.5 font-headline text-ui font-bold">{lastSetup.label}</div>
                  <div className="mt-0.5 text-meta font-ui text-white/80">Same setup as last time. Change any step after.</div>
                  <Button size="sm" variant="outline" className="mt-2.5 border-transparent" onClick={() => applySetup(lastSetup)}>Use this setup</Button>
                </div>
              )}
              {step === 1 && !lastSetup && lastSession && (
                <div className="mt-6 hidden rounded-card border border-white/15 bg-white/10 p-3 lg:block">
                  <div className="flex items-center gap-2"><HatchImage state="speaking" size={26} /><Text variant="caption" tone="gold">Hatch says</Text></div>
                  <div className="mt-1.5 text-ui font-ui text-white/90">Your last session scored {normalizeToTen(lastSession.overallScore, 5).toFixed(1)}/10{lastSession.disciplineLabel ? ` in ${lastSession.disciplineLabel}` : ''}. Read the debrief before the next rep.</div>
                  <Button asChild size="sm" variant="outline" className="mt-2.5 border-transparent"><Link href={`/live-interviews/${lastSession.id}/debrief`}>Open debrief</Link></Button>
                </div>
              )}
            </div>
          </aside>

          {/* Right: the current step */}
          <div className="flex min-w-0 flex-col px-5 py-5 lg:px-7 lg:py-6">
            {step === 1 && (
              <>
                <Text variant="caption">Company</Text>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Company">
                  {companies.map(c => (
                    <Chip key={c.companyId} selected={c.companyId === company?.companyId} data-testid={`wiz-company-${c.companyId}`} onClick={() => setParams({ company: c.companyId, role: null, scenario: null })} icon={<span className="material-symbols-outlined text-lede leading-none" aria-hidden>{c.icon}</span>}>{c.companyName}</Chip>
                  ))}
                  {companies.length === 0 && <Text variant="meta">No company interview profiles are available right now.</Text>}
                </div>
                {!company && companies.length > 0 && (
                  <Card tone="tinted" padding="md" className="mt-5 items-center justify-center text-center" data-testid="wiz-company-hint">
                    <HatchImage state="pointing" size={40} />
                    <Text variant="ui" tone="secondary" className="mt-2 max-w-sm">Pick a company and I&apos;ll show you the rounds it runs. Every round can be voice or chat.</Text>
                  </Card>
                )}
                {company && (
                  <>
                    {company.roles.length > 1 && (
                      <>
                        <Text variant="caption" className="mt-5">Role at {company.companyName}</Text>
                        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Role">
                          {company.roles.map((r, i) => <Chip key={`${r.slug}-${r.role}`} selected={i === roleIdx} data-testid={`wiz-role-${i}`} onClick={() => setParams({ role: i, scenario: null })}>{r.role}</Chip>)}
                        </div>
                      </>
                    )}
                    <Text variant="caption" className="mt-5">Round</Text>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Round">
                      {LIVE_INTERVIEW_DISCIPLINES.map(d => {
                        const meta = DISCIPLINE_META[d]; const count = scenarios.filter(s => s.discipline === d).length; const on = d === validDiscipline
                        return (
                          <Card key={d} asChild tone={on ? 'surface' : 'bright'} padding="sm" interactive className={cn('cursor-pointer text-left', on && 'border-primary-fixed bg-primary-fixed')}>
                            <button type="button" data-testid={`wiz-discipline-${d}`} aria-pressed={on} onClick={() => setParams({ discipline: d, scenario: null })}>
                              <span className="grid size-8 place-items-center rounded-tile bg-surface-container"><span className="material-symbols-outlined text-lede leading-none" aria-hidden>{meta.icon}</span></span>
                              <span className="mt-2 block font-headline text-body font-bold text-ink-strong">{meta.label}</span>
                              <span className="block text-meta font-ui text-ink-secondary">{count > 0 ? `${count} prompts · ${meta.artifact === 'none' ? 'voice or chat' : meta.artifact}` : 'Persona-led interview'}</span>
                            </button>
                          </Card>
                        )
                      })}
                    </div>
                  </>
                )}
                <div className="mt-auto flex items-center justify-between pt-6">
                  <Text variant="meta">Step 1 of 3</Text>
                  <Button data-testid="wizard-next" disabled={!company || !validDiscipline} onClick={() => setParams({ step: disciplineScenarios.length ? 2 : 3, scenario: null })}>{disciplineScenarios.length ? 'Choose a prompt →' : 'Review →'}</Button>
                </div>
              </>
            )}

            {step === 2 && validDiscipline && (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip selected={diffFilter === 'all'} onClick={() => setDiffFilter('all')} count={disciplineScenarios.length}>All</Chip>
                  {difficulties.map(d => <Chip key={d} selected={diffFilter === d} onClick={() => setDiffFilter(d)} className="capitalize">{d}</Chip>)}
                </div>
                {recommended && (
                  <Card tone="tinted" padding="sm" className="mt-3 flex-row items-center gap-3" data-testid="wiz-recommended">
                    <HatchImage state="speaking" size={34} />
                    <div className="min-w-0 flex-1"><Text variant="caption" tone="primary">Hatch recommends</Text><div className="truncate font-headline text-body font-bold text-ink-strong">{recommended.title}</div><Text variant="meta" className="capitalize">{recommended.difficulty} · ~{recommended.estimatedMinutes} min</Text></div>
                    <Button size="sm" onClick={() => setParams({ scenario: recommended.id, step: 3 })}>Select</Button>
                  </Card>
                )}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleScenarios.map(s => {
                    const on = s.id === scenario?.id
                    return (
                      <Card key={s.id} asChild tone="bright" padding="sm" interactive className={cn('cursor-pointer text-left', on && 'border-primary-fixed bg-primary-fixed/40')}>
                        <button type="button" data-testid={`wiz-scenario-${s.id}`} aria-pressed={on} onClick={() => setParams({ scenario: s.id })}>
                          <span className="flex gap-1.5"><Badge tone="difficulty" value={s.difficulty} className="capitalize">{s.difficulty}</Badge><Badge tone="neutral">~{s.estimatedMinutes} min</Badge></span>
                          <span className="mt-2 line-clamp-2 block font-headline text-body font-bold leading-snug text-ink-strong">{s.title}</span>
                        </button>
                      </Card>
                    )
                  })}
                </div>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <Button variant="ghost" data-testid="wizard-back" onClick={() => setParams({ step: 1 })}>← Back</Button>
                  <Button data-testid="wizard-next" disabled={!scenario} onClick={() => setParams({ step: 3 })}>Review →</Button>
                </div>
              </>
            )}

            {step === 3 && company && persona && validDiscipline && (
              <>
                <Card tone="tinted" padding="md" className="gap-2">
                  <Text variant="caption">Your interview</Text>
                  <Text variant="h4" as="h3">{company.companyName} · {persona.role} · {DISCIPLINE_META[validDiscipline].label}</Text>
                  {scenario ? <p className="font-headline text-body font-bold text-ink-strong">{scenario.title}</p> : <Text variant="ui">Persona-led interview. Hatch opens with a prompt from {company.companyName}&apos;s {persona.role} loop.</Text>}
                  {persona.interviewStyle && <Text variant="ui" tone="secondary">{persona.interviewStyle}</Text>}
                  <div className="flex flex-wrap gap-1.5 pt-1">{scenario && <Badge tone="difficulty" value={scenario.difficulty} className="capitalize">{scenario.difficulty}</Badge>}<Badge tone="neutral">~{scenario?.estimatedMinutes ?? persona.estimatedMins ?? 35} min</Badge><Badge tone="neutral">{DISCIPLINE_META[validDiscipline].artifact === 'none' ? 'Voice or chat' : DISCIPLINE_META[validDiscipline].artifact === 'canvas' ? 'Canvas' : 'Editor'}</Badge></div>
                </Card>
                <div className="mt-3 flex items-start gap-2 text-ui font-ui text-ink-secondary"><Mic size={16} aria-hidden className="mt-0.5 shrink-0" />Voice or chat, your choice. The microphone is optional and can be switched on after the session opens.</div>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <Button variant="ghost" data-testid="wizard-back" onClick={() => setParams({ step: disciplineScenarios.length ? 2 : 1 })}>← Back</Button>
                  <StartInterviewButton variant="primary" testId="wizard-start" label="Start interview" companyId={persona.companyId} roleId={persona.role} challengeId={scenario?.id} companyName={persona.companyName} discipline={validDiscipline} onBeforeStart={rememberSetup} />
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {mode === 'single' && step === 1 && <RecentSessionsList sessions={recentSessions.slice(0, 8)} total={recentSessions.length} />}
    </div>
  )
}
