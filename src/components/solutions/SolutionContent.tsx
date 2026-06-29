'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { mdRehypePlugins, mdRemarkPlugins, safeMarkdownUrl } from '@/components/ui/Md'
import { CopyablePre, solutionMarkdownComponents } from '@/components/challenge/markdownComponents'
import { SolutionDiagram } from './diagrams/SolutionDiagram'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { SolutionApproach, SolutionContentV1 } from '@/lib/solutions/schema'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

interface Props {
  content: SolutionContentV1
  size: 'pane' | 'modal'
  activeApproachId: string | null
  onApproachChange: (id: string) => void
}

// Coding approaches often weave the full solution into body_md as a fenced
// block AND carry it again in approach.code. Rendering both shows the code
// twice. Strip a fenced block from body_md only when its content exactly
// matches approach.code.source (trimmed), so distinct illustrative snippets
// and approaches whose code lives only in the code field are untouched. The
// dedicated approach.code block below remains the single canonical display.
export function stripDuplicateCodeFence(bodyMd: string, codeSource?: string): string {
  if (!codeSource) return bodyMd
  const target = codeSource.trim()
  return bodyMd
    .replace(/```[^\n]*\n([\s\S]*?)```/g, (block, inner: string) => (inner.trim() === target ? '' : block))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function SolutionMd({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={solutionMarkdownComponents}
      remarkPlugins={mdRemarkPlugins}
      rehypePlugins={mdRehypePlugins}
      skipHtml
      urlTransform={safeMarkdownUrl}
    >
      {children}
    </ReactMarkdown>
  )
}

function ComplexityChips({ approach }: { approach: SolutionApproach }) {
  if (!approach.complexity) return null
  const chip = (label: string, value: string) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'var(--color-surface-container-high)',
      border: '1px solid var(--color-outline-variant)',
      borderRadius: 999,
      padding: '3px 10px',
      fontFamily: 'var(--font-label)',
      fontSize: 11.5,
      fontWeight: 700,
      color: 'var(--color-on-surface)',
    }}>
      <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono, ui-monospace, Menlo, monospace)' }}>{value}</span>
    </span>
  )
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, margin: '10px 0 4px' }}>
      {chip('Time', approach.complexity.time)}
      {chip('Space', approach.complexity.space)}
      {approach.complexity.note && (
        <span style={{ fontSize: 11.5, color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-body)' }}>
          {approach.complexity.note}
        </span>
      )}
    </div>
  )
}

