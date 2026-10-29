import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Sokoban sounds: a footstep, a crate push, a hint and a win. */
export const SOKOBAN_SOUNDS = {
  step: [{ wave: 'noise', freq: 0, duration: 0.03, gain: 0.04, lowpass: 900 }],
  push: [
    { wave: 'noise', freq: 0, duration: 0.09, gain: 0.08, lowpass: 600 },
    { wave: 'triangle', freq: 140, freqEnd: 110, duration: 0.08, gain: 0.06 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
} satisfies Record<string, SoundSpec>;
