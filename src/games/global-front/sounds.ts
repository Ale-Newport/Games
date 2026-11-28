import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Global Front sounds: a purchase, a move, a battle round, a hint, the end. */
export const SOUNDS = {
  buy: [{ wave: 'triangle', freq: 660, duration: 0.06, gain: 0.08 }],
  move: [{ wave: 'sine', freq: 330, freqEnd: 392, duration: 0.1, gain: 0.08 }],
  battle: [
    { wave: 'noise', freq: 0, duration: 0.08, gain: 0.1, lowpass: 1200 },
    { wave: 'noise', freq: 0, duration: 0.06, delay: 0.1, gain: 0.08, lowpass: 900 },
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
