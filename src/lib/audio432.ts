// Web Audio API utility for 432Hz harmonic carrier generation and stem playback

let audioCtx: AudioContext | null = null;
let carrierOscillator: OscillatorNode | null = null;
let carrierGain: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function start432HzCarrier(frequency = 432, volume = 0.08): boolean {
  try {
    const ctx = getAudioContext();
    if (carrierOscillator) {
      stop432HzCarrier();
    }

    carrierOscillator = ctx.createOscillator();
    carrierGain = ctx.createGain();

    // 432Hz natural frequency
    carrierOscillator.type = 'sine';
    carrierOscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Subtle gentle fade in
    carrierGain.gain.setValueAtTime(0.001, ctx.currentTime);
    carrierGain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.3);

    carrierOscillator.connect(carrierGain);
    carrierGain.connect(ctx.destination);
    carrierOscillator.start();
    return true;
  } catch (err) {
    console.error('Failed to start 432Hz carrier tone:', err);
    return false;
  }
}

export function stop432HzCarrier(): void {
  if (carrierOscillator && carrierGain && audioCtx) {
    try {
      carrierGain.gain.setValueAtTime(carrierGain.gain.value, audioCtx.currentTime);
      carrierGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      setTimeout(() => {
        carrierOscillator?.stop();
        carrierOscillator?.disconnect();
        carrierGain?.disconnect();
        carrierOscillator = null;
        carrierGain = null;
      }, 250);
    } catch {
      carrierOscillator = null;
      carrierGain = null;
    }
  }
}

export function is432HzRunning(): boolean {
  return carrierOscillator !== null;
}

export async function playPcm24kAudio(base64Data: string): Promise<void> {
  const ctx = getAudioContext();
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 16-bit PCM @ 24kHz
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }

  const buffer = ctx.createBuffer(1, float32.length, 24000);
  buffer.copyToChannel(float32, 0);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
