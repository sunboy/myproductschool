'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const ROLES = [
  {
    id: 'swe',
    icon: 'code',
    badge: 'SWE',
    title: 'Software Engineer',
    description: 'Ship clean code but keep getting passed over for Staff',
  },
  {
    id: 'data',
    icon: 'database',
    badge: 'Data',
    title: 'Data Engineer',
    description: 'Build reliable pipelines but feel invisible to product decisions',
  },
  {
    id: 'ml',
    icon: 'psychology',
    badge: 'ML',
    title: 'ML Engineer',
    description: 'Improve model accuracy but struggle to translate it to business impact',
  },
  {
    id: 'devops',
    icon: 'settings_input_component',
    badge: 'DevOps',
    title: 'DevOps / SRE',
    description: 'Keep systems running but rarely get credit for product value',
  },
  {
    id: 'em',
    icon: 'groups',
    badge: 'EM',
    title: 'Eng Manager',
    description: 'Manage delivery but want to shape direction, not just execute',
  },
  {
    id: 'founding',
    icon: 'rocket_launch',
    badge: 'Founding',
    title: 'Founding Engineer',
    description: 'You ARE the product team - need to think like a CPO',
  },
]

const STEPS = [
  { num: 1, label: 'Role' },
  { num: 2, label: 'Assessment' },
  { num: 3, label: 'Results' },
]

export default function RoleSelectionPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleNext = async () => {
    if (!selectedRole) return
    setIsLoading(true)
    try {
      await fetch('/api/onboarding/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
    } catch {
      // Non-fatal — proceed regardless
    } finally {
      setIsLoading(false)
      router.push('/onboarding/calibration/frame')
    }
  }

  return (
    <>
      {/* Top App Bar */}
      <header className="bg-background border-b border-outline-variant fixed top-0 w-full z-50 h-12 flex items-center">
        <div className="flex justify-between items-center px-4 w-full max-w-7xl mx-auto">
          <Link href="/welcome" className="flex items-center gap-2 text-primary font-headline font-bold text-xl">
            <LumaGlyph size={32} state="idle" className="text-primary" />
            <span className="tracking-tight">HackProduct</span>
          </Link>
          <div className="flex items-center gap-4 text-secondary">
            <span className="material-symbols-outlined cursor-pointer hover:bg-surface-container p-1 rounded-full transition-colors">
              help
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-20 pb-24 px-6 md:px-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-12">

          {/* Progress Indicator */}
          <nav className="flex items-center justify-center w-full max-w-2xl mx-auto">
            <div className="flex items-center w-full relative">
              {STEPS.map((step, i) => (
                <div key={step.num} className="contents">
                  <div className="flex flex-col items-center z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${
                        step.num === 1
                          ? 'bg-primary text-on-primary'
                          : 'border-2 border-outline-variant bg-background text-secondary font-semibold'
                      }`}
                    >
                      {step.num}
                    </div>
                    <span
                      className={`mt-2 text-sm font-label ${
                        step.num === 1
                          ? 'font-bold text-primary'
                          : 'font-semibold text-secondary'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-grow h-[2px] bg-outline-variant -mt-6" />
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Header Section */}
          <section className="flex flex-col md:flex-row items-start gap-6 max-w-3xl">
            <div className="shrink-0">
              <LumaGlyph size={96} className="text-primary" state="idle" />
            </div>
            <div className="space-y-2">
              <h1 className="font-headline text-3xl font-bold text-primary">
                What&apos;s your role?
              </h1>
              <p className="font-body text-lg text-on-surface-variant leading-relaxed">
                We&apos;ll personalize your calibration challenge and learning path for your specific engineering role.
              </p>
            </div>
          </section>

          {/* Role Selection Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`group text-left bg-surface-container border rounded-xl p-6 transition-all hover:bg-primary-fixed hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    isSelected
                      ? 'bg-primary-fixed border-primary shadow-md'
                      : 'border-outline-variant'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      {role.icon}
                    </span>
                    <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {role.badge}
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface mb-2">
                    {role.title}
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant leading-tight group-hover:text-on-surface-variant">
                    {role.description}
                  </p>
                </button>
              )
            })}
          </section>

        </div>
      </main>

      {/* Bottom Nav Bar */}
      <footer className="bg-background fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 border-t border-outline-variant">
        <Link
          href="/welcome"
          className="flex items-center gap-2 text-primary font-label text-sm font-semibold underline transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </Link>
        <div className="flex items-center gap-4">
          {selectedRole && (
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-bold text-sm flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-70"
            >
              {isLoading ? 'Saving...' : 'Next'}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
          <button
            disabled
            className="flex items-center gap-2 text-secondary font-label text-sm font-semibold opacity-50 cursor-not-allowed"
          >
            Skip assessment
            <span className="material-symbols-outlined">skip_next</span>
          </button>
        </div>
      </footer>
    </>
  )
}
