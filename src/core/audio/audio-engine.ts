/**
 * Procedural sound effects through the Web Audio API. All platform sounds are synthesized at
 * runtime from these specs, so no third-party audio files are needed (see docs/asset-licenses.md).
 */

export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';

export interface ToneSpec {
  wave: Waveform;
  /** Start frequency in Hz (ignored for noise unless filtered). */
  freq: number;
  /** Optional end frequency for pitch sweeps. */
  freqEnd?: number;
  /** Seconds after the sound starts. */
  delay?: number;
  duration: number;
  attack?: number;
  release?: number;
  /** Peak gain 0..1 before master volume. */
  gain?: number;
  /** Low-pass cutoff in Hz, useful for noise. */
  lowpass?: number;
}

export type SoundSpec = readonly ToneSpec[];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private enabled = true;
  private volume = 0.7;

  configure(enabled: boolean, volume: number): void {
    this.enabled = enabled;
    this.volume = volume;
    if (this.master) this.master.gain.value = volume;
  }

  get isEnabled(): boolean {
    return this.enabled && this.volume > 0;
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      let seed = 22222;
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        data[i] = (seed / 0x7fffffff) * 2 - 1;
      }
    }
    return this.noise;
  }

  play(sound: SoundSpec): void {
    if (!this.isEnabled || sound.length === 0) return;
    const ctx = this.context();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + 0.005;
    for (const tone of sound) {
      const t0 = start + (tone.delay ?? 0);
      const attack = tone.attack ?? 0.005;
      const release = tone.release ?? Math.max(0.02, tone.duration * 0.6);
      const peak = tone.gain ?? 0.3;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(peak, t0 + attack);
      env.gain.setValueAtTime(peak, t0 + Math.max(attack, tone.duration - release));
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.duration);
      let node: AudioNode;
      let source: AudioScheduledSourceNode;
      if (tone.wave === 'noise') {
        const buffer = ctx.createBufferSource();
        buffer.buffer = this.noiseBuffer(ctx);
        buffer.loop = true;
        source = buffer;
        node = buffer;
      } else {
        const osc = ctx.createOscillator();
        osc.type = tone.wave;
        osc.frequency.setValueAtTime(tone.freq, t0);
        if (tone.freqEnd !== undefined)
          osc.frequency.exponentialRampToValueAtTime(Math.max(1, tone.freqEnd), t0 + tone.duration);
        source = osc;
        node = osc;
      }
      if (tone.lowpass !== undefined) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = tone.lowpass;
        node.connect(filter);
        node = filter;
      }
      node.connect(env);
      env.connect(this.master);
      source.start(t0);
      source.stop(t0 + tone.duration + 0.05);
    }
  }
}

/** Shared UI sounds used by the platform shell and available to every game. */
export const UI_SOUNDS = {
  click: [{ wave: 'triangle', freq: 660, freqEnd: 520, duration: 0.06, gain: 0.15 }],
  achievement: [
    { wave: 'triangle', freq: 784, duration: 0.12, gain: 0.25 },
    { wave: 'triangle', freq: 988, duration: 0.12, delay: 0.1, gain: 0.25 },
    { wave: 'triangle', freq: 1319, duration: 0.3, delay: 0.2, gain: 0.25 },
  ],
} satisfies Record<string, SoundSpec>;
