import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized quiz sounds: a found answer, a wrong click, the end and a perfect score. */
export const QUIZ_SOUNDS = {
  hit: [{ wave: 'sine', freq: 880, freqEnd: 1175, duration: 0.09, gain: 0.08 }],
  miss: [{ wave: 'square', freq: 200, freqEnd: 150, duration: 0.12, gain: 0.05 }],
  end: [
    { wave: 'triangle', freq: 440, duration: 0.15, gain: 0.12 },
    { wave: 'triangle', freq: 330, duration: 0.3, delay: 0.14, gain: 0.12 },
  ],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
} satisfies Record<string, SoundSpec>;
