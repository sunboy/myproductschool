import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="land-footer">
      <div>
        <p>Automate with interview-safe practice memory</p>
        <p>Copyright © 2026 HackProduct</p>
      </div>
      <nav aria-label="Footer links">
        <Link href="/">Homepage</Link>
        <Link href="/skills">Resources</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/llms.txt">Docs</Link>
      </nav>
    </footer>
  )
}
