import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Tile Rummy sounds: a click, a move, a play, a draw, a hint and the end. */
export const RUMMY_SOUNDS = {
  select: [{ wave: 'triangle', freq: 880, duration: 0.035, gain: 0.07 }],
  move: [{ wave: 'noise', freq: 0, duration: 0.04, gain: 0.08, lowpass: 2400 }],
  play: [
    { wave: 'noise', freq: 0, duration: 0.04, gain: 0.08, lowpass: 2400 },
    { wave: 'triangle', freq: 660, freqEnd: 880, duration: 0.12, delay: 0.04, gain: 0.1 },
  ],
  draw: [{ wave: 'sine', freq: 420, freqEnd: 360, duration: 0.1, gain: 0.07 }],
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
