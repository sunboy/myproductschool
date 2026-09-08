'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen, MessageSquare, LifeBuoy } from 'lucide-react'
import { MAIN_NAV_ENTRIES } from '@/components/redesign/AppSidebar'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'
import { HatchImage } from '@/components/redesign/HatchImage'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { useSession } from '@/context/SessionContext'
import { openFeedbackModal } from '@/components/feedback/FeedbackWidget'
import { useUiShell } from './UiShellContext'
import type { NavKey } from '@/lib/shell/route-kind'

export function AppSidebarV2({ active }: { active: NavKey | null }) {
  const router = useRouter()
  const { profile } = useSession()
  const { railCollapsed, forced, setNavCollapsed } = useUiShell()
  const collapsed = railCollapsed
  const isPro = profile?.plan === 'pro'
  const streak = profile?.streak_days ?? 0
  const coachLine = streak > 0 ? `${streak}-day streak` : 'New here'

  return (
    <aside
      data-testid="shell-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      className="flex h-full shrink-0 flex-col border-r border-hairline bg-surface-container-low"
      style={{ width: collapsed ? 'var(--shell-rail-w)' : 'var(--shell-nav-w)', padding: collapsed ? '12px 8px' : '12px 10px', transition: 'width 160ms ease' }}
    >
      <Link href="/dashboard" aria-label="HackProduct home" className="mb-3 flex items-center px-2">
        {collapsed ? <span className="font-headline text-[15px] font-bold text-primary">H</span> : <HackProductWordmark className="h-6 w-[140px]" />}
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {MAIN_NAV_ENTRIES.map(entry => {
          const Icon = entry.icon
          const isActive = entry.key === active
          const item = (
            <Link
              key={entry.key}
              href={entry.href}
              aria-current={isActive ? 'page' : undefined}
              data-hatch-target={entry.key === 'home' ? 'nav-dashboard' : `nav-${entry.key}`}
              className={`flex min-h-10 items-center gap-2.5 rounded-lg text-[13px] font-semibold ${collapsed ? 'justify-center px-0' : 'px-2.5'} ${isActive ? 'bg-forest-800 text-white' : 'text-ink-secondary hover:bg-surface-container'}`}
            >
              <Icon size={18} aria-hidden />
              {!collapsed && <span>{entry.label}</span>}
            </Link>
          )
          return collapsed ? <AppTooltip key={entry.key} label={entry.label} side="right">{item}</AppTooltip> : item
        })}
      </nav>

      <div className="flex-1" />

      <div className={`mb-2 flex items-center gap-2 rounded-lg border border-hairline bg-card-bright ${collapsed ? 'justify-center p-1.5' : 'px-2.5 py-2'}`}>
        <HatchImage state="avatar" size={26} />
        {!collapsed && <span className="text-[11px] text-ink-secondary">{coachLine}</span>}
      </div>

      {!collapsed && !isPro && (
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))} className="mb-2 rounded-lg bg-gold px-3 py-2 text-[12px] font-bold text-ink-strong">
          Upgrade to Pro
        </button>
      )}

      <div className={`flex ${collapsed ? 'flex-col items-center' : 'flex-col'} gap-0.5 border-t border-hairline pt-2 text-[12px] text-ink-secondary`}>
        <AppTooltip label="Send feedback" side="right" disabled={!collapsed}>
          <button type="button" onClick={() => openFeedbackModal()} className={`flex items-center gap-2 rounded-md py-1.5 ${collapsed ? 'px-2' : 'px-2'}`}>
            <MessageSquare size={16} aria-hidden />{!collapsed && 'Send feedback'}
          </button>
        </AppTooltip>
        <AppTooltip label="Help & Support" side="right" disabled={!collapsed}>
          <button type="button" onClick={() => router.push('/help')} className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <LifeBuoy size={16} aria-hidden />{!collapsed && 'Help & Support'}
          </button>
        </AppTooltip>
        <AppTooltip label={forced ? 'Nav collapses here' : collapsed ? 'Expand nav' : 'Collapse nav'} side="right">
          <button
            type="button"
            data-testid="shell-nav-toggle"
            disabled={forced}
            aria-pressed={collapsed}
            onClick={() => setNavCollapsed(!collapsed)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 disabled:opacity-50"
          >
            {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
            {!collapsed && (forced ? 'Reading mode' : 'Collapse')}
          </button>
        </AppTooltip>
      </div>
    </aside>
  )
}
