import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface QuickTakeCardProps {
  prompt: string
  challengeId: string
  lumaContext?: string | null
}

export function QuickTakeCard({ prompt, challengeId, lumaContext }: QuickTakeCardProps) {
  return (
    <div className="bg-primary rounded-2xl p-5 text-on-primary flex flex-col gap-4 relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />

      <div className="flex items-start gap-3 relative">
        <LumaGlyph size={36} state="speaking" className="text-on-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-headline font-bold text-base leading-tight">Quick Take</h3>
          <p className="text-on-primary/70 text-[11px] font-label mt-0.5">90 seconds · instant grade</p>
        </div>
      </div>

      <div className="bg-black/20 rounded-xl p-4 relative">
        <p className="text-on-primary/90 text-sm leading-relaxed">&ldquo;{prompt}&rdquo;</p>
      </div>

      {lumaContext && (
        <p className="text-xs text-on-primary/65 font-label flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0">auto_awesome</span>
          {lumaContext}
        </p>
      )}

      <Link
        href={`/workspace/challenges/${challengeId}?mode=quick`}
        className="self-start bg-white text-primary rounded-full px-5 py-2 font-label font-bold text-sm hover:bg-white/90 active:scale-95 transition-all duration-150 shadow-sm"
      >
        Start Quick Take
      </Link>
    </div>
  )
}
