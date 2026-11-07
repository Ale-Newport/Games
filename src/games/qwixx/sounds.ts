import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Colour Rows sounds: the dice, a cross, a pass, a penalty, a lock, a hint and the end. */
export const ROWS_SOUNDS = {
  roll: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 2600 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.06, gain: 0.07, lowpass: 2200 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.12, gain: 0.06, lowpass: 2000 },
  ],
  mark: [{ wave: 'triangle', freq: 600, freqEnd: 420, duration: 0.08, gain: 0.1 }],
  pass: [{ wave: 'sine', freq: 360, duration: 0.06, gain: 0.07 }],
  penalty: [{ wave: 'sawtooth', freq: 300, freqEnd: 110, duration: 0.35, gain: 0.07 }],
  lock: [
    { wave: 'square', freq: 220, duration: 0.06, gain: 0.08 },
    { wave: 'triangle', freq: 880, duration: 0.15, delay: 0.07, gain: 0.12 },
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
