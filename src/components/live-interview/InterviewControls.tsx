'use client'

interface InterviewControlsProps {
  isMuted: boolean
  isVoiceActive: boolean
  isChatOpen: boolean
  onToggleMute: () => void
  onToggleVoice: () => void
  onToggleChat: () => void
  onEndInterview: () => void
}

export default function InterviewControls({
  isMuted,
  isVoiceActive,
  isChatOpen,
  onToggleMute,
  onToggleVoice,
  onToggleChat,
  onEndInterview,
}: InterviewControlsProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-surface-container rounded-full border border-outline-variant shadow-sm">
      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
          isMuted
            ? 'bg-error/10 text-error hover:bg-error/20'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
        }`}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        <span className="material-symbols-outlined text-[22px]">
          {isMuted ? 'mic_off' : 'mic'}
        </span>
      </button>

      {/* Chat toggle */}
      <button
        onClick={onToggleChat}
        className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
          isChatOpen
            ? 'bg-primary/10 text-primary hover:bg-primary/20'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
        }`}
        aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
      >
        <span className="material-symbols-outlined text-[22px]">chat</span>
      </button>

      <div className="w-px h-6 bg-outline-variant" />

      {/* Voice active toggle */}
      <button
        onClick={onToggleVoice}
        className={`h-11 rounded-full flex items-center gap-2 px-4 transition-colors font-label text-sm font-semibold ${
          isVoiceActive
            ? 'bg-primary/10 text-primary hover:bg-primary/20'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
        }`}
        aria-label={isVoiceActive ? 'Disable voice' : 'Enable voice'}
      >
        {isVoiceActive ? (
          <div className="flex items-end gap-0.5 h-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 rounded-sm bg-primary animate-pulse"
                style={{
                  height: 8,
                  animation: `voice-bar 0.8s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
            <style>{`@keyframes voice-bar { 0%,100% { height: 8px } 50% { height: 16px } }`}</style>
          </div>
        ) : (
          <span className="material-symbols-outlined text-[18px]">volume_off</span>
        )}
        <span>{isVoiceActive ? 'Voice Active' : 'Voice Off'}</span>
      </button>

      {/* End call */}
      <button
        onClick={onEndInterview}
        className="h-11 w-11 rounded-full flex items-center justify-center bg-error/10 hover:bg-error/20 text-error transition-colors"
        aria-label="End interview"
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={{ transform: 'rotate(135deg)' }}
        >
          call
        </span>
      </button>
    </div>
  )
}
