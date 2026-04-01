import type { Metadata } from 'next'
import Image from 'next/image'
import { WaitlistForm } from '@/components/marketing/WaitlistForm'
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

const PATH_D =
  'M200 0 C200 200 350 250 350 450 S100 650 100 850 S300 1050 300 1250 S50 1450 50 1650 C50 1850 200 1900 200 2000'

export default async function WaitlistBPage() {
  const waitlistCount = await getWaitlistCount()
  const showSocial = waitlistCount > 1000
  const roundedCount = Math.floor(waitlistCount / 100) * 100

  return (
    <div className="min-h-screen bg-background text-on-background font-body scroll-smooth">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-on-background/10"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between w-full">
          <span className="flex items-center gap-2 text-xl font-headline font-bold text-on-background tracking-tight">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hackylogo.png"
              alt="HackProduct logo"
              className="w-8 h-8 object-contain"
              width={32}
              height={32}
            />
            HackProduct
          </span>
          <a
            href="#waitlist-form"
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-label font-bold shadow-[0_4px_0_0_#2d5c3a] hover:translate-y-[2px] hover:shadow-none transition-all inline-flex items-center justify-center"
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-10 flex flex-col items-center text-center relative z-10">
          {/* Mascot with speech bubble */}
          <div className="mb-8 relative">
            <div className="absolute -top-12 -left-20 bg-surface p-4 rounded-xl shadow-md font-label font-bold text-sm text-primary max-w-[150px] -rotate-12 border border-outline-variant z-10">
              &ldquo;Psst! The path to your dream role starts here!&rdquo;
              <div className="absolute -bottom-2 right-4 w-4 h-4 bg-surface rotate-45 border-r border-b border-outline-variant" />
            </div>
            <Image
              src="/images/hacky.png"
              alt="Hacky the HackProduct mascot robot, your product sense guide"
              width={192}
              height={192}
              className="w-48 h-48 drop-shadow-xl"
            />
          </div>

          {/* Headline */}
          <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tighter text-on-surface mb-6 max-w-3xl leading-none">
            Master Product Sense.<br />
            Stay Relevant with AI.
          </h1>

          {/* Subhead */}
          <p className="text-xl md:text-2xl text-on-surface-variant font-medium max-w-2xl mb-12">
            Coding skills are now a commodity. Develop your product sense, boost creativity, and
            elevate your critical thinking.
          </p>

          {/* Scroll arrow */}
          <div className="animate-bounce">
            <span
              className="material-symbols-outlined text-4xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 40" }}
            >
              keyboard_double_arrow_down
            </span>
          </div>
        </section>

        {/* Kinetic Learning Path */}
        <section
          className="relative max-w-4xl mx-auto px-6 pb-40 min-h-[2000px]"
          aria-label="Learning journey"
        >
          {/* SVG curved path background */}
          <div className="absolute inset-0 z-0 flex justify-center pointer-events-none" aria-hidden="true">
            <svg
              className="w-full h-full max-w-[600px]"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 400 2000"
            >
              <path
                d={PATH_D}
                stroke="var(--color-primary-container, #c8e8d0)"
                strokeLinecap="round"
                strokeWidth="24"
              />
              <path
                d={PATH_D}
                stroke="var(--color-primary, #4a7c59)"
                strokeLinecap="round"
                strokeWidth="8"
                strokeDasharray="10"
                opacity="0.2"
              />
            </svg>
          </div>

          {/* Stop 1: Learn the Frameworks */}
          <div className="relative z-10 pt-40 flex justify-end pr-[5%] group">
            <div className="flex flex-col items-center">
              <div className="bg-surface p-6 rounded-2xl shadow-md border border-outline-variant max-w-xs transition-all duration-500 opacity-80 group-hover:opacity-100 group-hover:shadow-xl">
                <span className="text-xs font-label font-black text-tertiary uppercase tracking-widest mb-2 block">
                  Module 01
                </span>
                <h3 className="text-xl font-headline font-bold mb-2">Learn the Frameworks</h3>
                <p className="text-on-surface-variant text-sm">
                  FLOW, our framework is a derived mental model based on experts from the industry
                </p>
              </div>
              <div className="mt-4">
                <Image
                  src="/images/hacky_reading.png"
                  alt="Mascot reading a book"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
            </div>
          </div>

          {/* Luma interjection 1 */}
          <div className="relative z-10 pt-40 flex justify-start pl-[15%]">
            <div className="bg-secondary-container p-4 rounded-t-2xl rounded-br-2xl border-l-4 border-outline text-on-secondary-container font-label font-bold text-sm max-w-[200px]">
              &ldquo;Most engineers struggle in the Product Sense round. Luma helps you win&rdquo;
            </div>
          </div>

          {/* Stop 2: Daily Practice Arena */}
          <div className="relative z-10 pt-40 flex justify-end pr-[10%] group">
            <div className="flex flex-col items-center">
              <div className="bg-surface p-6 rounded-2xl shadow-md border border-outline-variant max-w-xs transition-all duration-500 opacity-80 group-hover:opacity-100 group-hover:shadow-xl">
                <span className="text-xs font-label font-black text-tertiary uppercase tracking-widest mb-2 block">
                  Module 02
                </span>
                <h3 className="text-xl font-headline font-bold mb-2">Daily Practice Arena</h3>
                <p className="text-on-surface-variant text-sm">
                  Real-time challenges with an AI coach. Practice builds thinking muscle.
                </p>
              </div>
              <div className="mt-4">
                <Image
                  src="/images/hacky_dueling.png"
                  alt="Mascot dueling"
                  width={96}
                  height={96}
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>

          {/* Stop 3: Build Your Streak */}
          <div className="relative z-10 pt-40 flex justify-start pl-[5%] group">
            <div className="flex flex-col items-center">
              <div className="bg-surface p-6 rounded-2xl shadow-md border border-outline-variant max-w-xs transition-all duration-500 opacity-80 group-hover:opacity-100 group-hover:shadow-xl">
                <span className="text-xs font-label font-black text-tertiary uppercase tracking-widest mb-2 block">
                  Module 03
                </span>
                <h3 className="text-xl font-headline font-bold mb-2">Build Your Streak</h3>
                <p className="text-on-surface-variant text-sm">
                  Consistency is the secret sauce. Unlock badges and climb the global leaderboard.
                </p>
              </div>
              <div className="mt-4">
                <Image
                  src="/images/hacky_practice.png"
                  alt="Mascot practicing"
                  width={96}
                  height={96}
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>

          {/* Luma interjection 2 */}
          <div className="relative z-10 pt-20 flex justify-center">
            <div className="bg-primary-container p-4 rounded-2xl border-b-4 border-primary text-on-primary-container font-label font-bold text-base text-center max-w-[250px]">
              &ldquo;Look at that momentum! You&apos;re already in the top 10% of learners today!&rdquo;
            </div>
          </div>

          {/* Stop 4: Live AI-assisted Interviews */}
          <div className="relative z-10 pt-40 flex justify-start pl-[5%] group">
            <div className="flex flex-col items-center">
              <div className="bg-surface p-6 rounded-2xl shadow-md border border-outline-variant max-w-xs transition-all duration-500 opacity-80 group-hover:opacity-100 group-hover:shadow-xl">
                <span className="text-xs font-label font-black text-tertiary uppercase tracking-widest mb-2 block">
                  Module 04
                </span>
                <h3 className="text-xl font-headline font-bold mb-2">Live AI-assisted Interviews</h3>
                <p className="text-on-surface-variant text-sm">
                  Practice your product sense with Luma, our custom trained AI agent.
                </p>
              </div>
              <div className="mt-4">
                <Image
                  src="/images/hacky_hiring.png"
                  alt="Mascot looking professional"
                  width={80}
                  height={80}
                  className="w-20 h-20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist Form */}
        <section
          id="waitlist-form"
          className="relative z-10 flex flex-col items-center px-6 pb-40 scroll-mt-28"
        >
          {showSocial && (
            <p className="text-center text-on-surface-variant font-label text-sm mb-6">
              Join {roundedCount.toLocaleString()}+ others already on the waitlist
            </p>
          )}
          <div className="relative w-full max-w-md mx-auto">
            <div className="absolute inset-0 bg-primary blur-3xl opacity-20 rounded-full animate-pulse pointer-events-none" />
            <div className="relative">
              <WaitlistForm />
            </div>
          </div>
          <p className="text-xs font-label text-on-surface-variant/60 mt-4">
            Early access members lock in founding member pricing.
          </p>
        </section>
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
      </section>
    </div>
  )
}
