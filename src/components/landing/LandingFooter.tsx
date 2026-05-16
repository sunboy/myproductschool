import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="mkt-footer">
      <div>
        <p>HackProduct</p>
        <p>AI-native practice for product and technical judgment.</p>
        <p>Copyright © 2026 HackProduct</p>
      </div>
      <nav aria-label="Footer links">
        <Link href="/">Homepage</Link>
        <Link href="/interview-prep">Interview prep</Link>
        <Link href="/flow">FLOW</Link>
        <Link href="/skills">Skills</Link>
        <Link href="/practice">Practice</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/help">Help</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
      </nav>
    </footer>
  )
}
