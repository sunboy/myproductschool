import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DirectoryShell, CtaBand } from '@/components/directory/DirectoryChrome'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

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
    <DirectoryShell>
      <section className="relative overflow-hidden bg-[#0f1c16] px-5 py-20 text-[#f8f3e7] sm:px-8 lg:py-24">
        <div
          aria-hidden
          className="absolute inset-0 opacity-75"
          style={{
            background:
              'radial-gradient(760px 420px at 12% 78%, rgba(126,184,112,.24), transparent 62%), radial-gradient(680px 380px at 88% 8%, rgba(226,158,74,.16), transparent 60%), linear-gradient(120deg, rgba(91,164,235,.10), transparent 45%)',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.85fr] lg:items-center">
          <div>
            <Badge className="mb-5 bg-[#f8f3e7]/10 text-[#b9e6b2]">FLOW framework</Badge>
            <h1 className="max-w-4xl font-headline text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              The scoring system for career-changing judgment reps.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f8f3e7]/72">
              FLOW is how HackProduct turns every practice answer into trainable feedback:
              Frame, List, Optimize, Win. The moves adapt across product sense, systems,
              data, SQL, coding, and AI-native workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-md bg-[#f8f3e7] text-[#102018] hover:bg-white">
                <Link href="/login?returnTo=/challenges">Start a free rep</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md border-white/20 bg-white/5 text-[#f8f3e7] hover:bg-white/10 hover:text-white">
                <Link href="/practice">Browse reps</Link>
              </Button>
            </div>
          </div>

          <Card className="rounded-lg border-white/12 bg-[#f8f3e7]/8 py-0 text-[#f8f3e7] backdrop-blur">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-3 text-base">
                <HatchGlyph state="reviewing" size={36} />
                Hatch rubric snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-5">
              {MOVES.map((move) => (
                <div key={move.name} className="rounded-md border border-white/10 bg-black/12 p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold">{move.name}</span>
                    <span className="font-mono text-xs text-[#f8f3e7]/55">{move.score}</span>
                  </div>
                  <Progress value={move.score} className="h-1.5 bg-white/12 [&_[data-slot=progress-indicator]]:bg-[#b9e6b2]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">The four moves</div>
            <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">
              FLOW makes weak judgment visible.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {MOVES.map((move) => (
              <Card key={move.name} className="rounded-lg bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/25">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-lg font-black text-on-primary">
                    {move.letter}
                  </div>
                  <CardTitle className="font-headline text-2xl">{move.name}: {move.headline}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-on-surface-variant">{move.body}</p>
                  <div className="mt-4 flex gap-2 rounded-md bg-primary-fixed/60 p-3 text-sm font-semibold leading-5 text-on-primary-fixed">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                    {move.signal}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4eee2] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">Across disciplines</div>
            <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">
              Same moves, different evidence.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {DISCIPLINES.map(([name, evidence]) => (
              <Link
                key={name}
                href={`/skills/${name.toLowerCase().replaceAll(' ', '-')}`}
                className="rounded-lg bg-white p-5 no-underline ring-1 ring-outline-variant/30 transition-transform hover:-translate-y-0.5"
              >
                <h3 className="font-headline text-xl font-semibold text-on-surface">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{evidence}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[.75fr_1.25fr] md:items-start">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">Career outcomes</div>
            <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">
              FLOW is the mechanism. The career moment is the reason.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {OUTCOMES.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-5 text-base font-bold text-on-surface no-underline ring-1 ring-outline-variant/30 hover:text-primary"
              >
                {label}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Run a FLOW-scored rep."
        description="Pick a discipline, answer in the workspace, let Hatch follow up, and save the receipt that shows what changed."
      />
    </DirectoryShell>
  )
}
