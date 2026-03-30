'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

type Role = 'engineer' | 'em' | 'transitioning' | 'pm' | 'student' | 'career-changer' | 'bootcamp'
type SkillKey = 'metrics' | 'empathy' | 'prioritization' | 'rootCause' | 'strategy'

const ROLES: { id: Role; label: string; icon: string; desc?: string }[] = [
  { id: 'engineer', label: 'Software Engineer', icon: 'code' },
  { id: 'em', label: 'Engineering Manager', icon: 'groups' },
  { id: 'transitioning', label: 'Transitioning to PM', icon: 'trending_up' },
  { id: 'pm', label: 'Already a PM', icon: 'inventory' },
  { id: 'student', icon: 'school', label: 'Student / Recent Grad', desc: 'Studying PM or just graduated' },
  { id: 'career-changer', icon: 'swap_horiz', label: 'Career Changer', desc: 'Non-tech background pivoting to PM' },
  { id: 'bootcamp', icon: 'rocket_launch', label: 'Bootcamp / Self-taught', desc: 'Self-directed learning path' },
]

const ROLE_TO_GOAL: Record<Role, string> = {
  engineer: 'interview',
  em: 'job',
  transitioning: 'interview',
  pm: 'both',
  student: 'interview',
  'career-changer': 'interview',
  bootcamp: 'both',
}

const RECOMMENDATIONS: Record<Role, { title: string; desc: string }> = {
  engineer: { title: 'Metrics & Analytics', desc: 'Your analytical thinking is a superpower. Start with data-driven challenges.' },
  em: { title: 'Product Strategy', desc: 'Your leadership lens is valuable. Start with strategic decision-making.' },
  transitioning: { title: 'Product Strategy for Engineers', desc: 'Bridge your technical depth with product thinking fundamentals.' },
  pm: { title: 'Advanced Challenges', desc: "Let's find your blind spots. Jump into Advanced difficulty." },
  student: { title: 'Product 75 Vocabulary', desc: 'Start with vocabulary and beginner challenges to build your foundation.' },
  'career-changer': { title: 'Go-to-Market', desc: 'Your business instincts are an asset. Start where your experience shines.' },
  bootcamp: { title: 'Orientation Challenge', desc: "Let's build your foundations. Start with the guided orientation." },
}

const COMPETENCIES: { key: SkillKey; label: string; icon: string }[] = [
  { key: 'metrics', label: 'Metrics & KPIs', icon: 'analytics' },
  { key: 'empathy', label: 'User Empathy', icon: 'favorite' },
  { key: 'prioritization', label: 'Prioritization', icon: 'low_priority' },
  { key: 'rootCause', label: 'Root Cause Analysis', icon: 'search_insights' },
  { key: 'strategy', label: 'Product Strategy', icon: 'strategy' },
]

const STEPS = [
  { label: 'Calibration', icon: 'tune' },
  { label: 'Recommendation', icon: 'auto_awesome' },
  { label: 'Assessment', icon: 'bar_chart' },
]

