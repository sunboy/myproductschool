export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// ── Dashboard mock data ──────────────────────────────────────

export interface HotChallenge {
  title: string
  attempts: number
  avgScore: number
  domain: string
}

export interface DiscussionPreview {
  challenge: string
  author: string
  preview: string
  time: string
}

export interface MoveLevel {
  move: string
  icon: string
  level: number
  pct: number
}

export interface LeaderboardEntry {
  rank: number
  name: string
  xp: number
  isCurrentUser?: boolean
}

export interface UserNote {
  id: string
  content: string
  color: 'default' | 'yellow' | 'green' | 'blue'
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface DashboardPreferences {
  dashboard_cards: string[]
  dismissed_cards: string[]
  interview_date: string | null
  dashboard_card_sizes: Record<string, number>
}

export const MOCK_HOT_CHALLENGES: HotChallenge[] = [
  { title: 'Spotify DAU up, revenue flat', attempts: 284, avgScore: 71, domain: 'Product Strategy' },
  { title: 'DoorDash driver retention', attempts: 197, avgScore: 64, domain: 'Growth' },
  { title: 'Airbnb superhost funnel', attempts: 153, avgScore: 68, domain: 'Conversion' },
]

export const MOCK_DISCUSSIONS: DiscussionPreview[] = [
  { challenge: 'Model Accuracy Up, Engagement Down', author: 'priya_k', preview: 'The key insight here is that accuracy ≠ value...', time: '2h ago' },
  { challenge: 'Spotify podcast discovery', author: 'alex.pm', preview: 'I framed this as a retention problem first...', time: '5h ago' },
  { challenge: 'DoorDash driver churn', author: 'swei_eng', preview: 'Worth noting the supply-side constraint...', time: '1d ago' },
]

export const MOCK_MOVE_LEVELS: MoveLevel[] = [
  { move: 'Frame', icon: '◇', level: 2, pct: 68 },
  { move: 'Split', icon: '◈', level: 3, pct: 22 },
  { move: 'Weigh', icon: '◆', level: 1, pct: 90 },
  { move: 'Sell', icon: '◎', level: 1, pct: 45 },
]

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'priya_k', xp: 2840 },
  { rank: 2, name: 'alex.pm', xp: 2510 },
  { rank: 3, name: 'swei_eng', xp: 2380 },
  { rank: 14, name: 'You', xp: 1240, isCurrentUser: true },
]

export const MOCK_USER_NOTES: UserNote[] = [
  { id: 'n-mock-1', content: 'Always define the metric before proposing a solution — Luma flagged this twice.', color: 'yellow', pinned: true, created_at: '2026-03-28T10:00:00Z', updated_at: '2026-03-28T10:00:00Z' },
  { id: 'n-mock-2', content: 'RICE framework works best for prioritization challenges.', color: 'green', pinned: false, created_at: '2026-03-27T15:00:00Z', updated_at: '2026-03-27T15:00:00Z' },
  { id: 'n-mock-3', content: 'Remember to address trade-offs explicitly in every answer.', color: 'default', pinned: false, created_at: '2026-03-26T09:00:00Z', updated_at: '2026-03-26T09:00:00Z' },
]

const QUICK_TAKE_PROMPTS = [
  'A B2B SaaS company sees DAU up 20% but revenue flat. What\'s your diagnosis?',
  'Spotify\'s podcast discovery feature has low engagement despite high playlist retention. What would you investigate first?',
  'DoorDash driver churn increased 15% in Q3. How do you prioritize fixing it?',
  'Airbnb\'s superhost conversion rate dropped after a UI redesign. Walk me through your analysis.',
  'A fintech app has strong D1 retention but terrible D30. What\'s the most likely cause?',
  'Your ML model accuracy improved by 8% but user engagement dropped. What happened?',
  'Netflix sees binge-watching up but subscriber growth stalled. What\'s your next move?',
]

export function getMockQuickTakePrompt(): string {
  const dayOfWeek = new Date().getDay() // 0 (Sun) to 6 (Sat)
  return QUICK_TAKE_PROMPTS[dayOfWeek]
}

export const MOCK_DASHBOARD_PREFERENCES: DashboardPreferences = {
  dashboard_cards: ['quick_take', 'next_challenge', 'move_levels', 'productiq', 'hot_challenges', 'discussions', 'leaderboard', 'notes', 'interview_countdown', 'recent_activity'],
  dismissed_cards: [],
  interview_date: '2026-04-11',
  dashboard_card_sizes: {},
}
