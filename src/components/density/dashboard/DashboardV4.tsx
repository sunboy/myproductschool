import { HeroGrid } from './HeroGrid'
import { ContinueChallengeCard } from './ContinueChallengeCard'
import { ContinueReadingCard } from './ContinueReadingCard'
import { CalibrationCard } from './CalibrationCard'
import { HatchThoughtCard, type HatchPrompt } from './HatchThoughtCard'
import { PracticeAreaShelf } from './PracticeAreaShelf'
import { EditorialShelf } from './EditorialShelf'
import { PathsRow, type PathCard, type WeekDay } from './PathsRow'
import { FirstRepsShelf, type FirstRep } from './FirstRepsShelf'
import { HatchPickCard } from '@/components/density/HatchPickCard'
import { Text } from '@/design'
import type { AreaStat, EditorialItem } from '@/lib/data/dashboard-density'

export interface DashboardV4Props {
  displayName: string
  isNewUser: boolean
  streakDays: number
  resume: { title: string; meta: string; href: string } | null
  reading: { title: string; sub: string; href: string } | null
  hatchPick: { title: string; reason: string; href: string } | null
  hatchMessage: string
  hatchPrompts: HatchPrompt[]
  areaStats: AreaStat[]
  editorial: { featured: EditorialItem | null; items: EditorialItem[] }
  paths: PathCard[]
  quickTake: { prompt: string; challengeId: string; move?: string } | null
  week: WeekDay[]
  focusMove: string | null
  firstReps: FirstRep[]
  calibrationHref: string
}

export function DashboardV4(p: DashboardV4Props) {
  const greeting = p.isNewUser ? (
    <><Text variant="caption" tone="forest">Welcome, {p.displayName}</Text><Text variant="h2" as="h1" className="mt-1.5 leading-[1.05]">Find your <em className="font-medium not-italic text-tertiary">next possibility.</em></Text><Text variant="meta" className="mt-2">Two ways in: calibrate in five minutes, or just start a rep.</Text></>
  ) : (
    <><Text variant="caption" tone="forest">Welcome back, {p.displayName}</Text><Text variant="h2" as="h1" className="mt-1.5 leading-[1.05]">Keep your <em className="font-medium not-italic text-tertiary">curiosity going.</em></Text><Text variant="meta" className="mt-2">{p.streakDays > 0 ? `Day ${p.streakDays} of your streak. One rep keeps it alive.` : 'One rep today starts a streak.'}</Text></>
  )
  const cells = p.isNewUser
    ? [<CalibrationCard key="cal" startHref={p.calibrationHref} skipHref="/challenges" />, <HatchThoughtCard key="h" message={p.hatchMessage} prompts={p.hatchPrompts} subtitle="New here? Start with me" />]
    : [
        p.resume ? <ContinueChallengeCard key="c" {...p.resume} /> : p.hatchPick ? <HatchPickCard key="pick" eyebrow="Hatch's pick today" title={p.hatchPick.title} reason={p.hatchPick.reason} href={p.hatchPick.href} ctaLabel="Start" dismissScope="dashboard" /> : null,
        p.reading ? <ContinueReadingCard key="r" {...p.reading} /> : p.hatchPick && p.resume ? <HatchPickCard key="pick2" eyebrow="Hatch's pick today" title={p.hatchPick.title} reason={p.hatchPick.reason} href={p.hatchPick.href} ctaLabel="Start" dismissScope="dashboard" /> : null,
        <HatchThoughtCard key="h" message={p.hatchMessage} prompts={p.hatchPrompts} />,
      ].filter(Boolean) as React.ReactElement[]
  return (
    <div className="w-full">
      <HeroGrid greeting={greeting} cells={cells} />
      {p.isNewUser && <FirstRepsShelf reps={p.firstReps} />}
      <PracticeAreaShelf stats={p.areaStats} />
      {!p.isNewUser && <EditorialShelf featured={p.editorial.featured} items={p.editorial.items} />}
      {!p.isNewUser && <PathsRow paths={p.paths} quickTake={p.quickTake} week={p.week} streakDays={p.streakDays} focusMove={p.focusMove} />}
    </div>
  )
}
