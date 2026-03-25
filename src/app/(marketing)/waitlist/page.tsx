import { WaitlistForm } from '@/components/marketing/WaitlistForm'
import { WaitlistCountdown } from '@/components/marketing/WaitlistCountdown'

const WAITLIST_COUNT = 1100 // TODO: fetch from supabase at build/request time

export default function WaitlistPage() {
  const showSocial = WAITLIST_COUNT > 1000
  const roundedCount = Math.floor(WAITLIST_COUNT / 100) * 100

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background text-on-background font-body selection:bg-secondary-container selection:text-on-secondary-container flex flex-col">
      {/* Nav */}
      <nav className="bg-background/80 backdrop-blur-lg border-b border-on-background/5 z-50 relative">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-headline font-bold text-on-background tracking-tight">
            &lt; HackProduct
          </span>
          <WaitlistCountdown />
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <section className="max-w-7xl w-full mx-auto px-6">
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
                Stop Guessing.<br />
                <span className="text-primary">Start Thinking</span>{' '}
                Like a Product Leader.
              </h1>

              {/* Subhead */}
              <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed mb-5 max-w-md">
                The practice gym where engineers build real product intuition — through deliberate reps, not courses.
              </p>

              {/* Value Props */}
              <div className="flex flex-col gap-1.5 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check_circle
                  </span>
                  <span className="text-on-surface">
                    <strong>AI feedback</strong> on every answer — not just right or wrong
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check_circle
                  </span>
                  <span className="text-on-surface">
                    <strong>Real cases</strong> from Spotify, Uber, Stripe
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check_circle
                  </span>
                  <span className="text-on-surface">
                    <strong>Product IQ tracking</strong> — watch the gap close
                  </span>
                </div>
              </div>

              {/* Form */}
              <WaitlistForm />
              <p className="text-xs font-label text-on-surface-variant/60 mt-2">
                Free during beta. No credit card. Unsubscribe anytime.
              </p>
            </div>

            {/* Right: Illustration */}
            <div className="order-1 lg:order-2 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hacky.png"
                alt="Hacky the robot studying product roadmaps"
                className="w-64 sm:w-72 lg:w-full lg:max-w-md h-auto"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
