import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Planet Shapers sounds: a card, coins, a tile, a parameter step, production, a goal, a hint, the end. */
export const SOUNDS = {
  card: [
    { wave: 'triangle', freq: 440, duration: 0.07, gain: 0.09 },
    { wave: 'triangle', freq: 660, duration: 0.09, delay: 0.07, gain: 0.09 },
  ],
  coins: [
    { wave: 'triangle', freq: 988, duration: 0.05, gain: 0.08 },
    { wave: 'triangle', freq: 1318, duration: 0.08, delay: 0.05, gain: 0.08 },
  ],
  tile: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.07, lowpass: 1400 },
    { wave: 'sine', freq: 330, duration: 0.1, delay: 0.04, gain: 0.08 },
  ],
  raise: [{ wave: 'sine', freq: 392, freqEnd: 784, duration: 0.3, gain: 0.1 }],
  production: [
    { wave: 'square', freq: 262, duration: 0.06, gain: 0.05 },
    { wave: 'square', freq: 330, duration: 0.06, delay: 0.07, gain: 0.05 },
    { wave: 'square', freq: 392, duration: 0.1, delay: 0.14, gain: 0.05 },
  ],
  goal: [
    { wave: 'triangle', freq: 659, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.08, delay: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1175, duration: 0.16, delay: 0.16, gain: 0.12 },
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
