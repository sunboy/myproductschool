import type { SolutionContentV1 } from './schema'
import { runArrayTrace, buildSteppedArrayDiagram } from './trace/arrayTrace'

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

// Build the stepped diagram from the real trace harness so the mock is always
// schema-valid and the walkthrough is genuinely correct (not hand-authored).
const BINARY_SEARCH_TRACE = runArrayTrace('binary_search', [2, 4, 7, 9, 11, 13, 18, 21, 29], 21)
const BINARY_SEARCH_DIAGRAM = BINARY_SEARCH_TRACE
  ? buildSteppedArrayDiagram(BINARY_SEARCH_TRACE, { title: 'Searching for 21 in a sorted array' })
  : undefined

/**
 * Canned algorithm solution with a stepped (interactive) diagram, served in mock
 * mode via ?mock=stepped so the stepper renders without a DB or AI call. The
 * step prose here is illustrative; in production the model writes it over the
 * machine-verified deltas.
 */
export const MOCK_STEPPED_SOLUTION_CONTENT: SolutionContentV1 = {
  version: 1,
  challenge_type: 'algorithm',
  overview_md: 'This problem tests whether a candidate reaches for the sorted-array invariant instead of a linear scan. The array is sorted, so every comparison against the middle element rules out half the remaining range. The lesson is the halving, not the final return.',
  approaches: [
    {
      id: 'linear-scan',
      title: 'Linear scan',
      tagline: 'Walk the array left to right. Honest, but ignores the sort.',
      body_md: '## Idea\nCheck each element until the target appears. Correct, but it throws away the one fact that matters: the array is already sorted.',
      code: { language: 'python', source: 'def search(nums, target):\n    for i, v in enumerate(nums):\n        if v == target:\n            return i\n    return -1' },
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'binary-search',
      title: 'Binary search',
      tagline: 'Halve the live range on every comparison.',
      body_md: '## Idea\nThe sort lets a single comparison against the middle eliminate half the candidates. Track a live range with lo and hi, compare the midpoint, and discard the half that cannot contain the target.\n\n## Why lo <= hi\nA one-element range still has to be checked, so the loop continues while lo equals hi.',
      code: { language: 'python', source: 'def search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = lo + (hi - lo) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1' },
      complexity: { time: 'O(log n)', space: 'O(1)', note: 'each step halves the range, so the depth is log2(n)' },
    },
  ],
  // Top-level interactive walkthrough, surfaced as its own Visual tab. Mirrors
  // production, where the graft writes the verified stepped diagram to
  // content.walkthrough (not onto an approach).
  ...(BINARY_SEARCH_DIAGRAM
    ? {
        walkthrough: {
          ...BINARY_SEARCH_DIAGRAM,
          steps: BINARY_SEARCH_DIAGRAM.steps.map((step, i) => ({
            ...step,
            ...([
              { title: 'Compare the middle', explanation: 'The live range is the whole array. The midpoint is index 4 (value 11). 21 is greater, so everything at index 4 and to its left is too small.' },
              { title: 'Keep the right half', explanation: 'The live range is now index 5 to 8. The midpoint is index 6 (value 18). 21 is still greater, so discard this midpoint and the values to its left.' },
              { title: 'Land on the target', explanation: 'The live range is index 7 to 8. The midpoint is index 7 (value 21). That equals the target, so return index 7.' },
            ][i] ?? {}),
          })),
        },
      }
    : {}),
  ai_collaboration: {
    body_md: 'Own the invariant yourself: which half is safe to discard and why. Use an AI assistant to generate adversarial inputs (empty array, single element, target at the boundaries, duplicates) and to check your loop condition against the off-by-one traps.',
    prompts: [
      {
        title: 'Hunt the off-by-one',
        prompt: 'Here is my binary search: [paste]. Find inputs where it returns the wrong index or loops forever, focusing on the lo/hi boundary and the midpoint formula.',
        why: 'Boundary bugs are where binary search dies; the assistant is good at enumerating them once you own the logic.',
      },
    ],
    pitfalls: [
      'Asking for the full solution first removes the practice value; the rep is implementing the boundary logic, not recalling it.',
      'A confident-looking midpoint formula can still overflow in fixed-width languages; verify the lo + (hi - lo) // 2 form.',
    ],
  },
  key_takeaways: [
    'A sorted input is an invitation to halve, not to scan.',
    'Track the live range explicitly with lo and hi.',
    'The loop continues while lo equals hi, because a one-element range still needs a check.',
  ],
}
