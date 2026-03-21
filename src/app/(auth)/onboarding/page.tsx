'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MOCK_DOMAINS } from '@/lib/mock-data'

type Goal = 'interview' | 'job' | 'both'
type Level = 'beginner' | 'intermediate' | 'advanced'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState<Goal | null>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [domain, setDomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleComplete() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: name,
        onboarding_completed_at: new Date().toISOString(),
      })
    }
    router.push('/dashboard')
  }

  const goals: { id: Goal; label: string; desc: string; icon: string }[] = [
    { id: 'interview', label: 'Interview prep', desc: 'Ace the product sense round', icon: 'workspace_premium' },
    { id: 'job', label: 'On-the-job skills', desc: 'Think better as an engineer', icon: 'engineering' },
    { id: 'both', label: 'Both', desc: 'Build lasting product instincts', icon: 'auto_awesome' },
  ]

  const levels: { id: Level; label: string; desc: string; icon: string }[] = [
    { id: 'beginner', label: 'Beginner', desc: 'New to product thinking', icon: 'emoji_nature' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Some PM experience or reading', icon: 'emoji_objects' },
    { id: 'advanced', label: 'Advanced', desc: 'PM experience or deep interest', icon: 'local_fire_department' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-surface-container-high'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-headline text-3xl font-bold text-on-surface">Welcome! What should we call you?</h1>
              <p className="text-on-surface-variant mt-2">And what brings you here?</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
            <div className="space-y-3">
              {goals.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${goal === g.id ? 'border-primary bg-primary-container' : 'border-outline-variant bg-surface-container hover:border-primary/50'}`}
                >
                  <span className={`material-symbols-outlined ${goal === g.id ? 'text-primary' : 'text-on-surface-variant'}`}>{g.icon}</span>
                  <div>
                    <div className={`font-medium ${goal === g.id ? 'text-on-primary-container' : 'text-on-surface'}`}>{g.label}</div>
                    <div className="text-sm text-on-surface-variant">{g.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!name || !goal}
              className="w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-headline text-3xl font-bold text-on-surface">Your experience level?</h1>
              <p className="text-on-surface-variant mt-2">We&apos;ll calibrate your first challenges.</p>
            </div>
            <div className="space-y-3">
              {levels.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${level === l.id ? 'border-primary bg-primary-container' : 'border-outline-variant bg-surface-container hover:border-primary/50'}`}
                >
                  <span className={`material-symbols-outlined ${level === l.id ? 'text-primary' : 'text-on-surface-variant'}`}>{l.icon}</span>
                  <div>
                    <div className={`font-medium ${level === l.id ? 'text-on-primary-container' : 'text-on-surface'}`}>{l.label}</div>
                    <div className="text-sm text-on-surface-variant">{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={!level}
              className="w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-headline text-3xl font-bold text-on-surface">Pick your first domain</h1>
              <p className="text-on-surface-variant mt-2">You can explore all of them later.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {MOCK_DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDomain(d.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${domain === d.id ? 'border-primary bg-primary-container' : 'border-outline-variant bg-surface-container hover:border-primary/50'}`}
                >
                  <span className={`material-symbols-outlined ${domain === d.id ? 'text-primary' : 'text-on-surface-variant'}`}>{d.icon}</span>
                  <div>
                    <div className={`font-medium ${domain === d.id ? 'text-on-primary-container' : 'text-on-surface'}`}>{d.title}</div>
                    <div className="text-sm text-on-surface-variant">{d.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleComplete}
              disabled={!domain || loading}
              className="w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Setting up...' : 'Start practicing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
