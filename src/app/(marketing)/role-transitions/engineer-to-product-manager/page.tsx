import type { Metadata } from 'next'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

const PATH = '/role-transitions/engineer-to-product-manager'

const TITLE = 'Engineer to Product Manager Transition Practice | HackProduct'
const DESCRIPTION =
  'Move from engineering into product management with structured practice: product sense, metrics, prioritization, and stakeholder trade-offs, scored by Hatch and mapped to the FLOW framework.'

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  keywords: [
    'engineer to product manager',
    'engineer to PM transition',
    'switch from engineering to product management',
    'technical product manager practice',
    'product sense for engineers',
  ],
})

const WHAT_CHANGES = [
  {
    title: 'The question changes from "how" to "why"',
    body: 'Writing the code proved you could build the thing. The PM question is whether the thing was worth building at all, and for whom.',
  },
  {
    title: 'Ambiguity stops being a bug',
    body: 'A vague ticket used to mean someone forgot to write a spec. In product work, the ambiguity is the job. Framing it is the first move, not a blocker.',
  },
  {
    title: 'Trade-offs get named out loud',
    body: 'Engineers make trade-offs constantly and mostly keep them in their head. Product work means saying the trade-off out loud and defending the one you picked.',
  },
  {
    title: 'The audience for your reasoning gets wider',
    body: 'A pull request description is read by other engineers. A product recommendation is read by a designer, a sales lead, and an exec with five minutes.',
  },
]

const PRACTICE_TRACKS = [
  {
    eyebrow: 'Frame',
    title: 'Diagnose before you propose',
    body: 'Take a vague signal (usage dropped, a competitor shipped something, support tickets spiked) and find the actual problem before reaching for a fix.',
  },
  {
    eyebrow: 'List',
    title: 'Widen the option space',
    body: 'Generate more than the first two ideas that come to mind, including the option to do nothing, and account for who else is affected.',
  },
  {
    eyebrow: 'Optimize',
    title: 'Pick a criterion and defend it',
    body: 'State what you are optimizing for, name the metric and the guardrail, and explain what you are willing to give up to get it.',
  },
  {
    eyebrow: 'Win',
    title: 'Land a recommendation someone can act on',
    body: 'Write the decision in one sentence: what you will do, how you will know it worked, and how you will know it failed.',
  },
]

const PROOF_POINTS = [
  {
    title: 'Product sense reps built for technical backgrounds',
    body: 'Scenarios that respect what you already know (systems, data, trade-offs) and push you to apply it to user and business outcomes instead of implementation.',
  },
  {
    title: 'Hatch grades your reasoning, not your vocabulary',
    body: 'Feedback targets the actual move you missed (a skipped stakeholder, a preference dressed up as a trade-off) instead of rewarding buzzwords.',
  },
  {
    title: 'A study plan sequenced around the FLOW moves',
    body: 'The engineer-to-product study plan sequences practice around Frame, List, Optimize, and Win instead of a generic curriculum.',
  },
  {
    title: 'A skill map that tells you where you actually stand',
    body: 'Six competencies, tracked from your practice history, not from a form you filled out about yourself.',
  },
]

export default function EngineerToProductManagerPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: SITE_NAME, path: SITE_URL },
            { name: 'Role transitions', path: canonicalUrl('/role-transitions') },
            { name: 'Engineer to product manager', path: canonicalUrl(PATH) },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: TITLE,
            description: DESCRIPTION,
            url: canonicalUrl(PATH),
          },
        ]}
      />

      <V3PageHero
        eyebrow="Engineer to product manager"
        title="You can already build it. Now practice deciding what's worth building."
        subtitle="For engineers moving toward product management, or toward product thinking on the job without a title change. The technical depth carries over. The judgment underneath it (framing ambiguity, naming trade-offs, defending a recommendation) is a separate skill, and it is trainable."
        ctas={[
          { label: 'See where you stand', href: '/quiz/archetype' },
          { label: 'Start free', href: '/signup' },
        ]}
      />

      <V3Section
        eyebrow="What actually changes"
        title="The transition is not a vocabulary problem"
        subtitle="Most engineers moving into product work already understand the mechanics. What is missing is reps at the reasoning underneath a product decision."
      >
        <V3CardGrid>
          {WHAT_CHANGES.map((item) => (
            <V3Card key={item.title} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="FLOW"
        title="Four moves, trained in order"
        subtitle="Every product decision breaks down into the same four moves. HackProduct scores each one separately so you know exactly which move is costing you."
      >
        <V3CardGrid>
          {PRACTICE_TRACKS.map((item) => (
            <V3Card key={item.title} eyebrow={item.eyebrow} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="Why HackProduct"
        title="Built for people who already know how to think in systems"
        subtitle="This is not a course that starts from zero. It routes your existing technical judgment toward product outcomes."
      >
        <V3CardGrid>
          {PROOF_POINTS.map((item) => (
            <V3Card key={item.title} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="Who this is for"
        title="Built for engineers, not just PM candidates"
      >
        <V3CardGrid>
          <V3Card
            title="Engineers interviewing for PM or APM roles"
            body="Practice the product sense round the way it actually gets graded, with follow-up pressure instead of a single static answer."
          />
          <V3Card
            title="Engineers doing product work without the title"
            body="Staff and senior engineers who already own roadmap decisions and want sharper judgment, not a certificate."
          />
          <V3Card
            title="Founding engineers and early hires"
            body="Small teams where the person writing the code is also deciding what to build next, whether or not that is written into the job description."
          />
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Find your product-thinking archetype."
        subtitle="A short diagnostic maps your current strengths across the six competencies HackProduct tracks, then points you at the study plan built for the gap."
        ctas={[
          { label: 'Find your product-thinking archetype', href: '/quiz/archetype' },
          { label: 'Start free', href: '/signup' },
        ]}
      />
    </V3PageShell>
  )
}
