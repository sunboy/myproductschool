import type { ReactNode } from 'react'
import Link from 'next/link'

/* Reusable presentational primitives for V3 marketing pages.
   Built only from the scoped `.v3` CSS in v3-landing.css + v3-pages.css. */

type CtaLink = { label: string; href: string; variant?: 'forest' | 'amber' | 'primary' }

function Button({ label, href, variant = 'forest' }: CtaLink) {
  return (
    <Link className={`btn btn-${variant}`} href={href}>
      {label} <span aria-hidden>→</span>
    </Link>
  )
}

/** Eyebrow + headline + subcopy + optional CTAs. Replaces each page's hero band. */
export function V3PageHero({
  eyebrow,
  title,
  subtitle,
  ctas,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  ctas?: CtaLink[]
}) {
  return (
    <section className="v3-page-hero">
      <div className="shell">
        <div className="v3-page-hero-inner">
          {eyebrow ? (
            <p className="eyebrow">
              <span className="dot" />
              {eyebrow}
            </p>
          ) : null}
          <h1>{title}</h1>
          {subtitle ? <p className="v3-page-hero-sub">{subtitle}</p> : null}
          {ctas && ctas.length > 0 ? (
            <div className="v3-page-hero-cta">
              {ctas.map((cta) => (
                <Button key={cta.href + cta.label} {...cta} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/** A `.shell`-wrapped readable column for legal/help/about prose. */
export function V3ProseSection({ children }: { children: ReactNode }) {
  return (
    <section className="v3-prose-section">
      <div className="shell">
        <div className="v3-prose">{children}</div>
      </div>
    </section>
  )
}

/** A bordered prose block (one logical section of a legal/help page). */
export function V3ProseBlock({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="v3-prose-block">
      {title ? <h2>{title}</h2> : null}
      {children}
    </div>
  )
}

/** Section with optional heading + responsive card grid. */
export function V3Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="v3-section">
      <div className="shell">
        {title || subtitle || eyebrow ? (
          <div className="v3-section-head">
            {eyebrow ? (
              <p className="eyebrow">
                <span className="dot" />
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  )
}

export function V3CardGrid({ children }: { children: ReactNode }) {
  return <div className="v3-card-grid">{children}</div>
}

/** A card. Renders as a link when `href` is provided. */
export function V3Card({
  eyebrow,
  title,
  body,
  href,
}: {
  eyebrow?: string
  title: ReactNode
  body?: ReactNode
  href?: string
}) {
  const inner = (
    <>
      {eyebrow ? <span className="v3-card-eyebrow">{eyebrow}</span> : null}
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
    </>
  )
  if (href) {
    return (
      <Link className="v3-card" href={href}>
        {inner}
      </Link>
    )
  }
  return <div className="v3-card">{inner}</div>
}

/** Closing call-to-action band (forest gradient). */
export function V3CtaBand({
  title,
  subtitle,
  ctas,
}: {
  title: ReactNode
  subtitle?: ReactNode
  ctas: CtaLink[]
}) {
  return (
    <section className="v3-cta-band">
      <div className="shell">
        <div className="v3-cta-band-inner">
          <div className="v3-cta-band-copy">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="v3-cta-band-actions">
            {ctas.map((cta) => (
              <Button key={cta.href + cta.label} variant="amber" {...cta} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
