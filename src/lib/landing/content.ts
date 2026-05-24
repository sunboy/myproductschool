export type LandingMenuItem = {
  title: string
  eyebrow: string
  description: string
  href: string
  status: 'Public preview' | 'Gated preview' | 'In-app'
}

export type LandingPreview = {
  title: string
  eyebrow: string
  description: string
  href: string
  image: string
  alt: string
  hatchNote: string
  hatchImage?: string
  status: LandingMenuItem['status']
}

export type LandingPattern = {
  title: string
  move: string
  description: string
}

export type LandingFaq = {
  question: string
  answer: string
}

export const landingMenuItems: LandingMenuItem[] = [
  {
    title: 'Challenges',
    eyebrow: 'Messy reps',
    description: 'Browse product, system, data, SQL, coding, and AI-workflow scenarios before the full answer workspace unlocks.',
    href: '/practice',
    status: 'Public preview',
  },
  {
    title: 'Autopsies',
    eyebrow: 'Decisions with receipts',
    description: 'Read product stories through the choice, trade-off, mechanism, and consequence instead of a generic case-study recap.',
    href: '/explore/showcase',
    status: 'Public preview',
  },
  {
    title: 'Study Plans',
    eyebrow: 'Sequenced growth',
    description: 'Preview role-aware paths that turn scattered practice into weekly judgment gains.',
    href: '/study-plans',
    status: 'Public preview',
  },
  {
    title: 'FLOW',
    eyebrow: 'Weak move finder',
    description: 'See how Frame, List, Optimize, and Win turn a vague answer into trainable feedback.',
    href: '#flow-demo',
    status: 'Gated preview',
  },
  {
    title: 'Skills',
    eyebrow: 'Discipline catalog',
    description: 'Map practice to product sense, systems, data modeling, SQL, coding, and AI-native workflows.',
    href: '/skills',
    status: 'Public preview',
  },
  {
    title: 'Live Interviews',
    eyebrow: 'Pressure room',
    description: 'Preview live Hatch interviews with follow-ups, discipline selection, transcripts, and debriefs.',
    href: '/interviews/live-ai-interviews',
    status: 'Public preview',
  },
  {
    title: 'AI Analytics',
    eyebrow: 'Learning signal',
    description: 'Unlock the private dashboard that turns attempts into weak-move patterns and next-rep recommendations.',
    href: '/signup',
    status: 'In-app',
  },
]

export const landingPreviewCards: LandingPreview[] = [
  {
    title: 'Practice catalog',
    eyebrow: 'Challenges',
    description: 'Filter reps by discipline, FLOW move, and career goal. Public previews show the prompt and rubric hints; the app holds scoring and saved progress.',
    href: '/practice',
    image: '/hackproduct-marketing/landing/screenshots/practice-catalog-live.png',
    alt: 'HackProduct practice catalog page showing discipline filters and practice preview copy',
    hatchNote: 'Hatch saves the pushback for the workspace.',
    hatchImage: '/hackproduct-marketing/hatch/hatch-catalog-callout.png',
    status: 'Public preview',
  },
  {
    title: 'Autopsy library',
    eyebrow: 'Autopsies',
    description: 'Browse product stories with receipts, visuals, and explicit judgment calls instead of motivational summaries.',
    href: '/explore/showcase',
    image: '/hackproduct-marketing/landing/screenshots/autopsies-live.png',
    alt: 'HackProduct autopsy library page with product stories and Hatch reading illustration',
    hatchNote: 'Look for the decision that made the curve bend.',
    hatchImage: '/hackproduct-marketing/hatch/hatch-autopsy-callout.png',
    status: 'Public preview',
  },
  {
    title: 'Study plans',
    eyebrow: 'Plans',
    description: 'Role-aware sequences help you stop wandering through topics and start building the next judgment layer on purpose.',
    href: '/study-plans',
    image: '/hackproduct-marketing/landing/screenshots/study-plans-live.png',
    alt: 'HackProduct study plans page showing role-aware learning plan previews',
    hatchNote: 'A path beats another open tab.',
    hatchImage: '/hackproduct-marketing/hatch/hatch-plans-callout.png',
    status: 'Public preview',
  },
  {
    title: 'Live interview rooms',
    eyebrow: 'Interview pressure',
    description: 'Hatch runs the room, follows up when an answer hand-waves, and turns the debrief into the next practice move.',
    href: '/interviews/live-ai-interviews',
    image: '/hackproduct-marketing/landing/screenshots/live-interviews-live.png',
    alt: 'HackProduct live AI interview page showing discipline chips and live interview copy',
    hatchNote: 'The room should push back before the real one does.',
    hatchImage: '/hackproduct-marketing/hatch/hatch-interview-callout.png',
    status: 'Public preview',
  },
]

export const landingPatterns: LandingPattern[] = [
  {
    title: 'Problem framing',
    move: 'Frame',
    description: 'Find the job behind the request before you chase the loudest symptom.',
  },
  {
    title: 'Option breadth',
    move: 'List',
    description: 'Open the solution space so the first plausible idea does not become the roadmap.',
  },
  {
    title: 'Trade-off evidence',
    move: 'Optimize',
    description: 'Use rough but explicit criteria to make the bet defendable.',
  },
  {
    title: 'Recommendation posture',
    move: 'Win',
    description: 'Position the call so the listener knows who it is for, why now, and what validates it.',
  },
]

export const landingFaqs: LandingFaq[] = [
  {
    question: 'Is this another interview question bank?',
    answer:
      'No. The public surface shows the shape of the platform. The product is the loop: scenario, answer, Hatch pushback, FLOW scoring, next rep.',
  },
  {
    question: 'What can someone see before signing up?',
    answer:
      'Challenges, autopsies, study-plan previews, skill catalogs, and live-interview explainers are all visible. Saved workspaces, grading, analytics, and Hatch coaching are behind signup.',
  },
  {
    question: 'Who is HackProduct for?',
    answer:
      'Engineers who need sharper product judgment, whether that means surviving a PM interview or thinking more clearly on the job. Disciplines covered: product sense, systems, data, SQL, coding, and AI-native workflows.',
  },
  {
    question: 'How is FLOW different from a framework acronym?',
    answer:
      'FLOW is a scoring lens, not a template. Hatch checks whether an answer framed the real problem, opened real options, optimized with evidence, and positioned the recommendation. The score is what drives the next rep.',
  },
]

export const landingInventory = [
  'Public challenge previews',
  'Product autopsies with receipts',
  'Role-aware study paths',
  'FLOW-scored practice loop',
  'Live interview discipline previews',
  'Private analytics after signup',
]
