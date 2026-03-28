import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

/* ---------- mock data ---------- */
const companies = [
  { name: 'Google', challenges: 24, icon: '🔍', color: '#4285F4' },
  { name: 'Meta', challenges: 18, icon: '📘', color: '#1877F2' },
  { name: 'Stripe', challenges: 12, icon: '💳', color: '#635BFF' },
  { name: 'Amazon', challenges: 15, icon: '📦', color: '#FF9900' },
  { name: 'Apple', challenges: 8, icon: '🍎', color: '#000000' },
  { name: 'Uber', challenges: 10, icon: '🚗', color: '#000000' },
  { name: 'Airbnb', challenges: 6, icon: '🏠', color: '#FF385C' },
  { name: 'DoorDash', challenges: 5, icon: '🚪', color: '#FF3008' },
]

const activeStudyPlan = {
  company: 'Google',
  progress: 35,
  daysUntilInterview: 14,
  percentileRank: 72,
  challengesDone: 4,
  challengesTotal: 12,
}

type ChapterItem = { name: string; score?: number; status: 'completed' | 'available' | 'locked' }
type Chapter = { id: number; title: string; status: 'active' | 'locked' | 'pro'; items?: ChapterItem[]; count?: string }

const chapters: Chapter[] = [
  {
    id: 1, title: 'Chapter 1: Product Sense & Logic', status: 'active',
    items: [
      { name: 'Google Maps Monetization', score: 78, status: 'completed' },
      { name: 'YouTube Shorts Growth', score: 65, status: 'completed' },
      { name: 'Search Quality Metrics', status: 'available' },
      { name: 'Cloud Platform Pricing', status: 'locked' },
    ],
  },
  { id: 2, title: 'Chapter 2: Execution & Metrics', status: 'locked', count: '3 challenges, 2 concepts' },
  { id: 3, title: 'Chapter 3: Leadership & Behavioral', status: 'pro', count: 'PRO ONLY' },
]

const simulations = [
  { label: 'Standard', desc: 'Practice with AI interviewer at your pace', icon: 'smart_toy' },
  { label: 'Advanced', desc: 'Timed mock with realistic pressure', icon: 'timer' },
]

