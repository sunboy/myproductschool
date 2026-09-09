import Image from 'next/image'
import Link from 'next/link'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'
import { AuthCard } from '@/components/auth/editorial/AuthCard'
import '@/components/auth/editorial/editorial-auth-card.css'
import '../concept-quiet-studio.css'

interface ConceptQuietStudioProps {
  mode: 'login' | 'signup'
  redirectTo?: string
  archetype?: string
}

/**
 * Login concept 03 — Quiet Studio. The calmest option: cream editorial
 * composition with a lightweight CSS workspace scene beside the login card.
 */
export function ConceptQuietStudio({ mode, redirectTo, archetype }: ConceptQuietStudioProps) {
  return (
    <main className="concept-three hp-auth">
      <header>
        <Link className="brand" href="/" aria-label="HackProduct home">
          <HackProductWordmark priority />
        </Link>
      </header>
      <div className="studio-grid">
        <section className="studio-story">
          <h2>
            Interview prep
            <br />
            that thinks like
            <br />
            <em>you do.</em>
          </h2>
          <p>
            Practice across coding, SQL,
            <br />
            system design, product judgment
            <br />
            and AI analytics.
          </p>
          <div className="studio-scene">
            <div className="studio-circle" />
            <div className="studio-window" />
            <div className="studio-plant">
              <i /><i /><i />
              <span />
            </div>
            <div className="studio-mug">HP</div>
            <div className="studio-hatch">
              <Image src="/landing-v5/hatch-transparent.png" alt="" width={581} height={747} priority />
            </div>
            <div className="studio-laptop"><span>HP</span></div>
            <div className="studio-desk" />
          </div>
        </section>
        <section className="studio-auth">
          <AuthCard mode={mode} redirectTo={redirectTo} archetype={archetype} turnstileTheme="light" />
        </section>
      </div>
    </main>
  )
}
