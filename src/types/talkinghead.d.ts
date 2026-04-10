declare module '@met4citizen/talkinghead' {
  interface TalkingHeadOptions {
    ttsEndpoint?: string | null
    lipsyncModules?: string[]
    cameraView?: 'full' | 'mid' | 'upper' | 'head'
    cameraDistance?: number
    cameraX?: number
    cameraY?: number
    cameraRotateX?: number
    cameraRotateY?: number
    modelFPS?: number
    lightAmbientColor?: number
    lightAmbientIntensity?: number
    lightDirectColor?: number
    lightDirectIntensity?: number
    lightSpotIntensity?: number
    mixerGainSpeech?: number
    mixerGainBackground?: number
  }

  interface ShowAvatarOptions {
    url: string
    body?: 'F' | 'M'
    lipsyncLang?: string
    ttsLang?: string
    ttsVoice?: string
    avatarMood?: string
  }

  interface StreamStartOptions {
    sampleRate?: number
    gain?: number
    lipsyncLang?: string
    lipsyncType?: 'visemes' | 'blendshapes' | 'words'
    waitForAudioChunks?: boolean
    mood?: string
  }

  interface StreamAudioChunk {
    audio: ArrayBuffer
    words?: string[]
    wtimes?: number[]
    wdurations?: number[]
    visemes?: number[]
    vtimes?: number[]
    vdurations?: number[]
  }

  type Mood = 'neutral' | 'happy' | 'angry' | 'sad' | 'fear' | 'disgust' | 'love' | 'sleep'

  export default class TalkingHead {
    constructor(container: HTMLDivElement, options?: TalkingHeadOptions)
    showAvatar(options: ShowAvatarOptions, onprogress?: (p: number) => void): Promise<void>
    setView(view: 'full' | 'mid' | 'upper' | 'head', opt?: object): void
    setMood(mood: Mood): void
    setLighting(opt: object): void
    streamStart(
      opt?: StreamStartOptions,
      onAudioStart?: (() => void) | null,
      onAudioEnd?: (() => void) | null,
      onSubtitles?: ((text: string) => void) | null,
      onMetrics?: ((metrics: object) => void) | null
    ): void
    streamAudio(chunk: StreamAudioChunk): void
    streamNotifyEnd(): void
    streamInterrupt(): void
    streamStop(): void
    speakAudio(audio: object, opt?: object, onsubtitles?: ((text: string) => void) | null): void
    playGesture(name: string, dur?: number, mirror?: boolean, ms?: number): void
    stopGesture(ms?: number): void
    lookAtCamera(t: number): void
    audioCtx: AudioContext
  }
}
