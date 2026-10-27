import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Soft pencil-and-paper sounds for the sudoku family. */
export const SUDOKU_SOUNDS = {
  place: [
    { wave: 'triangle', freq: 660, freqEnd: 620, duration: 0.05, gain: 0.08 },
    { wave: 'noise', freq: 0, duration: 0.03, gain: 0.05, lowpass: 3000 },
  ],
  note: [{ wave: 'noise', freq: 0, duration: 0.025, gain: 0.05, lowpass: 5000 }],
  erase: [{ wave: 'noise', freq: 0, duration: 0.08, gain: 0.06, lowpass: 1800 }],
  wrong: [
    { wave: 'square', freq: 196, duration: 0.08, gain: 0.06 },
    { wave: 'square', freq: 165, duration: 0.1, delay: 0.08, gain: 0.06 },
  ],
  unit: [
    { wave: 'triangle', freq: 784, duration: 0.08, gain: 0.08 },
    { wave: 'triangle', freq: 1047, duration: 0.14, delay: 0.07, gain: 0.08 },
  ],
  solved: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.45, delay: 0.3, gain: 0.2 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  invalid: [{ wave: 'square', freq: 140, duration: 0.09, gain: 0.08 }],
} satisfies Record<string, SoundSpec>;
