import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Equation Guess sounds. */
export const SOUNDS = {
  tick: [{ wave: 'square', freq: 520, freqEnd: 620, duration: 0.06, gain: 0.04 }],
  bad: [{ wave: 'square', freq: 200, freqEnd: 150, duration: 0.15, gain: 0.05 }],
  great: [
    { wave: 'triangle', freq: 659, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.1, delay: 0.09, gain: 0.12 },
    { wave: 'triangle', freq: 1319, duration: 0.3, delay: 0.18, gain: 0.14 },
  ],
  poor: [{ wave: 'triangle', freq: 330, freqEnd: 196, duration: 0.45, gain: 0.1 }],
} satisfies Record<string, SoundSpec>;
