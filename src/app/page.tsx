import '@/app/(marketing)/home/landing.css'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { LogoStrip } from '@/components/landing/LogoStrip'
import { DisciplinesSection } from '@/components/landing/DisciplinesSection'
import { FeatureRows } from '@/components/landing/FeatureRows'
import { Quotes } from '@/components/landing/Quotes'
import { FomoBlock } from '@/components/landing/FomoBlock'
import { FAQ } from '@/components/landing/FAQ'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const metadata = {
  title: 'HackProduct: Upskill for the AI world',
  description: 'Practice real product sense, system design, data modeling, and coding scenarios with Hatch coaching you in real time.',
}

export default function RootPage() {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <LogoStrip />
      <DisciplinesSection />
      <FeatureRows />
      <Quotes />
      <FomoBlock />
      <FAQ />
      <LandingFooter />
    </>
  )
}
