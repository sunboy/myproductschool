'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen, MessageSquare, LifeBuoy } from 'lucide-react'
import { MAIN_NAV_ENTRIES } from '@/components/redesign/AppSidebar'
import { HatchImage } from '@/components/redesign/HatchImage'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { useSession } from '@/context/SessionContext'
import { openFeedbackModal } from '@/components/feedback/FeedbackWidget'
import { Brand, Button } from '@/design'
import { cn } from '@/lib/utils'
import { useUiShell } from './UiShellContext'
import type { NavKey } from '@/lib/shell/route-kind'

/** Sidebar in two states from one component: 200px labelled nav, or a 56px
 *  rail where every item is a 40×40 target centred in the track. On forced
 *  routes (readers, workspace, interview room) the expand button opens the
 *  labelled nav as an overlay drawer instead of pushing content. */
export function AppSidebarV2({ active }: { active: NavKey | null }) {
  const { railCollapsed, forced, navOverlay, setNavCollapsed, setNavOverlay } = useUiShell()
  const collapsed = railCollapsed
  const toggle = () => (forced ? setNavOverlay(!navOverlay) : setNavCollapsed(!collapsed))

  return (
    <>
      <NavPanel active={active} collapsed={collapsed} onToggle={toggle} />
      {navOverlay && <NavOverlay active={active} onClose={() => setNavOverlay(false)} />}
    </>
  )
}

function NavOverlay({ active, onClose }: { active: NavKey | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('keydown', onKey); document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [onClose])
  return (
    <div ref={ref} data-testid="shell-nav-overlay" className="absolute inset-y-0 left-0 z-40 shadow-xl">
      <NavPanel active={active} collapsed={false} overlay onToggle={onClose} />
    </div>
  )
}

function NavPanel({ active, collapsed, overlay = false, onToggle }: { active: NavKey | null; collapsed: boolean; overlay?: boolean; onToggle: () => void }) {
  const router = useRouter()
  const { profile } = useSession()
  const { forced } = useUiShell()
  const isPro = profile?.plan === 'pro'
  const streak = profile?.streak_days ?? 0
  const coachLine = streak > 0 ? `${streak}-day streak` : 'New here'
  const item = 'flex h-control-lg items-center gap-2.5 rounded-tile font-ui text-ui text-ink-strong transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
  const railItem = 'size-control-lg shrink-0 justify-center px-0'
  const wrap = (key: string, label: string, node: React.ReactNode) =>
    collapsed ? <AppTooltip key={key} label={label} side="right" block className="justify-center">{node}</AppTooltip> : <div key={key} className="flex w-full">{node}</div>

  return (
    <aside
      data-testid={overlay ? 'shell-sidebar-overlay' : 'shell-sidebar'}
      data-collapsed={collapsed ? 'true' : 'false'}
      className={cn('flex h-full shrink-0 flex-col border-r border-hairline bg-surface-container-low py-3 transition-[width] duration-150', collapsed ? 'w-(--shell-rail-w) px-2' : 'w-(--shell-nav-w) px-2.5')}
    >
      <Link href="/dashboard" aria-label="HackProduct home" className={cn('mb-3 flex h-9 items-center rounded-tile', collapsed ? 'justify-center' : 'px-2.5')}>
        {collapsed ? <Brand.Mark priority /> : <Brand.Wordmark priority />}
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {MAIN_NAV_ENTRIES.map(entry => {
          const Icon = entry.icon
          const isActive = entry.key === active
          return wrap(entry.key, entry.label, (
            <Link
              href={entry.href}
              aria-current={isActive ? 'page' : undefined}
              data-hatch-target={entry.key === 'home' ? 'nav-dashboard' : `nav-${entry.key}`}
              className={cn(item, collapsed ? railItem : 'w-full px-3', isActive && 'bg-forest-800 text-white hover:bg-forest-800')}
            >
              <Icon size={20} aria-hidden />
              {!collapsed && <span>{entry.label}</span>}
            </Link>
          ))
        })}
      </nav>

      <div className="flex-1" />

      <div className={cn('mb-2 flex items-center gap-2 rounded-tile border border-hairline bg-card-bright', collapsed ? 'mx-auto size-control-lg justify-center' : 'px-2.5 py-2')}>
        <HatchImage state="avatar" size={26} />
        {!collapsed && <span className="text-caption font-ui text-ink-secondary">{coachLine}</span>}
      </div>

      {!collapsed && !isPro && (
        <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))} className="mb-2 w-full bg-gold text-ink-strong hover:bg-gold/90">
          Upgrade to Pro
        </Button>
      )}

      <div className="flex flex-col gap-0.5 border-t border-hairline pt-2">
        {wrap('feedback', 'Send feedback', (
          <button type="button" onClick={() => openFeedbackModal()} className={cn(item, 'text-ink-secondary', collapsed ? railItem : 'w-full px-3 text-meta')}>
            <MessageSquare size={18} aria-hidden />{!collapsed && 'Send feedback'}
          </button>
        ))}
        {wrap('help', 'Help & Support', (
          <button type="button" onClick={() => router.push('/help')} className={cn(item, 'text-ink-secondary', collapsed ? railItem : 'w-full px-3 text-meta')}>
            <LifeBuoy size={18} aria-hidden />{!collapsed && 'Help & Support'}
          </button>
        ))}
        {wrap('toggle', overlay ? 'Close' : collapsed ? 'Expand nav' : 'Collapse nav', (
          <button
            type="button"
            data-testid={overlay ? 'shell-nav-overlay-close' : 'shell-nav-toggle'}
            aria-pressed={collapsed}
            aria-label={overlay ? 'Close navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'}
            onClick={onToggle}
            className={cn(item, 'text-ink-secondary', collapsed ? railItem : 'w-full px-3 text-meta')}
          >
            {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
            {!collapsed && (overlay ? 'Close' : forced ? 'Reading mode' : 'Collapse')}
          </button>
        ))}
      </div>
    </aside>
  )
}
