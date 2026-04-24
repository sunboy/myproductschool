export interface CardCatalogEntry {
  id: string
  label: string
  description: string
  icon: string
}

export const CARD_CATALOG: CardCatalogEntry[] = [
  {
    id: 'quick_take',
    label: 'Quick Take',
    description: '90-second challenge prompts with instant grading',
    icon: 'bolt',
  },
  {
    id: 'next_challenge',
    label: 'Next Challenge',
    description: 'Personalized challenge recommendation from Hatch',
    icon: 'auto_awesome',
  },
  {
    id: 'move_levels',
    label: 'Move Levels',
    description: 'Skill progression across product thinking moves',
    icon: 'trending_up',
  },
  {
    id: 'productiq',
    label: 'ProductIQ Score',
    description: 'Your overall product sense score and dimensions',
    icon: 'analytics',
  },
  {
    id: 'interview_countdown',
    label: 'Interview Countdown',
    description: 'Days until your interview with daily targets',
    icon: 'event',
  },
  {
    id: 'hot_challenges',
    label: 'Hot Challenges',
    description: 'Most-attempted challenges this week',
    icon: 'local_fire_department',
  },
  {
    id: 'discussions',
    label: 'Discussions',
    description: 'Latest comments from the community',
    icon: 'forum',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    description: 'Your rank among this week\'s cohort',
    icon: 'leaderboard',
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Quick notes and coaching reminders',
    icon: 'sticky_note_2',
  },
  {
    id: 'recent_activity',
    label: 'Recent Activity',
    description: 'Your latest challenge attempts and scores',
    icon: 'history',
  },
]

// Default col-span (1–3) per card
export const DEFAULT_SIZES: Record<string, 1 | 2 | 3> = {
  quick_take: 3,
  next_challenge: 2,
  move_levels: 1,
  productiq: 2,
  interview_countdown: 1,
  hot_challenges: 1,
  discussions: 1,
  leaderboard: 1,
  notes: 1,
  recent_activity: 2,
}

// Tailwind col-span classes keyed by size
export const COL_SPAN_CLASS: Record<1 | 2 | 3, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
}
