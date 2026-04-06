// AudioWorklet processor for mic capture — runs on audio thread, no main-thread jank.
// Converts float32 input to int16 PCM and posts to main thread via port.
class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0] || input[0].length === 0) return true

    const float32 = input[0]
    const int16 = new Int16Array(float32.length)
    for (let i = 0; i < float32.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32[i]))
      int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
    }
    this.port.postMessage(int16.buffer, [int16.buffer])
    return true
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor)
