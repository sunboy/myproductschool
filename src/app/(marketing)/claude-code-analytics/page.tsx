import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Live Data Analyst | Claude Code Analytics Practice | HackProduct',
  description:
    'Drive a live Claude Code agent against a real BigQuery dataset, investigate a business question end to end, and earn a graded analyst scorecard you can share.',
  path: '/claude-code-analytics',
  keywords: [
    'live data analyst practice',
    'Claude Code analytics',
    'AI-native data analysis',
    'BigQuery practice',
    'data analyst interview practice',
  ],
})

// Snapshot of the analyst arc (source of truth: src/components/v2/mediums/analyticsArc.ts).
// Copied locally so this marketing page has no workspace/(app) import. Update
// periodically alongside the arc, like the rest of the curated marketing content.
const SESSION_STEPS = [
  {
    step: 'Step 1',
    title: 'Connect the data tools',
    body: 'Spin up a sandbox, register the BigQuery tools, and start the agent. From there everything is plain language: you ask, it runs the queries.',
  },
  {
    step: 'Step 2',
    title: 'See what data exists',
    body: 'List the tables, then read one table’s columns and grain before writing any analysis. Good analysis starts by looking, not guessing.',
  },
  {
    step: 'Step 3',
    title: 'Understand the layout',
    body: 'Check the row count and partition column so queries stay fast and cheap on tables with millions of rows.',
  },
  {
    step: 'Step 4',
    title: 'Find the overall drop',
    body: 'Measure step-by-step conversion and rank where the largest drop happens. Isolate the cause, do not restate the symptom.',
  },
  {
    step: 'Step 5',
    title: 'Break it apart',
    body: 'Segment the worst step by a dimension like device or region. An aggregate hides the story; segmentation reveals it.',
  },
  {
    step: 'Step 6',
    title: 'Land the answer',
    body: 'Write the finding: the cause, the number that proves it, a recommended change, and a guardrail metric. A finding without a number is an opinion.',
  },
  {
    step: 'Step 7',
    title: 'Generate the report',
    body: 'Write the finding and the supporting queries to a report file. Capturing the queries makes the analysis reproducible.',
  },
  {
    step: 'Step 8',
    title: 'Write a skill',
    body: 'Encode the analysis as a reusable skill so the next session starts smarter on any dataset. This is the move that compounds.',
  },
]

const SCORED_DIMENSIONS = [
  { title: 'Connection setup', body: 'Getting the tools and the session wired up so the agent can actually query the data.' },
  { title: 'Problem framing', body: 'Reading the schema and grain before querying, so the investigation is grounded.' },
  { title: 'Query rigor', body: 'Measuring the right thing and ranking the drop instead of restating the symptom.' },
  { title: 'Segmentation', body: 'Breaking an aggregate apart to find where the cause concentrates.' },
  { title: 'Communication', body: 'Stating the cause, the number that proves it, and a recommended change.' },
  { title: 'Evidence', body: 'Capturing the queries and numbers so the finding is reproducible.' },
  { title: 'Skill construction', body: 'Encoding the analysis as a reusable skill the next session inherits.' },
]

export default function ClaudeCodeAnalyticsPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: 'https://hackproduct.dev/' },
            { name: 'Live data analyst', path: 'https://hackproduct.dev/claude-code-analytics' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Live Data Analyst | Claude Code Analytics Practice',
            url: 'https://hackproduct.dev/claude-code-analytics',
            description:
              'Drive a live Claude Code agent against a real BigQuery dataset to investigate a business question and earn a graded analyst scorecard.',
          },
        ]}
      />

      <V3PageHero
        eyebrow="Live data analyst"
        title="Drive a live AI analyst against real data."
        subtitle="Direct a Claude Code agent against a real BigQuery dataset to answer a business question. You decide what to chase, the agent runs the queries, and Hatch coaches every move until you land a finding that holds up."
        ctas={[
          { label: 'Start free', href: '/signup', variant: 'forest' },
          { label: 'See pricing', href: '/pricing', variant: 'amber' },
        ]}
      />

      <V3Section
        eyebrow="How a session runs"
        title="One investigation, eight moves."
        subtitle="A real analyst loop from a cold dataset to a reproducible answer. Beginner sessions run a shorter version of the same path."
      >
        <V3CardGrid>
          {SESSION_STEPS.map((s) => (
            <V3Card key={s.title} eyebrow={s.step} title={s.title} body={s.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="What it builds"
        title="Scored on the judgment, not the syntax."
        subtitle="Every session is graded across the moves a real analyst is measured on. You do not need to know SQL first, you direct the analysis in plain language."
      >
        <V3CardGrid>
          {SCORED_DIMENSIONS.map((d) => (
            <V3Card key={d.title} title={d.title} body={d.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="The proof"
        title="Walk away with an analyst scorecard."
        subtitle="Each finished session produces a graded report on live data: the finding, the queries that prove it, and a score across every analyst dimension. Keep it private or share it as proof of the work."
      >
        <V3CardGrid>
          <V3Card
            title="A finding backed by numbers"
            body="The cause, the metric that proves it, a recommended change, and the guardrail to watch."
          />
          <V3Card
            title="Reproducible queries"
            body="The exact queries you ran, captured in a report file so anyone can retrace the analysis."
          />
          <V3Card
            title="A shareable scorecard"
            body="A graded card across connection, framing, rigor, segmentation, communication, evidence, and skill."
          />
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Run your first investigation on real data."
        subtitle="No SQL required to start. Drive the agent, find the cause, and earn your first analyst scorecard."
        ctas={[{ label: 'Start free', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
