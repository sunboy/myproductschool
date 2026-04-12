import { LumaGlyph } from '@/components/shell/LumaGlyph'
import Link from 'next/link'

const steps = [
  { label: 'Frame', completed: true },
  { label: 'List', current: true },
  { label: 'Optimize' },
  { label: 'Win' },
]

const dimensions = [
  { name: 'Problem Reframing', score: 4 },
  { name: 'User Segmentation', score: 5 },
  { name: 'Data Reasoning', score: 3 },
  { name: 'Tradeoff Clarity', score: 4 },
  { name: 'Communication', score: 2 },
]

function scoreColor(score: number) {
  if (score >= 4) return '#4a7c59'
  if (score === 3) return '#705c30'
  return '#b83230'
}

export default async function RevealPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes scoreReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title section */}
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          The Feature That Backfired — List Step
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Step 2 of 4 complete
        </p>

        {/* Step progress indicator */}
        <div className="flex items-center gap-3 mt-6">
          {steps.map((step) => {
            if (step.completed) {
              return (
                <span
                  key={step.label}
                  className="bg-primary text-on-primary rounded-full px-4 py-1.5 text-sm font-label font-semibold flex items-center gap-1.5"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 16,
                      fontVariationSettings:
                        "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    check
                  </span>
                  {step.label}
                </span>
              )
            }
            if (step.current) {
              return (
                <span
                  key={step.label}
                  className="bg-primary-fixed text-primary ring-2 ring-primary rounded-full px-4 py-1.5 text-sm font-label font-semibold flex items-center gap-1.5"
                >
                  {step.label}
                </span>
              )
            }
            return (
              <span
                key={step.label}
                className="bg-surface-container text-on-surface-variant rounded-full px-4 py-1.5 text-sm font-label font-semibold flex items-center gap-1.5"
              >
                {step.label}
              </span>
            )
          })}
        </div>

        {/* Score reveal section */}
        <div className="mt-10 space-y-4">
          {dimensions.map((dim, i) => (
            <div
              key={dim.name}
              className="flex items-center gap-4"
              style={{
                animation: 'scoreReveal 0.5s ease-out forwards',
                animationDelay: `${i * 0.15}s`,
                opacity: 0,
              }}
            >
              <span className="w-44 text-sm font-label font-semibold text-on-surface">
                {dim.name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(dim.score / 5) * 100}%`,
                    backgroundColor: scoreColor(dim.score),
                  }}
                />
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: scoreColor(dim.score) }}
              >
                {dim.score}/5
              </span>
            </div>
          ))}
        </div>

        {/* XP reward chip */}
        <div className="mt-6 text-center">
          <span className="bg-tertiary-container text-on-tertiary-container rounded-full px-4 py-2 inline-flex items-center gap-2">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                fontVariationSettings:
                  "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              star
            </span>
            <span className="font-bold">+20 XP</span>
          </span>
        </div>

        {/* Coaching Feedback — Aggregate Fallacy */}
        <div className="mt-8 bg-surface-container rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 20 }}>warning_amber</span>
            <span className="font-label text-sm font-semibold text-on-surface">Aggregate Fallacy</span>
          </div>
          <p className="font-body text-sm text-on-surface-variant">
            Your response failed to segment user groups, masking that power users&apos; behavior remained stable while new users churned.
          </p>
          <p className="mt-2 text-xs font-label font-semibold text-primary">
            Segment by behavior before concluding.
          </p>
        </div>

        {/* Composition Effect card */}
        <div className="mt-4 bg-primary-fixed rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="material-symbols-outlined text-primary"
              style={{
                fontSize: 18,
                fontVariationSettings:
                  "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              lightbulb
            </span>
            <span className="font-label text-sm font-semibold text-on-surface">
              Composition Effect
            </span>
          </div>
          <p className="font-body text-sm text-on-surface-variant">
            Aggregate metrics can obscure true performance when user composition shifts.
            Start by asking which segment drives the metric change.
          </p>
          <p className="mt-3 text-xs text-primary font-label font-semibold">
            Added to your Thinking Journal →
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex items-center gap-4">
          <Link
            href={`/workspace/challenges/${id}`}
            className="bg-primary text-on-primary rounded-full px-6 py-3 font-label font-bold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            Next: Optimize
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                fontVariationSettings:
                  "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              arrow_forward
            </span>
          </Link>
          <Link
            href={`/challenges/${id}/feedback`}
            className="text-primary font-label font-semibold hover:opacity-80 transition-opacity"
          >
            See full feedback
          </Link>
        </div>
      </div>
    </div>
  )
}
