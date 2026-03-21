import Link from 'next/link'
import { DomainWithProgress } from '@/lib/types'
import { ProgressRing } from './ProgressRing'

interface DomainCardProps {
  domain: DomainWithProgress
}

export function DomainCard({ domain }: DomainCardProps) {
  return (
    <Link
      href={`/domains/${domain.slug}`}
      className="group flex flex-col p-5 bg-surface-container rounded-2xl border border-outline-variant hover:bg-surface-container-high hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">{domain.icon ?? 'grid_view'}</span>
        </div>
        <div className="text-primary">
          <ProgressRing percentage={domain.progress_percentage} size={40} strokeWidth={3} />
        </div>
      </div>
      <h3 className="font-headline font-bold text-on-surface text-lg mb-1">{domain.title}</h3>
      <p className="text-sm text-on-surface-variant flex-1 mb-4 line-clamp-2">{domain.description}</p>
      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">lightbulb</span>
          {domain.concept_count} concepts
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">fitness_center</span>
          {domain.challenge_count} challenges
        </span>
      </div>
    </Link>
  )
}
