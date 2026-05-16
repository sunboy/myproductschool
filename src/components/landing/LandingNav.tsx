import Link from 'next/link'
import { Search } from 'lucide-react'

const DISCIPLINES = ['Product', 'Systems', 'Data', 'SQL', 'Coding', 'AI-native']

export function LandingNav() {
  return (
    <header className="mkt-nav">
      <div className="mkt-nav-top">
        <Link href="/" className="mkt-wordmark">
          <span aria-hidden>HP</span>
          HackProduct
        </Link>
        <Link href="/practice" className="mkt-search">
          <Search aria-hidden size={17} />
          <span>Search product sense, SQL, systems...</span>
        </Link>
        <nav className="mkt-nav-actions" aria-label="Account navigation">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login" prefetch={false}>Log in</Link>
          <Link href="/login?returnTo=/challenges" prefetch={false} className="mkt-nav-primary">
            Start a free rep
          </Link>
        </nav>
      </div>
      <nav className="mkt-nav-cats" aria-label="Marketing navigation">
        <Link href="/interview-prep">Interview prep</Link>
        <Link href="/role-transitions">Role transitions</Link>
        <Link href="/uplevel">Promotion readiness</Link>
        <Link href="/salary-negotiation">Salary proof</Link>
        <Link href="/flow">FLOW</Link>
        <Link href="/skills">Skills</Link>
        <Link href="/practice">Practice catalog</Link>
        <div className="mkt-discipline-menu" aria-label="Disciplines">
          {DISCIPLINES.map((discipline) => (
            <span key={discipline}>{discipline}</span>
          ))}
        </div>
      </nav>
    </header>
  )
}
