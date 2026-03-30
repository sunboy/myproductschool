'use client'

import Link from 'next/link'
import { useState } from 'react'

const ROLES = [
  {
    id: 'software-engineer',
    icon: 'computer',
    title: 'Software Engineer',
    description: 'Ship clean code but keep getting passed over for Staff',
  },
  {
    id: 'data-engineer',
    icon: 'database',
    title: 'Data Engineer',
    description: 'Build reliable pipelines but feel invisible to product decisions',
  },
  {
    id: 'ml-engineer',
    icon: 'psychology',
    title: 'ML Engineer',
    description: 'Improve model accuracy but struggle to translate it to business impact',
  },
  {
    id: 'devops-sre',
    icon: 'settings',
    title: 'DevOps / SRE',
    description: 'Keep systems running but rarely get credit for product value',
  },
  {
    id: 'eng-manager',
    icon: 'people',
    title: 'Eng Manager',
    description: 'Manage delivery but want to shape direction, not just execute',
  },
  {
    id: 'founding-engineer',
    icon: 'rocket_launch',
    title: 'Founding Engineer',
    description: 'You ARE the product team — need to think like a CPO',
  },
]

const STEPS = [
  { num: 1, label: 'Role' },
  { num: 2, label: 'Assessment' },
  { num: 3, label: 'Results' },
]

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-label font-bold ${
                  step.num === 1
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                {step.num}
              </div>
              <span
                className={`text-sm font-label ${
                  step.num === 1 ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-12 h-px bg-outline-variant mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Help link */}
      <div className="flex justify-end mb-4">
        <Link href="mailto:hello@hackproduct.io" className="text-sm text-primary font-label font-semibold hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-base">help</span>
          Help
        </Link>
      </div>

      {/* Heading */}
      <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">
        What&apos;s your role?
      </h1>
      <p className="text-on-surface-variant font-body mb-8">
        We&apos;ll personalize your calibration challenge and learning path for your specific engineering role.
      </p>

      {/* Role grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`text-left p-5 rounded-xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary-container shadow-sm'
                  : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-primary text-on-primary' : 'bg-primary-fixed text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined">{role.icon}</span>
                </div>
                <div>
                  <h3 className={`font-label font-bold text-sm ${isSelected ? 'text-on-primary-container' : 'text-on-surface'}`}>
                    {role.title}
                  </h3>
                  <p className={`text-sm mt-0.5 ${isSelected ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-outline-variant pt-6">
        <Link
          href="/onboarding/welcome"
          className="text-sm text-on-surface-variant font-label font-semibold hover:text-on-surface transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </Link>
        <Link
          href="/onboarding/calibration/frame"
          className="text-sm text-primary font-label font-semibold hover:underline"
        >
          Skip assessment
        </Link>
        <Link
          href={selectedRole ? '/onboarding/calibration/frame' : '#'}
          className={`inline-flex items-center gap-1 rounded-full px-6 py-2.5 font-label font-semibold text-sm transition-colors ${
            selectedRole
              ? 'bg-primary text-on-primary hover:bg-primary/90'
              : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
          }`}
          aria-disabled={!selectedRole}
        >
          Next
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
