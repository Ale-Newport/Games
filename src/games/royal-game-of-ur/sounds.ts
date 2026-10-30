import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Ur sounds: the throw, a move, a rosette, a capture, a hint and the end. */
export const UR_SOUNDS = {
  throw: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 2600 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.06, gain: 0.07, lowpass: 2200 },
  ],
  move: [{ wave: 'triangle', freq: 300, freqEnd: 260, duration: 0.07, gain: 0.1 }],
  rosette: [
    { wave: 'sine', freq: 660, duration: 0.1, gain: 0.12 },
    { wave: 'sine', freq: 990, duration: 0.14, delay: 0.08, gain: 0.12 },
  ],
  capture: [
    { wave: 'square', freq: 240, freqEnd: 120, duration: 0.14, gain: 0.08 },
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.06, lowpass: 900 },
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
