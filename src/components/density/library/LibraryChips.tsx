'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { LibraryType } from '@/lib/data/library-density'
import { Chip } from '@/design'
export function LibraryChips({ counts }: { counts: Record<LibraryType, number> }) {
  const sp = useSearchParams(); const active = (sp.get('type') as LibraryType) || 'all'; const q = sp.get('q')
  const chips: Array<[LibraryType, string]> = [['all', `All ${counts.all}`], ['guides', `Guides ${counts.guides}`], ['autopsies', `Autopsies ${counts.autopsies}`], ['plans', `Study plans ${counts.plans}`], ['saved', 'Saved stories']]
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Library filter">
      {chips.map(([t, label]) => <Chip key={t} asChild selected={active === t}><Link role="tab" aria-selected={active === t} data-testid={`lib-chip-${t}`} href={t === 'all' ? (q ? `/explore?q=${encodeURIComponent(q)}` : '/explore') : `/explore?type=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>{label}</Link></Chip>)}
    </div>
  )
}
