import Link from 'next/link'

interface PlanItem {
  title: string
  sub: string
  diff: string
  color: string
  bg: string
  enrolled: number
  icon: string
  slug: string
}

interface PersonalisedPlan {
  slug: string
  title: string
  description: string | null
  move_tag: string | null
}

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#4a7c59',
  Intermediate: '#c9933a',
  Advanced: '#b83230',
}

const MOVE_ICON: Record<string, string> = {
  frame: 'center_focus_strong',
  list: 'format_list_bulleted',
  optimize: 'tune',
  win: 'emoji_events',
}

function PlanTexture({ color, dark = false }: { color: string; dark?: boolean }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30 transition-transform duration-500 group-hover:scale-[1.03]" viewBox="0 0 260 180" fill="none" aria-hidden="true">
      <path d="M-18 132 C38 70, 96 166, 152 90 S230 38, 282 92" stroke={color} strokeWidth="5" strokeLinecap="round" opacity={dark ? '0.25' : '0.16'} />
      <path d="M28 42 H232 M52 76 H176 M24 112 H238" stroke={dark ? '#f3ede0' : '#2e3230'} strokeWidth="1" strokeDasharray="3 10" opacity={dark ? '0.18' : '0.12'} />
      <circle cx="214" cy="48" r="30" fill={color} opacity={dark ? '0.10' : '0.12'} />
      <rect x="166" y="108" width="48" height="48" rx="14" fill={color} opacity={dark ? '0.08' : '0.10'} />
    </svg>
  )
}

function StudyPlanCard({ pl, index }: { pl: PlanItem; index: number }) {
  return (
    <Link
      href={`/explore/plans/${pl.slug}`}
      data-hatch-sound="open"
      className="animate-fade-in-up group relative flex min-h-[164px] flex-col justify-between overflow-hidden rounded-xl border border-outline-variant/35 p-4 no-underline shadow-[0_18px_42px_-34px_rgba(46,50,48,0.78)] ring-1 ring-white/35 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_30px_58px_-36px_rgba(46,50,48,0.9)]"
      style={{ background: pl.bg, animationDelay: `${index * 60}ms` }}
    >
      <PlanTexture color={pl.color} />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-[0_12px_24px_-18px_rgba(0,0,0,0.72)]" style={{ background: pl.color }}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
              {pl.icon}
            </span>
          </span>
          <span
            className="rounded-md bg-white/52 px-2 py-0.5 font-label text-[10px] font-extrabold uppercase tracking-[0.08em] ring-1 ring-black/5"
            style={{ color: DIFF_COLOR[pl.diff] ?? pl.color }}
          >
            {pl.diff}
          </span>
        </div>

        <div className="font-headline text-[17px] font-bold leading-tight text-[#1e1b14]">
          {pl.title}
        </div>
        <div className="mt-1 text-[12.5px] font-label font-semibold leading-snug text-black/55">
          {pl.sub}
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3">
        {pl.enrolled >= 10 ? (
          <span className="inline-flex items-center gap-1.5 font-label text-[12px] font-bold text-black/50">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            {pl.enrolled.toLocaleString()} enrolled
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-label text-[12px] font-extrabold text-white shadow-[0_10px_20px_-16px_rgba(0,0,0,0.75)]" style={{ background: pl.color }}>
          Start
          <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
        </span>
      </div>
    </Link>
  )
}

function PersonalisedPlanCard({ plan }: { plan: PersonalisedPlan }) {
  const move = plan.move_tag ?? ''
  const icon = MOVE_ICON[move] ?? 'route'

  return (
    <Link
      href={`/explore/plans/${plan.slug}`}
      data-hatch-sound="open"
      className="animate-fade-in-up group relative flex min-h-[164px] flex-col justify-between overflow-hidden rounded-xl border border-[#7ee099]/20 bg-[#1e3528] p-4 no-underline shadow-[0_24px_50px_-34px_rgba(30,53,40,0.95)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[#7ee099]/35 hover:shadow-[0_34px_66px_-38px_rgba(30,53,40,1)]"
    >
      <PlanTexture color="#7ee099" dark />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a7c59] text-white shadow-[0_12px_24px_-18px_rgba(0,0,0,0.78)]">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
              {icon}
            </span>
          </span>
          <span className="rounded-md bg-[#7ee099]/12 px-2 py-0.5 font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#9ee0b8] ring-1 ring-[#7ee099]/18">
            Your plan
          </span>
        </div>

        <div className="font-headline text-[17px] font-bold leading-tight text-[#f3ede0]">
          {plan.title}
        </div>
        <div className="mt-1 line-clamp-2 text-[12.5px] font-label font-semibold leading-snug text-[#f3ede0]/58">
          {plan.description ?? 'Sequenced across product, systems, data, SQL, and coding based on your FLOW profile.'}
        </div>
      </div>

      <div className="relative mt-5 flex justify-end">
        <span className="inline-flex items-center gap-1 rounded-md bg-[#4a7c59] px-2.5 py-1 font-label text-[12px] font-extrabold text-white shadow-[0_10px_20px_-16px_rgba(0,0,0,0.78)]">
          Continue
          <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
        </span>
      </div>
    </Link>
  )
}

export function StudyPlanGrid({ plans, personalisedPlan }: { plans: PlanItem[]; personalisedPlan?: PersonalisedPlan | null }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {personalisedPlan && <PersonalisedPlanCard plan={personalisedPlan} />}
      {plans.map((pl, index) => (
        <StudyPlanCard key={pl.title} pl={pl} index={index + (personalisedPlan ? 1 : 0)} />
      ))}
    </div>
  )
}
