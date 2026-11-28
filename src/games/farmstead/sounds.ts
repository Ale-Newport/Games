import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Farmstead sounds: placing a worker, building, field work, coins, the harvest, a hint, the end. */
export const SOUNDS = {
  place: [{ wave: 'triangle', freq: 523, duration: 0.08, gain: 0.09 }],
  build: [
    { wave: 'noise', freq: 0, duration: 0.04, gain: 0.08, lowpass: 900 },
    { wave: 'noise', freq: 0, duration: 0.04, delay: 0.09, gain: 0.08, lowpass: 900 },
  ],
  field: [{ wave: 'noise', freq: 0, duration: 0.18, gain: 0.06, lowpass: 600 }],
  coins: [
    { wave: 'triangle', freq: 988, duration: 0.05, gain: 0.08 },
    { wave: 'triangle', freq: 1318, duration: 0.08, delay: 0.05, gain: 0.08 },
  ],
  harvest: [
    { wave: 'triangle', freq: 392, duration: 0.1, gain: 0.1 },
    { wave: 'triangle', freq: 494, duration: 0.1, delay: 0.1, gain: 0.1 },
    { wave: 'triangle', freq: 587, duration: 0.18, delay: 0.2, gain: 0.1 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  lose: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
} satisfies Record<string, SoundSpec>;
