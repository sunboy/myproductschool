'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bookmark, BookOpen, Clock3, FileText, GraduationCap, Search, X } from 'lucide-react'

export type LibraryKind = 'guide' | 'autopsy' | 'plan'
export interface LibraryItem {
  id: string; kind: LibraryKind; title: string; description: string; href: string
  eyebrow: string; meta: string; accent: string; searchText: string
  bookmarked?: boolean; progress?: number; progressKey?: string
}

const categoryCopy: Record<LibraryKind | 'all', { label: string; description: string }> = {
  all: { label: 'All', description: 'Everything in the Library' },
  guide: { label: 'Guides', description: 'Clear explanations of the ideas behind the work' },
  autopsy: { label: 'Autopsies', description: 'Close reads of product decisions and outcomes' },
  plan: { label: 'Study plans', description: 'Sequenced paths for a specific goal' },
}

const iconByKind = { guide: BookOpen, autopsy: FileText, plan: GraduationCap } as const

function readProgress(key?: string): number | undefined {
  if (!key) return undefined
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    const value = JSON.parse(raw) as { scrollPct?: number }
    return typeof value.scrollPct === 'number' ? Math.max(0, Math.min(100, Math.round(value.scrollPct))) : undefined
  } catch { return undefined }
}

export function LibraryCatalog({ items, unavailableKinds = [] }: { items: LibraryItem[]; unavailableKinds?: LibraryKind[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<LibraryKind | 'all'>('all')
  const [deviceProgress, setDeviceProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    const progress: Record<string, number> = {}
    items.forEach(item => {
      const value = readProgress(item.progressKey)
      if (value !== undefined) progress[item.id] = value
    })
    setDeviceProgress(progress)
  }, [items])

  const resolved = useMemo(() => items.map(item => ({ ...item, progress: deviceProgress[item.id] ?? item.progress })), [deviceProgress, items])
  const needle = query.trim().toLowerCase()
  const visible = resolved.filter(item =>
    (category === 'all' || item.kind === category)
    && (!needle || `${item.title} ${item.description} ${item.eyebrow} ${item.searchText}`.toLowerCase().includes(needle)),
  )
  const continueItems = resolved.filter(item => item.progress && item.progress < 100).sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0)).slice(0, 3)
  const featured = resolved.find(item => item.bookmarked) ?? resolved.find(item => item.kind === 'autopsy') ?? resolved[0]
  const counts = useMemo(() => ({
    all: items.length,
    guide: items.filter(item => item.kind === 'guide').length,
    autopsy: items.filter(item => item.kind === 'autopsy').length,
    plan: items.filter(item => item.kind === 'plan').length,
  }), [items])

  const activeUnavailable = category !== 'all' && unavailableKinds.includes(category)

  return (
    <div className="relative isolate min-h-full overflow-hidden bg-[#fbf8f1] px-4 pb-20 pt-8 text-[#18392b] sm:px-7 lg:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[430px] overflow-hidden">
        <div className="absolute -right-24 -top-28 size-[420px] rotate-12 rounded-[52px] bg-[#e9e2d3]/70" />
        <div className="absolute right-[4%] top-24 size-48 rotate-45 bg-[#d9b56c]/15" />
        <div className="absolute -left-24 top-36 size-64 rotate-[18deg] rounded-[56px] bg-[#dfe9df]/65" />
      </div>
      <div className="mx-auto max-w-[1240px]">
        <header className="grid items-end gap-8 border-b border-[#ddd5c6] pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)]">
          <div>
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#8b672d]">Study Library</p>
            <h1 className="max-w-[720px] font-headline text-[clamp(2.6rem,6vw,5.2rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-[#123d2b]">Ideas worth keeping close.</h1>
            <p className="mt-5 max-w-[650px] text-[17px] leading-7 text-[#5f675f]">Read a sharp guide, study a product decision, or follow a focused plan. Everything here connects back to the work you practise.</p>
          </div>
          <div>
            <label htmlFor="library-search" className="mb-2 block text-sm font-bold text-[#365747]">Search the Library</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#cfc6b5] bg-white/90 px-4 shadow-[0_18px_50px_-38px_rgba(22,58,43,.55)] focus-within:border-[#2f6b4f] focus-within:ring-2 focus-within:ring-[#2f6b4f]/12">
              <Search aria-hidden size={20} className="shrink-0 text-[#6b756d]" />
              <input id="library-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search guides, companies, or skills" className="min-w-0 flex-1 bg-transparent text-base text-[#223f32] outline-none placeholder:text-[#8a8f89]" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="grid size-11 shrink-0 place-items-center rounded-full text-[#687168] hover:bg-[#f1ece2]"><X aria-hidden size={18} /></button>}
            </div>
          </div>
        </header>

        <nav aria-label="Library categories" className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {(Object.keys(categoryCopy) as Array<LibraryKind | 'all'>).map(key => (
            <button key={key} type="button" onClick={() => setCategory(key)} aria-pressed={category === key} className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition-colors ${category === key ? 'border-[#174a34] bg-[#174a34] text-white' : 'border-[#d4ccbd] bg-white/70 text-[#3f5b4c] hover:border-[#8da494]'}`}>
              {categoryCopy[key].label} <span className={category === key ? 'text-white/65' : 'text-[#8b918b]'}>{counts[key]}</span>
            </button>
          ))}
        </nav>

        {unavailableKinds.length > 0 && category === 'all' && (
          <div role="status" className="mt-5 rounded-2xl border border-[#d5b978] bg-[#fbf1dc] px-4 py-3 text-sm font-bold text-[#70531f]">
            Some {unavailableKinds.map(kind => categoryCopy[kind].label.toLowerCase()).join(' and ')} could not be loaded. The available collection is shown below.
          </div>
        )}

        {!query && category === 'all' && featured && <Featured item={featured} />}

        {!query && category === 'all' && continueItems.length > 0 && (
          <section className="mt-10">
            <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-[#8b672d]">Your reading</p>
            <h2 className="mt-1 font-headline text-2xl font-semibold text-[#183f2e]">Continue where you left off</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">{continueItems.map(item => <ContinueCard key={item.id} item={item} />)}</div>
          </section>
        )}

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#8b672d]">{categoryCopy[category].description}</p>
              <h2 className="mt-1 break-words font-headline text-3xl font-semibold tracking-[-0.02em] text-[#183f2e]">{query ? `Results for “${query}”` : category === 'all' ? 'Browse the collection' : categoryCopy[category].label}</h2>
            </div>
            <p aria-live="polite" className="text-sm font-bold tabular-nums text-[#737b74]">{visible.length} {visible.length === 1 ? 'item' : 'items'}</p>
          </div>
          {activeUnavailable ? (
            <div role="status" className="rounded-[24px] border border-[#d5b978] bg-[#fbf1dc] px-6 py-12 text-center">
              <h3 className="font-headline text-2xl font-semibold text-[#5f481f]">This collection could not be loaded</h3>
              <p className="mt-2 text-base text-[#78653e]">Try again shortly, or browse another Library category.</p>
            </div>
          ) : visible.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map(item => <LibraryCard key={item.id} item={item} />)}</div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#cfc6b5] bg-white/60 px-6 py-16 text-center">
              <h3 className="font-headline text-2xl font-semibold text-[#204632]">No matches yet</h3>
              <p className="mt-2 text-base text-[#6e766f]">Try a company, discipline, or broader phrase.</p>
              <button type="button" onClick={() => { setQuery(''); setCategory('all') }} className="mt-5 min-h-11 rounded-full border border-[#1f563d] px-4 py-2 text-sm font-extrabold text-[#1f563d]">Clear filters</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Featured({ item }: { item: LibraryItem }) {
  return (
    <section className="mt-8 grid overflow-hidden rounded-[28px] border border-[#d9d0c0] bg-[#163f2e] text-white shadow-[0_28px_70px_-54px_rgba(12,48,33,.8)] lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
      <div className="p-7 sm:p-9 lg:p-11">
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#e1b45c]">Editor’s pick · {categoryCopy[item.kind].label}</p>
        <h2 className="mt-4 max-w-[18ch] font-headline text-[clamp(2rem,4vw,3.65rem)] font-semibold leading-[1.04] tracking-[-0.035em]">{item.title}</h2>
        <p className="mt-4 max-w-[58ch] text-base leading-7 text-white/72">{item.description}</p>
        <Link href={item.href} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f8f3e9] px-5 py-3 text-sm font-extrabold text-[#163f2e] transition-transform hover:-translate-y-0.5">Start reading <ArrowRight aria-hidden size={17} /></Link>
      </div>
      <div className="relative min-h-56 overflow-hidden border-t border-white/10 bg-[#0f3023] lg:min-h-full lg:border-l lg:border-t-0">
        <div className="absolute -right-16 -top-16 size-72 rotate-12 rounded-[52px] border border-white/12 bg-white/[.035]" />
        <div className="absolute bottom-[-52px] left-[-24px] size-56 rotate-45 bg-[#d3a74e]/85" />
        <div className="absolute bottom-12 right-12 size-36 rounded-full border-[24px] border-[#8db59a]/25" />
        <div className="absolute inset-x-8 bottom-7 rounded-2xl border border-white/12 bg-white/[.06] p-4 backdrop-blur-sm"><p className="text-sm font-bold text-white/60">{item.eyebrow}</p><p className="mt-1 text-base font-extrabold">{item.meta}</p></div>
      </div>
    </section>
  )
}

function ContinueCard({ item }: { item: LibraryItem }) {
  return (
    <Link href={item.href} className="group rounded-2xl border border-[#d9d0c0] bg-white/85 p-5 shadow-[0_14px_40px_-34px_rgba(28,63,45,.55)]">
      <div className="flex items-center justify-between gap-3 text-sm font-bold text-[#69736b]"><span className="capitalize">{item.kind}</span><span className="tabular-nums">{item.progress}%</span></div>
      <h3 className="mt-3 font-headline text-xl font-semibold leading-snug text-[#1b4431] group-hover:text-[#9a6f29]">{item.title}</h3>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e9e2d5]"><div className="h-full rounded-full bg-[#2f6b4f]" style={{ width: `${item.progress}%` }} /></div>
    </Link>
  )
}

function LibraryCard({ item }: { item: LibraryItem }) {
  const Icon = iconByKind[item.kind]
  return (
    <Link href={item.href} className="group flex min-h-[290px] flex-col rounded-[22px] border border-[#ddd4c4] bg-white/90 p-5 shadow-[0_22px_55px_-48px_rgba(25,62,43,.6)] transition-all hover:-translate-y-1 hover:border-[#a9b7aa]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ backgroundColor: item.accent }}><Icon aria-hidden size={21} strokeWidth={1.8} /></span>
        {item.bookmarked && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5ead3] px-3 py-1.5 text-sm font-extrabold text-[#85601f]"><Bookmark aria-hidden size={14} fill="currentColor" /> Saved</span>}
      </div>
      <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.08em] text-[#8b672d]">{item.eyebrow}</p>
      <h3 className="mt-2 font-headline text-[23px] font-semibold leading-[1.18] tracking-[-0.02em] text-[#193e2e] group-hover:text-[#9b7029]">{item.title}</h3>
      <p className="mt-3 line-clamp-3 text-base leading-6 text-[#646d66]">{item.description}</p>
      <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#e7e0d4] pt-4 text-sm font-bold text-[#6f776f]"><span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden size={15} /> {item.meta || 'Open'}</span><ArrowRight aria-hidden size={17} className="text-[#275f45] transition-transform group-hover:translate-x-1" /></div>
      {typeof item.progress === 'number' && item.progress > 0 && <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#ebe4d9]" aria-label={`${item.progress}% complete`}><div className="h-full rounded-full bg-[#2f6b4f]" style={{ width: `${item.progress}%` }} /></div>}
    </Link>
  )
}
