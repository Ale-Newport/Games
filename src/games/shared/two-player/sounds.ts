import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Default synthesized sounds for two-player games; games may override individual entries. */
export const SHELL_SOUNDS = {
  placeX: [
    { wave: 'triangle', freq: 880, freqEnd: 660, duration: 0.09, gain: 0.22 },
    { wave: 'noise', freq: 0, duration: 0.03, gain: 0.05, lowpass: 3000 },
  ],
  placeO: [{ wave: 'sine', freq: 520, freqEnd: 440, duration: 0.14, gain: 0.28 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.22 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.22 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.22 },
    { wave: 'triangle', freq: 1047, duration: 0.35, delay: 0.3, gain: 0.24 },
  ],
  lose: [
    { wave: 'sine', freq: 392, duration: 0.18, gain: 0.22 },
    { wave: 'sine', freq: 330, duration: 0.18, delay: 0.16, gain: 0.22 },
    { wave: 'sine', freq: 262, duration: 0.4, delay: 0.32, gain: 0.22 },
  ],
  draw: [
    { wave: 'sine', freq: 440, duration: 0.16, gain: 0.2 },
    { wave: 'sine', freq: 440, duration: 0.24, delay: 0.18, gain: 0.16 },
  ],
  invalid: [{ wave: 'square', freq: 140, duration: 0.09, gain: 0.08 }],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;

export type ShellSounds = Record<keyof typeof SHELL_SOUNDS, SoundSpec>;
