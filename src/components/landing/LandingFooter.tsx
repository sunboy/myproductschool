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
        <Link href="/help">Help</Link>
        <Link href="/changelog">Changelog</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <a href="https://status.hackproduct.com" target="_blank" rel="noopener noreferrer">Status</a>
        <Link href="/llms.txt">Docs</Link>
      </nav>
    </footer>
  )
}
