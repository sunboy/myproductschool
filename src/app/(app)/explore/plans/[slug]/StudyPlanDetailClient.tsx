'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { StudyPlanItem, StudyPlanWithItems } from '@/lib/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ITEM_TYPE_LABEL: Record<string, string> = {
  challenge: 'Challenge',
  concept: 'Concept',
  article: 'Article',
}

function groupByChapter(items: StudyPlanItem[]): Map<string, StudyPlanItem[]> {
  const chapters = new Map<string, StudyPlanItem[]>()
  for (const item of items) {
    const chapter = item.chapter_title ?? 'Uncategorized'
    if (!chapters.has(chapter)) chapters.set(chapter, [])
    chapters.get(chapter)!.push(item)
  }
  return chapters
}

// ─── decorative layers ────────────────────────────────────────────────────────

function HeroDotGrid() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 70% 50%, black 30%, transparent 75%)',
        maskImage: 'radial-gradient(ellipse 80% 100% at 70% 50%, black 30%, transparent 75%)',
      }}
    />
  )
}

function HeroGlow() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(500px 400px at 80% 60%, rgba(78,180,120,0.14), transparent 65%)',
      }}
    />
  )
}

// ─── chapter row ──────────────────────────────────────────────────────────────

interface ChapterRowProps {
  chapterTitle: string
  items: StudyPlanItem[]
  chapterIdx: number
  slug: string
}

