import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'

export const metadata: Metadata = buildMetadata({
  title: 'Contact HackProduct | Support, Privacy, Legal',
  description:
    'Contact HackProduct for product support, billing questions, privacy requests, legal requests, partnerships, and questions about the AI-native practice system.',
  path: '/contact',
  keywords: [
    'contact HackProduct',
    'HackProduct support',
    'HackProduct billing',
    'Hatch AI coach support',
  ],
})

const contactRoutes = [
  {
    title: 'Product support',
    email: 'support@hackproduct.dev',
    body: 'Account access, billing, live interview loops, Hatch coaching, study plans, scoring, and practice artifacts.',
  },
  {
    title: 'General notes',
    email: 'hello@hackproduct.dev',
    body: 'Partnerships, press, feedback, and questions about HackProduct as an AI-native practice system.',
  },
  {
    title: 'Privacy requests',
    email: 'privacy@hackproduct.dev',
    body: 'Data access, correction, deletion, retention, vendor processing, and privacy policy questions.',
  },
  {
    title: 'Legal requests',
    email: 'legal@hackproduct.dev',
    body: 'Terms, business requests, and formal notices related to HackProduct services.',
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-on-surface">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: canonicalUrl('/') },
            { name: 'Contact', path: canonicalUrl('/contact') },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact HackProduct',
            url: canonicalUrl('/contact'),
            description:
              'Contact HackProduct for support, billing, privacy, legal, and partnership requests.',
          },
        ]}
      />
      <section className="border-b border-outline-variant bg-[#f6f0e7]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-24">
          <div>
            <Link href="/" className="text-sm font-black text-primary no-underline">
              HackProduct
            </Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.16em] text-primary">
              Contact
            </p>
            <h1 className="mt-4 font-headline text-4xl font-black leading-tight text-on-surface sm:text-6xl">
              Get the right note to the right team.
            </h1>
          </div>
          <div className="max-w-2xl self-end">
            <p className="text-xl font-bold leading-8 text-on-surface">
              HackProduct helps make product and technical judgment trainable.
            </p>
            <p className="mt-5 text-lg leading-8 text-on-surface-variant">
              Use these routes for support, billing, privacy, legal, and partnership
              questions around live interviews, Hatch coaching, scoring, study plans,
              autopsies, code, and canvas practice.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {contactRoutes.map((route) => (
            <article key={route.email} className="rounded-lg border border-outline-variant bg-white p-6">
              <h2 className="text-xl font-black text-on-surface">{route.title}</h2>
              <a
                href={`mailto:${route.email}`}
                className="mt-3 block text-base font-black text-primary no-underline"
              >
                {route.email}
              </a>
              <p className="mt-4 text-sm font-semibold leading-6 text-on-surface-variant">
                {route.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-primary/20 bg-primary-container/30 p-6 md:p-8">
          <h2 className="font-headline text-3xl font-black text-on-surface">
            Looking for a specific answer?
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Pricing', href: '/pricing' },
              { label: 'Help center', href: '/help' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Security', href: '/security' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm font-black text-on-surface no-underline transition-colors hover:border-primary hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
