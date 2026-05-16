import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DirectoryShell, CtaBand } from '@/components/directory/DirectoryChrome'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { OutcomePageEntry } from '@/lib/seo/outcomes'

const FLOW = [
  ['Frame', 'Define the real career moment and the signal you need to show.'],
  ['List', 'Open the possible paths, examples, and drill types before choosing one.'],
  ['Optimize', 'Prioritize the rep that most improves the next high-stakes moment.'],
  ['Win', 'Turn the evidence into a clear story someone can act on.'],
] as const

const OUTCOME_DETAIL: Record<OutcomePageEntry['slug'], {
  hatchImage: string
  hatchAlt: string
  samplePrompt: string
  signupHook: string
  quickWins: string[]
  playbook: Array<[string, string]>
}> = {
  'interview-prep': {
    hatchImage: '/images/hacky_practice.png',
    hatchAlt: 'Hatch preparing an interview practice session',
    samplePrompt: 'Spotify listening time dropped 15%, but DAU is flat and premium conversion is unchanged. Diagnose what changed.',
    signupHook: 'Open the workspace to get live follow-ups, a scored rubric, and the weak move Hatch would drill next.',
    quickWins: [
      'Find the missing clarifying question before the interviewer has to ask.',
      'Practice a product sense answer and a systems answer in the same session.',
      'Leave with a readiness map for Frame, List, Optimize, and Win.',
    ],
    playbook: [
      ['Diagnostic rep', 'Start with one ambiguous product or technical prompt and expose the weak move.'],
      ['Follow-up pressure', 'Hatch asks the second question that usually appears in live loops.'],
      ['Rubric receipt', 'Save what worked, what broke, and what to drill before the next interview.'],
    ],
  },
  'role-transitions': {
    hatchImage: '/images/hacky_learning.png',
    hatchAlt: 'Hatch guiding a role transition learning path',
    samplePrompt: 'You are the engineer closest to a retention problem. Write the product diagnosis before proposing a technical fix.',
    signupHook: 'Open the path to translate engineering instincts into product framing, metric reasoning, and decision memos.',
    quickWins: [
      'Turn implementation knowledge into user and business language.',
      'Practice product sense without pretending your technical depth is irrelevant.',
      'Build role-transition artifacts you can reuse in manager and recruiter conversations.',
    ],
    playbook: [
      ['Translate the signal', 'Convert a technical issue into a product problem statement.'],
      ['Choose the leverage point', 'Compare user, data, systems, and stakeholder moves before acting.'],
      ['Write the proof', 'Save a concise decision memo that shows product-minded judgment.'],
    ],
  },
  uplevel: {
    hatchImage: '/images/hacky_thinking.png',
    hatchAlt: 'Hatch reviewing senior and staff-level judgment',
    samplePrompt: 'A senior system migration is late, leadership is worried, and the customer impact is unclear. What recommendation do you make?',
    signupHook: 'Open the staff-readiness path to practice recommendations, trade-off language, and executive-ready receipts.',
    quickWins: [
      'Practice turning ambiguity into a decision leaders can act on.',
      'Connect architecture choices to customer and business impact.',
      'Build a trail of staff-level recommendations, not just completed tasks.',
    ],
    playbook: [
      ['Scope the room', 'Name the decision, audience, risk, and operating level signal.'],
      ['Compare trade-offs', 'Use systems, product, and data evidence before picking a path.'],
      ['Land the recommendation', 'Write the next step with owner, timeline, and kill criteria.'],
    ],
  },
  'salary-negotiation': {
    hatchImage: '/images/hacky_celebrate.png',
    hatchAlt: 'Hatch celebrating proof of career progress',
    samplePrompt: 'You need to show staff-level scope in a compensation conversation. Which evidence proves judgment rather than activity?',
    signupHook: 'Open the proof path to turn practice history into clearer evidence of operating level.',
    quickWins: [
      'Identify the difference between effort, impact, and judgment evidence.',
      'Collect FLOW receipts that show how your recommendations improved.',
      'Prepare a stronger level story without making compensation guarantees.',
    ],
    playbook: [
      ['Inventory receipts', 'Pull strong reps, weak-move improvements, and saved decision artifacts.'],
      ['Map level signal', 'Connect evidence to scope, ambiguity, influence, and decision quality.'],
      ['Draft the story', 'Build a concise proof narrative for the conversation.'],
    ],
  },
}

