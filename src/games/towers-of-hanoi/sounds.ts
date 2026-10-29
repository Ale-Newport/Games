import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Hanoi sounds: lift, drop, a blocked move, a hint and a win. */
export const HANOI_SOUNDS = {
  lift: [{ wave: 'sine', freq: 520, freqEnd: 700, duration: 0.06, gain: 0.06 }],
  drop: [{ wave: 'triangle', freq: 330, freqEnd: 260, duration: 0.07, gain: 0.08 }],
  blocked: [{ wave: 'square', freq: 140, duration: 0.06, gain: 0.05 }],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
} satisfies Record<string, SoundSpec>;
