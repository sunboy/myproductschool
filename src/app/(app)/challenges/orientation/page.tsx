import { MOCK_ORIENTATION_CHALLENGE } from '@/lib/mock-data'
import { ChallengeWorkspace } from '@/components/challenge/ChallengeWorkspace'

export default function OrientationPage() {
  return (
    <div>
      {/* Welcome banner */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-start gap-3 p-5 bg-primary-fixed rounded-xl border border-primary/20 mb-4">
          <span className="material-symbols-outlined text-primary text-2xl mt-0.5">waving_hand</span>
          <div>
            <h2 className="font-headline font-bold text-on-surface text-lg">Welcome to HackProduct</h2>
            <p className="text-sm text-on-surface-variant mt-1">This is your orientation challenge — a quick 5-minute exercise to establish your baseline. Don&apos;t worry about being perfect. The point is to see how Luma&apos;s feedback works.</p>
          </div>
        </div>
      </div>
      <ChallengeWorkspace
        challenge={MOCK_ORIENTATION_CHALLENGE}
        domainTitle="Product Strategy"
        domainIcon="lightbulb"
      />
    </div>
  )
}
