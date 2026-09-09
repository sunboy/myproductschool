import type { ReactNode } from 'react'

/** Single reading column (720px) with an optional right TOC. Used inside ShellV2 (rail forced). */
export function ReaderFrame({ children, toc, testId = 'reader-frame' }: { children: ReactNode; toc?: ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} className="mx-auto flex w-full max-w-[1100px] items-start gap-10 px-6 pb-24 pt-7 lg:px-10">
      <article className="w-full min-w-0 max-w-reader font-body text-body font-text leading-[1.65] text-ink-strong">{children}</article>
      {toc}
    </div>
  )
}
