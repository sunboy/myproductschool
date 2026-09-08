export type LibraryType = 'all' | 'guides' | 'autopsies' | 'plans' | 'saved'
export interface GuideItem { kind: 'guide'; id: string; slug: string; title: string; href: string; chapters: number; completed: number; minutes: number; tagline: string }
export interface PlanItem { kind: 'plan'; id: string; slug: string; title: string; href: string; reps: number; done: number; move: string | null; enrolled: boolean }
export interface StoryItem { kind: 'autopsy'; id: string; companySlug: string; storySlug: string; title: string; dek: string; href: string; readTime: string; company: string; saved: boolean; progress: number }
export interface LibraryInput { guides: GuideItem[]; plans: PlanItem[]; stories: StoryItem[]; readingProgress: Array<{ content_type: string; parent_id: string; content_id: string; progress: number }> }

export const readMins = (s?: string) => Number((s ?? '').match(/\d+/)?.[0] ?? 6)

export function filterByType(type: LibraryType, i: Pick<LibraryInput, 'guides' | 'plans' | 'stories'>) {
  return {
    guides: type === 'all' || type === 'guides' ? i.guides : [],
    plans: type === 'all' || type === 'plans' ? i.plans : [],
    stories: type === 'all' || type === 'autopsies' ? i.stories : type === 'saved' ? i.stories.filter(s => s.saved) : [],
  }
}

export function buildLibraryShelves(i: LibraryInput) {
  const storyProgress = new Map(i.readingProgress.filter(r => r.content_type === 'autopsy_story').map(r => [`${r.parent_id}/${r.content_id}`, Number(r.progress)]))
  const stories = i.stories.map(s => ({ ...s, progress: Math.max(s.progress, storyProgress.get(`${s.companySlug}/${s.storySlug}`) ?? 0) }))
  const featured = stories.find(s => s.saved) ?? stories[0] ?? null
  const inProgressGuides = i.guides.filter(g => g.completed > 0 && g.completed < g.chapters)
  const inProgressStories = stories.filter(s => s.progress > 0 && s.progress < 0.98 && s.id !== featured?.id)
  const enrolledPlans = i.plans.filter(p => p.enrolled && p.done < p.reps)
  const yourLearning = [...inProgressGuides, ...inProgressStories, ...enrolledPlans].slice(0, 4)
  return {
    featured,
    yourLearning,
    studyPlans: [...i.plans].sort((a, b) => Number(b.enrolled) - Number(a.enrolled)).slice(0, 4),
    modules: i.guides.slice(0, 4),
    autopsies: stories.filter(s => s.id !== featured?.id).slice(0, 4),
    counts: { all: i.guides.length + i.plans.length + i.stories.length, guides: i.guides.length, autopsies: i.stories.length, plans: i.plans.length, saved: i.stories.filter(s => s.saved).length },
  }
}
