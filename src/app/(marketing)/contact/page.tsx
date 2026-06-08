import type { Metadata } from 'next'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card } from '@/components/landing-v3/sections'

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

const helpLinks = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Help center', href: '/help' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Security', href: '/security' },
]

export default function ContactPage() {
  return (
    <V3PageShell>
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

      <V3PageHero
        eyebrow="Contact"
        title="Get the right note to the right team."
        subtitle="HackProduct helps make product and technical judgment trainable. Use these routes for support, billing, privacy, legal, and partnership questions around live interviews, Hatch coaching, scoring, study plans, autopsies, code, and canvas practice."
      />

      <V3Section title="Reach the right team.">
        <V3CardGrid>
          {contactRoutes.map((route) => (
            <a key={route.email} className="v3-card" href={`mailto:${route.email}`}>
              <span className="v3-card-eyebrow">{route.email}</span>
              <h3>{route.title}</h3>
              <p>{route.body}</p>
            </a>
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="Looking for a specific answer?">
        <V3CardGrid>
          {helpLinks.map((link) => (
            <V3Card key={link.href} title={link.label} href={link.href} />
          ))}
        </V3CardGrid>
      </V3Section>
    </V3PageShell>
  )
}
