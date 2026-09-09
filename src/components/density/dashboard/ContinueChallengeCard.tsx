import Link from 'next/link'
import { Play } from 'lucide-react'
import { Button, Card, Text } from '@/design'
export function ContinueChallengeCard({ title, meta, href }: { title: string; meta: string; href: string }) {
  return (
    <Card tone="forest" padding="none" data-testid="continue-challenge" className="h-full justify-center px-4 py-3.5">
      <i className="absolute block rounded-full" style={{ right: -30, top: -40, width: 140, height: 140, background: '#d9a441', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-[10px]" style={{ right: 20, top: 50, width: 100, height: 66, background: '#9db8a0', transform: 'rotate(-15deg)' }} aria-hidden />
      <Text variant="caption" tone="gold" className="relative">Continue · challenge</Text>
      <Link href={href} className="relative mt-1.5 line-clamp-2 max-w-[78%] font-headline text-[clamp(15px,4cqw,18px)] font-bold leading-[1.15] text-white hover:underline">{title}</Link>
      <div className="relative mt-1 text-meta font-ui text-white/85">{meta}</div>
      <div className="relative mt-2.5"><Button asChild size="sm" variant="outline" className="border-transparent"><Link href={href} data-hatch-target="dashboard-session"><Play aria-hidden />Resume</Link></Button></div>
    </Card>
  )
}
