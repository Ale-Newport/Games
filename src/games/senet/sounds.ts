import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Senet sounds: the sticks, a move, a swap, the Water, a hint and the end. */
export const SENET_SOUNDS = {
  throw: [
    { wave: 'noise', freq: 0, duration: 0.04, gain: 0.08, lowpass: 1800 },
    { wave: 'noise', freq: 0, duration: 0.04, delay: 0.05, gain: 0.07, lowpass: 1600 },
    { wave: 'noise', freq: 0, duration: 0.04, delay: 0.1, gain: 0.06, lowpass: 1400 },
  ],
  move: [{ wave: 'triangle', freq: 280, freqEnd: 240, duration: 0.07, gain: 0.1 }],
  capture: [
    { wave: 'square', freq: 260, freqEnd: 180, duration: 0.1, gain: 0.07 },
    { wave: 'square', freq: 180, freqEnd: 260, duration: 0.1, delay: 0.1, gain: 0.07 },
  ],
  water: [{ wave: 'sine', freq: 520, freqEnd: 180, duration: 0.45, gain: 0.12 }],
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
