import { LumaGlyph } from '@/components/shell/LumaGlyph'

export default function ShareScoreCardPage() {
  return (
    <div className="bg-[#2e3230]/80 min-h-screen flex items-center justify-center font-body text-on-surface p-4">
      {/* Top Right Close */}
      <button className="fixed top-6 right-8 text-white flex items-center gap-2 font-medium hover:opacity-80 transition-opacity z-10">
        <span className="material-symbols-outlined text-lg">close</span>
        <span>Close</span>
      </button>

      <div className="flex flex-col items-center gap-8 w-full max-w-[420px]">
        {/* Score Card */}
        <div className="w-[360px] bg-surface rounded-2xl border border-primary/20 shadow-2xl overflow-hidden flex flex-col items-center p-6 relative">
          {/* Card Header */}
          <div className="flex justify-between items-center w-full mb-6">
            <div className="flex items-center gap-2">
              <LumaGlyph size={32} className="text-primary" />
              <span className="font-headline font-bold text-primary text-lg">HackProduct</span>
            </div>
          </div>

          {/* Score Display */}
          <div className="text-center mb-2">
            <span className="font-headline text-[64px] font-bold text-primary leading-none">84</span>
            <span className="font-headline text-2xl text-primary/60">/100</span>
          </div>

          <div className="text-center mb-4">
            <p className="font-semibold text-on-surface text-base px-4">The Feature That Backfired</p>
            <div className="mt-2 inline-flex items-center gap-1 bg-tertiary-container/30 text-tertiary px-3 py-1 rounded-full text-xs font-bold">
              <span>Optimize</span>
              <span
                className="material-symbols-outlined text-[10px]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                diamond
              </span>
            </div>
          </div>

          {/* Mini Radar Chart Mockup */}
          <div className="relative w-[120px] h-[120px] mb-6 flex items-center justify-center">
            <div
              className="absolute inset-0 border border-outline-variant opacity-20"
              style={{ clipPath: 'polygon(50% 10%, 90% 40%, 75% 90%, 25% 90%, 10% 40%)' }}
            />
            <div
              className="absolute inset-2 bg-primary/20 border border-primary/40"
              style={{ clipPath: 'polygon(50% 10%, 90% 40%, 75% 90%, 25% 90%, 10% 40%)' }}
            />
            <div className="absolute -top-4 text-[8px] font-bold text-outline">FRAME</div>
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-[8px] font-bold text-outline">WIN</div>
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[8px] font-bold text-outline">LENS</div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium bg-surface-container rounded-lg px-4 py-2 mb-6">
            <span>Time: 4m 12s</span>
            <span className="text-outline-variant">&bull;</span>
            <span>XP: +120</span>
            <span className="text-outline-variant">&bull;</span>
            <span>Level: 3</span>
          </div>

          {/* Footer Logo/URL */}
          <div className="mt-auto border-t border-outline-variant/30 pt-4 w-full text-center">
            <p className="text-[10px] tracking-widest uppercase font-bold text-outline-variant">hackproduct.com</p>
          </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center w-full gap-6">
          {/* Luma Bubble */}
          <div className="flex items-start gap-4 max-w-[380px]">
            <LumaGlyph size={64} className="text-primary flex-shrink-0" />
            <div className="bg-surface-container rounded-xl p-4 text-sm text-on-surface relative mt-2 border border-outline-variant/20 shadow-sm">
              <div className="absolute -left-2 top-4 w-4 h-4 bg-surface-container border-l border-t border-outline-variant/20 rotate-[-45deg]" />
              <p className="relative z-10">Share your score and challenge your network. Who else can crack this one?</p>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <button className="bg-[#0A66C2] text-white w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all">
              Share to LinkedIn <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
            <button className="bg-on-surface text-white w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all">
              Share to Twitter/X <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
            <button className="border-2 border-primary text-primary w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-base">content_copy</span>
              Copy image
            </button>
          </div>

          {/* Caption Preview */}
          <div className="w-full bg-on-surface/10 rounded-lg p-3 border border-white/10">
            <p className="text-[11px] text-white/70 leading-relaxed italic">
              Pre-filled caption: &ldquo;I just scored 84/100 on The Feature That Backfired (Optimize move) on HackProduct&rdquo;
            </p>
          </div>

          {/* Context Strip */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#2e3230] bg-surface-container-high flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-xs text-white/80">3 friends from your network have also attempted this challenge</p>
              <a className="text-xs text-primary-fixed font-bold hover:underline mt-1 inline-block" href="#">See how you compare &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
