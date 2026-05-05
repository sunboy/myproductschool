import { OnboardingStateGate } from '@/components/onboarding/OnboardingStateGate'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body antialiased">
      <OnboardingStateGate />
      {children}
    </div>
  )
}
