import { Text } from '@/design'
export function ReaderHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <header className="mb-4">
      <Text variant="caption" tone="primary" className="mb-2">{eyebrow}</Text>
      <Text variant="h1">{title}</Text>
      {lede && <p className="mt-2.5 font-headline text-h4 font-normal leading-[1.4] text-on-surface-variant">{lede}</p>}
    </header>
  )
}
