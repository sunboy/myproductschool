import '@/app/(marketing)/home/landing.css'
import '@/app/(marketing)/home/cofounder.css'
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
  title: 'HackProduct | AI-Native Learning for Product-Minded Engineers',
  description: HACKPRODUCT_POSITIONING.subhead,
  path: '/',
  keywords: ['AI-native learning platform', 'product-minded engineers', 'product sense practice', 'LeetCode alternative', 'live AI interviews'],
})

export default function RootPage() {
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
