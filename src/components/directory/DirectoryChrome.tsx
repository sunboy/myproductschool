import Link from 'next/link'

export function DirectoryNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/40 bg-background/88 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Public directory">
        <Link href="/" className="font-headline text-lg font-bold text-on-surface no-underline">
          HackProduct
        </Link>
        <div className="hidden items-center gap-5 text-sm font-semibold text-on-surface-variant md:flex">
          <Link className="hover:text-primary" href="/skills">Skills</Link>
          <Link className="hover:text-primary" href="/practice">Practice</Link>
          <Link className="hover:text-primary" href="/study-plans">Study plans</Link>
          <Link className="hover:text-primary" href="/companies">Companies</Link>
          <Link className="hover:text-primary" href="/glossary">Glossary</Link>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center rounded-full bg-[#1e3528] px-4 py-2 text-sm font-bold text-[#f3ede0] no-underline transition-transform hover:-translate-y-0.5"
        >
          Start free
        </Link>
      </nav>
    </header>
  )
}

export function DirectoryShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <DirectoryNav />
      {children}
      <DirectoryFooter />
    </div>
  )
}

export function DirectoryFooter() {
  return (
    <footer className="border-t border-outline-variant/40 bg-[#102018] px-5 py-10 text-[#f3ede0]">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="font-headline text-2xl font-semibold">HackProduct</div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#f3ede0]/65">
            AI-native practice for product-minded engineers, PMs, data builders, and technical leaders.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#f3ede0]/70">
          <Link className="hover:text-white" href="/pricing">Pricing</Link>
          <Link className="hover:text-white" href="/waitlist">Waitlist</Link>
          <Link className="hover:text-white" href="/llms.txt">LLMs</Link>
        </div>
      </div>
    </footer>
  )
}

export function DirectoryHero({
  eyebrow,
  title,
  description,
  ctaHref = '/login',
  ctaLabel = 'Start free',
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string
  title: string
  description: string
  ctaHref?: string
  ctaLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}) {
  return (
    <section className="relative overflow-hidden bg-[#102018] px-5 py-20 text-[#f3ede0] sm:px-8 lg:py-24">
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(820px 520px at 12% 88%, rgba(126,224,153,0.18), transparent 62%), radial-gradient(720px 420px at 86% 16%, rgba(201,147,58,0.12), transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-5 inline-flex rounded-full border border-[#9ee0b8]/25 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9ee0b8]">
          {eyebrow}
        </div>
        <h1 className="max-w-4xl font-headline text-5xl font-semibold leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f3ede0]/70">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={ctaHref}
            className="inline-flex rounded-full bg-[#f3ede0] px-5 py-3 text-sm font-bold text-[#102018] no-underline transition-transform hover:-translate-y-0.5"
          >
            {ctaLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-[#f3ede0] no-underline transition-colors hover:border-white/45"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

export function DirectorySection({
  eyebrow,
  title,
  description,
  children,
  shaded = false,
}: {
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
  shaded?: boolean
}) {
  return (
    <section className={`px-5 py-16 sm:px-8 ${shaded ? 'bg-[#f4eee2]' : ''}`}>
      <div className="mx-auto max-w-7xl">
        {eyebrow && (
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {eyebrow}
          </div>
        )}
        <div className="mb-8 max-w-3xl">
          <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
          {description && <p className="mt-3 text-base leading-7 text-on-surface-variant">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}

export function DirectoryCard({
  href,
  title,
  description,
  meta,
}: {
  href: string
  title: string
  description: string
  meta?: string
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl bg-surface-container-lowest p-5 no-underline shadow-[0_1px_0_rgba(46,50,48,0.08)] ring-1 ring-outline-variant/35 transition-all hover:-translate-y-1 hover:ring-primary/35"
    >
      {meta && <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.10em] text-primary">{meta}</div>}
      <h3 className="font-headline text-xl font-semibold leading-tight text-on-surface group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-on-surface-variant">{description}</p>
      <span className="mt-5 text-sm font-bold text-primary">Open directory</span>
    </Link>
  )
}

export function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-primary-fixed/70 px-3 py-1 text-xs font-bold text-on-primary-fixed"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export function BulletGrid({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item} className="rounded-lg bg-surface-container-lowest p-4 text-sm font-semibold leading-6 ring-1 ring-outline-variant/30">
          {item}
        </div>
      ))}
    </div>
  )
}

export function CtaBand({
  title = 'Practice with Hatch when you are ready.',
  description = 'Public directories show the map. The app gives you live reps, rubric feedback, and AI coaching across the full interview loop.',
  href = '/login',
  label = 'Start free',
}: {
  title?: string
  description?: string
  href?: string
  label?: string
}) {
  return (
    <section className="px-5 py-16 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-2xl bg-[#1e3528] p-8 text-[#f3ede0] md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f3ede0]/70">{description}</p>
        </div>
        <Link href={href} className="inline-flex w-fit rounded-full bg-[#f3ede0] px-5 py-3 text-sm font-bold text-[#1e3528] no-underline">
          {label}
        </Link>
      </div>
    </section>
  )
}
