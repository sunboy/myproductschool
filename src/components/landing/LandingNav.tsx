import Link from 'next/link'

export function LandingNav() {
  return (
    <nav className="land-nav">
      <Link href="/home" style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 18, textDecoration: 'none', color: 'inherit' }}>
        HackProduct
      </Link>
      <div className="land-nav-links">
        <a href="#disciplines">Disciplines</a>
        <a href="#features">How it works</a>
        <a href="#proof">Stories</a>
        <a href="#faq">FAQ</a>
      </div>
      <div className="land-nav-cta">
        <Link href="/login" className="land-btn land-btn--ghost">Log in</Link>
        <Link href="/login" className="land-btn land-btn--primary">Start free →</Link>
      </div>
    </nav>
  )
}
