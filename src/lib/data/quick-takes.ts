import { FlowMove, QuickTake } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const MOCK_QUICK_TAKES: QuickTake[] = [
  {
    id: 'mock-qt-1',
    scenario_text: 'A B2B SaaS product sees a 20% spike in support tickets after a backend deployment. What do you do first?',
    paradigm: 'traditional',
    move: 'frame',
    active_date: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'mock-qt-2',
    scenario_text: 'Your AI-assisted feature has 40% adoption but 10% retention after 7 days. List the hypotheses you would investigate.',
    paradigm: 'ai-assisted',
    move: 'list',
    active_date: new Date().toISOString().slice(0, 10),
  },
]

export async function getTodaysQuickTake(): Promise<QuickTake | null> {
  if (IS_MOCK) return MOCK_QUICK_TAKES[0]

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('quick_takes')
    .select('*')
    .eq('active_date', today)
    .single()
  return data ?? null
}

export async function getRandomQuickTake(weakestMove?: FlowMove): Promise<QuickTake | null> {
  if (IS_MOCK) {
    if (weakestMove) return MOCK_QUICK_TAKES.find(qt => qt.move === weakestMove) ?? MOCK_QUICK_TAKES[0]
    return MOCK_QUICK_TAKES[Math.floor(Math.random() * MOCK_QUICK_TAKES.length)]
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  let query = supabase.from('quick_takes').select('*')
  if (weakestMove) query = query.eq('move', weakestMove)
  const { data } = await query
  if (!data || data.length === 0) return null
  return data[Math.floor(Math.random() * data.length)]
}
