export const LIVE_VOICE_SAMPLE_RATE = 16000

export interface LiveInterviewVoiceSettingsInput {
  thinkUrl: string
  authorization: string
  requestId: string
  useFlux: boolean
}

/**
 * Build the Deepgram Voice Agent Settings message in one testable place.
 * Flux uses the v2 listen schema and carries its language in the model name;
 * Nova uses the v1 schema and accepts an explicit language.
 */
export function buildLiveInterviewVoiceSettings(input: LiveInterviewVoiceSettingsInput) {
  return {
    type: 'Settings' as const,
    tags: ['hackproduct', 'live_interview'],
    mip_opt_out: true,
    flags: { history: true },
    audio: {
      input: { encoding: 'linear16', sample_rate: LIVE_VOICE_SAMPLE_RATE },
      output: { encoding: 'linear16', sample_rate: LIVE_VOICE_SAMPLE_RATE },
    },
    agent: {
      listen: input.useFlux
        ? {
            provider: {
              type: 'deepgram' as const,
              model: 'flux-general-en',
              version: 'v2' as const,
              eot_threshold: 0.7,
              eager_eot_threshold: 0.5,
              eot_timeout_ms: 4000,
            },
          }
        : {
            provider: {
              type: 'deepgram' as const,
              model: 'nova-3',
              version: 'v1' as const,
              language: 'en-US',
              smart_format: true,
            },
          },
      think: {
        provider: {
          type: 'open_ai' as const,
          model: 'hackproduct-live-interview',
          temperature: 0.7,
        },
        endpoint: {
          url: input.thinkUrl,
          headers: {
            authorization: input.authorization,
            'x-hp-voice-request-id': input.requestId,
          },
        },
        context_length: 'max' as const,
      },
      speak: {
        provider: {
          type: 'deepgram' as const,
          model: 'aura-2-asteria-en',
        },
      },
    },
  }
}
