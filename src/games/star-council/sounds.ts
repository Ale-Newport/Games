import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Star Council sounds: a card, ships moving, dice, a claim, a score, the gavel, a hint, the end. */
export const SOUNDS = {
  card: [
    { wave: 'triangle', freq: 440, duration: 0.07, gain: 0.09 },
    { wave: 'triangle', freq: 587, duration: 0.09, delay: 0.07, gain: 0.09 },
  ],
  move: [{ wave: 'sine', freq: 220, freqEnd: 440, duration: 0.22, gain: 0.08 }],
  roll: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 3000 },
    { wave: 'square', freq: 180, duration: 0.06, delay: 0.05, gain: 0.05 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.1, gain: 0.07, lowpass: 2400 },
  ],
  claim: [
    { wave: 'triangle', freq: 523, duration: 0.08, gain: 0.1 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.08, gain: 0.1 },
  ],
  score: [
    { wave: 'triangle', freq: 659, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.08, delay: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1175, duration: 0.16, delay: 0.16, gain: 0.12 },
  ],
  gavel: [
    { wave: 'square', freq: 140, duration: 0.06, gain: 0.1 },
    { wave: 'square', freq: 140, duration: 0.06, delay: 0.14, gain: 0.1 },
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