export default function PrepHubPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 animate-fade-in-up">
      <div className="grid grid-cols-12 gap-3">

        {/* ── Left Column: Company Selection ── */}
        <aside className="col-span-12 lg:col-span-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
            <h1 className="text-lg font-headline font-bold text-on-surface">Prep Hub</h1>
          </div>
          <p className="text-[10px] font-body text-on-surface-variant mb-2">Choose a company to see its study plan</p>

          <div className="space-y-1">
            {companies.map((c) => (
              <button
                key={c.name}
                className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 transition-colors ${
                  c.name === 'Google'
                    ? 'bg-primary-fixed ring-1 ring-primary/30'
                    : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                <span className="text-base">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-label font-semibold text-on-surface">{c.name}</p>
                  <p className="text-[10px] font-label text-on-surface-variant">{c.challenges} challenges</p>
                </div>
                {c.name === 'Google' && (
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main Content: Google Study Plan ── */}
        <main className="col-span-12 lg:col-span-6 space-y-3">
          {/* Active Plan Header */}
          <div className="card-elevated rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔍</span>
              <h2 className="text-base font-headline font-bold text-on-surface">Google Study Plan</h2>
            </div>
            <p className="text-xs font-body text-on-surface-variant mb-2">Comprehensive prep path for Google PM interviews</p>

            {/* Progress */}
            <div className="space-y-1">
              <div className="flex justify-between items-end text-[10px] font-label">
                <span className="font-bold text-primary">{activeStudyPlan.challengesDone} of {activeStudyPlan.challengesTotal} challenges</span>
                <span className="text-on-surface-variant">{activeStudyPlan.progress}% Complete</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${activeStudyPlan.progress}%` }} />
              </div>
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-2">
            {chapters.map((ch) => (
              <div key={ch.id} className="card-elevated rounded-xl overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between ${ch.status === 'active' ? 'bg-primary-fixed/20' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      ch.status === 'active' ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {ch.id}
                    </div>
                    <h3 className="text-xs font-bold text-on-surface">{ch.title}</h3>
                  </div>
                  {ch.status === 'pro' && (
                    <span className="bg-tertiary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">PRO</span>
                  )}
                  {ch.status === 'locked' && (
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">lock</span>
                  )}
                  {ch.status === 'active' && (
                    <span className="material-symbols-outlined text-primary text-lg">expand_less</span>
                  )}
                </div>

                {ch.status === 'active' && ch.items && (
                  <div className="divide-y divide-outline-variant/20">
                    {ch.items.map((item, i) => (
                      <div
                        key={i}
                        className={`px-4 py-2 flex items-center justify-between ${
                          item.status === 'available' ? 'bg-primary/5' : item.status === 'locked' ? 'opacity-60' : ''
                        }`}
                      >
                        <p className="text-xs font-label font-semibold text-on-surface truncate flex-1 min-w-0">{item.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'completed' && (
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                              {item.score && <span>{item.score}/100</span>}
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </span>
                          )}
                          {item.status === 'available' && (
                            <Link href="/challenges" className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 hover:opacity-90">
                              Start <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </Link>
                          )}
                          {item.status === 'locked' && (
                            <span className="text-[10px] font-label text-on-surface-variant flex items-center gap-1">
                              Locked <span className="material-symbols-outlined text-xs">lock</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {ch.count && ch.status !== 'active' && (
                  <div className="px-4 py-2 text-[10px] font-label text-on-surface-variant">{ch.count}</div>
                )}
              </div>
            ))}
          </div>

          {/* AI Simulation */}
          <div>
            <h3 className="text-xs font-label font-bold text-on-surface mb-2">AI-Powered Simulation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {simulations.map((sim) => (
                <button
                  key={sim.label}
                  className="card-elevated card-interactive rounded-lg p-3 text-left"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-primary text-lg">{sim.icon}</span>
                    <span className="font-label font-semibold text-on-surface text-xs">{sim.label}</span>
                  </div>
                  <p className="text-[10px] font-label text-on-surface-variant">{sim.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          {/* Prep Status */}
          <div className="bg-primary-fixed rounded-xl p-4">
            <h3 className="text-xs font-label font-bold text-on-surface mb-2">Prep Status</h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-1">
                  <svg width="64" height="64" className="-rotate-90" style={{ display: 'block' }}>
                    <circle cx="32" cy="32" r="26" fill="none" strokeWidth={5} stroke="#c4c8bc" />
                    <circle cx="32" cy="32" r="26" fill="none" strokeWidth={5}
                      stroke="#4a7c59" strokeLinecap="round"
                      strokeDasharray={`${(35 / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-headline font-bold text-on-surface">35%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-label">
                  <span className="text-on-surface-variant">Time left</span>
                  <span className="font-bold text-on-surface">14 days</span>
                </div>
                <div className="flex justify-between text-[10px] font-label">
                  <span className="text-on-surface-variant">Ahead of</span>
                  <span className="font-bold text-primary">72% of candidates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Community */}
          <div className="card-elevated rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-primary text-base">group</span>
              <h3 className="text-xs font-label font-bold text-on-surface">Community</h3>
            </div>
            <p className="text-[10px] font-label text-on-surface-variant">12 others prepping for Google this week</p>
          </div>

          {/* Luma Tip */}
          <div className="card-elevated rounded-lg p-3 border border-primary-container/20">
            <div className="flex items-start gap-2">
              <LumaGlyph size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-label font-semibold text-on-surface mb-0.5">Luma&apos;s Prep Tip</p>
                <p className="text-[10px] font-body text-on-surface-variant">
                  Focus on Product Sense challenges first — they&apos;re the most common in Google PM interviews. Complete Chapter 1 to unlock advanced simulations.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
