import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Iron Fields sounds: a move, coins, building, a fight, a star, a hint, the end. */
export const SOUNDS = {
  move: [{ wave: 'square', freq: 196, freqEnd: 262, duration: 0.14, gain: 0.06 }],
  coins: [
    { wave: 'triangle', freq: 988, duration: 0.05, gain: 0.08 },
    { wave: 'triangle', freq: 1318, duration: 0.08, delay: 0.05, gain: 0.08 },
  ],
  build: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 900 },
    { wave: 'square', freq: 147, duration: 0.08, delay: 0.06, gain: 0.07 },
  ],
  battle: [
    { wave: 'noise', freq: 0, duration: 0.12, gain: 0.1, lowpass: 1800 },
    { wave: 'square', freq: 110, duration: 0.2, delay: 0.08, gain: 0.08 },
  ],
  star: [
    { wave: 'triangle', freq: 784, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1047, duration: 0.08, delay: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1319, duration: 0.18, delay: 0.16, gain: 0.12 },
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
