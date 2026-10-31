import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Mahjong solitaire sounds: a click, a pair, a blocked tile, a shuffle, undo, a hint and the end. */
export const MAHJONG_SOUNDS = {
  select: [{ wave: 'triangle', freq: 880, duration: 0.04, gain: 0.08 }],
  pair: [
    { wave: 'noise', freq: 0, duration: 0.03, gain: 0.08, lowpass: 2400 },
    { wave: 'triangle', freq: 1040, freqEnd: 1320, duration: 0.1, delay: 0.02, gain: 0.1 },
  ],
  blocked: [{ wave: 'square', freq: 180, duration: 0.08, gain: 0.05 }],
  shuffle: [
    { wave: 'noise', freq: 0, duration: 0.06, gain: 0.07, lowpass: 2600 },
    { wave: 'noise', freq: 0, duration: 0.06, delay: 0.07, gain: 0.07, lowpass: 2200 },
    { wave: 'noise', freq: 0, duration: 0.06, delay: 0.14, gain: 0.07, lowpass: 1800 },
  ],
  undo: [{ wave: 'sine', freq: 520, freqEnd: 380, duration: 0.1, gain: 0.08 }],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  stuck: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
} satisfies Record<string, SoundSpec>;
