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
  /**
   * Extra paragraphs after `body`. This is where the email earns its open:
   * real substance from the magnet, not a teaser. Aim for 3-5 paragraphs.
   */
  bodyParagraphs?: string[]
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
      subject: 'Five dimensions, one gap: your AI product-sense read',
      eyebrow: 'Your readiness',
      heading: 'Where the round is actually going, and where your score sits.',
      body: 'You just worked through five scenarios that map to the five dimensions AI-native companies use to screen product candidates in 2026. The band is the surface. This is the rest: a per-dimension read, the distinction that decides most rejects, and a two-week plan starting from your weakest score.',
      bodyParagraphs: [
        'Here is the one distinction the quiz was built around: most candidates default to the model layer for problems that belong in the app layer. Formatting inconsistency, style drift, and output structure issues in an AI feature are almost always fixable with a system prompt, few-shot examples, or a post-processing step. Fine-tuning is a last resort, not a first response, and reaching for it too early signals that a candidate does not know where to apply force. The line an interviewer draws when scoring is: does this person know the difference between a model problem and an app-layer problem?',
        'In 2026, this matters because the round itself has changed. AI product-sense questions are no longer about describing what a feature does. They ask about when not to build it, which layer owns the problem, what an offline eval cannot measure, and where safety belongs other than in a disclaimer. Candidates who prepped on 2023 materials are being screened out in the first fifteen minutes on exactly these dimensions, because those dimensions were not in the playbooks two years ago.',
        'Your full report breaks the result into all five dimensions scored 0 to 3, shows the gap text for each one that landed at or below 1, and walks through a complete model-layer versus app-layer worked example using a support-thread summarization feature. There is also a safety-woven answer template with four layers: framing, data access, output format, and ongoing metrics. The two-week plan at the end starts from your weakest dimension and runs one targeted rep per day.',
        'HackProduct is the gym this diagnostic came from. Inside: 104 real product decisions graded move by move by Hatch, plus system design, SQL, coding, data modeling, and live AI interview rounds in one place. The practice reps for the AI product-sense dimensions your report flagged are already there, matched to your band.',
      ],
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
      subject: 'The four-move structure behind strong interview answers',
      eyebrow: 'Your toolkit',
      heading: 'Every strong answer runs four moves. Here is the reusable version.',
      body: 'You watched one answer get rebuilt. This is the version you keep: the four-move structure, the three reasoning templates that run underneath strong answers, and the before-and-after cases that show the difference at the sentence level.',
      bodyParagraphs: [
        'Here is the template for the move most candidates skip: the Optimize tradeoff sentence. A strong answer at this move looks like: "We get [gain]. We give up [sacrifice]. The sacrifice is acceptable because [reason]." Most candidates state a preference with supporting reasons but never name what the team gives up by making the choice. The interviewer hears an opinion rather than a decision, because a real decision has a named cost. This template is worth writing out and saying aloud before any screen where you will be asked to pick between options.',
        'The 2026 hiring context is relevant here. AI-adjacent product roles have made the bar for structured thinking sharper, not softer. Interviewers at AI-native companies are running the FLOW scoring pattern on answers whether candidates know it or not: did the answer name the right problem before jumping to solutions, did it generate more than one direction, did it name the sacrifice, did it end with a falsifiable claim. The candidates who pass have internalized the structure so it runs under pressure without effort.',
        'Your full report has the printable four-move structure with a template sentence for each move, three reasoning templates for the moments that cause the most rambling (the opening frame, the tradeoff, and the close), and a set of before-and-after answer excerpts where you can see exactly which move was skipped and what the stronger version does differently.',
        'When you want to practice the structure on real scenarios with graded feedback, HackProduct is where this came from. Hatch marks which move landed and which one missed on each rep. That feedback loop, across 104 real product decisions plus system design, SQL, coding, and live AI interview rounds, is what makes the structure automatic rather than effortful.',
      ],
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
      subject: 'The AI-PM question that eliminates the most candidates, and how to answer it',
      eyebrow: 'Your question bank',
      heading: '24 questions. Here is the one with the highest rejection rate, answered.',
      body: 'You saw the first ten. Here is the full set of 24, each tagged with the reasoning move it tests and the hidden signal behind it, plus answer skeletons for the six questions with the highest rejection rate.',
      bodyParagraphs: [
        'The question that eliminates the most candidates is rank 1 in your bank: "A user says the assistant keeps making things up. Walk through how you decide whether to fix the model, fix the retrieval layer, or change the product interaction." The hidden signal is whether the candidate understands that hallucination has multiple upstream causes. A strong answer opens by separating the failure into three buckets: knowledge gap (the model produces wrong facts), retrieval gap (the right facts exist but were not surfaced), and design gap (the product lets users form expectations the feature cannot meet). The bucket tells you where to apply force. Candidates who jump to "fine-tune the model" or "add citations" are treating a diagnostic question as a solution question, and interviewers log it immediately.',
        'The pattern behind the top-rejection questions is consistent: they all ask about a step before the solution. Which layer owns the problem. What the failure mode costs when it happens. Whether the eval measures what production actually tests. The candidates who clear these questions have learned to ask the diagnostic question out loud before answering, which signals the reasoning move the interviewer is scoring.',
        'In 2026, that move is now the filter. AI product-sense rounds at the companies running these interviews are structured to surface whether a candidate reasons about AI systems or just describes them. The question bank exists because the questions that separate passes from rejects were not in prep materials two years ago.',
        'Your full report has all 24 questions ranked by rejection risk, the hidden signal tagged to each one, and answer skeletons for the six highest-risk questions. The skeletons are reasoning moves, not model answers. Each one shows the four steps a strong answer takes in sequence.',
        'HackProduct has practice scenarios built around the same question types, graded by Hatch against the same rubric the bank describes. The gap between knowing the question and answering it under pressure closes with reps, not re-reading. Inside: 104 real product decisions, plus system design, SQL, coding, and live AI interview rounds in one place.',
      ],
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
      subject: 'The rejection rule most candidates never see in their own answers',
      eyebrow: 'Your set',
      heading: 'Seven answers to dissect, a taxonomy of three rejection families, and the strong move for each.',
      body: 'One question was the warm-up. Here is the full set: seven answer excerpts to dissect, the three rejection families that cover almost every product-sense rejection, and the strong-answer move that replaces each flaw.',
      bodyParagraphs: [
        'Here is one rejection rule from the taxonomy, written out fully: an answer fails the unfalsifiable-thinking test when the success condition has no paired failure condition. The quiz example looks like this: "If submission rate reaches 15 percent and actionable items increase after 60 days, the feature is working." The flaw is that almost any outcome can be declared a win under this framing. A strong answer pairs the primary metric with a counter-signal: "We know it worked if submission rate reaches 15 percent and 30-day activation does not drop below its current baseline. We know it failed if either condition is not met." The second version is falsifiable. The first is a preference wearing the clothes of a success metric.',
        'The reason this matters in 2026 is that interviewers at product-sense-heavy companies have built their evaluation rubrics around exactly these flaws. The taxonomy is not a stylistic preference: it maps to specific scoring criteria on the rubric the interviewer is filling out. Solution-first answers fail because the Frame move was skipped. Unfalsifiable thinking fails because the Win move has no counter-signal. Fake tradeoffs fail because the Optimize move named a direction without naming a sacrifice. Knowing the taxonomy means you can audit your own answers against the same criteria before you say them.',
        'Your full set has seven excerpts covering all three rejection families, the taxonomy entry for each one, and the specific rewrite that makes the answer pass. The structure of each case is: here is the flaw, here is the rejection family it belongs to, here is the strong move.',
        'When you want to practice catching flaws in your own answers, not just reading them in someone else\'s, HackProduct is where this came from. Hatch flags the exact flaw category in your reasoning using the same taxonomy, on reps across 104 real product decisions plus system design, SQL, coding, and live AI interview rounds in one place.',
      ],
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
      subject: 'Your push signal, your band, and the highest-leverage sentence in a negotiation',
      eyebrow: 'Your playbook',
      heading: 'The band was step one. Here is the part that actually moves the number.',
      body: 'You have a directional comp band and a push signal. This is the rest: a negotiation script, a counter-offer template, and the four questions to run before you say anything. The full report also has the reasoning behind your push or hold verdict.',
      bodyParagraphs: [
        'The single highest-leverage moment in a negotiation is the anchor reset, and it is the sentence most candidates skip. When the recruiter names a number, most candidates either accept it or counter it directly. The candidates who move the number furthest reset the anchor before the counter-offer: "I want to make this work, and I have done some research on what this role is paying in the market right now. Based on that, I was thinking of something closer to [number]." That sentence does two things. It signals that the candidate has external information without naming the source. And it moves the frame from "here is what we offered" to "here is what the market is paying," which is a different negotiating position. It works even when the recruiter has said the offer is firm, because "firm" is a negotiating position, not a budget fact.',
        'The comp bands in this quiz are directional on purpose. The tool\'s job is the push signal, not the database. If the quiz told you to push, there is room in the offer and the company expects a counter. If it told you to push once, one calibrated ask with one specific reason is the right move, and a second ask in your situation is more likely to slow the process than improve the outcome. If it told you to hold, the leverage position is weak enough that the smarter play is six to twelve months of demonstrated value before negotiating from real alternatives.',
        'In 2026, the senior PM and AI-PM comp ranges have moved faster than most candidates realize. The AI-PM premium at tier-1 companies has opened a gap of $30k to $60k over general PM roles at equivalent levels, and that gap is widest at mid-level where demand is outpacing supply. The playbook is relevant to whatever role you are negotiating, but if you are going for an AI-native role, the band in your report reflects that market.',
        'Your full report has the negotiation script with the four-question pre-call checklist, the counter-offer template with fill-in-the-bracket spots, the specific sentence for the anchor reset, and the one number in most offer letters that is more moveable than the base.',
        'HackProduct is the gym where candidates practice the interview skills that put them in the strongest negotiating position before the offer arrives. Inside: product-sense and system design rounds that determine where you land on the comp band, graded by Hatch move by move, plus SQL, coding, data modeling, and live AI interview rounds in one place.',
      ],
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
      subject: 'What the story audit found, and the reframe that fixes the telling',
      eyebrow: 'Your plan',
      heading: 'Same project. Two very different stories. Here is the PM version.',
      body: 'The quiz scored your story on three lenses: customer, tradeoff, and outcome. The audit result and the lens read are in your report. So is the reframe: the engineer telling versus the PM telling of the same project, and the 30-day plan.',
      bodyParagraphs: [
        'Here is what the customer lens looks like in practice, for a rescue-type project. The engineer version opens like this: "We had a critical service that was failing under load. I refactored the database layer and the p95 latency dropped from 4 seconds to 300ms." The PM version of the same project opens like this: "Enterprise customers were churning in their third month because they stopped trusting the data export. The exports were timing out at high volume, and support was seeing the same complaint on every quarterly renewal call. We fixed the underlying cause and retention in that segment went from 68 percent to 84 percent in the next cohort." Same project. Same engineer. The second version names a person with a blocked goal before it names any technical work, and it closes on a metric the business cared about rather than a latency number the business never saw. That is the reframe the audit is looking for.',
        'The telling is not a cosmetic change. PM interviewers score the story on product reasoning: did the candidate know whose problem this was, did they understand why the technical decision was made and what it gave up, and do they know what moved because of it. Engineers who cannot make that translation are screened as IC-capable, not PM-ready, regardless of how much cross-functional work they actually did.',
        'The reason this matters specifically in 2026 is that the bar for the PM interview has risen to include AI product reasoning, and the candidates who get offers are usually engineers who can demonstrate both the execution credibility and the product judgment. The execution credibility is already there. The work is the telling.',
        'Your full report has the band read with the lens scores, the engineer-versus-PM reframe of your story type (rescue, scale, zero-to-one, or migration), the three things that transfer from your background and the three gaps to close, the five stories every PM screen expects, and a week-by-week 30-day plan.',
        'HackProduct is where engineers practice the product reasoning moves the transition requires: framing problems, generating structurally different options, naming real tradeoffs, and closing with a falsifiable claim. Those moves, practiced on 104 real product decisions graded by Hatch, plus system design, SQL, coding, and live AI interview rounds in one place, are what close the credibility gap faster than any talking point about your engineering background.',
      ],
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
