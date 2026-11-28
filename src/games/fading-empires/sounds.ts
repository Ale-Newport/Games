import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Fading Empires sounds: a pick, a conquest, the die, a decline, coins, a hint, the end. */
export const SOUNDS = {
  pick: [
    { wave: 'triangle', freq: 392, duration: 0.08, gain: 0.1 },
    { wave: 'triangle', freq: 523, duration: 0.1, delay: 0.08, gain: 0.1 },
  ],
  take: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 1600 },
    { wave: 'square', freq: 330, duration: 0.07, delay: 0.05, gain: 0.07 },
  ],
  die: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 2600 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.07, gain: 0.07, lowpass: 2200 },
  ],
  decline: [{ wave: 'sine', freq: 440, freqEnd: 220, duration: 0.4, gain: 0.1 }],
  coins: [
    { wave: 'triangle', freq: 988, duration: 0.05, gain: 0.08 },
    { wave: 'triangle', freq: 1318, duration: 0.08, delay: 0.05, gain: 0.08 },
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
