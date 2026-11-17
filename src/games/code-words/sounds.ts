import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Code Words sounds. */
export const CODE_SOUNDS = {
  clue: [{ wave: 'sine', freq: 700, freqEnd: 900, duration: 0.15, gain: 0.08 }],
  agent: [
    { wave: 'triangle', freq: 660, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.12, delay: 0.07, gain: 0.12 },
  ],
  miss: [{ wave: 'square', freq: 240, freqEnd: 180, duration: 0.15, gain: 0.05 }],
  assassin: [{ wave: 'sawtooth', freq: 140, freqEnd: 60, duration: 0.6, gain: 0.1 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
  lose: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.45, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;
