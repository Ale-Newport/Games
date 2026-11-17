import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Sketch & Guess sounds. */
export const SKETCH_SOUNDS = {
  start: [{ wave: 'triangle', freq: 600, freqEnd: 800, duration: 0.15, gain: 0.1 }],
  correct: [
    { wave: 'triangle', freq: 784, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1047, duration: 0.14, delay: 0.07, gain: 0.12 },
  ],
  turnEnd: [{ wave: 'sine', freq: 660, freqEnd: 440, duration: 0.3, gain: 0.1 }],
  nobody: [{ wave: 'square', freq: 220, freqEnd: 160, duration: 0.3, gain: 0.05 }],
  podium: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
} satisfies Record<string, SoundSpec>;
