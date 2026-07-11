import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Home,
  Compass,
  Mic,
  BookOpen,
  ChartColumn,
  Users,
  ChartLine,
  CircleHelp,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HatchImage } from '@/components/redesign/HatchImage'

export type SidebarItem =
  | 'home'
  | 'practice'
  | 'interviews'
  | 'study-plans'
  | 'progress'
  | 'community'
  | 'analytics'

export type PlanTier = 'free' | 'pro'

interface NavEntry {
  key: SidebarItem
  label: string
  href: string
  icon: typeof Home
  /** Only the Interviews item shows the Live pill, per spec §Shell anatomy. */
  showLivePill?: boolean
}

const NAV_ENTRIES: NavEntry[] = [
  { key: 'home', label: 'Home', href: '/dashboard', icon: Home },
  { key: 'practice', label: 'Practice', href: '/challenges', icon: Compass },
  { key: 'interviews', label: 'Interviews', href: '/live-interviews', icon: Mic, showLivePill: true },
  { key: 'study-plans', label: 'Study Plans', href: '/explore/plans', icon: BookOpen },
  { key: 'progress', label: 'Progress', href: '/progress', icon: ChartColumn },
  { key: 'community', label: 'Community', href: '/cohort', icon: Users },
  { key: 'analytics', label: 'Analytics', href: '/challenges?discipline=cc_analytics', icon: ChartLine },
]

export interface AppSidebarProps {
  /** Which nav item is highlighted with the forest-800 active pill. */
  active: SidebarItem
  /** Free users see the Go Pro card; Pro users never do (spec §3). */
  planTier: PlanTier
  /** One-line status Hatch shows under its name in the coach card, e.g. "Has notes on your Frame step". */
  coachLine: string
  /**
   * Pro users only: an optional second status line under coachLine (the
   * freed sidebar slot may grow the coach card by one line instead of
   * showing filler, per spec §3).
   */
  coachLineSecondary?: string
  /**
   * Escape hatch for callers that want to render something other than the
   * default Go Pro card in the freed slot (spec §3: "nothing, or the Hatch
   * coach card grows one line — never a filler card"). Only used when
   * planTier === 'pro'. Omit entirely to render nothing.
   */
  proSlot?: ReactNode
  /** Called when the upgrade button is clicked (free tier only). */
  onUpgradeClick?: () => void
  /** Called when Help & Support is clicked. */
  onHelpClick?: () => void
  className?: string
}

/**
 * Left app sidebar (≈232px), per docs/redesign/round4-codex-direction/spec.md
 * "Shell anatomy" and previews/round4/dashboard.html .sidebar block.
 */
export function AppSidebar({
  active,
  planTier,
  coachLine,
  coachLineSecondary,
  proSlot,
  onUpgradeClick,
  onHelpClick,
  className,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-[232px] shrink-0 flex-col gap-5 border-r border-hairline bg-white p-4',
        className
      )}
    >
      <div className="px-2">
        <div className="flex items-baseline gap-1 font-headline text-[21px] font-bold text-ink-strong">
          HackProduct
        </div>
        <div className="mt-0.5 text-[11.5px] text-ink-muted">The practice gym for product thinking</div>
      </div>

      <nav className="mt-2 flex flex-col gap-0.5">
        {NAV_ENTRIES.map((entry) => {
          const Icon = entry.icon
          const isActive = entry.key === active
          return (
            <Link
              key={entry.key}
              href={entry.href}
              aria-current={isActive ? 'page' : undefined}
              data-hatch-target={entry.key === 'home' ? 'nav-dashboard' : `nav-${entry.key}`}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-secondary transition-colors',
                isActive && 'bg-forest-800 text-white'
              )}
            >
              <Icon size={18} strokeWidth={1.8} className={cn('shrink-0', isActive ? 'opacity-100' : 'opacity-85')} />
              {entry.label}
              {entry.showLivePill && (
                <span className="ml-auto rounded-full bg-amber-soft px-[7px] py-0.5 text-[10px] font-extrabold uppercase tracking-[0.03em] text-flame">
                  Live
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3.5">
        <div className="rounded-xl border border-hairline bg-card-bright p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-forest-900 p-[3px]">
              <HatchImage state="avatar" size={30} />
            </div>
            <div>
              <div className="text-[13.5px] font-bold text-ink-strong">Hatch</div>
              <div className="text-[11.5px] text-ink-muted">AI Coach</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-ink-secondary">
            <span className="size-[7px] shrink-0 rounded-full bg-forest-600" />
            {coachLine}
          </div>
          {coachLineSecondary && (
            <div className="mt-1.5 text-[11.5px] leading-[1.4] text-ink-secondary">{coachLineSecondary}</div>
          )}
        </div>

        {planTier === 'free' && (
          <div className="rounded-xl border border-hairline bg-card-bright p-4 text-ink-strong">
            <div className="mb-[3px] text-[14.5px] font-bold">Go Pro</div>
            <div className="mb-3 text-xs leading-[1.4] text-ink-secondary">
              Free plan: 20 challenges, 5 interviews, and 30 gradings a month. Pro removes the caps.
            </div>
            <button
              type="button"
              onClick={onUpgradeClick}
              className="w-full rounded-lg bg-gold px-3 py-2.5 text-[13px] font-extrabold text-forest-950"
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {planTier === 'pro' && proSlot}

        <button
          type="button"
          onClick={onHelpClick}
          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold text-ink-secondary"
        >
          <span className="flex items-center gap-2">
            <CircleHelp size={16} strokeWidth={1.8} />
            Help &amp; Support
          </span>
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
    </aside>
  )
}
