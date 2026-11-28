import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Fact Match sounds. */
export const SOUNDS = {
  place: [{ wave: 'square', freq: 520, freqEnd: 600, duration: 0.05, gain: 0.04 }],
  great: [
    { wave: 'triangle', freq: 659, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.1, delay: 0.09, gain: 0.12 },
    { wave: 'triangle', freq: 1319, duration: 0.3, delay: 0.18, gain: 0.14 },
  ],
  good: [
    { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.1 },
    { wave: 'triangle', freq: 784, duration: 0.2, delay: 0.09, gain: 0.1 },
  ],
  poor: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.35, gain: 0.1 }],
} satisfies Record<string, SoundSpec>;
