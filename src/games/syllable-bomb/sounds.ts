import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Syllable Bomb sounds. */
export const BOMB_SOUNDS = {
  word: [{ wave: 'triangle', freq: 660, freqEnd: 880, duration: 0.1, gain: 0.1 }],
  life: [
    { wave: 'triangle', freq: 660, duration: 0.1, gain: 0.14 },
    { wave: 'triangle', freq: 990, duration: 0.2, delay: 0.09, gain: 0.14 },
  ],
  bad: [{ wave: 'square', freq: 200, freqEnd: 150, duration: 0.12, gain: 0.05 }],
  boom: [
    { wave: 'sawtooth', freq: 120, freqEnd: 40, duration: 0.6, gain: 0.16 },
    { wave: 'square', freq: 60, freqEnd: 30, duration: 0.5, delay: 0.05, gain: 0.08 },
  ],
  end: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.2, gain: 0.16 },
  ],
} satisfies Record<string, SoundSpec>;
