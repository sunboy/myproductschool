import type { ReactNode } from 'react'

export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background font-body">{children}</div>
}
