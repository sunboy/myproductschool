// Single source of truth for the /go/* lead-magnet pages.
//
// Each magnet has a stable `slug` (the URL segment + the `source_slug` stored on
// the lead row + the email dedupe key) and, for email-gated magnets, the unlock
// email copy. SIGNUP-mode magnets (the practice tools + live-analyst demo) send
// the visitor straight to account creation and have no unlock email.
//
// This module is import-safe on both server and client (no server-only deps) so
// pages and the API route can share one list of valid slugs.

export type LeadMagnetCapture = 'gate' | 'signup'

export interface LeadMagnetUnlockCopy {
  subject: string
  eyebrow: string
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
  valueBullets?: string[]
}

export interface LeadMagnet {
  slug: string
  /** Short internal label for dashboards / analytics. */
  label: string
  capture: LeadMagnetCapture
  /** Present only for `gate` magnets. */
  unlockEmail?: LeadMagnetUnlockCopy
  /**
   * Gate magnets with a personal report page at /go/{slug}/r/{report_token}.
   * When true, the unlock email CTA and the inline unlocked state both link
   * the tokenized report (the printable deliverable).
   */
  hasReport?: boolean
  /**
   * Post-capture nurture copy (sent by the lead-nurture cron, deduped via
   * email_dedupes). d2 = day-2 value email, d5 = day-5 signup push. Both are
   * marketing emails and carry the unsubscribe link; the unlock email does
   * not. Copy is segmented per magnet.
   */
  nurture?: { d2: LeadMagnetUnlockCopy; d5?: LeadMagnetUnlockCopy }
}

