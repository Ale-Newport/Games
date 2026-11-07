import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Naval Battle sounds: a ship placed, a splash, a hit, a sinking, a hint and the end. */
export const NAVAL_SOUNDS = {
  place: [{ wave: 'triangle', freq: 520, duration: 0.06, gain: 0.08 }],
  splash: [{ wave: 'noise', freq: 0, duration: 0.25, gain: 0.07, lowpass: 900 }],
  hit: [
    { wave: 'noise', freq: 0, duration: 0.18, gain: 0.12, lowpass: 2400 },
    { wave: 'sawtooth', freq: 160, freqEnd: 70, duration: 0.25, gain: 0.08 },
  ],
  sunk: [
    { wave: 'noise', freq: 0, duration: 0.3, gain: 0.14, lowpass: 1600 },
    { wave: 'sawtooth', freq: 140, freqEnd: 40, duration: 0.6, delay: 0.05, gain: 0.1 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  lose: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
} satisfies Record<string, SoundSpec>;
