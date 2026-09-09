import type { Metadata } from 'next'
import { JsonLdScript } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, imageUrl } from '@/lib/seo/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/directory-content'
import { V3Nav } from '@/components/landing-v3/V3Nav'
import { V3TryRep } from '@/components/landing-v3/V3TryRep'
import { V3Hero } from '@/components/landing-v3/V3Hero'
import { V3ContextSection } from '@/components/landing-v3/V3ContextSection'
import { V3HowItWorks } from '@/components/landing-v3/V3HowItWorks'
import { V3HatchReveal } from '@/components/landing-v3/V3HatchReveal'
import { V3FeatureGrid } from '@/components/landing-v3/V3FeatureGrid'
import { V3LiveInterviewSection } from '@/components/landing-v3/V3LiveInterviewSection'
import { V3AnalyticsSection } from '@/components/landing-v3/V3AnalyticsSection'
import { V3PricingSection } from '@/components/landing-v3/V3PricingSection'
import { V3Footer } from '@/components/landing-v3/V3Footer'
import { V3AuthGate } from '@/components/landing-v3/V3AuthGate'

export const v3LandingDescription =
  'Build practical skills for your next challenge at work. Explore product and technical challenges, learn from real cases, prepare for interviews, and get personalized guidance from Hatch.'

export const v3LandingTitle = 'HackProduct | Practical Learning for Tech Professionals'

export const v3LandingKeywords = [
  'AI-native practice system',
  'product judgment practice',
  'technical interview practice',
  'AI interview coaching',
  'live interview practice',
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
        description: 'Monthly access to HackProduct Pro for live interviews, Hatch coaching, scoring, and practice artifacts.',
      },
      {
        '@type': 'Offer',
        name: 'HackProduct Pro Annual',
        price: '199',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing?plan=annual'),
        description: 'Annual access to HackProduct Pro for interview preparation or a role transition sprint.',
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
        <V3HowItWorks />
        <section className="shell hp-try-challenge" aria-labelledby="try-challenge-title">
          <div>
            <p className="hp-launch-kicker">TRY IT FOR YOURSELF</p>
            <h2 id="try-challenge-title">A small challenge.<br />A useful perspective.</h2>
            <p>Share how you would approach a real product decision. Get a sample of Hatch’s feedback before creating an account.</p>
          </div>
          <V3TryRep />
        </section>
        <V3HatchReveal />
        <V3FeatureGrid />
        <V3LiveInterviewSection />
        <V3AnalyticsSection />
        <V3PricingSection />
      </main>
      <V3Footer />
      <V3AuthGate />
    </div>
  )
}
