// src/components/live-interviews/EntryModeCards.tsx
import Link from 'next/link'

export function EntryModeCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Single Round */}
      <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-3">
        <div>
          <h2 className="font-headline font-bold text-on-surface text-base mb-1">Single Round</h2>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            Practice one interview type with a company persona. 25–35 min.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '🧠 Product Sense', cls: 'bg-primary-fixed text-primary' },
            { label: '🏗️ System Design', cls: 'bg-tertiary-container text-on-secondary-container' },
            { label: '🗄️ Data Modeling', cls: 'bg-secondary-container text-on-secondary-container' },
            { label: '💻 Coding', cls: 'bg-surface-container-highest text-on-surface-variant' },
          ].map(({ label, cls }) => (
            <span key={label} className={`${cls} rounded-full text-xs font-label px-2.5 py-0.5`}>{label}</span>
          ))}
        </div>
        <p className="font-body text-xs text-on-surface-variant">Choose a company persona below to start.</p>
      </div>

      {/* Full Loop */}
      <div className="bg-inverse-surface rounded-xl p-5 border-2 border-primary flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute top-3 right-3 bg-primary text-on-primary text-[9px] font-label font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
          New
        </div>
        <div>
          <h2 className="font-headline font-bold text-inverse-on-surface text-base mb-1">Full Loop</h2>
          <p className="font-body text-sm text-inverse-on-surface/60 leading-relaxed">
            Sequential rounds simulating a real interview loop. Pause and resume across sessions. Hatch grades across all rounds.
          </p>
        </div>
        <div className="flex items-center gap-2 text-inverse-on-surface/60 text-xs font-label flex-wrap">
          <span className="bg-white/10 rounded px-2 py-0.5">Round 1: Coding</span>
          <span>→</span>
          <span className="bg-white/10 rounded px-2 py-0.5">Round 2: Sys Design</span>
          <span>→</span>
          <span className="bg-white/10 rounded px-2 py-0.5">Round 3: Product</span>
        </div>
        <Link href="/live-interviews/loop/new">
          <div className="bg-primary text-on-primary rounded-xl py-2.5 text-center font-label font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
            Build your loop →
          </div>
        </Link>
      </div>
    </div>
  )
}
