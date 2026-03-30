'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useCohort } from '@/hooks/useCohort'

const MEDAL_COLORS = ['text-amber-400', 'text-slate-400', 'text-amber-700']

function buildLinkedInShareUrl(rank: number, score: number, challengeTitle: string): string {
  const text = encodeURIComponent(
    `I ranked #${rank} on this week's HackProduct community challenge: "${challengeTitle}" — scored ${score}/100. Sharpening my product thinking one challenge at a time. 🧠\n\nhackproduct.io`
  )
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://hackproduct.io')}&summary=${text}`
}

export default function CohortPage() {
  const { challenge, submission, leaderboard, isLoading, submitResponse } = useCohort()
  const [responseText, setResponseText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const userRowRef = useRef<HTMLTableRowElement>(null)

  // Raph Koster: scroll the user's rank row into view after leaderboard loads
  useEffect(() => {
    if (!isLoading && submission && userRowRef.current) {
      const t = setTimeout(() => {
        userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 600)
      return () => clearTimeout(t)
    }
  }, [isLoading, submission])
  const [teamNotified, setTeamNotified] = useState(false)
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hackproduct_cohort_notify') !== 'false'
    }
    return true
  })
  const [justToggled, setJustToggled] = useState(false)

  const handleTeamNotify = () => {
    setTeamNotified(true)
    setTimeout(() => {
      setTeamModalOpen(false)
      setTeamNotified(false)
    }, 2000)
  }

  const handleSubmit = async () => {
    if (!responseText.trim()) return
    setIsSubmitting(true)
    try {
      await submitResponse(responseText)
    } catch {
      // submission failed silently
    } finally {
      setIsSubmitting(false)
    }
  }

  // Build leaderboard display — only real data, never fake names
  const leaderboardDisplay = leaderboard.slice(0, 3).map((e, i) => ({
    rank: e.rank,
    name: e.display_name ?? 'Anonymous',
    score: e.score,
    move: 'Optimize',
    time: '--',
    medalColor: MEDAL_COLORS[i] ?? 'text-outline',
  }))

  const challengeTitle = challenge?.title ?? null
  const moveTag = challenge?.move_tag ? `${challenge.move_tag.charAt(0).toUpperCase() + challenge.move_tag.slice(1)} Move` : 'Optimize Move'

  // Derive my rank and percentile from real leaderboard data
  const mySubmissionRank = submission && leaderboard.length > 0
    ? (leaderboard.findIndex(e => e.user_id === submission.user_id) + 1) || null
    : null
  // Only show rank/score if we have real submission data
  const displayRank = mySubmissionRank
  const displayScore = submission?.score ?? null
  const percentileNum = leaderboard.length > 0 && mySubmissionRank
    ? Math.round((1 - (mySubmissionRank - 1) / leaderboard.length) * 100)
    : null
  const percentilePct = percentileNum !== null ? Math.max(1, Math.min(percentileNum, 99)) : null

  // Compute countdown from real week_end if available
  const closesInLabel = (() => {
    if (!challenge?.week_end) return null
    const end = new Date(challenge.week_end)
    const diffMs = end.getTime() - Date.now()
    if (diffMs <= 0) return 'Closed'
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return `${days}d ${hours}h ${mins}m`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  })()

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in-up">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">military_tech</span>
            This Week&apos;s Challenge
          </h1>
          <p className="text-sm text-on-surface-variant ml-9">{leaderboard.length > 0 ? `${leaderboard.length} engineers competing this week` : 'Loading leaderboard...'}</p>
        </div>
        {/* Wes Kao: discussion link visible from leaderboard page */}
        {challenge && (
          <Link
            href={`/challenges/${challenge.id}/discussion`}
            className="flex items-center gap-2 text-sm font-bold text-primary bg-primary-fixed px-4 py-2 rounded-full hover:bg-primary-fixed/80 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">forum</span>
            View Discussion
          </Link>
        )}
      </div>

      {/* ── Challenge Hero Card ── */}
      <section className="bg-primary rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex gap-2">
              <span className="bg-tertiary text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Week 12 · {moveTag}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight font-headline">
              {challengeTitle ?? 'This week\'s challenge is loading...'}
            </h2>
            <div className="flex items-center gap-4 text-sm font-medium opacity-90">
              {closesInLabel && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  <span>Closes in: {closesInLabel}</span>
                </div>
              )}
              {leaderboard.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">group</span>
                  <span>{leaderboard.length} submissions so far</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end">
            {submission ? (
              <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold">
                Submitted ✓
              </span>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !responseText.trim()}
                className="bg-white text-primary px-6 py-3 rounded-full font-bold text-sm shadow-sm hover:bg-primary-fixed transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Revision'}
              </button>
            )}
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-tertiary/20 rounded-full blur-2xl" />
      </section>

      {/* ── Ranking + Share — only shown when user has submitted ── */}
      {submission && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Luma Insights */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex gap-4 items-start">
            {displayRank !== null ? (
              <div className="flex flex-col items-center shrink-0">
                <div className="text-4xl font-black font-headline text-primary mb-1">#{displayRank}</div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Global Rank</div>
              </div>
            ) : null}
            <div className="flex-1 space-y-3">
              {percentilePct !== null && (
                <>
                  <div className="w-full bg-outline-variant h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${100 - percentilePct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                    <span>Percentile</span>
                    <span className="text-primary">Top {percentilePct}%</span>
                  </div>
                </>
              )}
              <div className="relative bg-white p-3 rounded-lg border border-outline-variant shadow-sm mt-4">
                <div className="absolute -left-2 top-3 w-4 h-4 bg-white border-l border-b border-outline-variant rotate-45" />
                <div className="flex gap-3">
                  <LumaGlyph size={32} state="speaking" className="text-primary shrink-0" />
                  <p className="text-xs italic text-on-surface leading-relaxed">
                    {percentilePct !== null
                      ? percentilePct <= 10
                        ? `Top ${percentilePct}%! You're outperforming most engineers at your level. Keep tightening your product intuition!`
                        : percentilePct <= 30
                        ? `Top ${percentilePct}% — solid start. Focus on your recommendation strength to climb the leaderboard.`
                        : `Keep going! You're in the top ${percentilePct}%. One more strong submission can move you up significantly.`
                      : "You've submitted this week's challenge. Check back as more engineers submit to see your ranking."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Share Card */}
          {displayRank !== null && displayScore !== null && challengeTitle && (
            <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-headline">Share your rank this week</h3>
                <span className="material-symbols-outlined text-on-surface-variant">ios_share</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-5xl font-black font-headline text-primary">#{displayRank}</div>
                <p className="text-xs text-on-surface-variant max-w-[180px]">Show your network you&apos;re building elite product skills at HackProduct.</p>
              </div>
              <a
                href={buildLinkedInShareUrl(displayRank, displayScore, challengeTitle)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 bg-[#0077b5] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#006097] transition-colors justify-center"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                Share rank
              </a>
            </div>
          )}
        </section>
      )}

      {/* ── Submit form — shown when not yet submitted ── */}
      {!submission && challenge && (
        <section className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <LumaGlyph size={32} state="listening" className="text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-on-surface">Submit your response to join the leaderboard</p>
              <p className="text-xs text-on-surface-variant">Write your thinking on this week&apos;s challenge — Luma will score it against the community.</p>
            </div>
          </div>
          <textarea
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
            className="w-full bg-white rounded-xl p-3 text-sm border border-outline-variant focus:outline-none focus:ring-1 ring-primary resize-none placeholder:text-on-surface-variant/40"
            placeholder="Share your product thinking..."
            rows={5}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !responseText.trim()}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit & get scored'}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </section>
      )}

      {/* ── Leaderboard Table ── */}
      <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-surface-container-high" />
            <div className="h-3 w-48 bg-surface-container-high rounded" />
            <div className="h-3 w-32 bg-surface-container rounded" />
          </div>
        ) : leaderboardDisplay.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <LumaGlyph size={48} state="idle" className="text-primary" />
            <p className="text-sm font-bold text-on-surface">No submissions yet this week</p>
            <p className="text-xs text-on-surface-variant">Be the first to submit and claim the top spot!</p>
          </div>
        ) : (
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
                {leaderboardDisplay.map((entry) => (
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
                          {entry.name.split(' ').map((n: string) => n[0]).join('')}
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

                {/* User row — only when we have a real rank */}
                {submission && displayRank !== null && !leaderboardDisplay.some(e => e.rank === displayRank) && (
                  <>
                    <tr className="h-10">
                      <td className="px-6 text-center" colSpan={5}>
                        <span className="material-symbols-outlined text-outline">more_horiz</span>
                      </td>
                    </tr>
                    <tr ref={userRowRef} className="h-14 bg-primary-fixed/30 border-y-2 border-primary/20">
                      <td className="px-6">
                        <span className="font-headline font-black text-primary">#{displayRank}</span>
                      </td>
                      <td className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              <span className="material-symbols-outlined text-xs">person</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white" />
                          </div>
                          <span className="text-sm font-black text-on-surface">You</span>
                        </div>
                      </td>
                      <td className="px-6 text-sm font-black text-primary">{displayScore !== null ? `${displayScore}/100` : '—'}</td>
                      <td className="px-6">
                        <span className="px-2 py-0.5 bg-primary text-white rounded-full text-[10px] font-bold">{moveTag}</span>
                      </td>
                      <td className="px-6 text-xs text-on-surface-variant font-black">—</td>
                    </tr>
                  </>
                )}

                {/* Show more rows if available */}
                {leaderboard.length > 3 && (
                  <tr className="h-10">
                    <td className="px-6 text-center" colSpan={5}>
                      <span className="text-xs text-on-surface-variant font-medium">
                        +{leaderboard.length - 3} more engineers
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-outline-variant">
              <span className="text-xs font-bold text-on-surface-variant">Notify me</span>
              <button
                onClick={() => {
                  const next = !notifyEnabled
                  setNotifyEnabled(next)
                  localStorage.setItem('hackproduct_cohort_notify', String(next))
                  setJustToggled(true)
                  setTimeout(() => setJustToggled(false), 2000)
                }}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${notifyEnabled ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifyEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {justToggled && (
              <span className="text-[10px] text-on-surface-variant animate-fade-in-up">
                {notifyEnabled ? "You'll get an email when results drop" : "Notifications off"}
              </span>
            )}
          </div>
          <Link href="/challenges" className="flex-1 md:flex-none px-6 py-2 border border-primary text-primary rounded-full text-sm font-bold hover:bg-primary-fixed transition-colors text-center">
            Preview Challenge
          </Link>
        </div>
      </section>

      {/* ── Team / B2B CTA ── */}
      <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-6 flex items-center justify-between gap-4 mt-6">
        <div>
          <h3 className="font-headline font-bold text-lg mb-1">Practice with your team</h3>
          <p className="text-sm text-inverse-on-surface/70">Create a private cohort for your engineering team. Track collective progress, run internal challenges, and level up together.</p>
        </div>
        <button
          onClick={() => setTeamModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap hover:opacity-90 transition-opacity shrink-0"
        >
          Create Team →
        </button>
      </div>

      {/* ── Team Modal ── */}
      {teamModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4"
          onClick={() => setTeamModalOpen(false)}
        >
          <div
            className="bg-background rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-headline text-xl font-bold mb-2">Team Cohorts</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Private leaderboards for your engineering team. Compete on weekly challenges together, track team-wide skill growth, and build a culture of product thinking. Drop your work email and we&apos;ll set you up.
            </p>
            {teamNotified ? (
              <p className="text-sm font-bold text-primary text-center py-3">Thanks! We&apos;ll be in touch.</p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="your@company.com"
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-primary bg-surface-container"
                />
                <button
                  onClick={handleTeamNotify}
                  className="w-full bg-primary text-white py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Notify me
                </button>
              </>
            )}
            <button
              onClick={() => setTeamModalOpen(false)}
              className="w-full mt-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
