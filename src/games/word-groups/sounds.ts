import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Word Groups sounds. */
export const GROUP_SOUNDS = {
  tap: [{ wave: 'triangle', freq: 640, duration: 0.04, gain: 0.06 }],
  shuffle: [
    { wave: 'triangle', freq: 400, duration: 0.04, gain: 0.05 },
    { wave: 'triangle', freq: 500, duration: 0.04, delay: 0.05, gain: 0.05 },
  ],
  solved: [
    { wave: 'triangle', freq: 660, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.18, delay: 0.09, gain: 0.12 },
  ],
  oneAway: [{ wave: 'sine', freq: 520, freqEnd: 600, duration: 0.2, gain: 0.08 }],
  wrong: [{ wave: 'square', freq: 200, freqEnd: 150, duration: 0.18, gain: 0.05 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
  lose: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.45, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;
