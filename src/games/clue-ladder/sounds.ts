import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Clue Ladder sounds. */
export const SOUNDS = {
  tick: [{ wave: 'square', freq: 620, freqEnd: 700, duration: 0.05, gain: 0.04 }],
  climb: [
    { wave: 'triangle', freq: 392, duration: 0.07, gain: 0.08 },
    { wave: 'triangle', freq: 494, duration: 0.07, delay: 0.06, gain: 0.08 },
    { wave: 'triangle', freq: 587, duration: 0.12, delay: 0.12, gain: 0.09 },
  ],
  great: [
    { wave: 'triangle', freq: 659, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.1, delay: 0.09, gain: 0.12 },
    { wave: 'triangle', freq: 1319, duration: 0.3, delay: 0.18, gain: 0.14 },
  ],
  good: [
    { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.1 },
    { wave: 'triangle', freq: 659, duration: 0.22, delay: 0.09, gain: 0.1 },
  ],
  poor: [{ wave: 'triangle', freq: 392, freqEnd: 247, duration: 0.4, gain: 0.1 }],
} satisfies Record<string, SoundSpec>;
