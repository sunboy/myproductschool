import Link from 'next/link'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Live AI interviews', href: '/interviews/live-ai-interviews' },
      { label: 'FLOW', href: '/flow' },
      { label: 'Hatch preview', href: '/hatch-preview' },
    ],
  },
  {
    title: 'Practice',
    links: [
      { label: 'Skills', href: '/skills' },
      { label: 'Study plans', href: '/study-plans' },
      { label: 'Autopsies', href: '/explore/showcase' },
      { label: 'Practice previews', href: '/practice' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Interview prep', href: '/interview-prep' },
      { label: 'Role transitions', href: '/role-transitions' },
      { label: 'Glossary', href: '/glossary' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Help', href: '/help' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
]

export function V3Footer() {
  return (
    <footer className="v3-footer" aria-labelledby="v3-footer-heading">
      <div className="shell v3-footer-shell">
        <div className="v3-footer-brand">
          <Link className="v3-footer-logo" href="/">
            <HackProductWordmark
              className="nav-logo-wordmark"
            />
          </Link>
          <h2 id="v3-footer-heading">
            Our mission is to make product and technical judgment trainable.
          </h2>
          <p>
            To do this, we built the AI-native practice system for interviews, role transitions,
            and high-stakes career moments.
          </p>
        </div>

        <nav className="v3-footer-links" aria-label="Footer">
          {footerColumns.map((column) => (
            <div className="v3-footer-column" key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="v3-footer-bottom">
          <span>© 2026 HackProduct. AI-native practice for product and technical judgment.</span>
          <span>Maximize interview readiness.</span>
        </div>
      </div>
    </footer>
  )
}
