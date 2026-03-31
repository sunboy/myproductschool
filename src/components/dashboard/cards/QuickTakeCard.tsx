import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface QuickTakeCardProps {
  prompt: string
  challengeId: string
  lumaContext?: string | null
}

export function QuickTakeCard({ prompt, challengeId, lumaContext }: QuickTakeCardProps) {
  return (
    <div className="bg-primary rounded-xl p-6 text-on-primary flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <LumaGlyph size={40} state="speaking" className="text-on-primary" />
        <div>
          <h3 className="font-headline font-bold text-lg">Quick Take</h3>
          <p className="text-on-primary/80 text-xs font-label">90 seconds. Grade in 15s.</p>
        </div>
      </div>

      <div className="bg-primary/20 rounded-xl p-4">
        <p className="italic text-on-primary/90 text-sm leading-relaxed">&ldquo;{prompt}&rdquo;</p>
      </div>

      {lumaContext && (
        <p className="text-xs text-on-primary/70 font-label">
          <span className="material-symbols-outlined text-xs align-middle mr-1">auto_awesome</span>
          {lumaContext}
        </p>
      )}

      <Link
        href={`/challenges/${challengeId}?mode=quick`}
        className="self-start bg-on-primary text-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Start Quick Take
      </Link>
    </div>
  )
}
