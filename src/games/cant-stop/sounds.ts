import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Summit Rush sounds: the dice, a climb, a bust, a stop, a summit, a hint and the end. */
export const SUMMIT_SOUNDS = {
  roll: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 2600 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.06, gain: 0.07, lowpass: 2200 },
  ],
  climb: [{ wave: 'triangle', freq: 440, freqEnd: 560, duration: 0.08, gain: 0.1 }],
  bust: [{ wave: 'sawtooth', freq: 320, freqEnd: 90, duration: 0.45, gain: 0.07 }],
  stop: [{ wave: 'triangle', freq: 660, duration: 0.1, gain: 0.1 }],
  claim: [
    { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.14 },
    { wave: 'triangle', freq: 784, duration: 0.18, delay: 0.09, gain: 0.14 },
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
