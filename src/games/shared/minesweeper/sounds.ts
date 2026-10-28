import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized minesweeper sounds: a click, a flag, a boom and a win. */
export const MINES_SOUNDS = {
  open: [{ wave: 'triangle', freq: 520, freqEnd: 480, duration: 0.04, gain: 0.07 }],
  cascade: [
    { wave: 'triangle', freq: 520, duration: 0.04, gain: 0.06 },
    { wave: 'triangle', freq: 660, duration: 0.05, delay: 0.04, gain: 0.06 },
  ],
  flag: [{ wave: 'square', freq: 880, freqEnd: 990, duration: 0.05, gain: 0.05 }],
  boom: [
    { wave: 'noise', freq: 0, duration: 0.5, gain: 0.3, lowpass: 900 },
    { wave: 'sine', freq: 90, freqEnd: 40, duration: 0.45, gain: 0.3 },
  ],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;