export const LEAD_MAGNETS: Record<string, LeadMagnet> = {
  'failure-mode': {
    slug: 'failure-mode',
    label: 'Product-sense failure mode',
    capture: 'gate',
    hasReport: true,
    unlockEmail: {
      subject: 'Your product-sense failure mode, unlocked',
      eyebrow: 'Your result',
      heading: 'Here is the full read on your product thinking.',
      body: 'You saw the headline. This is the rest: your skill profile across all six moves, how you stack up, and the three reps that close your weakest move first.',
      ctaLabel: 'See your full profile',
      ctaUrl: '/go/failure-mode',
      valueBullets: [
        'Your six-skill profile, not just the one-line read',
        'The exact move you skip under interview pressure',
        'Three reps that fix it, in order',
      ],
    },
    nurture: {
      d2: {
        subject: 'The move your report flagged, and what to do about it',
        eyebrow: 'One more thing',
        heading: 'Your weakest move has a specific fix.',
        body: 'Most profiles land on Frame or Win as the soft spot. The gap is almost never about not knowing the framework. It is about defaulting to the obvious problem statement instead of testing it. One thing your report did not include: the question that surfaces the real problem in under sixty seconds.',
        ctaLabel: 'Reopen your report',
        ctaUrl: '/go/failure-mode',
        valueBullets: [
          'The one-question test for whether your frame is right',
          'Why the weakest move compounds under time pressure',
          'How to run a five-minute self-audit before any live round',
        ],
      },
      d5: {
        subject: 'What training your weakest move actually looks like',
        eyebrow: 'Ready to close the gap',
        heading: 'The report told you where. HackProduct is where you train it.',
        body: 'Inside, there are practice reps built around the exact move your profile flagged. Each one puts you in a real decision, gives you the reasoning structure, and shows you what a stronger answer looks like. Free to start, no credit card.',
        ctaLabel: 'Start training free',
        ctaUrl: '/signup?from=go-failure-mode',
        valueBullets: [
          'Reps targeted to the skill gap in your profile',
          'Hatch reviews your answer and names the specific miss',
          'Track improvement across the six moves over time',
        ],
      },
    },
  },
  'ai-pm-readiness': {
    slug: 'ai-pm-readiness',
    label: 'AI product-sense readiness',
    capture: 'gate',
    hasReport: true,
    unlockEmail: {
      subject: 'Your 2026 AI product-sense gap report',
      eyebrow: 'Your readiness',
      heading: 'Where you stand on the round that now decides AI-PM offers.',
      body: 'The score was the surface. Inside: your gap on each of the five dimensions an AI product-sense round tests, with the model-layer versus app-layer breakdown most candidates miss.',
      ctaLabel: 'Open your gap report',
      ctaUrl: '/go/ai-pm-readiness',
      valueBullets: [
        'A per-dimension read, not a single band',
        'The model-layer vs app-layer distinction that separates passes from rejects',
        'A safety-woven answer template you can reuse',
      ],
    },
    nurture: {
      d2: {
        subject: 'The AI-PM dimension your readiness band is missing',
        eyebrow: 'One more thing',
        heading: 'Your readiness band has a blind spot most candidates share.',
        body: 'The gap your report surfaced is almost always the same one: candidates can describe what an AI feature does but cannot reason about when it should not ship. That distinction is what the model-layer question is actually testing, and your report did not have space for the practice move that builds it.',
        ctaLabel: 'Reopen your report',
        ctaUrl: '/go/ai-pm-readiness',
        valueBullets: [
          'The model-layer question type your readiness band predicts you will miss',
          'The reasoning move that turns a surface answer into a pass',
          'One practice scenario you can run through on your own today',
        ],
      },
      d5: {
        subject: 'What AI-PM training looks like for your readiness band',
        eyebrow: 'Ready to move the band',
        heading: 'Practice reps built for where your report placed you.',
        body: 'HackProduct has practice challenges targeted to the exact AI product-sense dimensions your band flagged. Each one puts you in a real decision, Hatch reviews your answer, and you can see the delta on each dimension. Free to start.',
        ctaLabel: 'Start training free',
        ctaUrl: '/signup?from=go-ai-pm-readiness',
        valueBullets: [
          'AI product-sense reps matched to your readiness band',
          'Per-dimension feedback, not a single score',
          'Track your band movement over time',
        ],
      },
    },
  },
  'answer-fix': {
    slug: 'answer-fix',
    label: 'Answer repair',
    capture: 'gate',
    hasReport: true,
    unlockEmail: {
      subject: 'Your interview-answer structure, ready to print',
      eyebrow: 'Your toolkit',
      heading: 'The four-move structure that turns rambling into a hire.',
      body: 'You watched one answer get rebuilt. This is the reusable version: the move-by-move structure plus the three reasoning templates strong candidates run without thinking.',
      ctaLabel: 'Get the structure',
      ctaUrl: '/go/answer-fix',
      valueBullets: [
        'The printable four-move answer structure',
        'Three reasoning templates for the hardest moments',
        'Before-and-after examples you can study',
      ],
    },
    nurture: {
      d2: {
        subject: 'The part of the answer structure most people skip',
        eyebrow: 'One more thing',
        heading: 'Move three is where strong answers separate from the rest.',
        body: 'The four-move structure your report covers gets most candidates to decent. The part it does not spell out: move three, the tradeoff, is where interviewers decide. Most answers name a pro and a con and stop. A strong answer names the sacrifice and the reason the team chose it anyway. That is a different sentence.',
        ctaLabel: 'Reopen your report',
        ctaUrl: '/go/answer-fix',
        valueBullets: [
          'The difference between naming a tradeoff and making one',
          'What interviewers write down at move three and what they skip',
          'A sentence-level fix you can apply to any answer you already have',
        ],
      },
      d5: {
        subject: 'Where to practice the four-move structure on real scenarios',
        eyebrow: 'Ready to practice',
        heading: 'The structure is in your head. Now build the muscle.',
        body: 'HackProduct has practice scenarios designed around the exact four-move pattern from your report. You write the answer, Hatch marks which move landed and which one did not, and you can see the gap close over reps. Free to start.',
        ctaLabel: 'Start training free',
        ctaUrl: '/signup?from=go-answer-fix',
        valueBullets: [
          'Real product-sense scenarios, graded move by move',
          'Specific feedback on the exact move that missed',
          'Track how the structure becomes instinct over time',
        ],
      },
    },
  },
  'ai-pm-questions': {
    slug: 'ai-pm-questions',
    label: 'AI-PM question bank',
    capture: 'gate',
    hasReport: true,
    unlockEmail: {
      subject: 'The full AI-PM question set, with what each one tests',
      eyebrow: 'Your question bank',
      heading: 'The questions exposing unready candidates, all of them.',
      body: 'You saw the first ten. Here is the full set, each tagged with the reasoning move it tests, plus the answer skeletons and rubrics interviewers actually score against.',
      ctaLabel: 'Open the full set',
      ctaUrl: '/go/ai-pm-questions',
      valueBullets: [
        'Every question, ranked by rejection risk',
        'The hidden evaluation signal behind each one',
        'Answer skeletons and the rubric they are scored on',
      ],
    },
    nurture: {
      d2: {
        subject: 'The question type that eliminates the most AI-PM candidates',
        eyebrow: 'One more thing',
        heading: 'One question category trips candidates who know everything else.',
        body: 'Your question bank has the full set. What it does not have is the pattern behind the highest-rejection questions: they all ask you to reason about what the model cannot do, not what it can. The candidates who pass have a specific move for these. The candidates who do not answer the question as if it were a product strategy question, which it is not.',
        ctaLabel: 'Reopen your question bank',
        ctaUrl: '/go/ai-pm-questions',
        valueBullets: [
          'The category of question with the highest rejection rate',
          'The reasoning move that separates passes from good-try answers',
          'One example question with the pass-level answer broken down',
        ],
      },
      d5: {
        subject: 'Where to practice answering these questions live',
        eyebrow: 'Ready to drill',
        heading: 'The question bank is prep. Practice is where the answer becomes instinct.',
        body: 'HackProduct has live AI-PM practice scenarios where you write the answer and Hatch scores it against the same rubric your question bank describes. The gap between knowing the question and answering it under pressure closes with reps, not re-reading. Free to start.',
        ctaLabel: 'Start training free',
        ctaUrl: '/signup?from=go-ai-pm-questions',
        valueBullets: [
          'AI-PM scenarios graded against real rubrics',
          'Hatch names the reasoning move you used and the one you missed',
          'Live interview mode when you are ready to pressure-test your answers',
        ],
      },
    },
  },
  'spot-the-flaw': {
    slug: 'spot-the-flaw',
    label: 'Spot the flaw',
    capture: 'gate',
    hasReport: true,
    unlockEmail: {
      subject: 'The rejection-reason taxonomy, unlocked',
      eyebrow: 'Your set',
      heading: 'Train the eye interviewers use to reject answers.',
      body: 'One was a warm-up. Here is the full flaw-spotting set and the taxonomy of rejection reasons, so you can catch the flaw in your own answers before someone else does.',
      ctaLabel: 'Open the full set',
      ctaUrl: '/go/spot-the-flaw',
      valueBullets: [
        'Ten answers to dissect, not one',
        'The full taxonomy of why answers get rejected',
        'The strong-answer move for each flaw',
      ],
    },
    nurture: {
      d2: {
        subject: 'The flaw type candidates almost never catch in their own answers',
        eyebrow: 'One more thing',
        heading: 'One flaw category shows up in answers that feel confident but get rejected.',
        body: 'The taxonomy in your set covers the common flaws. The one that trips the most candidates with real experience: the framing flaw, where the answer is technically correct but frames the problem in a way that signals the candidate is solving the wrong thing. It is invisible to the person giving the answer and obvious to the person receiving it.',
        ctaLabel: 'Reopen your set',
        ctaUrl: '/go/spot-the-flaw',
        valueBullets: [
          'What a framing flaw looks like from the interviewer side',
          'The sentence that signals it in your own answer',
          'The one rewrite move that fixes it without changing the substance',
        ],
      },
      d5: {
        subject: 'Where to practice catching flaws in your own answers, not just others',
        eyebrow: 'Ready to drill',
        heading: 'Spotting a flaw in someone else is easier. Catching it live is the skill.',
        body: 'HackProduct has practice scenarios where you write the answer and Hatch flags the exact flaw category in your reasoning, using the same taxonomy from your set. That feedback loop, on your own answers, is what converts the taxonomy from knowledge into instinct. Free to start.',
        ctaLabel: 'Start training free',
        ctaUrl: '/signup?from=go-spot-the-flaw',
        valueBullets: [
          'Real scenarios where Hatch flags the flaw in your answer, not a sample answer',
          'Flaw category tagged to the same taxonomy you already know',
          'See whether the same flaw pattern shows up across multiple reps',
        ],
      },
    },
  },
  salary: {
    slug: 'salary',
    label: 'Comp + negotiation',
    capture: 'gate',
    hasReport: true,
    unlockEmail: {
      subject: 'Your negotiation playbook is ready',
      eyebrow: 'Your playbook',
      heading: 'The band was step one. This is how you move it.',
      body: 'You have the market band. Now the part that changes the number: a one-page negotiation script, a counter-offer template, and the four questions that tell you whether to push.',
      ctaLabel: 'Get the playbook',
      ctaUrl: '/go/salary',
      valueBullets: [
        'A one-page negotiation script',
        'A counter-offer template you can adapt',
        'The four-question "should I push" framework',
      ],
    },
    nurture: {
      d2: {
        subject: 'The negotiation move most offers reward and most candidates skip',
        eyebrow: 'One more thing',
        heading: 'The playbook covers the script. This is the move behind the script.',
        body: 'Most candidates negotiate the number. The candidates who move it most negotiate the anchor, which is different. The playbook in your report has the script. What it does not include: the single sentence that resets the anchor before the counter-offer, and why it works even when the recruiter says the offer is firm.',
        ctaLabel: 'Reopen your playbook',
        ctaUrl: '/go/salary',
        valueBullets: [
          'The anchor-reset sentence and when to use it',
          'Why "the offer is firm" is a negotiating position, not a fact',
          'The one number in the offer letter that is almost always moveable',
        ],
      },
      d5: {
        subject: 'Where to practice the interview skills that put you in a stronger negotiating position',
        eyebrow: 'Ready to strengthen your position',
        heading: 'A better offer starts with a stronger interview performance.',
        body: 'HackProduct has practice for the product-sense and system-design rounds where PM and senior engineering comp is actually decided. Getting the interview right puts you in a position where negotiation is about moving from strong to stronger, not defending a weak outcome. Free to start.',
        ctaLabel: 'Start training free',
        ctaUrl: '/signup?from=go-salary',
        valueBullets: [
          'Practice the rounds that determine your comp band before the offer',
          'Hatch gives you specific feedback on where your answers land on the rubric',
          'Live interview mode to pressure-test before the real thing',
        ],
      },
    },
  },
  switch: {
    slug: 'switch',
    label: 'Engineer to PM',
    capture: 'gate',
    hasReport: true,
    unlockEmail: {
      subject: 'Your engineer-to-PM transition plan',
      eyebrow: 'Your plan',
      heading: 'The stories that transfer, and the ones to rebuild.',
      body: 'You saw the gaps. Here is the fix: one of your engineering stories reframed into product language, a 30-day transition plan, and the five stories you need ready before the first screen.',
      ctaLabel: 'Open your plan',
      ctaUrl: '/go/switch',
      valueBullets: [
        'One story reframed into customer, tradeoff, metric, judgment',
        'A 30-day transition plan',
        'The five stories every PM screen expects',
      ],
    },
    nurture: {
      d2: {
        subject: 'The story type your plan flagged as the hardest to rebuild',
        eyebrow: 'One more thing',
        heading: 'Your weakest story type has a specific reframe.',
        body: 'Most engineers making the switch have strong technical impact stories and weak customer-insight stories. The gap is not experience, it is translation. The same project that produced a performance improvement almost always contains a customer-insight story, but most engineers never extracted it. Your plan touches this. Here is the extraction move the plan did not have room for.',
        ctaLabel: 'Reopen your plan',
        ctaUrl: '/go/switch',
        valueBullets: [
          'The extraction move that finds the customer story inside a technical project',
          'The four words that signal a story is still framed for engineers, not PMs',
          'A one-paragraph rewrite of a technical impact story into product language',
        ],
      },
      d5: {
        subject: 'Where to practice the product thinking that makes the switch stick',
        eyebrow: 'Ready to practice',
        heading: 'The plan is the map. Practice is what makes the transition real.',
        body: 'HackProduct has product-sense challenges built around the moves your plan describes: framing problems, listing options, making tradeoffs, defending decisions. Practicing these on real scenarios is what closes the credibility gap faster than any talking point about your engineering background. Free to start.',
        ctaLabel: 'Start training free',
        ctaUrl: '/signup?from=go-switch',
        valueBullets: [
          'Product-sense reps on real scenarios, graded on the PM rubric',
          'Hatch identifies where your answer still sounds like an engineer',
          'Track the four FLOW moves your plan is built around',
        ],
      },
    },
  },
  // SIGNUP-mode magnets — surface value then straight to account creation.
  teardown: {
    slug: 'teardown',
    label: 'Product teardown',
    capture: 'signup',
  },
  'analyst-instinct': {
    slug: 'analyst-instinct',
    label: 'Live AI analyst',
    capture: 'signup',
  },
  mock: {
    slug: 'mock',
    label: 'Grade my answer',
    capture: 'signup',
  },
}

export const LEAD_MAGNET_SLUGS = Object.keys(LEAD_MAGNETS)

export function getLeadMagnet(slug: string): LeadMagnet | undefined {
  return LEAD_MAGNETS[slug]
}

// The single line of breadth copy threaded onto every page (the "one connected
// gym" positioning). Claim matches disciplines.ts + V3FeatureGrid real/active
// surfaces — deliberately excludes coming-soon items.
export const BREADTH_DISCIPLINES = [
  'Product sense',
  'System design',
  'SQL',
  'Coding',
  'Data modeling',
  'Live interviews',
  'Live AI analyst',
] as const

export const BREADTH_HEADLINE = 'Everything you practice in one place.'
export const BREADTH_SUBLINE =
  'One connected gym for product sense, system design, SQL, coding, data modeling, live interviews, and a live AI analyst.'
