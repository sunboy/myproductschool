import Link from 'next/link'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'
import '@/components/auth/editorial/editorial-auth-card.css'
import './auth-satellite-shell.css'

/**
 * Variant-neutral shell for the auth satellite pages (forgot-password,
 * reset-password, verify-email, magic-link-sent). Deliberately does NOT
 * couple to any of the 3 login concepts — a quiet cream page with the
 * brand mark and a centered .hp-auth card puts these pages "in the
 * editorial family" (plan §Phase 2) without breaking the one-line
 * ActiveLoginConcept switch (swapping the live variant would otherwise
 * leave these 4 pages styled as whichever concept they'd hardcoded).
 */
export function AuthSatelliteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-satellite-shell hp-auth">
      <header>
        <Link className="brand" href="/" aria-label="HackProduct home">
          <HackProductWordmark priority />
        </Link>
      </header>
      <div className="auth-satellite-center">{children}</div>
    </div>
  )
}
