import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized domino sounds: a tile set down, a draw, a pass, points, a hand won, a hint, the end. */
export const BONES_SOUNDS = {
  play: [
    { wave: 'noise', freq: 0, duration: 0.04, gain: 0.1, lowpass: 1800 },
    { wave: 'triangle', freq: 220, duration: 0.05, gain: 0.08 },
  ],
  draw: [{ wave: 'noise', freq: 0, duration: 0.08, gain: 0.06, lowpass: 3000 }],
  pass: [{ wave: 'sine', freq: 330, duration: 0.07, gain: 0.07 }],
  score: [
    { wave: 'triangle', freq: 660, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 990, duration: 0.14, delay: 0.07, gain: 0.12 },
  ],
  hand: [
    { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.14 },
    { wave: 'triangle', freq: 784, duration: 0.18, delay: 0.09, gain: 0.14 },
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
