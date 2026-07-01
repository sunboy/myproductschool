import type { Metadata } from 'next'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { defaultCommissionBps } from '@/lib/stripe/affiliates'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

const COMMISSION_PCT = Math.round(defaultCommissionBps() / 100)

export const metadata: Metadata = buildMetadata({
  title: 'Affiliate Program | Earn Recurring Commission | HackProduct',
  description: `Earn ${COMMISSION_PCT}% recurring commission on every subscriber you refer to HackProduct. Apply in minutes, get a personal link, get paid through Stripe.`,
  path: '/affiliate-program',
  keywords: [
    'HackProduct affiliate program',
    'interview prep affiliate',
    'recurring commission affiliate program',
    'AI tools affiliate program',
    'creator referral program',
  ],
})

const STEPS = [
  {
    step: 'Step 1',
    title: 'Apply',
    body: 'Sign in and open the affiliate center. Approval is instant, no waiting on a review queue.',
  },
  {
    step: 'Step 2',
    title: 'Get your link',
    body: 'You get a personal /r/ link. Every click sets a 60-day cookie, so you still get credit if someone subscribes weeks later.',
  },
  {
    step: 'Step 3',
    title: 'Get paid',
    body: `Earn ${COMMISSION_PCT}% recurring commission on every payment your referral makes, for as long as they stay subscribed. Payouts run through Stripe Connect straight to your bank account.`,
  },
]

const WHO_ITS_FOR = [
  {
    title: 'Interview prep creators',
    body: 'You already talk to engineers and PMs prepping for product sense, system design, and data rounds. Point them at reps that actually grade their reasoning.',
  },
  {
    title: 'AI tools educators',
    body: 'Your audience wants hands-on AI practice, not another explainer video. Claude Code Analytics gives them a real BigQuery investigation to drive.',
  },
  {
    title: 'Newsletter and community operators',
    body: 'One link in a newsletter, a Discord pin, or a course bonus section turns into recurring revenue for as long as the referral stays subscribed.',
  },
]

const FAQS = [
  {
    q: `How much commission do I earn?`,
    a: `You earn ${COMMISSION_PCT}% recurring commission on every payment a referred subscriber makes, for the lifetime of their subscription, not just the first payment.`,
  },
  {
    q: 'How long does the referral cookie last?',
    a: 'Sixty days. If someone clicks your link and subscribes any time in the next 60 days, the referral is credited to you.',
  },
  {
    q: 'How do I get paid?',
    a: 'Payouts run through Stripe Connect. Once your account is verified, commissions accrue automatically and transfer to your bank on the monthly payout run.',
  },
  {
    q: 'Is there a minimum audience size to apply?',
    a: 'No. Anyone with a channel where engineers, PMs, or students preparing for interviews will see your link can apply.',
  },
  {
    q: 'What can I say when promoting HackProduct?',
    a: 'Describe it accurately: a practice gym for product and technical judgment with AI-coached feedback, live mock interviews, and a graded live data analyst track. Avoid guarantees about interview outcomes.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
}

export default function AffiliateProgramMarketingPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: SITE_NAME, path: SITE_URL },
            { name: 'Affiliate program', path: canonicalUrl('/affiliate-program') },
          ]),
          faqJsonLd,
        ]}
      />

      <V3PageHero
        eyebrow="Affiliate program"
        title={`Earn ${COMMISSION_PCT}% recurring commission for every referral.`}
        subtitle="HackProduct pays creators and educators for sending engineers, PMs, and students who become paying subscribers. One link, tracked for 60 days, paid out every month through Stripe."
        ctas={[
          { label: 'Become an affiliate', href: '/signup?next=/affiliates', variant: 'forest' },
          { label: 'See pricing', href: '/pricing', variant: 'amber' },
        ]}
      />

      <V3Section
        eyebrow="Who it's for"
        title="Built for people already reaching this audience."
        subtitle="If your audience is preparing for interviews or leveling up with AI-native tools, a referral to HackProduct fits naturally."
      >
        <V3CardGrid>
          {WHO_ITS_FOR.map((item) => (
            <V3Card key={item.title} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="How it works"
        title="Three steps, no approval wait."
        subtitle="From application to your first payout, the whole flow runs through the same account you already use to practice."
      >
        <V3CardGrid>
          {STEPS.map((s) => (
            <V3Card key={s.title} eyebrow={s.step} title={s.title} body={s.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="FAQ"
        title="Questions about the affiliate program"
      >
        <V3CardGrid>
          {FAQS.map((faq) => (
            <V3Card key={faq.q} title={faq.q} body={faq.a} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Turn your audience into recurring revenue."
        subtitle={`Apply in minutes, get your link, and start earning ${COMMISSION_PCT}% on every subscriber you send.`}
        ctas={[{ label: 'Become an affiliate', href: '/signup?next=/affiliates' }]}
      />
    </V3PageShell>
  )
}