export function OutcomePage({ outcome }: { outcome: OutcomePageEntry }) {
  const detail = OUTCOME_DETAIL[outcome.slug]

  return (
    <DirectoryShell>
      <section className="relative overflow-hidden bg-[#102018] px-5 py-16 text-[#f8f3e7] sm:px-8 lg:py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(760px 420px at 15% 85%, rgba(142,207,158,.26), transparent 62%), radial-gradient(620px 340px at 90% 10%, rgba(201,147,58,.2), transparent 58%), linear-gradient(115deg, rgba(200,232,208,.1), transparent 45%)',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <Badge className="mb-5 border-[#b9e6b2]/25 bg-[#f8f3e7]/8 text-[#b9e6b2]">
              {outcome.shortTitle}
            </Badge>
            <h1 className="max-w-4xl font-headline text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">
              {outcome.hero}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f8f3e7]/72">{outcome.summary}</p>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#b9e6b2]">{outcome.proofPoint}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-md bg-[#f8f3e7] px-5 text-[#102018] hover:bg-white">
                <Link href={outcome.ctaHref} prefetch={false}>{outcome.ctaLabel}</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-md border-white/22 bg-white/5 px-5 text-[#f8f3e7] hover:bg-white/10 hover:text-white">
                <Link href={outcome.secondaryHref}>{outcome.secondaryLabel}</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-lg border-white/12 bg-[#f8f3e7] py-0 text-[#2e3230] shadow-2xl">
            <CardHeader className="border-b border-outline-variant/40 bg-[#fffdf8] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="font-headline text-xl font-semibold">
                  Sample rep preview
                </CardTitle>
                <Image src={detail.hatchImage} width={74} height={58} alt={detail.hatchAlt} className="h-auto w-[74px]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5">
              <div className="rounded-md border border-outline-variant/40 bg-white p-4">
                <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-primary">Prompt</div>
                <p className="text-sm font-bold leading-6">{detail.samplePrompt}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {FLOW.map(([move], index) => (
                  <div key={move} className="rounded-md bg-surface-container p-3">
                    <span className="text-[10px] font-black uppercase text-on-surface-variant">{move}</span>
                    <div className="mt-2 font-headline text-2xl font-bold text-primary">{[82, 66, 74, 88][index]}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 rounded-md bg-primary-fixed p-3 text-[#22342b]">
                <HatchGlyph state="challenging" size={34} />
                <p className="text-sm font-semibold leading-5">{detail.signupHook}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">What you can do today</div>
            <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">
              Useful before signup, stronger inside the workspace.
            </h2>
            <p className="mt-3 text-base leading-7 text-on-surface-variant">
              This page gives the path, examples, and proof model. The product unlocks the rep, follow-up pressure, scored feedback, and saved evidence.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {detail.quickWins.map((win) => (
              <div key={win} className="rounded-lg bg-surface-container-lowest p-5 text-sm font-bold leading-6 ring-1 ring-outline-variant/30">
                {win}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f1ea] px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">Recommended path</div>
            <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">
              A practical three-step playbook.
            </h2>
            <p className="mt-3 text-base leading-7 text-on-surface-variant">
              Each step maps to real product behavior: run the rep, get pushed, then save the receipt.
            </p>
          </div>
          <div className="grid gap-3">
            {detail.playbook.map(([title, body], index) => (
              <div key={title} className="grid gap-4 rounded-lg bg-white p-5 ring-1 ring-outline-variant/30 sm:grid-cols-[44px_1fr]">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-sm font-black text-on-primary">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-headline text-xl font-semibold text-on-surface">{title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-on-surface-variant">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">Reps to open next</div>
            <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">
              Start with drills that create useful evidence.
            </h2>
          </div>
          <div className="grid gap-3">
            {outcome.reps.map((rep) => (
              <Link
                key={rep.href}
                href={rep.href}
                className="grid gap-3 rounded-lg bg-surface-container-lowest p-5 no-underline ring-1 ring-outline-variant/30 transition-transform hover:-translate-y-0.5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{rep.discipline}</Badge>
                    <Badge className="bg-primary-fixed text-on-primary-fixed">{rep.flowMove}</Badge>
                  </div>
                  <h3 className="font-headline text-xl font-semibold text-on-surface">{rep.title}</h3>
                </div>
                <span className="text-sm font-bold text-primary">Preview</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Train for your next career move."
        description="Pick the outcome, run the rep, let Hatch follow up, and keep the receipts that show how your judgment is improving."
        href={outcome.ctaHref}
        label={outcome.ctaLabel}
      />
    </DirectoryShell>
  )
}
