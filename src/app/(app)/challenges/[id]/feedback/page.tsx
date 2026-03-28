'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export default function FeedbackPage() {
  const [showRecommended, setShowRecommended] = useState(false)

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">The Feature That Backfired</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: '#2dd4a0' }}>Traditional</span>
              <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Easy</span>
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                +85 XP
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-stone-400">
          <span className="line-through">Clean Run ✦</span>
          <Link href="/challenges" className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition-all">Next Challenge</Link>
        </div>
      </section>

      {/* Main Content: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Radar Chart and Breakdown */}
        <div className="space-y-6">
          <div className="bg-surface-container rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Skill Fingerprint
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Radar Chart */}
              <div className="relative w-48 h-48 shrink-0">
                <svg className="w-full h-full" style={{ transform: 'rotate(-18deg)' }} viewBox="0 0 200 200">
                  {/* Pentagon Grids */}
                  <polygon className="fill-none" style={{ stroke: '#c4c8bc', strokeDasharray: '2' }} points="100,10 185,72 153,171 47,171 15,72" />
                  <polygon className="fill-none" style={{ stroke: '#c4c8bc', strokeDasharray: '2' }} points="100,30 168,79 142,158 58,158 32,79" />
                  <polygon className="fill-none" style={{ stroke: '#c4c8bc', strokeDasharray: '2' }} points="100,50 151,87 131,146 69,146 49,87" />
                  <polygon className="fill-none" style={{ stroke: '#c4c8bc', strokeDasharray: '2' }} points="100,70 134,95 120,133 80,133 66,95" />
                  {/* Data Shape */}
                  <polygon style={{ fill: '#4a7c59', fillOpacity: 0.3, stroke: '#4a7c59', strokeWidth: 2 }} points="100,28 185,72 131,146 58,158 66,95" />
                  {/* Vertices Score Markers */}
                  <circle cx="100" cy="28" fill="#5eaeff" r="3" />
                  <circle cx="185" cy="72" fill="#2dd4a0" r="3" />
                  <circle cx="131" cy="146" fill="#22d3ee" r="3" />
                  <circle cx="58" cy="158" fill="#f59e0b" r="3" />
                  <circle cx="66" cy="95" fill="#a78bfa" r="3" />
                </svg>
              </div>
              {/* Breakdown List */}
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-on-surface-variant">Problem Reframing</span>
                    <span style={{ color: '#5eaeff' }}>4/5</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full w-[80%]" style={{ backgroundColor: '#5eaeff' }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-on-surface-variant">User Segmentation</span>
                    <span style={{ color: '#2dd4a0' }}>5/5</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full w-[100%]" style={{ backgroundColor: '#2dd4a0' }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-on-surface-variant">Data Reasoning</span>
                    <span style={{ color: '#22d3ee' }}>3/5</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full w-[60%]" style={{ backgroundColor: '#22d3ee' }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-on-surface-variant">Tradeoff Clarity</span>
                    <span style={{ color: '#f59e0b' }}>4/5</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full w-[80%]" style={{ backgroundColor: '#f59e0b' }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-on-surface-variant">Communication</span>
                    <span style={{ color: '#a78bfa' }}>2/5</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full w-[40%]" style={{ backgroundColor: '#a78bfa' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trap Dodged & Thinking Pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-surface-container border-l-4 border-primary rounded-xl p-4 shadow-sm">
              <div className="flex gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Thinking Pattern Identified</h3>
                  <p className="text-lg font-bold font-headline text-primary mb-2">Build On, Don&apos;t Tear Down</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">You successfully leveraged existing features rather than suggesting a full rebuild. This shows an understanding of organizational constraints and user muscle memory.</p>
                </div>
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">shield</span>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Trap Dodged</p>
                <p className="text-sm font-bold text-on-surface">Surface-Level Restatement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Anti-Patterns */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-headline flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-error">warning</span>
            Anti-Patterns Detected
          </h2>
          {/* Trap 1 Card */}
          <div className="border-l-4 border-error rounded-xl p-5 shadow-sm space-y-3" style={{ backgroundColor: '#fef2f2' }}>
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-error text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>dangerous</span>
                Aggregate Fallacy
              </h3>
              <span className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded uppercase">-15 XP</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">Treated all users as one group when analyzing the failure. This obscured the fact that the feature actually worked for 20% of your power users while confusing the casual base.</p>
            <div className="bg-white/60 p-3 rounded-lg border border-error/10 text-sm">
              <span className="font-bold text-error">💡 Fix:</span>
              <span className="text-stone-700"> Segment by behavior instead of treating the average as the reality.</span>
            </div>
          </div>
          {/* Trap 2 Card */}
          <div className="border-l-4 border-error rounded-xl p-5 shadow-sm space-y-3" style={{ backgroundColor: '#fef2f2' }}>
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-error text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                Data Delay
              </h3>
              <span className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded uppercase">-10 XP</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">Called for more research when the qualitative feedback from the beta was already sufficient to pivot. In an interview, this comes across as indecisiveness.</p>
            <div className="bg-white/60 p-3 rounded-lg border border-error/10 text-sm">
              <span className="font-bold text-error">💡 Fix:</span>
              <span className="text-stone-700"> Act on available signal even if imperfect; articulate what you&apos;d validate next while moving.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Bottom Section */}
      <section className="space-y-6">
        {/* Detailed Feedback */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-start gap-4 mb-6">
            <LumaGlyph size={48} state="celebrating" className="text-primary" />
            <div>
              <h2 className="text-xl font-bold font-headline text-on-surface">Detailed Feedback</h2>
              <p className="text-sm text-stone-500">Coach Luma&apos;s evaluation of your strategy</p>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed space-y-4">
            <p>Your approach to identifying the &ldquo;backfired&rdquo; component was strong—you correctly isolated the new UI as the primary friction point. However, your proposed solution leaned heavily on <strong>reverting to the previous state</strong>, which ignores the strategic reasons why the change was made in the first place.</p>
            <p>Great product thinkers don&apos;t just roll back; they <em>re-integrate</em>. You identified the user pain but missed the opportunity to explain how you&apos;d keep the business objective while fixing the user experience. Your communication score was hit because you didn&apos;t articulate the &ldquo;Why&rdquo; behind the user&apos;s confusion beyond a simple &ldquo;It&apos;s different.&rdquo;</p>
          </div>
          {/* Recommended Answer Collapsible */}
          <div className="mt-8 border-t border-stone-100 pt-6">
            <div
              className="group cursor-pointer"
              onClick={() => setShowRecommended(!showRecommended)}
            >
              <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">lightbulb</span>
                  <span className="font-bold text-sm">View Recommended Answer</span>
                </div>
                <span className={`material-symbols-outlined text-stone-400 group-hover:text-stone-600 transition-colors ${showRecommended ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Tip Callout */}
        <div className="bg-tertiary/10 border border-tertiary/20 rounded-xl p-5 flex gap-4">
          <div className="bg-tertiary text-white w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-tertiary mb-1">Interview Tip</h4>
            <p className="text-sm text-on-surface-variant leading-snug">When a feature fails, interviewers look for <strong>radical accountability</strong>. Instead of blaming &ldquo;marketing&rdquo; or &ldquo;bad luck,&rdquo; show you can trace the failure back to a specific faulty assumption in your initial hypothesis.</p>
          </div>
        </div>
      </section>

      {/* Footer Padding */}
      <div className="h-10" />
    </div>
  )
}
