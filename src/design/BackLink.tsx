import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The one back affordance. Rendered by the top bar via ReaderChromeContext;
 *  pages declare it with useReaderChrome({ left: <BackLink … /> }). */
export function BackLink({ href, label, className, testId = 'back-link', onClick }: { href: string; label: string; className?: string; testId?: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-testid={testId}
      data-slot="back-link"
      className={cn('inline-flex h-control-md shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control border border-hairline bg-card-bright pl-2.5 pr-3 font-ui text-ui text-ink-strong hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40', className)}
    >
      <ArrowLeft size={16} aria-hidden />
      {label}
    </Link>
  )
}
