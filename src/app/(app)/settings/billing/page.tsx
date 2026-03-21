import Link from 'next/link'

export default function BillingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-headline text-3xl font-bold text-on-surface">Billing</h1>

      <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">workspace_premium</span>
          <div>
            <div className="font-medium text-on-surface">Current plan</div>
            <div className="text-sm text-on-surface-variant">Free tier</div>
          </div>
        </div>
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">workspace_premium</span>
          Upgrade to Pro
        </Link>
      </div>
    </div>
  )
}
