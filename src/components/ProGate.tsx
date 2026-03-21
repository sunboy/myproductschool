'use client'
import Link from 'next/link'

interface ProGateProps {
  children: React.ReactNode
  feature?: string
}

export function ProGate({ children, feature = 'This feature' }: ProGateProps) {
  return (
    <div className="relative">
      <div className="select-none pointer-events-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 max-w-sm text-center shadow-lg border border-outline-variant">
          <span className="material-symbols-outlined text-4xl text-primary mb-3 block">workspace_premium</span>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-2">Pro feature</h3>
          <p className="text-sm text-on-surface-variant mb-4">
            {feature} is available on the Pro plan.
          </p>
          <Link
            href="/pricing"
            className="block w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 transition-opacity text-center text-sm"
          >
            Upgrade to Pro — $12/mo
          </Link>
        </div>
      </div>
    </div>
  )
}
