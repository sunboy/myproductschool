import { QUESTIONS } from './questions'

export interface GutCall {
  move: string
  headline: string
  question: string
  options: Array<{ optionId: string; icon: string; title: string; reason: string }>
}

const idAt = (move: string, idx: number) => {
  const q = QUESTIONS.find(x => x.move === move)!
  return q.options[idx].id
}

// Short, gut-call rephrasings of the four QUESTIONS scenarios, one per FLOW
// move. Each option maps to the real QUESTIONS option id by index so scoring
// (POST /api/onboarding/calibration/submit) is unchanged. Quality order
// mirrors QUESTIONS: frame/list/optimize are best, good_but_incomplete,
// surface, plausible_wrong (A/B/C/D); win is best, good_but_incomplete,
// plausible_wrong, surface (A/B/C/D), so the win options below map C -> D's
// index and D -> C's index to keep the copy's quality order (best, good,
// surface-styled-third, plausible-wrong-styled-fourth) readable.
export const GUT_CALLS: GutCall[] = [
  {
    move: 'frame',
    headline: 'A B2B SaaS product just lost 30% of weekly active users.',
    question: 'First move?',
    options: [
      { optionId: idAt('frame', 0), icon: 'search', title: 'Find who left and why before touching anything.', reason: 'Segment the drop, then decide.' },
      { optionId: idAt('frame', 1), icon: 'chat', title: 'Ask the loudest customers what broke.', reason: 'Fast signal, but biased.' },
      { optionId: idAt('frame', 2), icon: 'bolt', title: 'Ship a re-engagement campaign now.', reason: 'Move first, learn later.' },
      { optionId: idAt('frame', 3), icon: 'refresh', title: 'Roll back the last release.', reason: 'Assumes the release did it.' },
    ],
  },
  {
    move: 'list',
    headline: 'Logging a purchase in a finance app takes five taps.',
    question: 'What goes on the table?',
    options: [
      { optionId: idAt('list', 0), icon: 'layers', title: 'Three structurally different fixes, not three tweaks.', reason: 'Automation, defaults, and skipping the form.' },
      { optionId: idAt('list', 1), icon: 'sliders', title: 'Trim the form to three taps.', reason: 'One good option, not a set.' },
      { optionId: idAt('list', 2), icon: 'palette', title: 'Redesign the screen to feel lighter.', reason: 'Prettier, same taps.' },
      { optionId: idAt('list', 3), icon: 'x', title: 'Remove logging; import bank data instead.', reason: 'Big bet, skips the question.' },
    ],
  },
  {
    move: 'optimize',
    headline: 'Two checkout variants. A cuts abandonment 18% but adds 40 seconds. B is 25 seconds faster, no change in abandonment.',
    question: 'Which ships?',
    options: [
      { optionId: idAt('optimize', 0), icon: 'target', title: 'Whichever wins on revenue per visitor.', reason: 'Name the metric, then pick.' },
      { optionId: idAt('optimize', 1), icon: 'cart', title: 'A. Fewer abandoned carts is money.', reason: 'The 40 seconds only hits people who finish.' },
      { optionId: idAt('optimize', 2), icon: 'zap', title: 'B. Faster feels better.', reason: 'Speed is the experience.' },
      { optionId: idAt('optimize', 3), icon: 'flask', title: 'Neither. Build a C that does both.', reason: 'Test again before deciding.' },
    ],
  },
  {
    move: 'win',
    headline: 'You are deprecating a legacy export that 12% of users still touch.',
    question: 'How does the team land it?',
    options: [
      { optionId: idAt('win', 0), icon: 'flag', title: 'Name the metric and the date it must hold.', reason: 'A falsifiable call, owned.' },
      { optionId: idAt('win', 1), icon: 'users', title: 'Offer a migration path and a long sunset.', reason: 'Kind, but no success test.' },
      { optionId: idAt('win', 3), icon: 'megaphone', title: 'Announce it and absorb the complaints.', reason: 'Decisive, blind.' },
      { optionId: idAt('win', 2), icon: 'pause', title: 'Keep it until usage hits zero.', reason: 'Never ships.' },
    ],
  },
]
