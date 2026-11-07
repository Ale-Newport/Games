import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Pig sounds: a roll, a 1, a hold, a hint and the end. */
export const PIG_SOUNDS = {
  roll: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 2600 },
    { wave: 'noise', freq: 0, duration: 0.04, delay: 0.06, gain: 0.06, lowpass: 2000 },
  ],
  pig: [{ wave: 'sawtooth', freq: 260, freqEnd: 80, duration: 0.4, gain: 0.08 }],
  hold: [
    { wave: 'triangle', freq: 660, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 990, duration: 0.14, delay: 0.07, gain: 0.12 },
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
