import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized riichi sounds: a discard, a call, riichi, a win, a draw, a deal, a hint and the end. */
export const RIICHI_SOUNDS = {
  discard: [{ wave: 'noise', freq: 0, duration: 0.035, gain: 0.09, lowpass: 2600 }],
  call: [
    { wave: 'square', freq: 440, duration: 0.06, gain: 0.07 },
    { wave: 'square', freq: 660, duration: 0.08, delay: 0.06, gain: 0.07 },
  ],
  riichi: [
    { wave: 'triangle', freq: 523, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 784, duration: 0.08, delay: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1047, duration: 0.14, delay: 0.16, gain: 0.12 },
  ],
  win: [
    { wave: 'triangle', freq: 659, duration: 0.1, gain: 0.15 },
    { wave: 'triangle', freq: 880, duration: 0.18, delay: 0.09, gain: 0.15 },
  ],
  draw: [{ wave: 'sine', freq: 330, freqEnd: 260, duration: 0.3, gain: 0.08 }],
  deal: [
    { wave: 'noise', freq: 0, duration: 0.06, gain: 0.07, lowpass: 2200 },
    { wave: 'noise', freq: 0, duration: 0.06, delay: 0.08, gain: 0.07, lowpass: 2000 },
  ],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  gameWin: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  gameLose: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
} satisfies Record<string, SoundSpec>;
