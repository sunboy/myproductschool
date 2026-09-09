import type { ReactNode } from 'react'
import { LearningGeometry } from './LearningGeometry'

export function LearningPageHeading({ eyebrow, title, children, action }: { eyebrow: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return <header className="learning-section-heading">
    <LearningGeometry quiet />
    <div className="learning-section-copy"><span>{eyebrow}</span><h1>{title}</h1>{children && <p>{children}</p>}</div>
    {action && <div className="learning-section-action">{action}</div>}
  </header>
}
