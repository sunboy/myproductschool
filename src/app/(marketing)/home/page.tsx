import './marketplace.css'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { LogoStrip } from '@/components/landing/LogoStrip'
import { DisciplinesSection } from '@/components/landing/DisciplinesSection'
import { FeatureRows } from '@/components/landing/FeatureRows'
import { Quotes } from '@/components/landing/Quotes'
import { FomoBlock } from '@/components/landing/FomoBlock'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { JsonLdScript } from '@/lib/seo/json-ld'
import { buildMetadata } from '@/lib/seo/site'
import {
  HACKPRODUCT_POSITIONING,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from '@/lib/seo/directory-content'

export const metadata = buildMetadata({
  title: 'HackProduct | Train Product and Technical Judgment',
  description: HACKPRODUCT_POSITIONING.subhead,
  path: '/',
  keywords: ['interview prep', 'product sense practice', 'staff engineer promotion readiness', 'engineer to product', 'AI-native workflows'],
})

export default function LandingPage() {
  return (
    <>
      <JsonLdScript data={[organizationJsonLd(), websiteJsonLd(), softwareApplicationJsonLd()]} />
      <LandingNav />
      <LandingHero />
      <LogoStrip />
      <DisciplinesSection />
      <FeatureRows />
      <Quotes />
      <FomoBlock />
      <LandingFooter />
    </>
  )
}