function Tradeoffs({ approach }: { approach: SolutionApproach }) {
  if (!approach.tradeoffs || approach.tradeoffs.length === 0) return null
  return (
    <div style={{ display: 'grid', gap: 8, margin: '14px 0' }}>
      <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
        Tradeoffs
      </div>
      {approach.tradeoffs.map((tradeoff, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 10,
          overflow: 'hidden',
          fontSize: 12.5,
          lineHeight: 1.5,
          fontFamily: 'var(--font-body)',
        }}>
          <div style={{ padding: '8px 10px', background: 'var(--color-primary-fixed)', color: 'var(--color-on-surface)' }}>
            <span style={{ fontWeight: 800, color: 'var(--color-primary)', marginRight: 5, fontFamily: 'var(--font-label)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gain</span>
            {tradeoff.gain}
          </div>
          <div style={{ padding: '8px 10px', background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)', borderLeft: '1px solid var(--color-outline-variant)' }}>
            <span style={{ fontWeight: 800, color: 'var(--color-tertiary)', marginRight: 5, fontFamily: 'var(--font-label)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost</span>
            {tradeoff.cost}
          </div>
        </div>
      ))}
    </div>
  )
}

function AiCollaborationSection({ content }: { content: SolutionContentV1 }) {
  const ai = content.ai_collaboration
  // Collapsed by default so the official solution leads. The AI angle is a
  // disclosure the reader opens once they want it, not a banner competing with
  // the answer above it.
  const [open, setOpen] = useState(false)
  return (
    <section
      data-testid="solution-ai-collaboration"
      style={{
        marginTop: 26,
        background: 'linear-gradient(135deg, #f7f3ea 0%, #eef5ee 100%)',
        border: '1px solid rgba(74,124,89,0.22)',
        borderRadius: 16,
        padding: open ? '16px 18px' : '12px 16px',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
          marginBottom: open ? 10 : 0,
        }}
      >
        <HatchGlyph size={30} state="speaking" className="text-primary" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: 15.5, fontWeight: 700, color: 'var(--color-on-surface)', lineHeight: 1.25 }}>
            Working this problem with AI
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
            Where an AI pair speeds you up here, and where it leads you astray.
          </div>
        </div>
        <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', fontSize: 22, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          expand_more
        </span>
      </button>

      {open && (
        <>
          <SolutionMd>{ai.body_md}</SolutionMd>

          <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-primary)', margin: '14px 0 8px' }}>
            Prompts worth stealing
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {ai.prompts.map((prompt, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 12.5, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 5 }}>
                  {prompt.title}
                </div>
                <CopyablePre>
                  <span style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: 12.5 }}>{prompt.prompt}</span>
                </CopyablePre>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: -6, lineHeight: 1.5 }}>
                  {prompt.why}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-tertiary)', margin: '16px 0 6px' }}>
            Where AI work goes wrong here
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {ai.pitfalls.map((pitfall, i) => (
              <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.55, color: 'var(--color-on-surface)' }}>
                {pitfall}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/**
 * Pure renderer for a solution document. Shared between the in-workspace pane
 * and the maximized dialog (size widens type and spacing in the modal).
 */
export function SolutionContent({ content, size, activeApproachId, onApproachChange }: Props) {
  const active = content.approaches.find((a) => a.id === activeApproachId) ?? content.approaches[0]
  const isModal = size === 'modal'

  return (
    <div style={{ maxWidth: isModal ? 760 : undefined, margin: isModal ? '0 auto' : undefined }}>
      {/* Overview */}
      <SolutionMd>{content.overview_md}</SolutionMd>

      {/* Approach selector */}
      {content.approaches.length > 1 && (
        <div role="tablist" aria-label="Solution approaches" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '18px 0 14px' }}>
          {content.approaches.map((approach, i) => {
            const isActive = approach.id === active.id
            return (
              <button
                key={approach.id}
                role="tab"
                aria-selected={isActive}
                data-testid={`solution-approach-${approach.id}`}
                onClick={() => onApproachChange(approach.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 13px',
                  borderRadius: 999,
                  border: isActive ? '1.5px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                  background: isActive ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-low)',
                  color: 'var(--color-on-surface)',
                  fontFamily: 'var(--font-label)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 17,
                  height: 17,
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                  color: isActive ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                }}>
                  {i + 1}
                </span>
                {approach.title}
              </button>
            )
          })}
        </div>
      )}

      {/* Active approach */}
      <div data-testid="solution-active-approach" style={{ marginTop: content.approaches.length > 1 ? 0 : 18 }}>
        <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: isModal ? 19 : 17, fontWeight: 700, color: 'var(--color-on-surface)', margin: '0 0 4px', lineHeight: 1.25 }}>
          {active.title}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-on-surface-variant)', margin: '0 0 8px', lineHeight: 1.5 }}>
          {active.tagline}
        </p>
        <ComplexityChips approach={active} />
        {active.diagram && <SolutionDiagram spec={active.diagram} />}
        <SolutionMd>{stripDuplicateCodeFence(active.body_md, active.code?.source)}</SolutionMd>
        {active.code && (
          <div style={{ margin: '14px 0' }}>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 6 }}>
              {active.code.language}
            </div>
            <CopyablePre>
              <code style={{ fontFamily: 'var(--font-mono, ui-monospace, Menlo, monospace)', fontSize: 12.5 }}>
                {active.code.source}
              </code>
            </CopyablePre>
          </div>
        )}
        <Tradeoffs approach={active} />
      </div>

      <AiCollaborationSection content={content} />

      {/* Key takeaways */}
      {content.key_takeaways && content.key_takeaways.length > 0 && (
        <section style={{ marginTop: 22, marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>
            Key takeaways
          </div>
          <div style={{ display: 'grid', gap: 7 }}>
            {content.key_takeaways.map((takeaway, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)', marginTop: 2 }}>
                  check_circle
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-on-surface)' }}>
                  {takeaway}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
