import type { Metadata } from 'next'
import { JsonLdScript } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, imageUrl } from '@/lib/seo/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/directory-content'
import { V3Nav } from '@/components/landing-v3/V3Nav'
import { V3Hero } from '@/components/landing-v3/V3Hero'
import { V3ContextSection } from '@/components/landing-v3/V3ContextSection'
import { V3HatchReveal } from '@/components/landing-v3/V3HatchReveal'
import { V3FeatureGrid } from '@/components/landing-v3/V3FeatureGrid'
import { V3LiveInterviewSection } from '@/components/landing-v3/V3LiveInterviewSection'
import { V3PricingSection } from '@/components/landing-v3/V3PricingSection'
import { V3Footer } from '@/components/landing-v3/V3Footer'
import { V3AuthGate } from '@/components/landing-v3/V3AuthGate'

export const v3LandingDescription =
  'HackProduct makes product and technical judgment trainable. Run live interview loops, get Hatch AI coaching, study autopsies, follow study plans, practice code and canvas work, and track scoring in one AI-native prep system.'

export const v3LandingTitle = 'HackProduct | AI-Native Practice System for Product and Technical Judgment'

export const v3LandingKeywords = [
  'AI-native practice system',
  'product judgment practice',
  'technical interview practice',
  'AI interview coaching',
  'live interview loops',
  'product sense interview prep',
  'system design interview practice',
]

export const v3LandingMetadata: Metadata = buildMetadata({
  title: v3LandingTitle,
  description: v3LandingDescription,
  path: '/',
  keywords: v3LandingKeywords,
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
  description: v3LandingDescription,
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

export function V3LandingPage() {
  return (
    <div className="v3">
      <JsonLdScript data={[organizationJsonLd(), websiteJsonLd(), softwareJsonLd]} />
      <V3Nav />
      <main>
        <V3Hero />
        <V3ContextSection />
        <V3HatchReveal />
        <V3FeatureGrid />
        <V3LiveInterviewSection />
        <V3PricingSection />
      </main>
      <V3Footer />
      <V3AuthGate />
    </div>
  )
}
