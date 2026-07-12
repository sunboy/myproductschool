import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLearnModuleSummaries } from '@/lib/data/learn-modules'
import { DIFFICULTY_LABELS, type PracticeDifficulty } from '@/lib/practice/difficulty'
import type { LearnModule, LearnModuleWithProgress } from '@/lib/types'
import { BackButton } from '@/components/navigation/BackButton'
import { HatchImage } from '@/components/redesign/HatchImage'
import { HatchSays } from '@/components/redesign/HatchSays'
import { NoteCard } from '@/components/redesign/NoteCard'
import { ProTipStrip } from '@/components/redesign/ProTipStrip'

// Guides hub — compact dense dark hero band per spec §1 amendment (the three
// library hubs keep the approved previews' dark heroes; guides-hub-1440.png).
// Module grid comes straight from getLearnModuleSummaries; the
// continue-reading band is real per-user chapter progress from
// user_learn_progress (same source /api/learn uses), rendered only when a
// module is genuinely in progress.

function tintFromHex(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default async function ModulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const modulesRaw = await getLearnModuleSummaries().catch(() => [] as LearnModule[])

  // Real per-user chapter progress, same table/shape as /api/learn.
  let completedByModule: Record<string, number> = {}
  if (user) {
    try {
      const admin = createAdminClient()
      const { data: progress } = await admin
        .from('user_learn_progress')
        .select('module_id')
        .eq('user_id', user.id)
      for (const p of progress ?? []) {
        completedByModule[p.module_id] = (completedByModule[p.module_id] ?? 0) + 1
      }
    } catch {
      completedByModule = {}
    }
  }

  const modules: LearnModuleWithProgress[] = modulesRaw.map(m => ({
    ...m,
    completed_chapters: completedByModule[m.id] ?? 0,
    progress_percentage: m.chapter_count > 0
      ? Math.round(((completedByModule[m.id] ?? 0) / m.chapter_count) * 100)
      : 0,
  }))

  // Continue-reading band: only a module the user has genuinely started and
  // not finished. No fabricated progress — if nothing qualifies, band omits.
  const inProgress = modules
    .filter(m => m.completed_chapters > 0 && m.progress_percentage < 100)
    .sort((a, b) => b.progress_percentage - a.progress_percentage)
  const continueModule = inProgress[0] ?? null
  const resumeChapterNumber = continueModule ? continueModule.completed_chapters + 1 : null

  const totalChapters = modules.reduce((sum, m) => sum + (m.chapter_count ?? 0), 0)
  const totalMinutes = modules.reduce((sum, m) => sum + (m.est_minutes ?? 0), 0)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 48px' }}>
      <BackButton href="/explore" label="Back to Explore" className="mb-4" />

      {/* ── Compact dense dark hero band (guides-hub-1440.png) ── */}
      <div
        className="relative mb-5 overflow-hidden rounded-2xl px-[26px] py-6 text-white"
        style={{
          background:
            'linear-gradient(120deg, var(--color-forest-950) 0%, var(--color-forest-900) 45%, var(--color-forest-850) 75%, var(--color-forest-700) 130%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-[420px] w-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(30,71,45,.55) 0%, rgba(30,71,45,0) 70%)' }}
        />
        <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="min-w-0 lg:pr-32">
            <div className="mb-2 font-label text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-mint-glow">
              Guides
            </div>
            <h1 className="mb-2 max-w-[26ch] font-headline text-[30px] font-semibold leading-[1.18] text-on-hero-strong">
              Read the theory. Then go train it.
            </h1>
            <p className="max-w-[54ch] text-[13px] leading-[1.5] text-white/72">
              Short, sharp chapters on the frameworks behind every challenge
              {modules.length > 0 ? `: ${modules.length} guides` : ''}
              {totalChapters > 0 ? `, ${totalChapters} chapters` : ''}
              {totalMinutes > 0 ? `, about ${totalMinutes} minutes end to end` : ''}.
            </p>
          </div>

          <div className="relative flex items-center lg:col-start-2">
            <div className="pointer-events-none absolute -left-[150px] bottom-[-28px] z-[1] hidden w-[132px] lg:block">
              <HatchImage state="reading" size={132} priority className="drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" />
            </div>
            {(continueModule || modules.length > 0) && (
              <HatchSays
                className="relative z-10 w-full"
                tint="mint"
                message={
                  continueModule
                    ? `You're ${continueModule.completed_chapters} ${
                        continueModule.completed_chapters === 1 ? 'chapter' : 'chapters'
                      } into ${continueModule.name}. Chapter ${resumeChapterNumber} is next.`
                    : `Start with ${modules[0].name}: ${modules[0].chapter_count} chapters, about ${modules[0].est_minutes} minutes.`
                }
                ctaLabel={continueModule ? `Resume chapter ${resumeChapterNumber}` : 'Start reading'}
                ctaHref={`/explore/modules/${(continueModule ?? modules[0]).slug}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Continue reading (real progress only) ── */}
      {continueModule && (
        <NoteCard
          tint="amber"
          className="mb-5 flex flex-col gap-3 px-[18px] py-3 md:flex-row md:items-center md:gap-4"
        >
          <div className="flex min-w-0 items-center gap-4 md:flex-1">
            <span className="font-label shrink-0 whitespace-nowrap text-[11.5px] font-bold text-on-surface-muted">
              In progress
            </span>
            <span className="h-4 w-px shrink-0 bg-outline-variant" aria-hidden="true" />
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="font-body truncate text-sm font-bold text-on-surface">
                {continueModule.name}
              </span>
              <span className="font-label min-w-0 truncate text-xs font-semibold tabular-nums text-on-surface-muted">
                {continueModule.tagline ? `${continueModule.tagline} · ` : ''}Ch. {continueModule.completed_chapters} of {continueModule.chapter_count}
              </span>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 md:w-[130px]">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-outline-variant/60">
              <div
                className="h-full rounded-full"
                style={{ width: `${continueModule.progress_percentage}%`, background: continueModule.accent_color }}
              />
            </div>
            <span className="font-label shrink-0 text-[11px] font-extrabold tabular-nums text-on-surface-variant">
              {continueModule.progress_percentage}%
            </span>
          </div>
          <Link
            href={`/explore/modules/${continueModule.slug}`}
            className="font-label inline-flex shrink-0 items-center gap-1.5 self-start whitespace-nowrap rounded-[8px] px-[18px] py-2.5 text-[12.5px] font-extrabold text-white md:self-auto"
            style={{ background: 'var(--color-forest-950, #052316)' }}
          >
            Resume chapter {resumeChapterNumber}
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </NoteCard>
      )}

      {/* ── Section head ── */}
      <div className="mb-1 mt-1 flex items-baseline justify-between">
        <div>
          <h2 className="font-body" style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface, #20291f)', margin: 0 }}>
            All guides
          </h2>
          {modules.length > 0 && (
            <p className="font-label mt-0.5 text-[12.5px] text-on-surface-muted">
              {totalChapters > 0 ? `${totalChapters} chapters total` : `${modules.length} guides`}
              {totalMinutes > 0 ? `, ${totalMinutes} minutes end to end` : ''}
            </p>
          )}
        </div>
      </div>

      {/* ── Module grid ── */}
      {modules.length === 0 ? (
        <div className="font-label py-16 text-center text-sm text-on-surface-muted">
          No guides published yet.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(module => {
            const diff = (module.difficulty ?? 'easy') as PracticeDifficulty
            const diffLabel = DIFFICULTY_LABELS[diff] ?? DIFFICULTY_LABELS.easy
            const hasProgress = module.completed_chapters > 0
            const isComplete = hasProgress && module.progress_percentage >= 100
            const ctaLabel = isComplete
              ? 'Read again'
              : hasProgress
              ? `Resume chapter ${module.completed_chapters + 1}`
              : 'Start reading'

            return (
              <Link
                key={module.id}
                href={`/explore/modules/${module.slug}`}
                className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface no-underline"
              >
                {/* Cover band: tinted surface with the module title as the mark.
                    Letter-initial covers are banned (spec §8) — the accent
                    lives in the title text color, never an initial square. */}
                <div
                  className="flex items-center px-4"
                  style={{ minHeight: 68, background: tintFromHex(module.cover_color, 0.12) }}
                >
                  <span
                    className="font-body py-3 text-[15.5px] font-bold leading-snug"
                    style={{
                      color: module.accent_color,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {module.name}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  {module.tagline && (
                    <div
                      className="font-body mb-3 text-[13px] leading-relaxed text-on-surface-variant"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {module.tagline}
                    </div>
                  )}
                  <div className="font-label mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold tabular-nums text-on-surface-muted">
                    <span>{module.chapter_count} ch</span>
                    <span className="size-[3px] shrink-0 rounded-full bg-on-surface-muted" aria-hidden="true" />
                    <span>{module.est_minutes} min</span>
                    <span
                      className="ml-0.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold"
                      style={{
                        color: diff === 'hard' ? '#b83230' : diff === 'medium' ? '#9d6a1a' : 'var(--color-forest-700, #1d432b)',
                        background: diff === 'hard' ? '#fbe4e2' : diff === 'medium' ? 'var(--color-amber-soft, #fef3e2)' : '#e8f4de',
                        border: `1.5px solid ${diff === 'hard' ? '#b83230' : diff === 'medium' ? '#9d6a1a' : 'var(--color-forest-700, #1d432b)'}`,
                      }}
                    >
                      {diffLabel}
                    </span>
                  </div>
                  <span className="font-label mt-auto inline-flex items-center justify-center gap-1.5 rounded-[8px] border border-outline-variant bg-surface py-2.5 text-[13px] font-extrabold text-on-surface">
                    {ctaLabel}
                    <ArrowRight size={13} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            )
          })}
          {/* Quiet closing cell per preview: teal info note, text only. */}
          <NoteCard
            tint="teal"
            className="flex items-center justify-center rounded-xl px-5 py-6"
          >
            <span className="font-body text-center text-sm font-bold text-on-surface-variant">
              More guides are being written
            </span>
          </NoteCard>
        </div>
      )}

      <ProTipStrip
        lead="Theory decays fast."
        tip="A framework you read but never use fades within the week. After a chapter, run one challenge that grades against it."
        ctaLabel="Pick a challenge"
        ctaHref="/challenges"
      />
    </div>
  )
}
