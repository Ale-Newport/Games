import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized World Conquest sounds: a placement, a battle, a conquest, a trade, a move, a hint, the end. */
export const SOUNDS = {
  place: [{ wave: 'triangle', freq: 330, duration: 0.05, gain: 0.08 }],
  battle: [
    { wave: 'noise', freq: 0, duration: 0.06, gain: 0.09, lowpass: 1800 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.08, gain: 0.07, lowpass: 1400 },
  ],
  conquer: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 1800 },
    { wave: 'square', freq: 392, duration: 0.08, delay: 0.06, gain: 0.08 },
    { wave: 'square', freq: 523, duration: 0.14, delay: 0.14, gain: 0.08 },
  ],
  trade: [
    { wave: 'triangle', freq: 660, duration: 0.07, gain: 0.1 },
    { wave: 'triangle', freq: 990, duration: 0.1, delay: 0.07, gain: 0.1 },
  ],
  move: [{ wave: 'sine', freq: 440, freqEnd: 330, duration: 0.14, gain: 0.1 }],
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
