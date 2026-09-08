import type { ReactNode } from 'react'

/** Single 700px reading column with an optional right TOC. Used inside ShellV2 (rail forced). */
export function ReaderFrame({ children, toc, testId = 'reader-frame' }: { children: ReactNode; toc?: ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} className="mx-auto flex w-full max-w-[1100px] items-start gap-10 px-6 pb-24 pt-7 lg:px-10">
      <article className="min-w-0 w-full max-w-[700px] font-body text-[15px] leading-[1.6] text-ink-strong">{children}</article>
      {toc}
    </div>
  )
}
