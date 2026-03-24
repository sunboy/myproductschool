import Link from 'next/link'
import { FloatingNav } from '@/components/marketing/FloatingNav'
import { GradientFooter } from '@/components/marketing/GradientFooter'
import { LogoMarquee } from '@/components/marketing/LogoMarquee'

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-secondary-container selection:text-on-secondary-container">
      <FloatingNav />

      <main>
        {/* ── Hero Section ─────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block tracking-[0.15em] text-[12px] font-bold text-outline uppercase">
                THE PRACTICE GYM FOR PRODUCT THINKING
              </div>
              <h1 className="font-headline font-black text-6xl md:text-[72px] leading-[1.1] text-on-background">
                Master <span className="text-gradient">Product Sense</span>
              </h1>
              <p className="text-lg md:text-xl text-secondary max-w-lg leading-relaxed">
                Refine your intuition through deliberate practice. The only
                platform designed to turn high-level frameworks into second
                nature.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/signup"
                  className="bg-primary text-white px-8 py-4 rounded-full font-bold ambient-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Start Free Training
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </Link>
                <button className="bg-white text-primary px-8 py-4 rounded-full font-bold ghost-border border border-outline-variant/15 hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">
                    play_circle
                  </span>
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Right Visual: App Screenshot Mockup */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full" />
              <div className="relative bg-white p-6 rounded-xl editorial-shadow rotate-2 transition-transform duration-500 hover:rotate-0">
                <div className="border-b border-surface-container pb-4 mb-6 flex justify-between items-center">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-error/20" />
                    <div className="w-3 h-3 rounded-full bg-secondary-container" />
                    <div className="w-3 h-3 rounded-full bg-primary/20" />
                  </div>
                  <span className="text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full uppercase tracking-wider">
                    Hard
                  </span>
                </div>
                <div className="space-y-4">
                  <h3 className="font-headline text-xl font-bold text-on-background">
                    Marketplace Retention Challenge
                  </h3>
                  <p className="text-sm text-outline font-medium">
                    Uber is seeing a 15% drop in driver retention in Tier 2
                    cities. How do you diagnose and solve this?
                  </p>
                  <div className="bg-surface-container-low p-4 rounded-lg min-h-[140px] relative">
                    <p className="text-sm text-on-background leading-relaxed">
                      First, I&apos;d segment the driver population by tenure. If the
                      drop is in the first 30 days, it&apos;s likely an onboarding
                      friction issue. If it&apos;s long-term drivers, it&apos;s likely
                      earnings or fatigue. I would prioritize examining the
                      earnings per hour (EPH) vs fuel costs in those specific
                      regions
                      <span className="inline-block w-[2px] h-4 bg-primary ml-1 animate-pulse" />
                    </p>
                  </div>

                  {/* Luma Feedback Card Overlay */}
                  <div className="absolute -bottom-10 -right-10 w-64 bg-[#f0f8f2] p-4 rounded-xl border border-primary/10 editorial-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span
                          className="material-symbols-outlined text-white text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          diamond
                        </span>
                      </div>
                      <span className="font-bold text-xs text-primary">
                        Luma AI Coach
                      </span>
                    </div>
                    <p className="text-[11px] text-primary/80 font-medium leading-normal">
                      &ldquo;Strong framework usage. You identified the segmentation
                      correctly. Consider adding a competitive landscape analysis
                      for Tier 2 competitors.&rdquo;
                    </p>
                    <div className="mt-2 pt-2 border-t border-primary/10 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-primary/60 uppercase">
                        Score
                      </span>
                      <span className="text-sm font-black text-primary">
                        8.2/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Logo Marquee ─────────────────────────────────────── */}
        <LogoMarquee />

        {/* ── Feature Bento Grid ───────────────────────────────── */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="font-headline font-bold text-4xl text-on-background">
                Why engineers choose HackProduct
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: AI Coach Luma */}
              <div className="bg-white p-10 rounded-xl editorial-shadow hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(74,124,89,0.1)] transition-all duration-300 flex flex-col h-full">
                <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                  <div className="absolute inset-2 bg-primary/20 rounded-full" />
                  <span
                    className="material-symbols-outlined text-primary text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    diamond
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">
                  AI Coach Luma
                </h3>
                <p className="text-outline leading-relaxed flex-grow">
                  Real-time feedback on your product thinking. Luma analyzes your
                  logic, framework application, and trade-off considerations.
                </p>
              </div>

              {/* Card 2: 500+ Challenges */}
              <div className="bg-white p-10 rounded-xl editorial-shadow group transition-all duration-300 flex flex-col h-full">
                <div className="w-16 h-16 mb-8 bg-secondary-container/30 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-3xl">
                    grid_view
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">
                  500+ Challenges
                </h3>
                <p className="text-outline leading-relaxed flex-grow">
                  From retention pivots to marketplace cold-start problems,
                  practice on the exact scenarios used in top-tier product
                  interviews.
                </p>
              </div>

              {/* Card 3: ProductIQ Score */}
              <div className="bg-white p-10 rounded-xl editorial-shadow flex flex-col h-full border border-transparent hover:border-primary/10 transition-colors">
                <div className="w-16 h-16 mb-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    analytics
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">
                  ProductIQ Score
                </h3>
                <p className="text-outline leading-relaxed mb-8 flex-grow">
                  Visualize your growth across 6 core dimensions of product
                  thinking. Benchmark your skills against the industry standard.
                </p>
                <div className="mt-auto h-20 flex items-end gap-1">
                  <div className="flex-1 bg-primary/10 h-1/4 rounded-t-sm" />
                  <div className="flex-1 bg-primary/20 h-2/4 rounded-t-sm" />
                  <div className="flex-1 bg-primary/40 h-3/4 rounded-t-sm" />
                  <div className="flex-1 bg-signature-gradient h-full rounded-t-sm" />
                  <div className="flex-1 bg-primary/60 h-4/5 rounded-t-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Social Proof Section ─────────────────────────────── */}
        <section className="py-32 bg-[#f0f8f2] px-6">
          <div className="max-w-7xl mx-auto">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 text-center">
              <div className="space-y-2">
                <div className="text-5xl font-headline font-bold text-gradient">
                  12,000+
                </div>
                <div className="text-sm font-label font-bold text-primary/60 uppercase tracking-widest">
                  Active Learners
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-headline font-bold text-gradient">
                  4.8
                </div>
                <div className="text-sm font-label font-bold text-primary/60 uppercase tracking-widest">
                  Average Rating
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-headline font-bold text-gradient">
                  94%
                </div>
                <div className="text-sm font-label font-bold text-primary/60 uppercase tracking-widest">
                  Career Mobility
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white p-8 rounded-xl editorial-shadow">
                <div className="flex gap-1 text-secondary mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="italic text-on-background mb-6 leading-relaxed font-headline">
                  &ldquo;The structure of these challenges forced me to think
                  beyond the obvious. It&apos;s the only thing that actually
                  prepared me for my Lead PM role at Stripe.&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed border-2 border-primary-fixed flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">SJ</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">Sarah Jenkins</div>
                    <div className="text-xs text-outline">
                      Lead PM @ Stripe
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white p-8 rounded-xl editorial-shadow">
                <div className="flex gap-1 text-secondary mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="italic text-on-background mb-6 leading-relaxed font-headline">
                  &ldquo;As an engineer transitioning into product, the AI
                  feedback was invaluable. It helped me unlearn technical biases
                  and focus on user value.&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed border-2 border-primary-fixed flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">MC</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">Marcus Chen</div>
                    <div className="text-xs text-outline">
                      Sr. Product Engineer @ Vercel
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white p-8 rounded-xl editorial-shadow">
                <div className="flex gap-1 text-secondary mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="italic text-on-background mb-6 leading-relaxed font-headline">
                  &ldquo;High-quality editorial design meets rigorous
                  intellectual challenge. It feels like a private library for the
                  modern product mind.&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed border-2 border-primary-fixed flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">ER</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">Elena Rodriguez</div>
                    <div className="text-xs text-outline">
                      Product Lead @ DoorDash
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <GradientFooter />

      {/* ── Floating Action Button ─────────────────────────────── */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group">
          <span className="material-symbols-outlined">chat</span>
          <span className="font-bold font-label">Talk to a Mentor</span>
        </button>
      </div>
    </div>
  )
}
