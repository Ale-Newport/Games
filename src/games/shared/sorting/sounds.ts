import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized tube-sorting sounds: lift, pour, a blocked move, a hint and a win. */
export const SORT_SOUNDS = {
  lift: [{ wave: 'sine', freq: 520, freqEnd: 640, duration: 0.06, gain: 0.06 }],
  pour: [
    { wave: 'noise', freq: 0, duration: 0.12, gain: 0.05, lowpass: 2200 },
    { wave: 'sine', freq: 700, freqEnd: 520, duration: 0.12, gain: 0.05 },
  ],
  blocked: [{ wave: 'square', freq: 140, duration: 0.06, gain: 0.05 }],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
} satisfies Record<string, SoundSpec>;
