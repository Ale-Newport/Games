import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized merge-game sounds: a slide, a merge, the goal tile, a hint and the end. */
export const MERGE_SOUNDS = {
  slide: [{ wave: 'noise', freq: 0, duration: 0.04, gain: 0.05, lowpass: 1600 }],
  merge: [{ wave: 'triangle', freq: 520, freqEnd: 780, duration: 0.09, gain: 0.1 }],
  goal: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  over: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
} satisfies Record<string, SoundSpec>;
