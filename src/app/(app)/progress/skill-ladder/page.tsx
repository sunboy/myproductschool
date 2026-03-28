import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

/* ---------- mock data ---------- */
const relatedSkills = [
  { name: 'Logic', level: 3 },
  { name: 'Metrics', level: 4 },
  { name: 'Design', level: 1 },
  { name: 'Strategy', level: 2 },
]

export default function SkillLadderPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in-up">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6">
        <span>Progress</span>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span>Skill Ladder</span>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-primary font-bold flex items-center gap-1">Lens Move <span className="material-symbols-outlined text-[12px]">view_in_ar</span></span>
      </nav>

      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>view_in_ar</span>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-headline font-bold text-primary">Lens Move</h1>
              <span className="bg-primary-fixed text-primary px-3 py-0.5 rounded-full text-xs font-bold border border-primary/20">Level 2 — Lens Builder</span>
              <span className="bg-tertiary text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-tertiary/20">FLOW Move: Lens</span>
            </div>
            <p className="text-on-surface-variant text-sm mt-1">Find the right angle to see through a problem</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Skill Ladder ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Luma Card */}
          <div className="bg-surface-container rounded-xl p-5 flex items-center gap-5 border border-outline-variant/30">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center overflow-hidden">
                <LumaGlyph size={48} state="speaking" className="text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 bg-primary text-white p-0.5 rounded-full border border-white">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm relative before:content-[''] before:absolute before:-left-2 before:top-4 before:w-4 before:h-4 before:bg-white before:rotate-45">
              <p className="text-sm font-medium text-on-surface">You&apos;re 6 challenges away from Level 3. Here&apos;s exactly what that unlocks.</p>
            </div>
          </div>

          {/* Vertical Skill Ladder */}
          <div className="space-y-4">

            {/* LEVEL 1 (Completed) */}
            <div className="bg-primary text-white rounded-xl p-5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-10" />
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined font-bold">check</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">Level 1 — Lens Finder · Beginner</h3>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">🥉 Earned Jan 2026</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20">FLOW: Lens</span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">Typical: APM / Junior PM</p>
              </div>
              <button className="bg-white text-primary px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/90 transition-colors">Share →</button>
            </div>

            {/* LEVEL 2 (Current) */}
            <div className="bg-primary-fixed border-2 border-primary rounded-xl p-6 relative">
              <div className="absolute -left-3 top-6 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-primary text-lg">Level 2 — Lens Builder · Developing</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Focus: Multi-stakeholder alignment &amp; edge-case discovery</p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-tertiary text-white px-2 py-0.5 rounded-full text-[10px] font-bold">FLOW: Lens</span>
                  <span className="bg-tertiary-container text-tertiary px-3 py-1 rounded-full text-xs font-bold border border-tertiary/20">6 challenges remaining</span>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold mb-1.5 text-on-surface">
                  <span>Progress to Level 3</span>
                  <span>1,240 / 2,000 XP (62%)</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-3 p-0.5 border border-primary/20">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: '62%' }} />
                </div>
              </div>
              {/* Recommended Challenge Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Luma&apos;s Pick for you</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">DAU/MAU ratio declining</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] flex items-center gap-0.5 bg-surface-container-low px-1.5 py-0.5 rounded border border-outline-variant">Lens <span className="material-symbols-outlined text-[10px]">view_in_ar</span></span>
                        <span className="text-[10px] text-error font-bold uppercase">Hard</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/challenges" className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:shadow-md transition-all active:scale-95">Start →</Link>
                </div>
              </div>
            </div>

            {/* LEVEL 3 (Locked) */}
            <div className="bg-surface-container-high border border-outline-variant/50 rounded-xl p-5 flex items-center gap-4 opacity-70">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-outline">lock</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-on-surface-variant">Level 3 — Lens Strategist · Proficient</h3>
                  <span className="material-symbols-outlined text-outline text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>workspace_premium</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">Complete 6 more Lens challenges (2 Hard)</p>
                <div className="mt-1 text-[10px] font-bold text-tertiary/80 uppercase tracking-tight">FLOW: Frame → Lens → Optimize</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest/50 flex items-center justify-center border border-dashed border-outline-variant">
                <span className="material-symbols-outlined text-outline-variant text-xl">military_tech</span>
              </div>
            </div>

            {/* LEVEL 4 (Locked) */}
            <div className="bg-surface-container-high/50 border border-outline-variant/30 rounded-xl p-5 flex items-center gap-4 opacity-50">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-outline-variant">lock</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-outline">Level 4 — Lens Expert</h3>
                <p className="text-xs text-outline mt-0.5">Master system-wide perspective moves</p>
                <div className="mt-1 text-[10px] font-bold text-tertiary/60 uppercase tracking-tight">FLOW: Frame → Lens → Optimize → Win</div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-2xl">military_tech</span>
            </div>

            {/* LEVEL 5 (Locked) */}
            <div className="bg-surface-container-high/30 border border-outline-variant/20 rounded-xl p-5 flex items-center gap-4 opacity-30">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-outline-variant">lock</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-outline">Level 5 — Lens Master</h3>
                <div className="mt-1 text-[10px] font-bold text-tertiary/40 uppercase tracking-tight">FLOW: Mastery</div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-2xl">diamond</span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Sidebar ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Credential Section */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/30">
            <h3 className="text-sm font-bold text-on-surface mb-4">Live Credential</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/20 flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>view_in_ar</span>
              </div>
              <h4 className="text-lg font-headline font-bold text-primary">Lens Builder</h4>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Level 2</p>
              <div className="mt-4 flex items-center gap-2 bg-primary-fixed px-3 py-1 rounded-full text-[10px] font-black text-primary">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                HACKPRODUCT VERIFIED
              </div>
            </div>
            <button className="w-full bg-[#0077b5] text-white py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow hover:bg-[#006097] transition-colors">
              <span className="material-symbols-outlined text-lg">add_circle</span> Add to LinkedIn profile →
            </button>
          </div>

          {/* Career Benchmark */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/30">
            <h3 className="text-sm font-bold text-on-surface mb-4">Career Benchmark</h3>
            <div className="space-y-4 pt-4">
              <div className="relative h-1 bg-outline-variant rounded-full mb-8">
                <div className="absolute left-0 -top-1 w-3 h-3 bg-outline rounded-full">
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-outline whitespace-nowrap">APM</div>
                </div>
                <div className="absolute left-[33%] -top-1 w-3 h-3 bg-primary rounded-full">
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary whitespace-nowrap">PM</div>
                </div>
                <div className="absolute left-[45%] -top-4 w-1 bg-primary h-6 flex flex-col items-center">
                  <div className="absolute -top-7 bg-primary text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm">YOU</div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary whitespace-nowrap">PM-2</div>
                </div>
                <div className="absolute left-[66%] -top-1 w-3 h-3 bg-outline rounded-full">
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-outline whitespace-nowrap">Senior</div>
                </div>
                <div className="absolute left-full -translate-x-full -top-1 w-3 h-3 bg-outline rounded-full">
                  <div className="absolute -bottom-6 right-0 text-[9px] font-bold text-outline whitespace-nowrap">Principal</div>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant italic leading-relaxed pt-2">Your current &lsquo;Lens Move&rsquo; skill score puts you in the top 15% of Mid-Level PMs in the tech industry.</p>
            </div>
          </div>

          {/* Related Skills */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/30">
            <h3 className="text-sm font-bold text-on-surface mb-3">Related Skills</h3>
            <div className="grid grid-cols-2 gap-2">
              {relatedSkills.map((s) => (
                <div key={s.name} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase">{s.name}</p>
                  <p className="text-xs font-bold text-on-surface">Level {s.level}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FLOW Framework Note */}
          <div className="bg-tertiary-container/30 rounded-xl p-4 border border-tertiary/20 flex gap-3 items-start">
            <span className="material-symbols-outlined text-tertiary text-lg">info</span>
            <p className="text-[11px] text-tertiary font-medium leading-tight">
              <span className="font-bold block mb-0.5">FLOW Framework</span>
              The Lens move is one of 4 FLOW thinking moves: Frame · Lens · Optimize · Win
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
