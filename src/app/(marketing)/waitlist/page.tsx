import { WaitlistForm } from '@/components/marketing/WaitlistForm'
import { LandingHero } from '@/components/marketing/LandingHero'
import { InteractiveDemo } from '@/components/marketing/InteractiveDemo'
import { FailurePatternGrid } from '@/components/marketing/FailurePatternGrid'
import { ModesShowcase } from '@/components/marketing/ModesShowcase'
import { SocialProof } from '@/components/marketing/SocialProof'
import { InlinePricing } from '@/components/marketing/InlinePricing'

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingHero />

        <div id="demo">
          <InteractiveDemo />
        </div>

        <FailurePatternGrid />

        <ModesShowcase />

        <SocialProof />

        <InlinePricing />

        {/* Final CTA + Waitlist */}
        <section className="py-20 text-center">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-4">
            Start your first challenge.{' '}
            <span className="text-primary">It&apos;s free.</span>
          </h2>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            Join the waitlist and be the first to sharpen your product instincts
            with Luma.
          </p>
          <div className="max-w-md mx-auto">
            <WaitlistForm />
          </div>
        </section>
      </div>
    </div>
  )
}
