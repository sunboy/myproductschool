import type { SolutionContentV1 } from './schema'

/** Canned solution served in mock mode so the tab renders without a DB or AI call. */
export const MOCK_SOLUTION_CONTENT: SolutionContentV1 = {
  version: 1,
  challenge_type: 'flow',
  overview_md: 'This challenge tests whether a learner can find the friction behind a vanity symptom. The 8% follow rate is not the problem; it is the measurement of a problem nobody has named yet. A strong answer resists proposing features until the framing work is done.',
  approaches: [
    {
      id: 'reasoning-walkthrough',
      title: 'The reasoning walkthrough',
      tagline: 'Frame the friction, list structurally distinct options, name the sacrifice, make a falsifiable bet.',
      body_md: '## Frame\nThe symptom is a low follow rate. The friction is that following feels like a commitment without confidence. Users browse podcasts the way they window-shop: no signal about quality, consistency, or fit.\n\n## List\nThree structurally distinct options: reduce the commitment (inline trial episodes), increase confidence (social proof on cards), or replace browsing with curation (personalized picks).\n\n## Optimize\nThe criterion is confidence-per-second-of-effort. Social proof wins on effort but sacrifices discovery diversity. That sacrifice is acceptable because the current state is zero discovery, not diverse discovery.\n\n## Win\nWe will know this worked if the in-session follow rate doubles within six weeks. We will know it failed if follow-then-unfollow within 7 days rises above 20%.',
      diagram: {
        kind: 'flow_steps',
        title: 'The reasoning chain',
        steps: [
          { label: 'Symptom', detail: '8% follow rate' },
          { label: 'Friction', detail: 'Commitment without confidence', emphasis: true },
          { label: 'Options', detail: 'Trial, proof, curation' },
          { label: 'Criterion', detail: 'Confidence per effort' },
          { label: 'Bet', detail: '2x follows in 6 weeks' },
        ],
      },
    },
  ],
  ai_collaboration: {
    body_md: 'Own the framing yourself; that is the skill being trained. Use an AI assistant to pressure-test it: have it enumerate stakeholders you missed, generate counter-hypotheses for the low follow rate, and attack your chosen metric.\n\nThe failure mode is asking for "how to improve podcast discovery" up front. The assistant will hand back the textbook feature list and the practice value evaporates.',
    prompts: [
      {
        title: 'Stress-test your frame',
        prompt: 'Here is my problem framing for a podcast discovery challenge: [paste]. List three alternative root causes that would make my framing wrong, and what data would distinguish them.',
        why: 'Uses the assistant as a critic of your thinking instead of a source of answers.',
      },
      {
        title: 'Widen the option space',
        prompt: 'I have three solution directions: trial episodes, social proof, curated picks. Propose two more that are structurally different from all three, not variations.',
        why: 'AI is strong at enumeration once you have anchored the structure yourself.',
      },
    ],
    pitfalls: [
      'Asking the assistant for the answer before attempting the frame yourself removes the practice value entirely.',
      'The assistant will happily optimize a metric you chose badly; it will not challenge the metric unless you ask it to.',
    ],
  },
  key_takeaways: [
    'Name the friction before designing the fix.',
    'Structurally distinct options beat variations of one idea.',
    'A tradeoff names the sacrifice; a preference hides it.',
  ],
}
