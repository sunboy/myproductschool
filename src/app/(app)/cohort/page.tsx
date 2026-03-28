import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

/* ---------- mock data ---------- */
const leaderboard = [
  { rank: 1, name: 'Alex Chen', initials: 'AC', score: 98, move: 'Optimize', time: '31m 12s', medal: 'workspace_premium', medalColor: 'text-tertiary' },
  { rank: 2, name: 'Sarah Jenkins', initials: 'SJ', score: 94, move: 'Optimize', time: '35m 44s', medal: 'workspace_premium', medalColor: 'text-[#C0C0C0]' },
  { rank: 3, name: 'David Miller', initials: 'DM', score: 92, move: 'Optimize', time: '29m 05s', medal: 'workspace_premium', medalColor: 'text-[#CD7F32]' },
]

export default function CohortPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-3 animate-fade-in-up">

      {/* -- Header -- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 border-b border-outline-variant/30 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="material-symbols-outlined text-primary text-xl">military_tech</span>
            <h1 className="text-xl font-headline font-black text-primary">This Week&apos;s Challenge</h1>
          </div>
          <p className="text-xs font-body text-on-surface-variant">
            <span className="font-bold">847 engineers</span> competing in the current cohort
          </p>
        </div>
        <span className="bg-secondary-container text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider self-start md:self-auto">
          Cohort Alpha
        </span>
      </div>

      {/* -- Challenge Card (Green Hero) -- */}
      <section className="bg-signature-gradient text-white rounded-xl p-4 relative overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="bg-tertiary-container text-tertiary text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              Week 12 · Optimize Move <span className="material-symbols-outlined text-xs">diamond</span>
            </span>
          </div>

          <p className="text-base md:text-lg font-headline leading-tight max-w-2xl">
            You&apos;re PM at Spotify. Podcast listening dropped 23% in Q3. Diagnose and recommend a fix.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-label">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="font-semibold">Closes in:</span>
              <span className="animate-pulse">2d 14h 31m</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-label">
              <span className="material-symbols-outlined text-sm">group</span>
              <span className="font-semibold">Average Score:</span>
              <span>64/100</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="bg-primary-container text-primary text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                check_circle
              </span>
              Submitted — Your score: 79/100
            </div>
            <button className="text-[10px] font-bold bg-on-primary/20 text-on-primary rounded-full px-3 py-1 hover:bg-on-primary/30 transition-colors">
              Submit Revision
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl" />
      </section>

      {/* -- Ranking + Share -- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Ranking Card */}
        <div className="card-elevated rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] font-bold text-on-surface-variant mb-0.5 uppercase tracking-wide">Your Ranking</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-headline text-primary">#47</span>
              <span className="text-xs text-on-surface-variant font-body">out of 847</span>
            </div>
            <span className="bg-tertiary-container text-tertiary text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-1">Top 6%</span>
          </div>

          {/* Luma message */}
          <div className="mt-2 bg-surface-container-high rounded-lg p-2 flex items-start gap-1.5">
            <LumaGlyph size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-body text-on-surface-variant italic">
              &ldquo;Top 6%! You&apos;re outperforming most engineers at your level. Keep tightening your product intuition!&rdquo;
            </p>
          </div>

          {/* Percentile bar */}
          <div className="mt-3 space-y-1">
            <div className="relative h-3 w-full bg-outline-variant rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-primary w-[94%]" />
              <div className="absolute left-[94%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-0.5 h-3 bg-on-surface" />
                <span className="text-[8px] font-black text-on-surface mt-0.5 uppercase">You</span>
              </div>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-on-surface-variant px-0.5">
              <span>0%</span>
              <span>50%</span>
              <span>TOP 1%</span>
            </div>
          </div>
        </div>

        {/* Share Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">ios_share</span>
            <span className="text-3xl font-black font-headline text-primary">#47</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-sm text-on-surface">Share your rank this week</h3>
            <p className="text-xs text-on-surface-variant">Show your network you&apos;re building elite product skills.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#0A66C2] text-white px-5 py-2 rounded-full font-bold text-xs hover:brightness-110 transition-all shadow-md">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
            Post to LinkedIn
          </button>
        </div>
      </div>

      {/* -- Leaderboard -- */}
      <section className="card-elevated border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="px-4 py-2 flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex gap-1 bg-surface-container-high p-0.5 rounded-full">
            <button className="px-3 py-1 rounded-full text-[10px] font-bold bg-white text-on-surface shadow-sm">All engineers</button>
            <button className="px-3 py-1 rounded-full text-[10px] font-bold text-on-surface-variant hover:text-on-surface">My level</button>
            <button className="px-3 py-1 rounded-full text-[10px] font-bold text-on-surface-variant hover:text-on-surface">Engineers → PM</button>
          </div>
          <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">filter_list</span>
            Filters
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30">
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">Engineer</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Move</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody className="text-xs font-body">
              {/* Top 3 */}
              {leaderboard.map((entry) => (
                <tr key={entry.rank} className="hover:bg-surface-container transition-colors border-b border-outline-variant/20">
                  <td className="px-4 py-2 font-black text-primary flex items-center gap-1.5">
                    <span
                      className={`material-symbols-outlined text-base ${entry.medalColor}`}
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      {entry.medal}
                    </span> {entry.rank}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px]">{entry.initials}</div>
                      <span className="font-bold text-xs">{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-black">{entry.score}/100</td>
                  <td className="px-4 py-2 text-[10px] text-on-surface-variant">{entry.move}</td>
                  <td className="px-4 py-2 text-[10px] text-on-surface-variant">{entry.time}</td>
                </tr>
              ))}

              {/* Ellipsis */}
              <tr>
                <td className="px-4 py-1 text-center text-outline text-[10px] tracking-widest" colSpan={5}>● ● ●</td>
              </tr>

              {/* Rank 47 - You */}
              <tr className="bg-primary/10 hover:bg-primary/15 transition-colors border-y border-primary/20">
                <td className="px-4 py-2.5 font-black text-primary">47</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-bold text-primary text-[10px]">
                      <span className="material-symbols-outlined text-xs">person</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-primary text-xs">Mark Peterson</span>
                      <span className="text-[9px] uppercase font-bold text-primary/70">(YOU)</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-black text-primary">79/100</td>
                <td className="px-4 py-2.5 text-[10px] font-bold text-primary">Optimize</td>
                <td className="px-4 py-2.5 text-[10px] font-bold text-primary">42m 05s</td>
              </tr>

              {/* Ellipsis */}
              <tr>
                <td className="px-4 py-1 text-center text-outline text-[10px] tracking-widest" colSpan={5}>● ● ●</td>
              </tr>

              {/* Rank 847 */}
              <tr className="hover:bg-surface-container transition-colors border-b border-outline-variant/20">
                <td className="px-4 py-2 font-bold text-on-surface-variant">847</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant text-[10px]">JD</div>
                    <span className="font-medium text-on-surface-variant text-xs">Jane Doe</span>
                  </div>
                </td>
                <td className="px-4 py-2 font-bold text-on-surface-variant">12/100</td>
                <td className="px-4 py-2 text-[10px] text-on-surface-variant">Incomplete</td>
                <td className="px-4 py-2 text-[10px] text-on-surface-variant">--</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 bg-surface-container-high/50 text-center">
          <button className="text-[10px] font-bold text-primary hover:underline">View 842 more entries</button>
        </div>
      </section>

      {/* -- Coming Next Banner -- */}
      <section className="bg-secondary-container rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 border border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-secondary text-lg">upcoming</span>
          </div>
          <div>
            <h4 className="text-xs font-black text-secondary uppercase tracking-tight">Next Week: Frame Move</h4>
            <p className="text-[10px] text-secondary/80">Drops Sunday · Get early access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-secondary text-on-primary rounded-full px-3 py-1.5 text-[10px] font-bold">
            Notify me
          </button>
          <Link href="/challenges" className="text-[10px] font-bold text-secondary hover:underline">
            Preview Challenge
          </Link>
        </div>
      </section>
    </div>
  )
}
