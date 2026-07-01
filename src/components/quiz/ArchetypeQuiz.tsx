'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { QUESTIONS } from '@/lib/calibration/questions'
import {
  scoreMove,
  deriveArchetype,
  archetypeSlugFor,
  observationFor,
  type CalibrationMove,
  type CalibrationScores,
} from '@/lib/calibration/deriveArchetype'

type Answers = Partial<Record<CalibrationMove, 'A' | 'B' | 'C' | 'D'>>

const MOVE_LABEL: Record<CalibrationMove, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

function buildScores(answers: Answers): CalibrationScores {
  return {
    frame: scoreMove('frame', answers.frame ?? ''),
    list: scoreMove('list', answers.list ?? ''),
    optimize: scoreMove('optimize', answers.optimize ?? ''),
    win: scoreMove('win', answers.win ?? ''),
  }
}

export function ArchetypeQuiz() {
  const [stage, setStage] = useState<'intro' | 'question' | 'result'>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [copied, setCopied] = useState(false)

  const totalSteps = QUESTIONS.length
  const currentQuestion = QUESTIONS[step]

  const result = useMemo(() => {
    if (stage !== 'result') return null
    const scores = buildScores(answers)
    const archetype = deriveArchetype(scores)
    const slug = archetypeSlugFor(scores)
    const observation = observationFor(archetype.name)
    return { scores, archetype, slug, observation }
  }, [stage, answers])

  function startQuiz() {
    setStage('question')
    setStep(0)
    setAnswers({})
  }

  function selectOption(move: CalibrationMove, optionId: 'A' | 'B' | 'C' | 'D') {
    const next = { ...answers, [move]: optionId }
    setAnswers(next)
    if (step + 1 < totalSteps) {
      setStep(step + 1)
    } else {
      setStage('result')
    }
  }

  function retake() {
    setStage('intro')
    setStep(0)
    setAnswers({})
    setCopied(false)
  }

  const shareUrl = result
    ? `https://www.hackproduct.com/quiz/archetype?a=${result.slug}`
    : ''
  const shareText = result
    ? `I'm ${result.archetype.name} on HackProduct's product-thinking quiz.`
    : ''

  async function handleShare() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can fail on non-secure origins or without permission.
      // The link share buttons below still work either way.
    }
  }

  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col px-4 py-12 sm:px-6 sm:py-16">
      {stage === 'intro' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <HatchGlyph size={72} state="idle" className="text-primary" />
          <p className="font-label text-sm font-semibold uppercase tracking-widest text-tertiary">
            60-second quiz, no signup
          </p>
          <h1 className="font-headline text-4xl font-bold text-on-background sm:text-5xl">
            What kind of product thinker are you?
          </h1>
          <p className="max-w-md font-body text-base leading-relaxed text-on-surface-variant">
            Four short scenarios. Every answer reveals how you frame problems, weigh tradeoffs, and land a
            recommendation. At the end you get your archetype and the blind spot that comes with it.
          </p>
          <button
            type="button"
            onClick={startQuiz}
            className="mt-2 rounded-full bg-primary px-8 py-3 font-label text-base font-semibold text-on-primary transition-transform active:scale-[0.98]"
          >
            Start the quiz
          </button>
        </div>
      )}

      {stage === 'question' && currentQuestion && (
        <div className="flex flex-1 flex-col gap-6">
          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-label text-xs font-semibold text-on-surface-variant">
              <span>Question {step + 1} of {totalSteps}</span>
              <span>{MOVE_LABEL[currentQuestion.move]}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HatchGlyph size={40} state="listening" className="mt-1 shrink-0 text-primary" />
            <p className="font-body text-sm leading-relaxed text-on-surface-variant">
              {currentQuestion.scenario}
            </p>
          </div>

          <h2 className="font-headline text-2xl font-bold text-on-background">
            {currentQuestion.q}
          </h2>

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(currentQuestion.move, option.id)}
                className="group flex items-start gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-left transition-all hover:border-primary hover:bg-primary-container/20 active:scale-[0.99]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-label text-sm font-bold text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary">
                  {option.id}
                </span>
                <span className="font-body text-sm leading-relaxed text-on-surface">
                  {option.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'result' && result && (
        <div className="flex flex-1 flex-col items-center gap-6 text-center">
          <HatchGlyph size={80} state="celebrating" className="text-primary" />
          <p className="font-label text-sm font-semibold uppercase tracking-widest text-tertiary">
            Your archetype
          </p>
          <h1 className="font-headline text-4xl font-bold text-on-background sm:text-5xl">
            {result.archetype.name}
          </h1>
          <p className="max-w-lg font-body text-base leading-relaxed text-on-surface-variant">
            {result.archetype.description}
          </p>

          <div className="w-full max-w-lg rounded-xl border border-outline-variant bg-secondary-container p-5 text-left">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-on-secondary-container">
              Your blind spot
            </p>
            <p className="mt-2 font-body text-sm leading-relaxed text-on-secondary-container">
              {result.observation}
            </p>
          </div>

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
            href={`/signup?archetype=${result.slug}&redirectTo=${encodeURIComponent('/dashboard')}`}
            className="mt-2 w-full max-w-lg rounded-full bg-primary px-8 py-3.5 text-center font-label text-base font-semibold text-on-primary transition-transform active:scale-[0.98]"
          >
            Start free to train your blind spot
          </Link>

          <button
            type="button"
            onClick={retake}
            className="font-label text-sm font-semibold text-on-surface-variant underline-offset-4 hover:underline"
          >
            Retake the quiz
          </button>
        </div>
      )}
    </div>
  )
}
