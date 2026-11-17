import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Caption Battle sounds. */
export const CAPTION_SOUNDS = {
  send: [{ wave: 'triangle', freq: 520, freqEnd: 780, duration: 0.14, gain: 0.1 }],
  results: [
    { wave: 'triangle', freq: 660, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.15, delay: 0.09, gain: 0.12 },
  ],
  podium: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
} satisfies Record<string, SoundSpec>;
