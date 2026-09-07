import Image from 'next/image'
import Link from 'next/link'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'
import { AuthCard } from '@/components/auth/editorial/AuthCard'
import '@/components/auth/editorial/editorial-auth-card.css'
import '../concept-dark-editorial.css'

interface ConceptDarkEditorialProps {
  mode: 'login' | 'signup'
  redirectTo?: string
  archetype?: string
}

const BULLETS = [
  'Real problems from top companies',
  'AI feedback that helps you improve',
  'Track progress and build confidence',
  'Built for engineers, by engineers',
] as const

/**
 * Login concept 02 — Dark Editorial. Deep forest editorial panel on the
 * left, minimal evidence/benefit copy, partial Hatch, bright functional
 * auth card on the right.
 */
export function ConceptDarkEditorial({ mode, redirectTo, archetype }: ConceptDarkEditorialProps) {
  return (
    <main className="concept-two hp-auth">
      <section className="dark-story">
        <Link className="brand brand-light" href="/" aria-label="HackProduct home">
          <HackProductWordmark priority />
        </Link>
        <div className="dark-kicker">ACE INTERVIEWS. BUILD WHAT&apos;S NEXT.</div>
        <h2>
          More than practice.
          <br />
          Real interview
          <br />
          <em>readiness.</em>
        </h2>
        <ul>
          {BULLETS.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="dark-line-art" />
        <div className="dark-hatch">
          <Image src="/landing-v5/hatch-transparent.png" alt="" width={581} height={747} priority />
        </div>
      </section>
      <section className="light-auth">
        <AuthCard mode={mode} redirectTo={redirectTo} archetype={archetype} turnstileTheme="light" />
      </section>
    </main>
  )
}
