import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized cube sounds: a turn click, a hint and a win. */
export const CUBE_SOUNDS = {
  turn: [
    { wave: 'noise', freq: 0, duration: 0.06, gain: 0.07, lowpass: 2600 },
    { wave: 'square', freq: 260, freqEnd: 220, duration: 0.04, gain: 0.03 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
} satisfies Record<string, SoundSpec>;
