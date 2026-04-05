'use client'

import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useLearnModules } from '@/hooks/useLearnModules'
import { useStudyPlans } from '@/hooks/useStudyPlans'
import type { LearnModuleWithProgress, StudyPlan, DomainWithProgress } from '@/lib/types'
import { useEffect, useState } from 'react'

const PARADIGMS = [
  { name: 'Traditional',  description: 'Metrics, trade-offs, prioritization — the foundation every engineer needs.', icon: 'architecture', borderColor: '#4a7c59', example: "DAU/MAU looks great but revenue is flat. What's going on?", count: 'Core collection', href: '/challenges?paradigm=traditional' },
  { name: 'AI-Assisted',  description: 'When to trust AI output, how to validate, keeping human judgment sharp.', icon: 'smart_toy', borderColor: '#5b8fbe', example: 'Copilot code passes tests but has a subtle security flaw.', count: 'Growing library', href: '/challenges?paradigm=ai-assisted' },
  { name: 'Agentic',      description: 'Multi-step AI systems — agents, evals, failure modes, trust boundaries.', icon: 'hub', borderColor: '#7c6f9e', example: 'Your agent auto-approved 40 refunds overnight. 3 were fraudulent.', count: 'Growing library', href: '/challenges?paradigm=agentic' },
  { name: 'AI-Native',    description: "Products that couldn't exist without AI — new interaction models and risks.", icon: 'neurology', borderColor: '#b87c4a', example: 'Your AI tutor hallucinates history. Ship or hold?', count: 'Growing library', href: '/challenges?paradigm=ai-native' },
]

function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{title}</h2>
      {viewAllHref && (
        <Link href={viewAllHref} className="font-label text-xs font-bold text-primary hover:underline">View all →</Link>
      )}
    </div>
  )
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  )
}

function ParadigmCard({ name, description, icon, borderColor, example, count, href }: typeof PARADIGMS[0]) {
  return (
    <Link href={href} className="flex flex-col gap-2 bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-colors" style={{ borderLeft: `3px solid ${borderColor}` }}>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-lg shrink-0" style={{ color: borderColor, fontVariationSettings: "'FILL' 0" }}>{icon}</span>
        <span className="font-label text-sm font-bold text-on-surface">{name}</span>
        <span className="ml-auto font-label text-[10px] text-on-surface-variant shrink-0">{count}</span>
      </div>
      <p className="font-body text-xs text-on-surface-variant leading-relaxed">{description}</p>
      <p className="font-body text-[10px] text-on-surface-variant italic opacity-70">&quot;{example}&quot;</p>
    </Link>
  )
}

function ModuleCard({ module }: { module: LearnModuleWithProgress }) {
  return (
    <Link href={`/learn/${module.slug}`} className="flex flex-col gap-2 bg-surface-container rounded-xl p-4 shrink-0 w-44 hover:bg-surface-container-high transition-colors">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: (module.cover_color ?? '#4a7c59') + '33' }}>
        <span className="material-symbols-outlined text-base" style={{ color: module.cover_color ?? '#4a7c59', fontVariationSettings: "'FILL' 0" }}>auto_stories</span>
      </div>
      <div className="font-label text-sm font-bold text-on-surface leading-snug line-clamp-2">{module.name}</div>
      <div className="font-body text-xs text-on-surface-variant line-clamp-1">{module.tagline}</div>
      {module.completed_chapters > 0 && (
        <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden mt-auto">
          <div className="h-full bg-primary rounded-full" style={{ width: `${module.progress_percentage}%` }} />
        </div>
      )}
      <div className="font-label text-[10px] text-on-surface-variant mt-auto">
        {module.completed_chapters > 0 ? `${module.completed_chapters}/${module.chapter_count} done` : `~${module.est_minutes} min`}
      </div>
    </Link>
  )
}

function DomainPill({ domain }: { domain: DomainWithProgress }) {
  return (
    <Link href={`/domains/${domain.slug}`} className="flex flex-col items-center gap-1.5 shrink-0 w-20 py-3 px-2 rounded-xl hover:bg-surface-container transition-colors text-center">
      <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center">
        <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{domain.icon ?? 'category'}</span>
      </div>
      <span className="font-label text-xs font-bold text-on-surface leading-tight">{domain.title}</span>
      <span className="font-label text-[10px] text-on-surface-variant">{domain.challenge_count} challenges</span>
    </Link>
  )
}

