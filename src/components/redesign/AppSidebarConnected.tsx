'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSession } from '@/context/SessionContext'
import { AppSidebar, type SidebarItem } from '@/components/redesign/AppSidebar'
import { openFeedbackModal } from '@/components/feedback/FeedbackWidget'

function resolveActive(pathname: string): SidebarItem {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'home'
  if (pathname.startsWith('/live-interviews')) return 'interviews'
  if (pathname.startsWith('/explore/plans')) return 'study-plans'
  if (pathname.startsWith('/explore/autopsies')) return 'autopsies'
  if (pathname.startsWith('/explore/modules')) return 'guides'
  if (pathname.startsWith('/progress')) return 'progress'
  if (pathname.startsWith('/cohort')) return 'community'
  if (pathname.startsWith('/challenges')) return 'practice'
  return 'home'
}

/**
 * Wires AppSidebar to real session/route state: active nav item from
 * usePathname, plan tier from SessionContext (pro hides the Go Pro card per
 * spec §3), Hatch coach card status line, and real navigation for the
 * upgrade/help actions.
 */
export function AppSidebarConnected() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useSession()
  const isPro = profile?.plan === 'pro'

  const coachLine = profile?.streak_days
    ? `${profile.streak_days}-day streak. Today's rep is picked on your dashboard.`
    : 'Your next rep is picked on the dashboard.'

  return (
    <AppSidebar
      active={resolveActive(pathname)}
      planTier={isPro ? 'pro' : 'free'}
      coachLine={coachLine}
      onUpgradeClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
      onHelpClick={() => router.push('/help')}
      onFeedbackClick={openFeedbackModal}
    />
  )
}
