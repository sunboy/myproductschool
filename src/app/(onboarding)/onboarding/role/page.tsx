'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { getOnboardingState, saveOnboardingState } from '@/lib/onboarding/state-client'

const ROLES = [
  {
    id: 'swe',
    icon: 'terminal',
    title: 'Software Engineer',
    badge: 'SWE',
    color: '#4a7c59',
    tracks: ['Coding', 'System design', 'Product sense'],
    description: 'Turn strong execution into stronger product judgment.',
  },
  {
    id: 'data_eng',
    icon: 'storage',
    title: 'Data Engineer',
    badge: 'Data Eng',
    color: '#7a5c2e',
    tracks: ['SQL', 'Data modeling', 'Product sense'],
    description: 'Make data contracts and product metrics impossible to ignore.',
  },
  {
    id: 'ml_eng',
    icon: 'model_training',
    title: 'ML Engineer',
    badge: 'ML Eng',
    color: '#6d4cc2',
    tracks: ['System design', 'Data modeling', 'Product sense'],
    description: 'Translate model choices into product impact and risk.',
  },
  {
    id: 'devops',
    icon: 'settings_suggest',
    title: 'DevOps / Platform',
    badge: 'Platform',
    color: '#3b6ed4',
    tracks: ['System design', 'Coding', 'Product sense'],
    description: 'Connect reliability work to user trust and business outcomes.',
  },
  {
    id: 'em',
    icon: 'groups',
    title: 'Engineering Manager',
    badge: 'EM',
    color: '#c9933a',
    tracks: ['Product sense', 'System design', 'Interview loops'],
    description: 'Coach teams toward better calls, not just faster delivery.',
  },
  {
    id: 'founding_eng',
    icon: 'rocket_launch',
    title: 'Founding Engineer',
    badge: 'Founder',
    color: '#c66a3b',
    tracks: ['Product sense', 'Coding', 'SQL'],
    description: 'When there is no product team, Hatch becomes your sparring partner.',
  },
  {
    id: 'tech_lead',
    icon: 'account_tree',
    title: 'Tech Lead',
    badge: 'Lead',
    color: '#2f8b74',
    tracks: ['System design', 'Data modeling', 'Product sense'],
    description: 'Make architecture, scope, and sequencing legible to everyone.',
  },
  {
    id: 'pm',
    icon: 'track_changes',
    title: 'Product Manager',
    badge: 'PM',
    color: '#4a7c59',
    tracks: ['Product sense', 'SQL', 'System design'],
    description: 'Get technical enough to pressure-test the work you ask for.',
  },
  {
    id: 'designer',
    icon: 'palette',
    title: 'Product Designer',
    badge: 'Design',
    color: '#a878d6',
    tracks: ['Product sense', 'Data modeling', 'Interview loops'],
    description: 'Pair user empathy with sharper decision and metric sense.',
  },
  {
    id: 'data_scientist',
    icon: 'query_stats',
    title: 'Data Scientist',
    badge: 'Data Sci',
    color: '#5a3a7c',
    tracks: ['SQL', 'Data modeling', 'Product sense'],
    description: 'Turn analyses into decisions people actually change course for.',
  },
] as const

type RoleId = typeof ROLES[number]['id']

const STEPS = [
  { label: 'Role', active: true },
  { label: 'Calibration', active: false },
  { label: 'Plan', active: false },
] as const