function ChapterRow({ chapterTitle, items, chapterIdx, slug }: ChapterRowProps) {
  const [open, setOpen] = useState(chapterIdx === 0)
  const completedInChapter = items.filter(i => i.challenge?.is_completed).length
  const totalInChapter = items.length
  const isFullyDone = completedInChapter === totalInChapter && totalInChapter > 0
  const hasProgress = completedInChapter > 0 && !isFullyDone

  return (
    <div style={{
      background: '#fdfbf6',
      border: '1px solid #e7dfc9',
      borderRadius: 24,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'transparent', border: 'none', textAlign: 'left',
          cursor: 'pointer', transition: 'background 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f4eee2')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Chapter number dot */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...(isFullyDone
            ? { background: '#4a7c59', color: '#fff' }
            : hasProgress
            ? { background: '#cfe3d3', color: '#0f3d1f' }
            : { background: '#ede6d6', color: '#78715f' }),
        }}>
          {isFullyDone ? (
            <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>check</span>
          ) : (
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 11.5, fontWeight: 700 }}>{chapterIdx + 1}</span>
          )}
        </div>

        {/* Title + mini progress */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 17, fontWeight: 700, letterSpacing: '-0.005em', color: '#1e1b14',
          }}>
            {chapterTitle}
          </div>
          {hasProgress && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{ height: 3, width: 80, background: '#ede6d6', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((completedInChapter / totalInChapter) * 100)}%`, height: '100%', background: '#4a7c59', borderRadius: 999 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: '#78715f' }}>in progress</span>
            </div>
          )}
        </div>

        {/* Done count */}
        <span style={{
          fontFamily: 'var(--font-label)',
          fontSize: 12.5, fontWeight: 700, flexShrink: 0, minWidth: 60, textAlign: 'right',
          color: completedInChapter > 0 ? '#4a7c59' : '#78715f',
        }}>
          {completedInChapter}/{totalInChapter} done
        </span>

        {/* Expand icon */}
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20, color: '#78715f', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms',
          }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #e7dfc9' }}>
          {items.map((item, itemIdx) => {
            const typeLabel = ITEM_TYPE_LABEL[item.item_type] ?? item.item_type
            const title = item.challenge?.title ?? (item as { concept?: { title?: string } }).concept?.title ?? 'Untitled'
            const href =
              item.item_type === 'challenge' && item.challenge_id
                ? `/workspace/challenges/${item.challenge_id}?from_plan=${slug}`
                : item.item_type === 'concept' && item.concept_id
                ? `/vocabulary/${item.concept_id}`
                : '#'
            const isCompleted = item.challenge?.is_completed ?? false
            const isInProgress = item.challenge?.is_in_progress ?? false
            const actionLabel = isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'

            const typeBadgeStyle: React.CSSProperties =
              item.item_type === 'challenge'
                ? { background: '#cfe3d3', color: '#0f3d1f' }
                : item.item_type === 'concept'
                ? { background: '#f3e2b9', color: '#705c30' }
                : { background: '#e4dcc8', color: '#4e4a3f' }

            return (
              <Link
                key={item.id}
                href={href}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px auto 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  borderBottom: itemIdx < items.length - 1 ? '1px solid #e7dfc9' : 'none',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f4eee2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#4a7c59', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : isInProgress ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#705c30', fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#d5cab1' }}>radio_button_unchecked</span>
                )}

                <span style={{
                  ...typeBadgeStyle,
                  fontFamily: 'var(--font-label)',
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 9px', borderRadius: 999,
                  whiteSpace: 'nowrap' as const,
                }}>
                  {typeLabel}
                </span>

                <span style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: 14, fontWeight: isCompleted ? 500 : 600,
                  color: isCompleted ? '#78715f' : '#1e1b14',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {title}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {isCompleted && item.challenge?.best_score != null && (
                    <span style={{
                      fontFamily: 'var(--font-label)',
                      fontSize: 13, fontWeight: 800, color: '#4a7c59',
                      background: '#cfe3d3', padding: '3px 8px', borderRadius: 999,
                    }}>
                      +{item.challenge.best_score.toFixed(1)}
                    </span>
                  )}
                  <span style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: 12, fontWeight: 700, color: '#4e4a3f',
                    border: '1px solid #d5cab1', borderRadius: 999,
                    padding: '6px 12px', display: 'inline-block',
                  }}>
                    {actionLabel}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

export function StudyPlanDetailClient({ plan, slug }: { plan: StudyPlanWithItems; slug: string }) {
  const diff = plan.difficulty ?? 'intermediate'
  const difficultyLabel = diff.charAt(0).toUpperCase() + diff.slice(1)

  const allChallengeItems = plan.items.filter(i => i.item_type === 'challenge' && i.challenge_id)
  const firstIncomplete = allChallengeItems.find(i => !i.challenge?.is_completed)
  const ctaHref = firstIncomplete?.challenge_id
    ? `/workspace/challenges/${firstIncomplete.challenge_id}?from_plan=${slug}`
    : `/workspace/challenges/${allChallengeItems[0]?.challenge_id ?? '#'}?from_plan=${slug}`

  const chapters = groupByChapter(plan.items)
  const totalDone = plan.items.filter(i => i.challenge?.is_completed).length
  const pct = plan.progress_percentage

  const avatarColors = Array.from({ length: 5 }, (_, i) => `hsl(${i * 67 + 110}, 45%, 52%)`)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 64px' }}>

      {/* ── Hero card ── */}
      <div style={{
        borderRadius: 32, overflow: 'hidden', marginBottom: 32,
        background: 'linear-gradient(135deg, #1e3528 0%, #0e1a14 100%)',
        padding: '36px 48px', position: 'relative',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <HeroDotGrid />
        <HeroGlow />

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 40,
          alignItems: 'center', position: 'relative', zIndex: 1,
        }}>
          {/* Left */}
          <div>
            {/* Breadcrumb */}
            <div style={{
              fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700,
              color: 'rgba(243,237,224,0.45)',
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
            }}>
              <Link href="/explore" style={{ color: 'inherit', textDecoration: 'none' }}>Explore</Link>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chevron_right</span>
              <Link href="/explore/plans" style={{ color: 'inherit', textDecoration: 'none' }}>Study Plans</Link>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chevron_right</span>
              <span style={{ color: 'rgba(243,237,224,0.70)' }}>{plan.title}</span>
            </div>

            {/* Icon + title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, flexShrink: 0,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color: '#7ee099', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                  {plan.icon ?? 'school'}
                </span>
              </div>
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1,
                  color: '#f3ede0', margin: '0 0 6px',
                }}>
                  {plan.title}
                </h1>
                <span style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f3e2b9', padding: '4px 10px', borderRadius: 999,
                }}>
                  {difficultyLabel}
                </span>
              </div>
            </div>

            {plan.description && (
              <p style={{
                fontFamily: 'var(--font-label)', fontSize: 14.5, lineHeight: 1.55,
                color: 'rgba(243,237,224,0.72)', maxWidth: 560, marginBottom: 16, marginTop: 0,
              }}>
                {plan.description}
              </p>
            )}

            {pct > 0 && (
              <div style={{ maxWidth: 520, marginTop: 16 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, color: 'rgba(243,237,224,0.55)', fontWeight: 700,
                  marginBottom: 6, fontFamily: 'var(--font-label)',
                }}>
                  <span>Your progress</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #7ee099, #4a7c59)', borderRadius: 999 }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Link
                href={ctaHref}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: '#f3ede0', color: '#1e1b14',
                  padding: '14px 24px', borderRadius: 999,
                  fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none', transition: 'transform 120ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                {pct > 0 ? 'Continue Plan' : 'Start Plan'}
              </Link>
              <button
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'rgba(255,255,255,0.08)', color: '#f3ede0',
                  border: '1px solid rgba(255,255,255,0.14)',
                  padding: '14px 24px', borderRadius: 999,
                  fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', transition: 'transform 120ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bookmark_border</span>
                Save for later
              </button>
            </div>
          </div>

          {/* Right: stat pills */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {[
              { label: 'Chapters', value: String(plan.chapter_count) },
              { label: 'Total items', value: String(plan.item_count) },
              { label: 'Est. time', value: plan.estimated_hours != null ? `~${plan.estimated_hours}h` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 18, padding: '10px 18px', minWidth: 150, textAlign: 'right',
              }}>
                <div style={{
                  fontFamily: 'var(--font-label)', fontSize: 10.5, fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase' as const,
                  color: 'rgba(243,237,224,0.40)', marginBottom: 2,
                }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600, color: '#f3ede0' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Left: Curriculum */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 700,
              letterSpacing: '-0.01em', color: '#1e1b14', margin: 0,
            }}>
              Curriculum
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-label)', fontSize: 12, color: '#78715f' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>group</span>
              {totalDone} of {plan.item_count} completed
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from(chapters.entries()).map(([chapterTitle, items], chapterIdx) => (
              <ChapterRow
                key={chapterTitle}
                chapterTitle={chapterTitle}
                items={items}
                chapterIdx={chapterIdx}
                slug={slug}
              />
            ))}
          </div>
        </div>

        {/* Right: Sticky sidebar */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Plan Overview */}
          <div style={{ background: '#fdfbf6', border: '1px solid #e7dfc9', borderRadius: 24, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 17, fontWeight: 700, color: '#1e1b14', marginBottom: 14 }}>
              Plan Overview
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Chapters', value: String(plan.chapter_count) },
                { label: 'Total items', value: String(plan.item_count) },
                ...(plan.estimated_hours != null ? [{ label: 'Est. time', value: `~${plan.estimated_hours}h` }] : []),
                { label: 'Difficulty', value: difficultyLabel },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 13.5,
                  borderBottom: i < arr.length - 1 ? '1px solid #e7dfc9' : 'none',
                  paddingBottom: i < arr.length - 1 ? 10 : 0,
                }}>
                  <span style={{ fontFamily: 'var(--font-label)', color: '#78715f' }}>{row.label}</span>
                  {row.label === 'Difficulty' ? (
                    <span style={{
                      fontFamily: 'var(--font-label)', fontSize: 11.5, fontWeight: 800,
                      letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                      background: '#cfe3d3', color: '#0f3d1f', padding: '3px 10px', borderRadius: 999,
                    }}>
                      {row.value}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-label)', fontWeight: 700, color: '#1e1b14' }}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>
            <Link
              href={ctaHref}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#4a7c59', color: '#fff', borderRadius: 999, padding: '12px',
                fontFamily: 'var(--font-label)', fontSize: 14, fontWeight: 700,
                marginTop: 16, textDecoration: 'none', transition: 'transform 120ms',
                width: '100%', boxSizing: 'border-box' as const,
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              {pct > 0 ? 'Continue Plan' : 'Start Plan'}
            </Link>
          </div>

          {/* Hatch's Coaching */}
          <div style={{ background: '#cfe3d3', borderRadius: 24, padding: 18, border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <HatchGlyph size={36} state="speaking" className="flex-shrink-0" />
              <div>
                <div style={{
                  fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800,
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  color: '#0f3d1f', opacity: 0.7, marginBottom: 5,
                }}>
                  Hatch&rsquo;s Coaching
                </div>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: 13, lineHeight: 1.55, color: '#0f3d1f', margin: 0 }}>
                  This plan is designed for engineers who want to build genuine product intuition. Don&rsquo;t rush — depth beats breadth. Complete each challenge before choosing the model answer.
                </p>
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div style={{ background: '#fdfbf6', border: '1px solid #e7dfc9', borderRadius: 24, padding: 16 }}>
            <div style={{
              fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              color: '#78715f', marginBottom: 10,
            }}>
              On this plan
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {avatarColors.map((bg, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '2px solid #fdfbf6', background: bg, color: '#fff',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-label)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i, position: 'relative',
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: '#4e4a3f', marginLeft: 14 }}>
                1,243 engineers
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
