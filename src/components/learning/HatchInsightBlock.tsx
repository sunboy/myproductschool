import { HatchImage } from '@/components/redesign/HatchImage'

interface HatchInsightBlockProps {
  insight: string
}

export function HatchInsightBlock({ insight }: HatchInsightBlockProps) {
  return (
    <div className="bg-primary-fixed rounded-2xl p-6 flex gap-4 my-6">
      <HatchImage size={24} state="idle" className="shrink-0 mt-1" />
      <div>
        <p className="text-xs font-semibold font-label text-on-primary-fixed uppercase tracking-widest mb-1">Hatch&rsquo;s Take</p>
        <p className="text-on-primary-fixed font-body text-sm leading-relaxed italic">{insight}</p>
      </div>
    </div>
  )
}
