import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  stopAndDrainAudioSources,
  voiceCloseAction,
} from '../../../src/lib/live-interview/audio-lifecycle'
import { buildLiveInterviewVoiceSettings } from '../../../src/lib/live-interview/voice-settings'

const BASE_INPUT = {
  thinkUrl: 'https://preview.example/api/live-interview/session-1/voice-think',
  authorization: 'Bearer signed-token',
  requestId: 'request-1',
}

test('builds Flux settings with the Deepgram v2 schema and no v1 language field', () => {
  const settings = buildLiveInterviewVoiceSettings({ ...BASE_INPUT, useFlux: true })
  const provider = settings.agent.listen.provider

  assert.equal(provider.model, 'flux-general-en')
  assert.equal(provider.version, 'v2')
  assert.equal('language' in provider, false)
  assert.equal(provider.eot_threshold, 0.7)
  assert.equal(provider.eager_eot_threshold, 0.5)
  assert.equal(provider.eot_timeout_ms, 4000)
  assert.equal(settings.agent.think.endpoint.url, BASE_INPUT.thinkUrl)
  assert.equal(settings.audio.input.sample_rate, 16000)
  assert.equal(settings.audio.output.sample_rate, 16000)
})

test('builds the rollback setting with an explicit Nova v1 provider', () => {
  const settings = buildLiveInterviewVoiceSettings({ ...BASE_INPUT, useFlux: false })
  const provider = settings.agent.listen.provider

  assert.deepEqual(provider, {
    type: 'deepgram',
    model: 'nova-3',
    version: 'v1',
    language: 'en-US',
    smart_format: true,
  })
})

test('drains tracked audio before stop callbacks can report natural completion', () => {
  let naturalCompletions = 0
  const sources = new Set<{ stop: () => void }>()
  const source = {
    stop() {
      if (sources.delete(source) && sources.size === 0) naturalCompletions += 1
    },
  }
  sources.add(source)

  stopAndDrainAudioSources(sources)

  assert.equal(sources.size, 0)
  assert.equal(naturalCompletions, 0)
})

test('falls back after retry exhaustion even when a socket never produced a transcript', () => {
  assert.equal(voiceCloseAction({
    intentionallyClosed: false,
    isCurrentSocket: true,
    reconnectAttempts: 2,
    maxReconnectAttempts: 2,
  }), 'fallback')

  assert.equal(voiceCloseAction({
    intentionallyClosed: false,
    isCurrentSocket: true,
    reconnectAttempts: 1,
    maxReconnectAttempts: 2,
  }), 'reconnect')
})

test('ignores teardown closes and delayed close events from replaced sockets', () => {
  assert.equal(voiceCloseAction({
    intentionallyClosed: true,
    isCurrentSocket: true,
    reconnectAttempts: 0,
    maxReconnectAttempts: 2,
  }), 'ignore')

  assert.equal(voiceCloseAction({
    intentionallyClosed: false,
    isCurrentSocket: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 2,
  }), 'ignore')
})
