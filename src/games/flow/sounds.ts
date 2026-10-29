import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Color Links sounds: a drawing tick, a pair joined, a hint and a win. */
export const LINK_SOUNDS = {
  draw: [{ wave: 'sine', freq: 660, freqEnd: 700, duration: 0.03, gain: 0.04 }],
  link: [
    { wave: 'triangle', freq: 784, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1046, duration: 0.12, delay: 0.07, gain: 0.12 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
} satisfies Record<string, SoundSpec>;