const DEFAULT_RATINGS: Record<SkillKey, number> = {
  metrics: 3,
  empathy: 3,
  prioritization: 3,
  rootCause: 3,
  strategy: 3,
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [skillRatings, setSkillRatings] = useState<Record<SkillKey, number>>(DEFAULT_RATINGS)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleComplete() {
    setLoading(true)

    const ratings = Object.values(skillRatings)
    const avg = ratings.reduce((sum, v) => sum + v, 0) / ratings.length
    const experience_level = avg < 2.5 ? 'beginner' : avg >= 4 ? 'advanced' : 'intermediate'

    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_context: selectedRole ?? 'engineer',
        experience_level,
      }),
    })
    if (!res.ok) {
      // show error or just continue to dashboard anyway
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <aside className="w-56 bg-surface-container-low flex flex-col pt-16 px-6 gap-2 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-2">
          <LumaGlyph size={32} state="idle" className="text-primary" />
          <span className="font-headline text-sm font-semibold text-on-surface">HackProduct</span>
        </div>

        <div className="flex-1" />

        {/* Step nav */}
        <nav className="flex flex-col gap-1 mb-16">
          {STEPS.map((s, i) => {
            const stepNum = i + 1
            const isCompleted = step > stepNum
            const isCurrent = step === stepNum
            const isFuture = step < stepNum

            let itemClass = 'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors '
            if (isCurrent) {
              itemClass += 'bg-primary-container text-on-primary-container font-semibold'
            } else if (isCompleted) {
              itemClass += 'text-primary font-semibold'
            } else {
              itemClass += 'text-on-surface-variant opacity-50'
            }

            const fillValue = isCompleted || isCurrent ? 1 : 0

            return (
              <div key={s.label} className={itemClass}>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: `'FILL' ${fillValue}, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                >
                  {s.icon}
                </span>
                <span>{s.label}</span>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center items-center px-12 py-16">
        <div className="w-full max-w-xl">

          {/* Step 1 — Calibration */}
          {step === 1 && (
            <div>
              <h1 className="font-headline text-2xl text-on-surface mb-2">
                Before we start, tell me where you are.
              </h1>
              <p className="text-on-surface-variant text-base mb-8">
                Luma will personalize your learning path.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(role => {
                  const isSelected = selectedRole === role.id
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={[
                        'flex flex-col items-center gap-1.5 p-5 rounded-2xl border-2 cursor-pointer text-center transition-all',
                        'bg-surface-container hover:bg-surface-container-high',
                        isSelected
                          ? 'border-primary bg-primary-fixed text-on-primary-fixed'
                          : 'border-outline-variant text-on-surface',
                      ].join(' ')}
                    >
                      <span
                        className="material-symbols-outlined text-[28px]"
                        style={{ fontVariationSettings: `'FILL' ${isSelected ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                      >
                        {role.icon}
                      </span>
                      <span className="text-sm font-medium leading-snug">{role.label}</span>
                      {role.desc && (
                        <span className="text-xs text-on-surface-variant leading-snug">{role.desc}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedRole}
                className="bg-primary text-on-primary rounded-full px-8 py-2.5 font-semibold font-label mt-8 hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2 — Recommendation */}
          {step === 2 && (() => {
            const rec = selectedRole ? RECOMMENDATIONS[selectedRole] : RECOMMENDATIONS.engineer
            return (
              <div>
                <h1 className="font-headline text-2xl text-on-surface mb-6">
                  Here&apos;s what Luma recommends.
                </h1>

                <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
                  <div className="flex items-center gap-2 mb-3">
                    <LumaGlyph size={24} state="speaking" className="text-primary" />
                    <span className="text-on-surface-variant text-sm">Luma suggests:</span>
                  </div>
                  <p className="font-headline text-xl font-semibold text-primary mb-3">
                    {rec.title}
                  </p>
                  <p className="text-on-surface-variant text-sm mb-4">
                    {rec.desc}
                  </p>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setStep(3)}
                    className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold hover:opacity-90 transition-opacity"
                  >
                    Sounds right →
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-surface-container-high text-on-surface rounded-full px-6 py-2.5 font-label hover:opacity-80 transition-opacity"
                  >
                    Let me choose myself
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Step 3 — Assessment */}
          {step === 3 && (
            <div>
              <h1 className="font-headline text-2xl text-on-surface mb-2">
                Rate your current confidence.
              </h1>
              <p className="text-on-surface-variant text-base mb-6">
                Be honest — Luma uses this to calibrate challenge difficulty.
              </p>

              <div className="divide-y divide-outline-variant">
                {COMPETENCIES.map(comp => (
                  <div key={comp.key} className="flex items-center justify-between py-3">
                    {/* Left: icon + label */}
                    <div className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-primary text-[20px]"
                        style={{ fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                      >
                        {comp.icon}
                      </span>
                      <span className="text-on-surface text-sm font-medium">{comp.label}</span>
                    </div>

                    {/* Right: 5-dot rating */}
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(dot => {
                        const isSelected = skillRatings[comp.key] === dot
                        return (
                          <button
                            key={dot}
                            onClick={() => setSkillRatings(prev => ({ ...prev, [comp.key]: dot }))}
                            className={[
                              'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold cursor-pointer transition-all',
                              isSelected
                                ? 'bg-primary border-primary text-on-primary'
                                : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
                            ].join(' ')}
                          >
                            {dot}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleComplete}
                disabled={loading}
                className="bg-primary text-on-primary rounded-full px-8 py-2.5 font-semibold font-label mt-8 w-full hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
