import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

const MOVES = [
  {
    letter: 'F',
    name: 'Frame',
    headline: 'Find the real job before solving.',
    body: 'Clarify user, goal, metric, scope, and constraint so the rest of the answer solves the right problem.',
    signal: 'Good candidates ask clarifying questions. Strong candidates change the problem definition.',
    score: 86,
  },
  {
    letter: 'L',
    name: 'List',
    headline: 'Open the option space.',
    body: 'Generate non-overlapping hypotheses, architectures, schemas, queries, or implementation paths before you pick one.',
    signal: 'The answer stops sounding like a guess and starts sounding like a map.',
    score: 72,
  },
  {
    letter: 'O',
    name: 'Optimize',
    headline: 'Choose with evidence.',
    body: 'Use impact, confidence, effort, risk, latency, cost, correctness, or user value to select the highest-leverage path.',
    signal: 'You can defend why this bet beats the alternatives.',
    score: 78,
  },
  {
    letter: 'W',
    name: 'Win',
    headline: 'Land the recommendation.',
    body: 'Make the decision legible: recommendation first, evidence second, risks named, next step clear.',
    signal: 'The room knows what to do next.',
    score: 91,
  },
] as const

const DISCIPLINES = [
  ['Product sense', 'User, metric, segment, recommendation'],
  ['System design', 'Requirement, component, bottleneck, trade-off'],
  ['Data modeling', 'Entity, relationship, access pattern, constraint'],
  ['SQL', 'Business question, join path, assumption, conclusion'],
  ['Coding', 'Constraint, approach, edge case, correctness'],
  ['AI-native workflows', 'Context, eval, review loop, product value'],
] as const

const OUTCOMES = [
  ['Interview prep', '/interview-prep'],
  ['Role transitions', '/role-transitions'],
  ['Promotion readiness', '/uplevel'],
  ['Salary proof', '/salary-negotiation'],
] as const

export function FlowFrameworkPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: 'https://hackproduct.dev/' },
            { name: 'FLOW Framework', path: 'https://hackproduct.dev/flow' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'FLOW Framework',
            url: 'https://hackproduct.dev/flow',
            description:
              'FLOW is how HackProduct scores career-changing judgment reps: Frame, List, Optimize, and Win across product and technical disciplines.',
          },
        ]}
      />

      <V3PageHero
        eyebrow="FLOW framework"
        title="The scoring system for career-changing judgment reps."
        subtitle="FLOW is how HackProduct turns every practice answer into trainable feedback: Frame, List, Optimize, Win. The moves adapt across product sense, systems, data, SQL, coding, and AI-native workflows."
        ctas={[
          { label: 'Start a free rep', href: '/login?returnTo=/challenges' },
          { label: 'Browse reps', href: '/practice', variant: 'amber' },
        ]}
      />

      <V3Section eyebrow="The four moves" title="FLOW makes weak judgment visible.">
        <V3CardGrid>
          {MOVES.map((move) => (
            <V3Card
              key={move.name}
              eyebrow={`${move.letter} · ${move.name}`}
              title={move.headline}
              body={`${move.body} ${move.signal}`}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Across disciplines" title="Same moves, different evidence.">
        <V3CardGrid>
          {DISCIPLINES.map(([name, evidence]) => (
            <V3Card
              key={name}
              title={name}
              body={evidence}
              href={`/skills/${name.toLowerCase().replaceAll(' ', '-')}`}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="Career outcomes"
        title="FLOW is the mechanism. The career moment is the reason."
      >
        <V3CardGrid>
          {OUTCOMES.map(([label, href]) => (
            <V3Card key={href} title={label} href={href} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Run a FLOW-scored rep."
        subtitle="Pick a discipline, answer in the workspace, let Hatch follow up, and save the receipt that shows what changed."
        ctas={[{ label: 'Start a rep', href: '/login?returnTo=/challenges' }]}
      />
    </V3PageShell>
  )
}
