// The V3 design system (all selectors scoped under `.v3`) is loaded once here
// so every marketing page can adopt it via <V3PageShell> / the `.v3` wrapper
// without a per-page import. Scoping under `.v3` means zero leakage to pages
// that don't opt in.
import './v3/v3-landing.css'
import './v3/v3-pages.css'
import './v3/lead-magnet.css'
import './v3/lead-magnet-report.css'
import './v3/lead-magnet-instant.css'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
