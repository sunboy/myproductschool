import Link from 'next/link'
import { Button, Card, Text } from '@/design'
import { cn } from '@/lib/utils'

/** Featured editorial card. No fixed height: the card is a CSS container, the
 *  title scales with `cqw` and clamps to two lines, the CTA and meta sit in
 *  flow, and the art column drops out under 520px of container width. */
export function EditorialCard({ href, eyebrow, title, sub, meta, ctaLabel = 'Start reading →', className = '', testId }: { href: string; eyebrow: string; title: string; sub?: string; meta?: string; ctaLabel?: string; className?: string; testId?: string }) {
  return (
    <Card tone="forest" padding="none" data-testid={testId} className={cn('min-h-36', className)}>
      <div className="grid h-full grid-cols-1 @[520px]:grid-cols-[minmax(0,1fr)_40%]">
        <div className="flex min-w-0 flex-col gap-1.5 px-5 py-4">
          <Text variant="caption" tone="gold">{eyebrow}</Text>
          <Link href={href} className="line-clamp-2 font-headline text-[clamp(18px,5.2cqw,28px)] font-bold leading-[1.1] text-white hover:underline">{title}</Link>
          {sub && <p className="truncate text-meta font-ui text-white/85">{sub}</p>}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="sm" variant="outline" className="border-transparent"><Link href={href}>{ctaLabel}</Link></Button>
            {meta && <span className="text-meta font-ui text-white/70">{meta}</span>}
          </div>
        </div>
        <div className="relative hidden overflow-hidden bg-forest-900 @[520px]:block" aria-hidden>
          <i className="absolute block" style={{ left: '18%', top: 24, width: 150, height: 150, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
          <i className="absolute block rounded-full" style={{ right: 24, top: 16, width: 110, height: 110, border: '22px solid #2f5f3f' }} />
        </div>
      </div>
    </Card>
  )
}
