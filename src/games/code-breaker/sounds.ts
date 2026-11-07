import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Code Breaker sounds: a peg click, the scoring ticks, a win and a loss. */
export const CODE_SOUNDS = {
  peg: [{ wave: 'triangle', freq: 600, freqEnd: 540, duration: 0.05, gain: 0.08 }],
  clear: [{ wave: 'triangle', freq: 420, freqEnd: 360, duration: 0.05, gain: 0.06 }],
  score: [
    { wave: 'sine', freq: 880, duration: 0.05, gain: 0.08 },
    { wave: 'sine', freq: 990, duration: 0.05, delay: 0.07, gain: 0.08 },
  ],
  miss: [{ wave: 'square', freq: 220, freqEnd: 180, duration: 0.12, gain: 0.05 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  lose: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 330, duration: 0.18, delay: 0.16, gain: 0.15 },
    { wave: 'triangle', freq: 262, duration: 0.4, delay: 0.32, gain: 0.15 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;
