import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

/* ---------- mock data ---------- */
const leaderboard = [
  { rank: 1, name: 'Alex Chen', score: 98, move: 'Optimize', time: '31m 12s', medalColor: 'text-amber-400' },
  { rank: 2, name: 'Sarah Jenkins', score: 94, move: 'Optimize', time: '35m 44s', medalColor: 'text-slate-400' },
  { rank: 3, name: 'David Miller', score: 92, move: 'Optimize', time: '29m 05s', medalColor: 'text-amber-700' },
]

export default function CohortPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in-up">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">military_tech</span>
            This Week&apos;s Challenge
          </h1>
          <p className="text-sm text-on-surface-variant ml-9">847 engineers competing in the current cohort</p>
        </div>
      </div>

      {/* ── Challenge Hero Card ── */}
      <section className="bg-primary rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex gap-2">
              <span className="bg-tertiary text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Week 12 · Optimize Move</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight font-headline">
              You&apos;re PM at Spotify. Podcast listening dropped 23% in Q3. Diagnose and recommend a fix.
            </h2>
            <div className="flex items-center gap-4 text-sm font-medium opacity-90">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">schedule</span>
                <span>Closes in: 2d 14h 31m</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">group</span>
                <span>Average Score: 64/100</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button className="bg-white text-primary px-6 py-3 rounded-full font-bold text-sm shadow-sm hover:bg-primary-fixed transition-colors">
              Submit Revision
            </button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-tertiary/20 rounded-full blur-2xl" />
      </section>

      {/* ── Ranking + Share ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Luma Insights */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex gap-4 items-start">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-black font-headline text-primary mb-1">#47</div>
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Global Rank</div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="w-full bg-outline-variant h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[94%]" />
            </div>
            <div className="flex justify-between text-xs font-bold text-on-surface-variant">
              <span>Percentile</span>
              <span className="text-primary">Top 6%</span>
            </div>
            <div className="relative bg-white p-3 rounded-lg border border-outline-variant shadow-sm mt-4">
              <div className="absolute -left-2 top-3 w-4 h-4 bg-white border-l border-b border-outline-variant rotate-45" />
              <div className="flex gap-3">
                <LumaGlyph size={32} state="speaking" className="text-primary shrink-0" />
                <p className="text-xs italic text-on-surface leading-relaxed">
                  &ldquo;Top 6%! You&apos;re outperforming most engineers at your level. Keep tightening your product intuition!&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Card */}
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold font-headline">Share your rank this week</h3>
            <span className="material-symbols-outlined text-on-surface-variant">ios_share</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-black font-headline text-primary">#47</div>
            <p className="text-xs text-on-surface-variant max-w-[180px]">Show your network you&apos;re building elite product skills at HackProduct.</p>
          </div>
          <button className="mt-4 w-full bg-[#0077b5] text-white py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            Post to LinkedIn
          </button>
        </div>
      </section>

      {/* ── Leaderboard Table ── */}
      <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Rank</th>
                <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Engineer</th>
                <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Score</th>
                <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Move</th>
                <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Top 3 */}
              {leaderboard.map((entry) => (
                <tr key={entry.rank} className="h-14 hover:bg-surface-container transition-colors">
                  <td className="px-6">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined ${entry.medalColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                      <span className="font-headline font-bold">{entry.rank}</span>
                    </div>
                  </td>
                  <td className="px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-outline-variant flex items-center justify-center text-[10px] font-bold text-primary">
                        {entry.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold">{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-6 text-sm font-bold text-primary">{entry.score}/100</td>
                  <td className="px-6">
                    <span className="px-2 py-0.5 bg-secondary-container rounded-full text-[10px] font-bold">{entry.move}</span>
                  </td>
                  <td className="px-6 text-xs text-on-surface-variant font-medium">{entry.time}</td>
                </tr>
              ))}

              {/* Ellipsis */}
              <tr className="h-10">
                <td className="px-6 text-center" colSpan={5}>
                  <span className="material-symbols-outlined text-outline">more_horiz</span>
                </td>
              </tr>

              {/* USER RANK 47 */}
              <tr className="h-14 bg-primary-fixed/30 border-y-2 border-primary/20">
                <td className="px-6">
                  <span className="font-headline font-black text-primary">47</span>
                </td>
                <td className="px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        <span className="material-symbols-outlined text-xs">person</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white" />
                    </div>
                    <span className="text-sm font-black text-on-surface">Mark Peterson (YOU)</span>
                  </div>
                </td>
                <td className="px-6 text-sm font-black text-primary">79/100</td>
                <td className="px-6">
                  <span className="px-2 py-0.5 bg-primary text-white rounded-full text-[10px] font-bold">Optimize</span>
                </td>
                <td className="px-6 text-xs text-on-surface-variant font-black">42m 05s</td>
              </tr>

              {/* Ellipsis */}
              <tr className="h-10">
                <td className="px-6 text-center" colSpan={5}>
                  <span className="material-symbols-outlined text-outline">more_horiz</span>
                </td>
              </tr>

              {/* Last Rank */}
              <tr className="h-14 opacity-60">
                <td className="px-6">
                  <span className="font-headline font-bold">847</span>
                </td>
                <td className="px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">JD</div>
                    <span className="text-sm font-medium">Jane Doe</span>
                  </div>
                </td>
                <td className="px-6 text-sm font-medium">12/100</td>
                <td className="px-6">
                  <span className="px-2 py-0.5 bg-outline-variant rounded-full text-[10px] font-bold">Incomplete</span>
                </td>
                <td className="px-6 text-xs text-on-surface-variant">--</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Next Week Banner ── */}
      <section className="bg-surface-container-high border border-outline-variant p-4 md:p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-white rounded-lg border border-outline-variant flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">upcoming</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-1">Coming Next</h4>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-black font-headline">NEXT WEEK: FRAME MOVE</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded border border-outline-variant font-medium">Drops Sunday</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-outline-variant">
            <span className="text-xs font-bold text-on-surface-variant">Notify me</span>
            <button className="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out">
              <span className="translate-x-5 pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </div>
          <Link href="/challenges" className="flex-1 md:flex-none px-6 py-2 border border-primary text-primary rounded-full text-sm font-bold hover:bg-primary-fixed transition-colors text-center">
            Preview Challenge
          </Link>
        </div>
      </section>
    </div>
  )
}
