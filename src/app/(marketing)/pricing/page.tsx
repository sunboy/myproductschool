'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FloatingNav } from '@/components/marketing/FloatingNav'
import { GradientFooter } from '@/components/marketing/GradientFooter'
import { LogoMarquee } from '@/components/marketing/LogoMarquee'
import { UpgradeButton } from '@/components/marketing/UpgradeButton'

const FREE_FEATURES = [
  { label: 'Core Methodology Access', included: true },
  { label: 'Weekly Case Study', included: true },
  { label: 'Community Forum Access', included: true },
  { label: 'AI Performance Coach', included: false },
]

const PRO_FEATURES = [
  'Full Methodology Library',
  'Unlimited AI Coach Sessions',
  'Proprietary Challenge Sandbox',
  'Priority 1:1 Support',
]

const TESTIMONIALS = [
  {
    stat: '12k+',
    statLabel: 'Active Scholars',
    quote:
      'The editorial quality of the curriculum is unlike anything else. It feels like a masterclass in philosophical product thinking.',
    name: 'Elena Vance',
    role: 'Senior PM, Lumon',
    avatarClass: 'bg-primary-container',
    cardClass: 'rotate-[-1deg] hover:rotate-0',
  },
  {
    stat: '4.8',
    statLabel: 'Coach Accuracy',
    quote:
      "The AI Coach doesn't just give answers; it challenges your logic. It's like having a brilliant, tireless mentor on demand.",
    name: 'Mark S.',
    role: 'Head of Growth, Flux',
    avatarClass: 'bg-primary',
    cardClass: 'hover:scale-105',
  },
  {
    stat: '94%',
    statLabel: 'Career Acceleration',
    quote:
      'I secured my Director role within 3 months of implementing the HackProduct frameworks. A complete career pivot.',
    name: 'Julianne Cao',
    role: 'Product Director, Aris',
    avatarClass: 'bg-[#2a6038]',
    cardClass: 'rotate-[1deg] hover:rotate-0',
  },
]

