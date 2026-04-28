// src/components/explore/LoopTracksSection.tsx
import Link from 'next/link'

interface LoopTrack {
  id: string
  title: string
  slug: string
  description: string
  estimated_hours: number
  disciplines: string[]
  difficulty: string
}

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product Sense',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  coding: 'Coding',
}

interface Props {
  tracks: LoopTrack[]
}

export function LoopTracksSection({ tracks }: Props) {
  if (tracks.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-headline font-bold text-on-surface text-base">Interview Loop Tracks</h2>
        <span className="bg-primary text-on-primary text-[9px] font-label font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
          New
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tracks.map((track) => (
          <Link key={track.id} href={`/prep/study-plans/${track.slug}`}>
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer h-full flex flex-col gap-2">
              <div className="font-label font-bold text-on-surface text-sm">{track.title}</div>
              <div className="text-xs text-on-surface-variant line-clamp-2 flex-1">{track.description}</div>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {track.disciplines.map((d) => (
                  <span key={d} className="bg-surface-container-highest text-on-surface-variant rounded-full text-[10px] px-2 py-0.5 font-label">
                    {DISCIPLINE_LABELS[d] ?? d}
                  </span>
                ))}
                <span className="bg-surface-container-highest text-on-surface-variant rounded-full text-[10px] px-2 py-0.5 font-label">
                  {track.estimated_hours}h
                </span>
                <span className="bg-surface-container-highest text-on-surface-variant rounded-full text-[10px] px-2 py-0.5 font-label capitalize">
                  {track.difficulty}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
