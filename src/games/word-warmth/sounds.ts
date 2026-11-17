import type { SoundSpec } from '../../core/audio/audio-engine';

/** A guess blips higher the warmer it is. */
export const warmSound = (score: number): SoundSpec => [
  { wave: 'sine', freq: 260 + Math.max(0, score) * 11, duration: 0.12, gain: 0.09 },
];

export const WARM_SOUNDS = {
  bad: [{ wave: 'square', freq: 180, freqEnd: 140, duration: 0.12, gain: 0.05 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
  lose: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.4, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;
