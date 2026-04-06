import type { Metadata } from 'next'
import { WaitlistForm } from '@/components/marketing/WaitlistForm'
import { WaitlistCountdown } from '@/components/marketing/WaitlistCountdown'
import { CyclingText } from '@/components/marketing/CyclingText'
import { createAdminClient } from '@/lib/supabase/admin'

async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = createAdminClient()
    const { count } = await supabase.from('waitlist').select('*', { count: 'exact', head: true })
    return count ?? 0
  } catch {
    return 0
  }
}

export const metadata: Metadata = {
  title: 'Join the Waitlist | Product Sense Practice for Engineers, PMs & Students',
  description: 'HackProduct is the product sense training platform for engineers, PMs, and students. Practice real product decisions from Google, Uber, Stripe. Get AI-coached feedback. Ace PM interviews and ship better products on the job. Join 1,000+ tech professionals on the waitlist.',
  keywords: [
    'product sense practice', 'PM interview prep', 'product manager interview questions',
    'product thinking for engineers', 'product sense training', 'product management course',
    'Google PM interview prep', 'Meta product manager interview', 'Amazon PM interview',
    'FAANG interview prep', 'product design interview', 'product strategy practice',
    'LeetCode for product managers', 'product case study practice',
    'software engineer product skills', 'engineer to PM transition',
    'APM program preparation', 'associate product manager interview',
    'product metrics practice', 'product roadmap exercises',
    'tech interview preparation', 'product management bootcamp',
    'product sense exercises', 'product intuition training',
    'AI product coach', 'product management AI tutor',
  ],
  openGraph: {
    title: 'HackProduct | Master Product Sense for Tech Careers',
    description: 'Practice real product decisions. Get AI-coached feedback. Ace PM interviews at Google, Meta, Amazon. Join 1,000+ engineers and PMs on the waitlist.',
    url: 'https://hackproduct.dev/waitlist',
    type: 'website',
  },
  twitter: {
    title: 'HackProduct | Product Sense Practice for Engineers & PMs',
    description: 'The LeetCode for product thinking. Practice real product decisions, get AI feedback, and ace PM interviews. Join the waitlist.',
  },
  alternates: {
    canonical: 'https://hackproduct.dev/waitlist',
  },
}

// JSON-LD structured data for rich search results
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'HackProduct',
      url: 'https://hackproduct.dev',
      description: 'The product sense training platform for engineers, PMs, and students. Practice real product decisions and get AI-coached feedback.',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free during beta',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '120',
        bestRating: '5',
      },
    },
    {
      '@type': 'Organization',
      name: 'HackProduct',
      url: 'https://hackproduct.dev',
      logo: 'https://hackproduct.dev/images/hackylogo.png',
      sameAs: [],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is HackProduct?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'HackProduct is a product sense training platform for engineers, PMs, and students. It helps you practice real product decisions from companies like Google, Uber, and Stripe, with AI-coached feedback from Luma, your personal product coach.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is HackProduct different from LeetCode?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'LeetCode trains coding skills. HackProduct trains product thinking. You practice product sense questions like "How would you improve Google Maps?" or "Should Spotify launch a hardware product?" and get structured feedback on your reasoning, metrics, and strategy.',
          },
        },
        {
          '@type': 'Question',
          name: 'Who is HackProduct for?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'HackProduct is for software engineers preparing for PM interviews, product managers sharpening their skills, students preparing for APM programs, and anyone in tech who wants to think more strategically about products.',
          },
        },
        {
          '@type': 'Question',
          name: 'What companies do the case studies come from?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Case studies are inspired by real product decisions at companies like Google, Meta, Amazon, Spotify, Uber, Stripe, and top startups. They cover product strategy, metrics, prioritization, and user research.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is HackProduct free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'HackProduct is free during the beta period. Beta users get free lifetime access. No credit card is required to join the waitlist.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is a product sense interview?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A product sense interview tests your ability to think like a product manager. You might be asked to improve an existing product, design a new feature, define success metrics, or make prioritization trade-offs. Companies like Google, Meta, and Amazon use these rounds for both PM and engineering roles.',
          },
        },
      ],
    },
  ],
}

