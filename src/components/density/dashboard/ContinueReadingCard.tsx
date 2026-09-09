import Link from 'next/link'
import { Button, Card, Text } from '@/design'
export function ContinueReadingCard({ title, sub, href }: { title: string; sub: string; href: string }) {
  return (
    <Card tone="forest" padding="none" data-testid="continue-reading" className="h-full justify-center bg-forest-900 px-4 py-3.5">
      <i className="absolute block" style={{ right: -20, top: 20, width: 120, height: 120, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-full" style={{ right: 60, bottom: -30, width: 90, height: 90, border: '16px solid #2f5f3f' }} aria-hidden />
      <Text variant="caption" tone="gold" className="relative">Continue · reading</Text>
      <Link href={href} className="relative mt-1.5 line-clamp-2 max-w-[70%] font-headline text-[clamp(15px,4cqw,18px)] font-bold leading-[1.15] text-white hover:underline">{title}</Link>
      <div className="relative mt-1 truncate text-meta font-ui text-white/85">{sub}</div>
      <div className="relative mt-2.5"><Button asChild size="sm" variant="outline" className="border-transparent"><Link href={href}>Keep reading</Link></Button></div>
    </Card>
  )
}
