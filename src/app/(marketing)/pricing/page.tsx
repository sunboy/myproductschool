import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { UpgradeButton } from '@/components/marketing/UpgradeButton'

const FREE_FEATURES = [
  'Unlimited beginner challenges',
  '3 intermediate/advanced per day',
  'All 5 domains',
  'Vocabulary + flashcards',
  'Basic Luma feedback (4 dimensions)',
  'Progress tracking',
]

const PRO_FEATURES = [
  'Everything in Free, plus:',
  'Unlimited all challenges',
  'Full model answers with trade-off analysis',
  'Failure pattern tracking + prescriptions',
  'Mock interview simulations',
  'Shareable ProductIQ card',
  'Framework reference in Workshop mode',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant px-6 py-4 flex items-center gap-3">
        <LumaGlyph size={24} className="text-primary" />
        <Link href="/" className="font-headline font-bold text-on-surface">HackProduct</Link>
        <div className="flex-1" />
        <Link href="/login" className="text-sm text-on-surface-variant hover:text-on-surface">Sign in</Link>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="font-headline text-5xl font-bold text-on-surface">Simple pricing</h1>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Start free. Upgrade when you&apos;re ready to go deeper.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free plan */}
          <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant space-y-5">
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">Free</h2>
              <div className="mt-2">
                <span className="text-4xl font-bold text-on-surface">$0</span>
                <span className="text-on-surface-variant ml-1">/ month</span>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant italic">Build the habit</p>
            <Link href="/signup" className="block w-full py-3 text-center bg-surface-container-high border border-outline-variant text-on-surface font-medium rounded-xl hover:opacity-90 transition-opacity">
              Get started free
            </Link>
            <ul className="space-y-3">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-base text-primary">check</span>
                  <span className="text-on-surface">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Pro plan */}
          <div className="p-6 bg-primary-container rounded-2xl border-2 border-primary/30 space-y-5 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full">MOST POPULAR</span>
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-primary-container">Pro</h2>
              <div className="mt-2">
                <span className="text-4xl font-bold text-primary">$12</span>
                <span className="text-on-primary-container/70 ml-1">/ month</span>
              </div>
            </div>
            <p className="text-sm text-on-primary-container/70 italic">Accelerate your prep</p>
            <UpgradeButton />
            <ul className="space-y-3">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                  <span className="text-on-primary-container">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="font-headline text-2xl font-bold text-on-surface text-center">FAQ</h2>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your billing settings at any time. No questions asked.' },
            { q: 'Is this useful even for senior engineers?', a: 'Absolutely. Product sense is a growth multiplier at any level — the challenges scale in depth.' },
            { q: 'How is this different from reading PM books?', a: "Practice vs passive learning. You get Luma's feedback on your actual thinking, not just knowledge absorption." },
          ].map(item => (
            <div key={item.q} className="p-5 bg-surface-container rounded-xl border border-outline-variant">
              <h3 className="font-medium text-on-surface mb-2">{item.q}</h3>
              <p className="text-sm text-on-surface-variant">{item.a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