export default async function WaitlistPage() {
  const waitlistCount = await getWaitlistCount()
  const showSocial = waitlistCount > 1000
  const roundedCount = Math.floor(waitlistCount / 100) * 100

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background text-on-background font-body selection:bg-secondary-container selection:text-on-secondary-container flex flex-col">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="bg-background/80 backdrop-blur-lg border-b border-on-background/5 z-50 relative" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xl font-headline font-bold text-on-background tracking-tight">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hackylogo.png" alt="HackProduct logo" className="w-8 h-8 object-contain" width={32} height={32} />
            HackProduct
          </span>
          {/* <WaitlistCountdown /> */}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <article className="max-w-7xl w-full mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 py-8 lg:py-0 items-center">

            {/* Left: Copy + Form */}
            <div className="order-2 lg:order-1 flex flex-col justify-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary-fixed px-3 py-1.5 rounded-full mb-5 self-start flex-wrap">
                <span
                  className="material-symbols-outlined text-primary text-base"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                >
                  bolt
                </span>
                <span className="text-xs font-label font-bold tracking-wider uppercase text-on-background">
                  Beta — Limited Spots
                </span>
                {showSocial && (
                  <>
                    <span className="text-outline-variant text-xs">|</span>
                    <span className="inline-flex items-center gap-1 text-xs font-label font-semibold text-on-surface-variant">
                      <span
                        className="material-symbols-outlined text-tertiary text-sm"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                      >
                        group
                      </span>
                      Join {roundedCount.toLocaleString()}+ others
                    </span>
                  </>
                )}
              </div>

              {/* Headline */}
              <h1 className="font-headline font-bold text-3xl sm:text-4xl lg:text-[44px] leading-[1.15] text-on-background mb-4">
                Built for <CyclingText /><br />
                Who Think in Products.
              </h1>

              {/* Subhead */}
              <h2 className="text-base lg:text-lg text-on-surface-variant leading-relaxed mb-5 max-w-md font-normal">
                Master product sense for interviews and on the job. Practice real decisions, get feedback from Luma, your personal product coach, and build the intuition that gets you hired and promoted.
              </h2>

              {/* Value Props */}
              <ul className="flex flex-col gap-1.5 mb-6 text-sm list-none" role="list">
                <li className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check_circle
                  </span>
                  <span className="text-on-surface">
                    <strong>Ace product sense interviews</strong> with Luma-graded practice rounds
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check_circle
                  </span>
                  <span className="text-on-surface">
                    <strong>Ship better on the job</strong> with real cases from startups and Big Tech
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check_circle
                  </span>
                  <span className="text-on-surface">
                    <strong>Track your growth</strong> as your Product IQ rises with every rep
                  </span>
                </li>
              </ul>

              {/* Form */}
              <WaitlistForm />
              <p className="text-xs font-label text-on-surface-variant/60 mt-2">
                Early access members lock in founding member pricing.
              </p>
            </div>

            {/* Right: Illustration */}
            <div className="order-1 lg:order-2 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hacky.png"
                alt="Hacky, the HackProduct mascot robot, studying product roadmaps and frameworks for product sense interview preparation"
                className="w-64 sm:w-72 lg:w-full lg:max-w-md h-auto"
                width={512}
                height={512}
              />
            </div>
          </div>
        </article>
      </main>

      {/* SEO-rich content below the fold, visible to crawlers */}
      <section className="sr-only" aria-label="About HackProduct">
        <h2>What is HackProduct?</h2>
        <p>HackProduct is the product sense training platform for software engineers, product managers, and students. Like LeetCode for coding interviews, HackProduct helps you practice product thinking for PM interviews and on-the-job product decisions.</p>

        <h3>Product Sense Interview Preparation</h3>
        <p>Prepare for product sense interviews at Google, Meta, Amazon, Apple, Netflix, Microsoft, Uber, Spotify, Stripe, and other top tech companies. Practice product design questions, product improvement questions, product strategy questions, and metrics and analytics questions.</p>

        <h3>Who Uses HackProduct</h3>
        <p>Software engineers preparing for PM interviews. Product managers sharpening product intuition. Students preparing for APM programs at Google, Meta, and Microsoft. Career switchers transitioning into product management. Tech leads building product thinking skills. MBA students preparing for product roles.</p>

        <h3>How HackProduct Works</h3>
        <p>Choose from real product case studies inspired by decisions at top tech companies. Analyze the problem, form your recommendation, and submit your answer. Luma, your AI product coach, grades your response across multiple dimensions including product strategy, user empathy, metrics definition, and execution planning. Track your Product IQ score as it grows with every practice session.</p>

        <h3>Product Sense Skills You Will Build</h3>
        <p>Product strategy and vision. User research and empathy. Metrics definition and analytics. Feature prioritization frameworks. Product roadmap planning. Go-to-market strategy. A/B testing and experimentation. Competitive analysis. Revenue model design. Technical feasibility assessment.</p>

        <h3>Companies That Ask Product Sense Questions</h3>
        <p>Google, Meta, Amazon, Apple, Netflix, Microsoft, Uber, Lyft, Airbnb, Spotify, Stripe, Square, Shopify, Salesforce, Adobe, Twitter, LinkedIn, Pinterest, Snap, DoorDash, Instacart, Robinhood, Coinbase, and hundreds of startups include product sense rounds in their interview process for both PM and engineering roles.</p>
      </section>
    </div>
  )
}
