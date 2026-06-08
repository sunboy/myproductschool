import type { Metadata } from 'next'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card } from '@/components/landing-v3/sections'

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

const relatedLinks = [
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/pricing' },
]

export default function SecurityPage() {
  return (
    <V3PageShell>
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

      <V3PageHero
        eyebrow="Security"
        title="Security for an AI-native practice system."
        subtitle="HackProduct brings reps, rubrics, Hatch coaching, artifacts, scoring, and human judgment into one connected loop. That means we treat practice history, code, canvas work, billing, and support workflows as core product data, with controls shaped around account safety and operational need."
      />

      <V3Section eyebrow="How we protect your work" title="Six pillars of HackProduct security.">
        <V3CardGrid>
          {securitySections.map((section) => (
            <V3Card key={section.title} title={section.title} body={section.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="Related policies and support.">
        <V3CardGrid>
          {relatedLinks.map((link) => (
            <V3Card key={link.href} title={link.label} href={link.href} />
          ))}
        </V3CardGrid>
      </V3Section>
    </V3PageShell>
  )
}