export default function RoleSelectionPage() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const selected = ROLES.find(role => role.id === selectedRole)

  useEffect(() => {
    let cancelled = false

    getOnboardingState<{ selectedRole?: string | null }>()
      .then(state => {
        if (cancelled || state?.step !== '/onboarding/role') return
        const role = state.data?.selectedRole
        if (typeof role === 'string' && ROLES.some(item => item.id === role)) {
          setSelectedRole(role as RoleId)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedRole || isLoading) return
    const timeout = window.setTimeout(() => {
      saveOnboardingState('/onboarding/role', { selectedRole }).catch(() => {})
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [isLoading, selectedRole])

  useEffect(() => {
    let cleanup = () => {}

    import('gsap').then(({ gsap }) => {
      if (!rootRef.current) return
      const ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>('[data-gsap="role-card"]')
        gsap.fromTo(cards, {
          opacity: 0,
          y: 18,
          scale: 0.98,
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.045,
          clearProps: 'opacity,transform',
        })
        gsap.to('[data-gsap="scanline"]', {
          xPercent: 120,
          duration: 2.8,
          repeat: -1,
          ease: 'none',
        })
      }, rootRef)
      cleanup = () => ctx.revert()
    }).catch(() => {})

    return () => cleanup()
  }, [])

  async function handleNext() {
    if (!selectedRole) return
    setIsLoading(true)
    try {
      await fetch('/api/onboarding/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
    } catch {
      // Calibration can still continue in mock/offline mode.
    } finally {
      await saveOnboardingState('/calibration', {
        selectedRole,
        screen: 'intro',
        answers: {},
      }).catch(() => null)
      router.push('/calibration')
    }
  }

  return (
    <div ref={rootRef} className="min-h-screen bg-background px-5 py-7">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/onboarding/welcome" className="flex items-center gap-2 text-primary no-underline">
            <HatchGlyph size={30} state="idle" className="text-primary" />
            <span className="font-headline text-xl font-black">HackProduct</span>
          </Link>
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.label} className="flex items-center gap-2">
                <span
                  className={[
                    'inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-label font-black',
                    step.active ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant',
                  ].join(' ')}
                >
                  {index + 1}
                </span>
                <span className={step.active ? 'text-xs font-black text-primary' : 'hidden text-xs font-bold text-on-surface-variant sm:inline'}>
                  {step.label}
                </span>
                {index < STEPS.length - 1 && <span className="h-px w-8 bg-outline-variant" />}
              </div>
            ))}
          </div>
        </header>

        <main className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-6 max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-label font-black uppercase tracking-[0.12em] text-primary">
                <span className="material-symbols-outlined text-[14px]">radar</span>
                Pick your starting loadout
              </div>
              <h1 className="m-0 font-headline text-[38px] font-black leading-none text-on-surface sm:text-[52px]">
                What work should Hatch optimize for?
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-on-surface-variant">
                Your role changes the order of reps, not the ambition. Hatch will still measure the full surface: product, systems, data, SQL, and code.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {ROLES.map(role => {
                const isSelected = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    data-gsap="role-card"
                    data-hatch-sound={isSelected ? undefined : 'nudge'}
                    onClick={() => setSelectedRole(role.id)}
                    aria-pressed={isSelected}
                    className={[
                      'group relative min-h-[194px] overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                      isSelected
                        ? 'border-primary bg-primary-fixed shadow-[0_18px_38px_-28px_rgba(74,124,89,0.75)]'
                        : 'border-outline-variant/55 bg-surface-container-low hover:-translate-y-0.5 hover:bg-surface-container',
                    ].join(' ')}
                  >
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10" style={{ background: role.color }} />
                    <div className="relative flex items-start justify-between gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: role.color }}>
                        <span className="material-symbols-outlined text-[23px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {role.icon}
                        </span>
                      </span>
                      <span className="rounded-full bg-background/80 px-2 py-1 text-[10px] font-label font-black uppercase tracking-[0.08em] text-on-surface-variant">
                        {role.badge}
                      </span>
                    </div>
                    <h2 className="relative mt-5 font-headline text-[19px] font-bold leading-tight text-on-surface">
                      {role.title}
                    </h2>
                    <p className="relative mt-2 text-[13px] font-semibold leading-snug text-on-surface-variant">
                      {role.description}
                    </p>
                    <div className="relative mt-4 flex flex-wrap gap-1.5">
                      {role.tracks.map(track => (
                        <span key={track} className="rounded-md bg-background/70 px-2 py-1 text-[10px] font-label font-black text-on-surface-variant">
                          {track}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <aside className="lg:sticky lg:top-7 lg:self-start">
            <div className="relative overflow-hidden rounded-[28px] border border-outline-variant bg-[#1e3528] p-5 text-[#f3ede0]">
              <div data-gsap="scanline" className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="relative flex items-start gap-3">
                <HatchGlyph size={52} state={selected ? 'speaking' : 'listening'} className="shrink-0 text-primary-fixed-dim" />
                <div>
                  <div className="font-label text-[11px] font-black uppercase tracking-[0.12em] text-[#9ee0b8]">
                    Hatch preview
                  </div>
                  <h2 className="mt-1 font-headline text-[22px] font-bold leading-tight">
                    {selected ? `I will tune this for ${selected.title}.` : 'Choose a role and I will tune the quest.'}
                  </h2>
                </div>
              </div>

              <div className="relative mt-6 grid gap-2">
                {(selected?.tracks ?? ['Product sense', 'System design', 'Data modeling', 'SQL', 'Coding']).map((track, index) => (
                  <div key={track} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.075] px-3 py-2.5">
                    <span className="text-xs font-label font-bold">{track}</span>
                    <span className="text-[11px] font-label font-black text-[#9ee0b8]">
                      {index === 0 ? 'primary' : 'included'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                data-hatch-sound="submit"
                disabled={!selectedRole || isLoading}
                className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-label font-black text-on-primary transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isLoading ? 'Saving role...' : 'Start the Hatch quest'}
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
              <Link
                href="/dashboard"
                data-hatch-sound="close"
                className="relative mt-3 flex justify-center text-xs font-label font-bold text-[#f3ede0]/60 no-underline hover:text-[#f3ede0]"
              >
                Skip calibration for now
              </Link>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
