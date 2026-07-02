import type { MagnetQuizConfig, QuizAnswers, QuizOutcome } from '@/lib/lead-magnets/quiz-types'

// The three rejection flaws covered in this quiz:
//  1. solution-before-problem (opens with a feature before naming whose problem this is)
//  2. metric without a counter-signal (unfalsifiable success — no way to know if it failed)
//  3. preference dressed as a tradeoff (picks a direction without naming what gets sacrificed)

export const spotTheFlawConfig: MagnetQuizConfig = {
  magnet: 'spot-the-flaw',
  version: 1,
  steps: [
    {
      kind: 'mcq',
      id: 'flaw-1',
      context:
        '"The question was: our mobile checkout conversion dropped 8 points last quarter. What would you do? I would add a progress bar to the checkout flow, simplify the form by removing optional fields, and run an A/B test to confirm the improvement. The progress bar specifically has worked well at other companies I have looked into, and the shorter form reduces cognitive load at the point of highest intent."',
      prompt: 'Where does this answer lose the interviewer?',
      options: [
        {
          id: 'a',
          text: 'The candidate recommends A/B testing, which signals they are not confident in the solution.',
        },
        {
          id: 'b',
          text: 'The candidate never names whose problem this is or where in checkout the drop actually happened.',
        },
        {
          id: 'c',
          text: 'The candidate cites external benchmarks, which the interviewer cannot verify.',
        },
        {
          id: 'd',
          text: 'The candidate talks about cognitive load, which is design language rather than product language.',
        },
      ],
      reveal: {
        correctId: 'b',
        explain:
          'Solution-first answers fail because the interviewer is scoring the move the candidate skipped: naming whose problem this is and where it lives. An 8-point conversion drop could mean the payment form is rejecting cards, the shipping estimate is killing confidence, or the return policy is too buried to find. An answer that opens with a feature is already behind, because every feature named before the problem is a feature aimed at a guess.',
      },
    },
    {
      kind: 'mcq',
      id: 'flaw-2',
      context:
        '"The question was: how would you measure success for a new in-app feedback widget? I would track the number of users who submit feedback each week, target a 15 percent submission rate, and monitor whether the volume of actionable items from customer success increases. If both numbers are up after 60 days, the feature is working and we ship broadly."',
      prompt: 'Where does this answer lose the interviewer?',
      options: [
        {
          id: 'a',
          text: 'A 15 percent submission rate is an arbitrary target with no basis in the product context given.',
        },
        {
          id: 'b',
          text: 'The candidate ignores qualitative feedback and only mentions quantitative metrics.',
        },
        {
          id: 'c',
          text: 'The candidate has no counter-signal, so there is no condition under which the experiment fails.',
        },
        {
          id: 'd',
          text: 'Sixty days is too long a horizon for a feature validation cycle in most teams.',
        },
      ],
      reveal: {
        correctId: 'c',
        explain:
          'A metric without a counter-signal is unfalsifiable. If submission rate goes up and CS volume goes up, the candidate calls it a win. But what if open rates drop 20 percent because users are annoyed by the widget prompt? What if CS volume rises because the widget is surfacing product confusion that already existed? Without a guardrail and a failure condition, any outcome can be declared a success. The interviewer needs to know that the candidate can be wrong, not just confirmed.',
      },
    },
    {
      kind: 'mcq',
      id: 'flaw-3',
      context:
        '"The question was: the team has two options for the next quarter — deepen integrations with enterprise tools or invest in a self-serve onboarding overhaul for SMB users. Which do you choose? I would go with the onboarding overhaul because the SMB segment is where most of our growth is coming from, and a better onboarding experience will improve activation, which directly feeds retention and long-term revenue. Enterprise deals take longer and require more support, so the ROI is harder to see quickly."',
      prompt: 'Where does this answer lose the interviewer?',
      options: [
        {
          id: 'a',
          text: 'The candidate chose SMB without asking for data on relative revenue contribution from each segment.',
        },
        {
          id: 'b',
          text: 'The candidate frames enterprise negatively, which may alienate interviewers from enterprise-focused companies.',
        },
        {
          id: 'c',
          text: 'The candidate states a preference with supporting reasons but never names what the team gives up by not doing the other option.',
        },
        {
          id: 'd',
          text: 'The candidate conflates activation and retention, which are separate metrics with different drivers.',
        },
      ],
      reveal: {
        correctId: 'c',
        explain:
          'Preference dressed as a tradeoff is one of the most common flaws in strategy answers. The candidate has reasons for the choice, but reasons are not a tradeoff. A real tradeoff names the sacrifice: "We get faster activation at the cost of the enterprise pipeline this quarter, and we accept that because growth right now buys us the headcount to run both in Q3." Without naming what gets delayed, reduced, or abandoned, the candidate is not making a decision. They are stating a preference with a confidence overlay.',
      },
    },
  ],
  deriveResult(answers: QuizAnswers): QuizOutcome {
    const correct = ['flaw-1', 'flaw-2', 'flaw-3']
    const correctAnswers: Record<string, string> = {
      'flaw-1': 'b',
      'flaw-2': 'c',
      'flaw-3': 'c',
    }

    let correctCount = 0
    const missedRules: string[] = []

    for (const stepId of correct) {
      const picked = answers[stepId]
      if (picked === correctAnswers[stepId]) {
        correctCount++
      } else {
        const rules: Record<string, string> = {
          'flaw-1':
            'Name whose problem it is before any solution. An answer that opens with a feature is aimed at a guess.',
          'flaw-2':
            'Every success metric needs a counter-signal. Without a failure condition, any outcome can be called a win.',
          'flaw-3':
            'A tradeoff names what the team gives up, not just what it gains. Reasons for a choice are not the same as a decision.',
        }
        missedRules.push(rules[stepId])
      }
    }

    if (correctCount === 3) {
      return {
        band: {
          key: 'sharp-eye',
          label: 'Sharp eye',
          blurb:
            'All three. You spotted the real rejection reason each time, not the surface-level issue. That is the same pattern recognition interviewers develop after running a few hundred rounds. The full taxonomy below names eight more places an answer can lose the room.',
        },
        recommendedNext: { label: 'Catch flaws in real challenges', href: '/challenges' },
        detail: { correctCount, missedRules },
      }
    }

    if (correctCount === 2) {
      return {
        band: {
          key: 'trained-but-gappy',
          label: 'Trained, with blind spots',
          blurb:
            'Two of three. The flaw you missed is one that shows up in a specific class of answers, and missing it in a real round costs points before the candidate even knows what happened. The full taxonomy maps it and seven others.',
        },
        recommendedNext: { label: 'Catch flaws in real challenges', href: '/challenges' },
        detail: { correctCount, missedRules },
      }
    }

    return {
      band: {
        key: 'flying-blind',
        label: 'Flying blind',
        blurb:
          'Zero or one. The rejection reasons interviewers use are not the ones most candidates expect, and right now there is a gap between what looks like a good answer and what scores like one. The full taxonomy is designed exactly for this.',
      },
      recommendedNext: { label: 'Catch flaws in real challenges', href: '/challenges' },
      detail: { correctCount, missedRules },
    }
  },
}
