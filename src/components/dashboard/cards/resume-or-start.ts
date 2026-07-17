// The single dominant dashboard action. One shape, one challenge URL.
// `kind` is resolved server-side by precedence (resume an in-progress rep >
// first rep for a brand-new user > next recommended rep), so the user never
// has to choose between competing CTAs. The resume destination is
// byte-identical to the resume-challenge email's ?resume=1 link.
export type ResumeOrStartAction =
  | {
      kind: 'resume'
      href: string
      title: string
      /** 1-based FLOW step the attempt paused on, when known (1..4). */
      step?: number | null
      totalSteps?: number | null
      difficulty?: string | null
    }
  | {
      kind: 'first'
      href: string
      title?: string | null
    }
  | {
      kind: 'next'
      href: string
      title: string
      difficulty?: string | null
      domain?: string | null
      hatchInsight?: string | null
    }
