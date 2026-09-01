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
  if (pathname.startsWith('/challenges')) return 'practice'
  return 'home'
}

// Deep-reading routes (story reader, module reader) stack the global sidebar
// under their own in-page navigation (chapter rail, TOC, progress dock). An
// icon-only rail here frees width back to the content without adding a
// stateful collapse toggle — it's purely a function of the current route.
//
// /explore/autopsies/[slug] is the company hub (browsing UI, not a reader) —
// only routes with a segment beyond the company slug are actual stories, in
// either shape the app uses: /[slug]/[storySlug] or /[slug]/stories/[storySlug].
// /explore/modules/[slug] is itself the chapter reader, so no such distinction
// is needed there.
function isDeepReadingRoute(pathname: string): boolean {
  if (pathname.startsWith('/explore/autopsies/')) {
    const segmentsAfterHub = pathname.slice('/explore/autopsies/'.length).split('/').filter(Boolean)
    return segmentsAfterHub.length > 1
  }
  return pathname.startsWith('/explore/modules/')
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
      collapsed={isDeepReadingRoute(pathname)}
      onUpgradeClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
      onHelpClick={() => router.push('/help')}
      onFeedbackClick={openFeedbackModal}
    />
  )
}
