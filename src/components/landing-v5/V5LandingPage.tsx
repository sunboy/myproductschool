import type { Metadata } from 'next'
import { JsonLdScript } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, imageUrl } from '@/lib/seo/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/directory-content'
import { V3AuthGate } from '@/components/landing-v3/V3AuthGate'
import { V5Header } from './V5Header'
import { V5Hero } from './V5Hero'
import { V5PracticeGrid } from './V5PracticeGrid'
import { V5Grading } from './V5Grading'
import { V5AIWork } from './V5AIWork'
import { V5Pricing } from './V5Pricing'
import { V5Footer } from './V5Footer'

export const v5LandingDescription =
  'HackProduct makes engineering interview practice trainable across coding, SQL, system design, product judgment, and AI-directed work. Graded practice, live interviews, Hatch AI coaching, and scoring in one system.'

export const v5LandingTitle = 'HackProduct | Engineering Interview Practice for the AI Era'

export const v5LandingKeywords = [
  'engineering interview practice',
  'technical interview practice',
  'system design interview practice',
  'product judgment practice',
  'AI-native practice system',
  'AI interview coaching',
  'coding interview practice',
]

export const v5LandingMetadata: Metadata = buildMetadata({
  title: v5LandingTitle,
  description: v5LandingDescription,
  path: '/',
  keywords: v5LandingKeywords,
})

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${canonicalUrl('/')}#software`,
  name: 'HackProduct',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  url: canonicalUrl('/'),
  image: imageUrl(),
  description: v5LandingDescription,
  offers: {
    '@type': 'OfferCatalog',
    name: 'HackProduct Pro',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'HackProduct Pro Monthly',
        price: '39',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing?plan=monthly'),
        description: 'Monthly access to HackProduct Pro for live loops, Hatch coaching, scoring, and practice artifacts.',
      },
      {
        '@type': 'Offer',
        name: 'HackProduct Pro Annual',
        price: '199',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing?plan=annual'),
        description: 'Annual access to HackProduct Pro for an interview season or role transition sprint.',
      },
    ],
  },
}

export function V5LandingPage() {
  return (
    <div className="v5">
      <JsonLdScript data={[organizationJsonLd(), websiteJsonLd(), softwareJsonLd]} />
      <V5Header />
      <main>
        <V5Hero />
        <V5PracticeGrid />
        <V5Grading />
        <V5AIWork />
        <V5Pricing />
      </main>
      <V5Footer />
      <V3AuthGate />
    </div>
  )
}
