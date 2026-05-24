import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'

export const metadata: Metadata = buildMetadata({
  title: 'Security at HackProduct | Data, Billing, and AI Practice Safety',
  description:
    'How HackProduct protects accounts, billing, practice data, Hatch coaching workflows, and operational access in the AI-native practice system.',
  path: '/security',
  keywords: [
    'HackProduct security',
    'AI practice data security',
    'Hatch coaching data',
    'HackProduct privacy and security',
  ],
})

const securitySections = [
  {
    title: 'Account and access',
    body: 'HackProduct protects account sessions, verification flows, and sensitive actions with authentication controls, rate limits, and operational monitoring.',
  },
  {
    title: 'Billing safety',
    body: 'Stripe handles checkout, subscriptions, invoices, tax, and payment method storage. HackProduct does not store full payment card numbers.',
  },
  {
    title: 'Practice data',
    body: 'Live interviews, chat, voice, code, canvas work, study progress, scores, and Hatch feedback are treated as learner data and scoped to product operation.',
  },
  {
    title: 'AI workflows',
    body: 'Hatch coaching is designed around practice context, rubric feedback, moderation, and review paths that keep generated guidance separate from guaranteed outcomes.',
  },
  {
    title: 'Operational access',
    body: 'Internal access is limited to operational needs such as support, debugging, safety, billing, fraud prevention, and legal compliance.',
  },
  {
    title: 'Reporting',
    body: 'Security concerns can be reported through security@hackproduct.dev. Privacy requests should go to privacy@hackproduct.dev.',
  },
]

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background text-on-surface">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: canonicalUrl('/') },
            { name: 'Security', path: canonicalUrl('/security') },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Security at HackProduct',
            url: canonicalUrl('/security'),
            description:
              'How HackProduct protects accounts, billing, learner data, Hatch coaching workflows, and operational access.',
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
              Security
            </p>
            <h1 className="mt-4 font-headline text-4xl font-black leading-tight text-on-surface sm:text-6xl">
              Security for an AI-native practice system.
            </h1>
          </div>
          <div className="max-w-2xl self-end">
            <p className="text-xl font-bold leading-8 text-on-surface">
              HackProduct brings reps, rubrics, Hatch coaching, artifacts, scoring,
              and human judgment into one connected loop.
            </p>
            <p className="mt-5 text-lg leading-8 text-on-surface-variant">
              That means we treat practice history, code, canvas work, billing, and
              support workflows as core product data, with controls shaped around
              account safety and operational need.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {securitySections.map((section) => (
            <article key={section.title} className="rounded-lg border border-outline-variant bg-white p-6">
              <h2 className="text-xl font-black text-on-surface">{section.title}</h2>
              <p className="mt-4 text-sm font-semibold leading-6 text-on-surface-variant">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-primary/20 bg-primary-container/30 p-6 md:p-8">
          <h2 className="font-headline text-3xl font-black text-on-surface">
            Related policies and support.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Privacy policy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Contact', href: '/contact' },
              { label: 'Pricing', href: '/pricing' },
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
