// src/components/explore/LoopTracksSection.tsx
import Link from 'next/link'

interface LoopTrack {
  id: string
  title: string
  slug: string
  description: string
  estimated_hours: number
  disciplines: string[]
  difficulty?: string | null
}

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product Sense',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  coding: 'Coding',
}

// Per-discipline accent colors (text + glow)
const DISCIPLINE_COLORS: Record<string, { bg: string; text: string }> = {
  system_design: { bg: 'rgba(126,224,153,0.12)', text: '#7ee099' },
  product_sense: { bg: 'rgba(201,147,58,0.15)', text: '#c9933a' },
  data_modeling: { bg: 'rgba(100,180,255,0.12)', text: '#64b4ff' },
  coding:        { bg: 'rgba(200,160,255,0.12)', text: '#c8a0ff' },
}

// SVG circuit/node decoration per card slot
const CARD_SVGS = [
  // Card 0 — interconnected nodes
  <svg key="0" aria-hidden viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', right: -8, top: -8, width: 160, height: 120, opacity: 0.18, pointerEvents: 'none' }}>
    <circle cx="120" cy="30" r="18" stroke="#7ee099" strokeWidth="1.2"/>
    <circle cx="80" cy="70" r="10" stroke="#7ee099" strokeWidth="1"/>
    <circle cx="140" cy="90" r="7" stroke="#4a7c59" strokeWidth="1"/>
    <line x1="120" y1="48" x2="80" y2="60" stroke="#7ee099" strokeWidth="0.8" strokeDasharray="3 3"/>
    <line x1="120" y1="48" x2="140" y2="83" stroke="#4a7c59" strokeWidth="0.8" strokeDasharray="3 3"/>
    <line x1="80" y1="80" x2="140" y2="83" stroke="#4a7c59" strokeWidth="0.7" strokeDasharray="2 4"/>
    <circle cx="120" cy="30" r="4" fill="#7ee099" fillOpacity="0.5"/>
    <circle cx="80" cy="70" r="3" fill="#7ee099" fillOpacity="0.4"/>
  </svg>,
  // Card 1 — stacked arcs / signal rings
  <svg key="1" aria-hidden viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', right: -10, top: -10, width: 160, height: 120, opacity: 0.18, pointerEvents: 'none' }}>
    <path d="M 130 100 A 50 50 0 0 0 80 50" stroke="#c9933a" strokeWidth="1.2" strokeDasharray="4 4"/>
    <path d="M 148 115 A 72 72 0 0 0 76 43" stroke="#c9933a" strokeWidth="0.8" strokeDasharray="3 5"/>
    <path d="M 112 88 A 30 30 0 0 0 82 58" stroke="#c9933a" strokeWidth="1" />
    <circle cx="82" cy="57" r="5" fill="#c9933a" fillOpacity="0.45"/>
    <circle cx="130" cy="100" r="3.5" fill="#c9933a" fillOpacity="0.3"/>
  </svg>,
  // Card 2 — grid / lattice
  <svg key="2" aria-hidden viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', right: -8, top: -8, width: 160, height: 120, opacity: 0.15, pointerEvents: 'none' }}>
    {[0,1,2,3].map(col => [0,1,2].map(row => (
      <rect key={`${col}-${row}`} x={60 + col * 26} y={10 + row * 32} width="18" height="18" rx="4" stroke="#7ee099" strokeWidth="0.9"/>
    )))}
    <line x1="69" y1="28" x2="69" y2="42" stroke="#7ee099" strokeWidth="0.7"/>
    <line x1="95" y1="28" x2="95" y2="42" stroke="#7ee099" strokeWidth="0.7"/>
    <line x1="69" y1="60" x2="69" y2="74" stroke="#4a7c59" strokeWidth="0.7"/>
    <line x1="121" y1="28" x2="121" y2="42" stroke="#7ee099" strokeWidth="0.7"/>
  </svg>,
]

interface Props {
  tracks: LoopTrack[]
}

export function LoopTracksSection({ tracks }: Props) {
  if (tracks.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-headline font-bold text-on-surface text-base">Interview Loop Tracks</h2>
          <span className="bg-primary text-on-primary text-[9px] font-label font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
            New
          </span>
        </div>
        <Link
          href="/live-interviews"
          className="text-xs font-label font-semibold"
          style={{ color: '#7ee099' }}
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tracks.map((track, i) => {
          const primaryDiscipline = track.disciplines[0]
          const accentColor = DISCIPLINE_COLORS[primaryDiscipline] ?? { bg: 'rgba(126,224,153,0.12)', text: '#7ee099' }

          return (
            <Link
              key={track.id}
              href={`/live-interviews/loop/new?role=${encodeURIComponent(track.title)}&disciplines=${track.disciplines.join(',')}`}
            >
              <div
                className="rounded-2xl p-4 h-full flex flex-col gap-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1e3528 0%, #14241c 100%)',
                  border: '1px solid rgba(126,224,153,0.18)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Dot grid overlay */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                    maskImage: 'radial-gradient(ellipse 90% 90% at 90% 10%, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 90% 10%, black 20%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* SVG decoration */}
                {CARD_SVGS[i % CARD_SVGS.length]}

                {/* Hours badge */}
                <div className="relative flex items-center justify-between">
                  <span
                    className="text-[10px] font-label font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: accentColor.bg, color: accentColor.text }}
                  >
                    {track.estimated_hours}h loop
                  </span>
                  {track.difficulty && (
                    <span className="text-[10px] font-label capitalize" style={{ color: 'rgba(243,237,224,0.40)' }}>
                      {track.difficulty}
                    </span>
                  )}
                </div>

                {/* Title + description */}
                <div className="relative flex-1 flex flex-col gap-1">
                  <div className="font-headline font-semibold text-sm leading-snug" style={{ color: '#f3ede0' }}>
                    {track.title}
                  </div>
                  <div className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'rgba(243,237,224,0.55)' }}>
                    {track.description}
                  </div>
                </div>

                {/* Discipline chips */}
                <div className="relative flex flex-wrap gap-1.5">
                  {track.disciplines.map((d) => {
                    const c = DISCIPLINE_COLORS[d] ?? { bg: 'rgba(255,255,255,0.08)', text: 'rgba(243,237,224,0.5)' }
                    return (
                      <span
                        key={d}
                        className="text-[10px] font-label px-2 py-0.5 rounded-full"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {DISCIPLINE_LABELS[d] ?? d}
                      </span>
                    )
                  })}
                </div>

                {/* CTA arrow */}
                <div
                  className="relative text-[11px] font-label font-semibold flex items-center gap-1"
                  style={{ color: accentColor.text }}
                >
                  Start loop
                  <span style={{ fontSize: 13 }}>→</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