function PlanCard({ plan }: { plan: StudyPlan }) {
  return (
    <Link href={`/learn/plans/${plan.slug}`} className="flex flex-col gap-2 bg-surface-container rounded-xl p-4 shrink-0 w-52 hover:bg-surface-container-high transition-colors">
      <div className="flex gap-1.5 flex-wrap">
        {plan.move_tag && <span className="font-label text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary capitalize">{plan.move_tag}</span>}
        {plan.role_tags?.slice(0, 1).map(r => <span key={r} className="font-label text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">{r}</span>)}
      </div>
      <div className="font-label text-sm font-bold text-on-surface leading-snug">{plan.title}</div>
      <div className="font-body text-xs text-on-surface-variant line-clamp-2">{plan.description ?? ''}</div>
      <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden mt-auto">
        <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
      </div>
      <div className="font-label text-[10px] text-on-surface-variant">{plan.challenge_count ?? 0} challenges · ~{plan.estimated_hours} hrs</div>
    </Link>
  )
}

export default function LearnPage() {
  const { modules, isLoading: modulesLoading } = useLearnModules()
  const { plans, isLoading: plansLoading } = useStudyPlans()
  const [domains, setDomains] = useState<DomainWithProgress[]>([])

  useEffect(() => {
    fetch('/api/domains')
      .then(r => r.ok ? r.json() : {})
      .then((data: unknown) => {
        // API returns { domains: [...] } shape
        const typed = data as { domains?: DomainWithProgress[] } | DomainWithProgress[] | null
        const list = Array.isArray(typed) ? typed : ((typed as { domains?: DomainWithProgress[] })?.domains ?? [])
        setDomains(list)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-10">
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface mb-1">Learn</h1>
        <p className="font-body text-sm text-on-surface-variant">Orient yourself, build theory, follow a structured path.</p>
      </div>

      {/* Paradigms — 2×2 grid, always 4 */}
      <section>
        <SectionHeader title="Paradigms" />
        <div className="grid grid-cols-2 gap-3">
          {PARADIGMS.map(p => <ParadigmCard key={p.name} {...p} />)}
        </div>
      </section>

      {/* Luma nudge */}
      <div className="flex items-center gap-3 bg-primary-fixed rounded-xl px-4 py-3">
        <LumaGlyph size={28} state="speaking" className="text-primary shrink-0" />
        <p className="font-body text-xs text-on-surface leading-relaxed">
          Start with <strong>Traditional</strong> — it builds the core framing muscle that all other paradigms depend on.
        </p>
      </div>

      {/* Course Modules */}
      <section>
        <SectionHeader title="Course Modules" viewAllHref="/learn/modules" />
        {modulesLoading ? (
          <div className="flex gap-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="w-44 h-36 shrink-0 bg-surface-container rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <HorizontalScroll>
            {modules.slice(0, 8).map(m => <ModuleCard key={m.id} module={m} />)}
          </HorizontalScroll>
        )}
      </section>

      {/* Domains */}
      <section>
        <SectionHeader title="Domains" viewAllHref="/learn/domains" />
        <HorizontalScroll>
          {domains.length === 0
            ? Array(6).fill(0).map((_, i) => <div key={i} className="w-20 h-24 shrink-0 bg-surface-container rounded-xl animate-pulse" />)
            : domains.slice(0, 10).map(d => <DomainPill key={d.id} domain={d} />)
          }
        </HorizontalScroll>
      </section>

      {/* Study Plans */}
      <section>
        <SectionHeader title="Study Plans" viewAllHref="/learn/plans" />
        {plansLoading ? (
          <div className="flex gap-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="w-52 h-36 shrink-0 bg-surface-container rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <HorizontalScroll>
            {plans.slice(0, 6).map(p => <PlanCard key={p.id} plan={p} />)}
          </HorizontalScroll>
        )}
      </section>
    </div>
  )
}
