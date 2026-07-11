'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HatchImage } from '@/components/redesign/HatchImage'
import {
  PRODUCT_SENSE_MCQS,
  PRODUCT_SENSE_FREEFORM,
  moveLabel,
  type McqAnswers,
} from '@/lib/quiz/productSense'
import type { CalibrationMove } from '@/lib/calibration/deriveArchetype'

type Stage = 'intro' | 'mcq' | 'freeform' | 'grading' | 'result' | 'error'

interface GradeResponse {
  result: {
    total: number
    verdict: 'sharp' | 'solid' | 'developing'
    headline: string
    strongMove: CalibrationMove
    weakMove: CalibrationMove
    strongMoveLabel: string
    weakMoveLabel: string
    moveScores: Record<string, number>
    slug: string
  }
  freeform: {
    score: number
    strength: string
    gap: string
    graded_by: 'ai' | 'heuristic'
  }
}

const VERDICT_ACCENT: Record<GradeResponse['result']['verdict'], string> = {
  sharp: 'text-primary',
  solid: 'text-tertiary',
  developing: 'text-on-surface-variant',
}

export function ProductSenseQuiz() {
  const [stage, setStage] = useState<Stage>('intro')
  const [mcqStep, setMcqStep] = useState(0)
  const [mcqAnswers, setMcqAnswers] = useState<McqAnswers>({})
  const [freeform, setFreeform] = useState('')
  const [grade, setGrade] = useState<GradeResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const currentMcq = PRODUCT_SENSE_MCQS[mcqStep]
  const totalMcq = PRODUCT_SENSE_MCQS.length

  function start() {
    setStage('mcq')
    setMcqStep(0)
    setMcqAnswers({})
    setFreeform('')
    setGrade(null)
  }

  function selectOption(move: CalibrationMove, optionId: 'A' | 'B' | 'C' | 'D') {
    setMcqAnswers((prev) => ({ ...prev, [move]: optionId }))
    if (mcqStep + 1 < totalMcq) {
      setMcqStep(mcqStep + 1)
    } else {
      setStage('freeform')
    }
  }

  async function submitFreeform() {
    setStage('grading')
    try {
      const res = await fetch('/api/public/quiz/product-sense/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcqAnswers, freeform }),
      })
      if (!res.ok) throw new Error(`grade failed: ${res.status}`)
      const data: GradeResponse = await res.json()
      setGrade(data)
      setStage('result')
    } catch {
      setStage('error')
    }
  }

  function retake() {
    setStage('intro')
    setMcqStep(0)
    setMcqAnswers({})
    setFreeform('')
    setGrade(null)
    setCopied(false)
  }

  const shareUrl = grade
    ? `https://www.hackproduct.com/quiz/product-sense?r=${grade.result.slug}`
    : ''
  const shareText = grade
    ? `I scored ${grade.result.total}/9 on HackProduct's product-sense round. ${grade.result.headline}.`
    : ''
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  async function handleShare() {
    if (!grade) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can fail on non-secure origins. The link buttons still work.
    }
  }

  const freeformWords = freeform.trim().split(/\s+/).filter(Boolean).length
  const freeformReady = freeformWords >= 8

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col px-4 py-12 sm:px-6 sm:py-16">
      {/* ── Intro ── */}
      {stage === 'intro' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <HatchImage size={72} state="idle" />
          <p className="font-label text-sm font-semibold uppercase tracking-widest text-tertiary">
            3 questions, no signup
          </p>
          <h1 className="font-headline text-4xl font-bold text-on-background sm:text-5xl">
            Can you pass a product-sense round?
          </h1>
          <p className="max-w-md font-body text-base leading-relaxed text-on-surface-variant">
            One real scenario, two taste-checks, and one recommendation you write yourself. Hatch reads your
            answer, scores it out of nine, and tells you which move you already have and which one is costing you
            the room.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-2 rounded-full bg-primary px-8 py-3 font-label text-base font-semibold text-on-primary transition-transform active:scale-[0.98]"
          >
            Start the round
          </button>
        </div>
      )}

      {/* ── MCQ taste-checks ── */}
      {stage === 'mcq' && currentMcq && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-label text-xs font-semibold text-on-surface-variant">
              <span>Taste-check {mcqStep + 1} of {totalMcq}</span>
              <span>{moveLabel(currentMcq.move)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((mcqStep + 1) / (totalMcq + 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HatchImage size={40} state="listening" className="mt-1 shrink-0" />
            <p className="font-body text-sm leading-relaxed text-on-surface-variant">
              {currentMcq.scenario}
            </p>
          </div>

          <h2 className="font-headline text-2xl font-bold text-on-background">{currentMcq.q}</h2>

          <div className="flex flex-col gap-3">
            {currentMcq.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(currentMcq.move, option.id)}
                className="group flex items-start gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-left transition-all hover:border-primary hover:bg-primary-container/20 active:scale-[0.99]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-label text-sm font-bold text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary">
                  {option.id}
                </span>
                <span className="font-body text-sm leading-relaxed text-on-surface">{option.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Freeform ── */}
      {stage === 'freeform' && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-label text-xs font-semibold text-on-surface-variant">
              <span>Final move</span>
              <span>{moveLabel(PRODUCT_SENSE_FREEFORM.move)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full w-full rounded-full bg-primary transition-all duration-300" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HatchImage size={40} state="listening" className="mt-1 shrink-0" />
            <p className="font-body text-sm leading-relaxed text-on-surface-variant">
              {PRODUCT_SENSE_FREEFORM.scenario}
            </p>
          </div>

          <h2 className="font-headline text-2xl font-bold text-on-background">{PRODUCT_SENSE_FREEFORM.q}</h2>

          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            rows={7}
            maxLength={1200}
            placeholder={PRODUCT_SENSE_FREEFORM.placeholder}
            className="w-full resize-y rounded-xl border border-outline-variant bg-surface-container-low p-4 font-body text-sm leading-relaxed text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary"
          />

          <div className="flex items-center justify-between">
            <span className="font-label text-xs text-on-surface-variant">
              {freeformReady ? 'Ready to grade.' : 'A few sentences is enough. What ships, how you measure, when you roll back.'}
            </span>
            <button
              type="button"
              onClick={submitFreeform}
              disabled={!freeformReady}
              className="rounded-full bg-primary px-8 py-3 font-label text-base font-semibold text-on-primary transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Grade my answer
            </button>
          </div>
        </div>
      )}

      {/* ── Grading ── */}
      {stage === 'grading' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <HatchImage size={72} state="reviewing" />
          <p className="font-headline text-2xl font-bold text-on-background">Hatch is reading your call</p>
          <p className="max-w-sm font-body text-sm leading-relaxed text-on-surface-variant">
            Checking whether you scoped the rollout, named a metric, and left yourself a way out.
          </p>
        </div>
      )}

      {/* ── Result ── */}
      {stage === 'result' && grade && (
        <div className="flex flex-1 flex-col items-center gap-6 text-center">
          <HatchImage size={80} state="celebrating" />
          <p className="font-label text-sm font-semibold uppercase tracking-widest text-tertiary">
            {grade.result.total} out of 9
          </p>
          <h1 className={`font-headline text-4xl font-bold sm:text-5xl ${VERDICT_ACCENT[grade.result.verdict]}`}>
            {grade.result.headline}
          </h1>

          {/* Per-move breakdown */}
          <div className="grid w-full max-w-lg grid-cols-3 gap-3">
            {(['frame', 'optimize', 'win'] as CalibrationMove[]).map((move) => (
              <div
                key={move}
                className="flex flex-col items-center gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-4"
              >
                <span className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {moveLabel(move)}
                </span>
                <span className="font-headline text-2xl font-bold text-on-background">
                  {grade.result.moveScores[move] ?? 0}
                  <span className="text-base font-normal text-on-surface-variant">/3</span>
                </span>
              </div>
            ))}
          </div>

          {/* Strong move */}
          <div className="w-full max-w-lg rounded-xl border border-outline-variant bg-primary-container/30 p-5 text-left">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-primary">
              Your strong move: {grade.result.strongMoveLabel}
            </p>
            <p className="mt-2 font-body text-sm leading-relaxed text-on-surface">
              {grade.freeform.strength}
            </p>
          </div>

          {/* Weak move */}
          <div className="w-full max-w-lg rounded-xl border border-outline-variant bg-secondary-container p-5 text-left">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-on-secondary-container">
              The move that costs you the room: {grade.result.weakMoveLabel}
            </p>
            <p className="mt-2 font-body text-sm leading-relaxed text-on-secondary-container">
              {grade.freeform.gap}
            </p>
          </div>

          {/* Share */}
          <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-full border border-outline bg-surface-container px-6 py-2.5 font-label text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              {copied ? 'Link copied' : 'Copy share link'}
            </button>
            <a
              href={linkedinShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-outline bg-surface-container px-6 py-2.5 font-label text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Share on LinkedIn
            </a>
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-outline bg-surface-container px-6 py-2.5 font-label text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Share on X
            </a>
          </div>

          <Link
            href={`/signup?redirectTo=${encodeURIComponent('/challenges')}`}
            className="mt-2 w-full max-w-lg rounded-full bg-primary px-8 py-3.5 text-center font-label text-base font-semibold text-on-primary transition-transform active:scale-[0.98]"
          >
            Start free, here is your next rep
          </Link>

          <button
            type="button"
            onClick={retake}
            className="font-label text-sm font-semibold text-on-surface-variant underline-offset-4 hover:underline"
          >
            Run it again
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {stage === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <HatchImage size={64} state="idle" />
          <h2 className="font-headline text-2xl font-bold text-on-background">Grading hit a snag</h2>
          <p className="max-w-sm font-body text-sm leading-relaxed text-on-surface-variant">
            The scorer did not come back that time. Your answer is still here. Give it one more try.
          </p>
          <button
            type="button"
            onClick={submitFreeform}
            className="rounded-full bg-primary px-8 py-3 font-label text-base font-semibold text-on-primary transition-transform active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
