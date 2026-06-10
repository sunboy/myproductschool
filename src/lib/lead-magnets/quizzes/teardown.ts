import type { MagnetQuizConfig, QuizAnswers, QuizOutcome } from '@/lib/lead-magnets/quiz-types'

// Two real product decisions from public company history.
//
// Decision 1: Amazon 1-Click (1997) — sourced from USPTO patent US6,182,050
//   and Peri Hartman's account. The insight that the form only existed to
//   collect data the system could store permanently is the move that separated
//   the best answer from the plausible-wrong ones.
//
// Decision 2: Duolingo streak (2017) — the streak mechanic was introduced when
//   retention was the team's primary problem. The decision was whether to invest
//   in curriculum depth or a lightweight behavioral loop. The streak became
//   Duolingo's highest-leverage retention feature in the years that followed.

export const teardownQuizConfig: MagnetQuizConfig = {
  magnet: 'teardown',
  version: 1,
  steps: [
    {
      kind: 'mcq',
      id: 'decision-1',
      context:
        'Amazon, 1997. Cart abandonment across e-commerce was running roughly 60 to 80 percent. The company had already improved its checkout flow with clearer progress indicators, better error messages, and saved payment information. Checkout still required entering an address and payment method on every order. The engineering team noticed that every returning customer was re-entering data the system already had. Peri Hartman, one of the engineers, proposed that the stored credentials could do the work the form fields were doing — making the form itself unnecessary for repeat purchases. The question was whether to file a patent on this approach or treat it as a UX improvement and ship it without one.',
      prompt: 'What was the right call?',
      options: [
        {
          id: 'a',
          text: 'Skip the patent. A checkout simplification is a UX improvement, not a novel invention, and patents invite litigation that distracts the team from building.',
          scores: { points: 0 },
        },
        {
          id: 'b',
          text: 'File the patent and ship the feature, but license it freely to competitors so the industry raises conversion together and Amazon benefits from a larger overall e-commerce market.',
          scores: { points: 1 },
        },
        {
          id: 'c',
          text: 'File the patent and enforce it. If a stored-credential checkout is genuinely novel and competitors cannot build it, every returning customer who shops elsewhere faces more friction — and friction compounds over time.',
          scores: { points: 3 },
        },
        {
          id: 'd',
          text: 'Delay the decision and run an A/B test first. The patent is only worth filing if the conversion lift is large enough to justify the legal cost and maintenance overhead.',
          scores: { points: 2 },
        },
      ],
      reveal: {
        correctId: 'c',
        explain:
          'Amazon filed the patent (US6,182,050) in September 1997 and received it in 1999. They enforced it aggressively — Barnes & Noble had to add a mandatory "review your order" step after a lawsuit. Apple licensed it in 2000. The patent held competitors back from the same simplification for twenty years. The reasoning move that separates the best answer from the plausible-wrong ones: the value of the decision was not in the conversion lift Amazon got, but in the conversion friction it permanently imposed on everyone else. The data to justify the patent was not a prerequisite for filing it — the structural advantage was visible from first principles.',
      },
    },
    {
      kind: 'mcq',
      id: 'decision-2',
      context:
        'Duolingo, roughly 2017. The team had strong top-of-funnel acquisition but weak day-7 and day-30 retention. The product was well-liked by people who used it, but most users opened the app once, completed a lesson or two, and disappeared. The curriculum team argued for investing in more content — better exercises, more languages, more levels — on the basis that depth would give users more reasons to return. The growth team proposed something smaller: a streak counter that tracked consecutive days of activity, with a push notification when the streak was at risk of breaking. The streak required no new curriculum and could ship in a week. The question was where to direct the next quarter of engineering effort.',
      prompt: 'What was the right call?',
      options: [
        {
          id: 'a',
          text: 'Invest in curriculum depth. Retention that depends on a streak counter is fragile — once the streak breaks, the user has no reason to restart. Content gives users intrinsic motivation.',
          scores: { points: 1 },
        },
        {
          id: 'b',
          text: 'Ship the streak and invest in curriculum in parallel. The streak is low-cost to build and gives data on whether behavioral loops move retention before committing to content work.',
          scores: { points: 2 },
        },
        {
          id: 'c',
          text: 'Ship the streak, watch the data, and use the retention gains to make the case internally for more curriculum investment in the next cycle.',
          scores: { points: 3 },
        },
        {
          id: 'd',
          text: 'Neither. Run qualitative research first to understand why users are not returning before betting on either solution.',
          scores: { points: 0 },
        },
      ],
      reveal: {
        correctId: 'c',
        explain:
          'Duolingo shipped the streak. It became the single highest-leverage retention feature in the product\'s history. The reasoning move: the streak was not a substitute for content quality, it was the scaffolding that kept users in the product long enough for content quality to matter. The plausible-wrong answer (curriculum depth first) treats intrinsic motivation as the goal, but intrinsic motivation requires enough repetitions to form a habit — and most users were leaving before the habit could form. The streak bought those repetitions cheaply. The qualitative-research answer was a stall, because the team already had a strong hypothesis and a low-cost test available. Sequencing research before a week-long build is the wrong order when the experiment is cheap.',
      },
    },
  ],
  deriveResult(answers: QuizAnswers): QuizOutcome {
    const stepIds = ['decision-1', 'decision-2']
    const pointsPerOption: Record<string, Record<string, number>> = {
      'decision-1': { a: 0, b: 1, c: 3, d: 2 },
      'decision-2': { a: 1, b: 2, c: 3, d: 0 },
    }

    let totalPoints = 0
    for (const stepId of stepIds) {
      const picked = answers[stepId] as string | undefined
      if (picked && pointsPerOption[stepId][picked] !== undefined) {
        totalPoints += pointsPerOption[stepId][picked]
      }
    }

    const detail = { totalPoints }

    if (totalPoints >= 5) {
      return {
        band: {
          key: 'sharp',
          label: 'Sharp',
          blurb:
            'Both calls landed close to what actually happened. The separating move in each: seeing the structural consequence of the decision, not just the immediate product outcome. That is what good teardown reading trains.',
        },
        recommendedNext: { label: 'Decode another decision', href: '/explore/autopsies' },
        detail,
      }
    }

    if (totalPoints >= 3) {
      return {
        band: {
          key: 'solid',
          label: 'Solid',
          blurb:
            'One call was close, one drifted. The gap is usually in how far ahead the reasoning runs — stopping at the immediate product effect rather than following the decision through to its second-order consequence.',
        },
        recommendedNext: { label: 'Decode another decision', href: '/explore/autopsies' },
        detail,
      }
    }

    if (totalPoints === 2) {
      return {
        band: {
          key: 'surface',
          label: 'Surface',
          blurb:
            'Both calls were plausible but landed on the wrong answer. The pattern: picking the option that sounds most defensible rather than the one with the best structural logic. That gap closes fast with more reps.',
        },
        recommendedNext: { label: 'Decode another decision', href: '/explore/autopsies' },
        detail,
      }
    }

    return {
      band: {
        key: 'missed',
        label: 'Missed',
        blurb:
          'The options that looked safest turned out to be the ones that cost the most. That is not a judgment on instinct — it is a signal that the reasoning pattern that reads these decisions well is not yet automatic. It becomes automatic with reps.',
        },
      recommendedNext: { label: 'Decode another decision', href: '/explore/autopsies' },
      detail,
    }
  },
}
