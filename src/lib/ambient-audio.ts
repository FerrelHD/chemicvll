/**
 * Procedural Ambient Soundscape Engine using native Web Audio API.
 * Zero external audio assets or dependencies.
 */

export type AmbientMode = 'off' | 'lofi' | 'brown' | 'rain';

export const AMBIENT_MODES: readonly AmbientMode[] = ['off', 'lofi', 'brown', 'rain'];

export function isAmbientMode(value: unknown): value is AmbientMode {
  return typeof value === 'string' && (AMBIENT_MODES as readonly string[]).includes(value);
}

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private stopCallbacks: Array<() => void> = [];
  private activeMode: AmbientMode = 'off';

  public getMode(): AmbientMode {
    return this.activeMode;
  }

  public stop(): void {
    this.activeMode = 'off';
    for (const fn of this.stopCallbacks) {
      try {
        fn();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.stopCallbacks = [];
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      } catch {
        // Ignore
      }
    }
  }

  public setMode(mode: AmbientMode): void {
    if (!isAmbientMode(mode) || mode === 'off') {
      this.stop();
      return;
    }
    if (typeof window === 'undefined') {
      this.activeMode = mode;
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      this.activeMode = mode;
      return;
    }

    this.stop();
    this.activeMode = mode;

    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.setTargetAtTime(0.18, ctx.currentTime, 0.25);
    master.connect(ctx.destination);
    this.masterGain = master;

    if (mode === 'brown') {
      this.startNoise(ctx, master, 'brown', 320);
    } else if (mode === 'rain') {
      this.startNoise(ctx, master, 'pink', 1100);
    } else if (mode === 'lofi') {
      this.startLofiPad(ctx, master);
    }
  }

  private startNoise(
    ctx: AudioContext,
    dest: AudioNode,
    kind: 'brown' | 'pink',
    cutoffHz: number
  ): void {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (kind === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.2;
      }
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoffHz;

    source.connect(filter);
    filter.connect(dest);
    source.start();

    this.stopCallbacks.push(() => {
      source.stop();
      source.disconnect();
      filter.disconnect();
    });
  }

  private startLofiPad(ctx: AudioContext, dest: AudioNode): void {
    // Warm Fmaj9 chord frequencies (Hz)
    const freqs = [174.61, 220.0, 261.63, 329.63, 392.0];
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 540;
    filter.connect(dest);

    const oscs: OscillatorNode[] = [];
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.12;

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      oscs.push(osc);
    }

    // Subtle LFO breathing on the lowpass cutoff
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.stopCallbacks.push(() => {
      for (const osc of oscs) {
        osc.stop();
        osc.disconnect();
      }
      lfo.stop();
      lfo.disconnect();
      lfoGain.disconnect();
      filter.disconnect();
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
