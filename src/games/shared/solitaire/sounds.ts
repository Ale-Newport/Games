import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized card sounds: a soft slap, a flick for turning, a chime for foundation plays. */
export const CARD_SOUNDS = {
  place: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.16, lowpass: 2600 },
    { wave: 'triangle', freq: 300, freqEnd: 240, duration: 0.05, gain: 0.05 },
  ],
  flip: [{ wave: 'noise', freq: 0, duration: 0.04, gain: 0.12, lowpass: 5200 }],
  draw: [
    { wave: 'noise', freq: 0, duration: 0.035, gain: 0.1, lowpass: 4200 },
    { wave: 'noise', freq: 0, duration: 0.035, delay: 0.05, gain: 0.08, lowpass: 4200 },
  ],
  home: [
    { wave: 'noise', freq: 0, duration: 0.04, gain: 0.1, lowpass: 3000 },
    { wave: 'triangle', freq: 880, freqEnd: 1175, duration: 0.12, delay: 0.03, gain: 0.08 },
  ],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.2 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.2 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.2 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.22 },
  ],
  lose: [
    { wave: 'sine', freq: 392, duration: 0.18, gain: 0.2 },
    { wave: 'sine', freq: 294, duration: 0.4, delay: 0.16, gain: 0.2 },
  ],
  invalid: [{ wave: 'square', freq: 140, duration: 0.09, gain: 0.08 }],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;

export type CardSound = 'place' | 'flip' | 'draw' | 'home';