const FAQS = [
  {
    q: 'Can I switch between plans mid-month?',
    a: 'Yes, you can upgrade or downgrade at any time. If you upgrade, the new features are unlocked immediately, and the billing is prorated. If you downgrade, the changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'Is there a discount for non-profits or students?',
    a: 'We offer a 50% discount for registered students, bootcamp participants, and non-profit organizations. Please contact our support team with your credentials to apply.',
  },
  {
    q: 'How often is the AI Coach updated?',
    a: 'Our AI Coach is continuously improved with new frameworks, industry trends, and coaching techniques. Major updates are released quarterly, with incremental improvements shipping weekly.',
  },
  {
    q: 'Do you offer custom enterprise licensing?',
    a: 'Yes, we offer tailored enterprise plans for teams of 10 or more. Enterprise plans include custom challenge creation, organization-wide analytics, and dedicated support. Contact our sales team to learn more.',
  },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      <FloatingNav />

      {/* Hero Section */}
      <header className="relative bg-signature-gradient pt-48 pb-64 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          {/* Luma Glyph */}
          <div className="mb-10 relative inline-block">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute border-2 border-white/20 rounded-full w-20 h-20 animate-[spin_20s_linear_infinite]" />
              <div className="absolute border border-white/40 rounded-full w-14 h-14 animate-[spin_15s_linear_infinite_reverse]" />
              <span
                className="material-symbols-outlined text-white text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                diamond
              </span>
            </div>
          </div>
          <h1 className="font-headline font-extrabold text-white text-4xl md:text-[56px] leading-tight max-w-3xl mx-auto mb-6 tracking-[-0.02em]">
            Master the Product Craft with Scientific Precision.
          </h1>
          <p className="text-white/80 text-xl font-light max-w-2xl mx-auto leading-relaxed">
            Choose the path that fits your ambition. From foundational learning
            to high-performance AI coaching for product leaders.
          </p>
        </div>
      </header>

      {/* Pricing Cards Section */}
      <section className="max-w-6xl mx-auto px-8 -mt-40 relative z-20">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Foundation (Free) */}
          <div className="bg-white rounded-xl p-10 editorial-shadow border border-outline-variant/15 flex flex-col transition-transform duration-500 hover:translate-y-[-4px]">
            <div className="mb-8">
              <h3 className="text-primary font-bold tracking-widest text-xs uppercase mb-2">
                FOUNDATION
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-5xl font-extrabold text-on-surface tracking-[-0.02em]">
                  $0
                </span>
                <span className="text-on-surface-variant font-medium">
                  / forever
                </span>
              </div>
              <p className="mt-4 text-on-surface-variant leading-relaxed">
                Perfect for aspiring PMs starting their journey into structured
                methodologies.
              </p>
            </div>
            <div className="space-y-4 mb-10 flex-grow">
              {FREE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl ${
                      f.included
                        ? 'text-primary'
                        : 'text-on-surface-variant opacity-40'
                    }`}
                    style={{
                      fontVariationSettings: f.included
                        ? "'FILL' 1"
                        : "'FILL' 0",
                    }}
                  >
                    {f.included ? 'check_circle' : 'block'}
                  </span>
                  <span
                    className={`text-on-surface-variant ${
                      !f.included ? 'italic opacity-40' : ''
                    }`}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="w-full py-4 px-6 rounded-full bg-primary-container text-primary font-bold hover:brightness-95 transition-all duration-300 text-center block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Card 2: Professional (Pro) */}
          <div className="bg-white rounded-xl p-10 shadow-[0_20px_50px_rgba(74,124,89,0.12)] border border-primary/10 flex flex-col md:-translate-y-8 relative overflow-hidden group">
            {/* Most Popular Badge */}
            <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-xl font-bold text-[10px] tracking-[0.2em]">
              MOST POPULAR
            </div>
            <div className="mb-8">
              <h3 className="text-primary font-bold tracking-widest text-xs uppercase mb-2">
                PROFESSIONAL
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-5xl font-extrabold text-on-surface tracking-[-0.02em]">
                  $49
                </span>
                <span className="text-on-surface-variant font-medium">
                  / month
                </span>
              </div>
              <p className="mt-4 text-on-surface-variant leading-relaxed">
                Advanced systems and AI-powered feedback for high-growth product
                professionals.
              </p>
            </div>
            <div className="space-y-4 mb-10 flex-grow">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-primary text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  <span className="text-on-surface font-semibold">{f}</span>
                </div>
              ))}
            </div>
            <UpgradeButton variant="hero" />
          </div>
        </div>
      </section>

      {/* Company Marquee */}
      <section className="mt-24">
        <p className="text-center font-bold text-xs uppercase tracking-widest text-primary/60 mb-8">
          TRANSFORMING PRODUCT TEAMS AT
        </p>
        <LogoMarquee />
      </section>

      {/* Testimonials & Stats */}
      <section className="py-32 max-w-7xl mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="font-headline font-bold text-4xl text-on-surface mb-4 italic tracking-[-0.02em]">
            Measured Excellence.
          </h2>
          <div className="h-1 w-20 bg-primary mx-auto opacity-30" />
        </div>
        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className={`bg-white p-8 editorial-shadow border border-outline-variant/15 ${t.cardClass} transition-transform duration-500 rounded-xl`}
            >
              <div className="mb-6">
                <span className="font-headline text-6xl font-extrabold text-primary tracking-[-0.02em]">
                  {t.stat}
                </span>
                <p className="font-bold text-sm uppercase tracking-wider text-on-surface-variant mt-2">
                  {t.statLabel}
                </p>
              </div>
              <p className="text-on-surface-variant italic leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full ${t.avatarClass}`}
                />
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-primary/5">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="font-headline font-bold text-4xl text-on-surface mb-16 text-center tracking-[-0.02em]">
            Frequently Contemplated
          </h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className={`bg-white p-8 rounded-xl cursor-pointer transition-all duration-300 ${
                  openFaq === i
                    ? 'editorial-shadow border-l-4 border-primary translate-y-[-4px]'
                    : 'shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-outline-variant/15 hover:border-primary/40 hover:translate-y-[-2px]'
                }`}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-headline font-bold text-xl text-on-surface tracking-[-0.02em]">
                    {faq.q}
                  </h4>
                  <span className="material-symbols-outlined text-primary shrink-0 ml-4">
                    {openFaq === i ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                </div>
                {openFaq === i && (
                  <p className="text-on-surface-variant leading-relaxed mt-4">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <GradientFooter />
    </div>
  )
}
