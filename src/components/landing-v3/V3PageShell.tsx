import type { ReactNode } from 'react'
import { V3SiteNav } from '@/components/landing-v3/V3SiteNav'
import { V3Footer } from '@/components/landing-v3/V3Footer'

/**
 * The single composition point for every marketing/content page. Wraps content
 * in the `.v3` design-system root (so all scoped V3 CSS applies) and frames it
 * with the route-linked nav + the shared footer.
 *
 * The V3 stylesheet is loaded once in (marketing)/layout.tsx, so pages only
 * need to render inside this shell — no per-page CSS import.
 */
export function V3PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="v3">
      <V3SiteNav />
      <main>{children}</main>
      <V3Footer />
    </div>
  )
}
