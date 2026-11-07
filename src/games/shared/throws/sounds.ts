import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized throw sounds: the shake, a round won, lost or tied, a hint and the match's end. */
export const THROW_SOUNDS = {
  shake: [
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.07, lowpass: 1800 },
    { wave: 'noise', freq: 0, duration: 0.05, delay: 0.12, gain: 0.07, lowpass: 1800 },
  ],
  roundWin: [{ wave: 'triangle', freq: 660, freqEnd: 880, duration: 0.14, gain: 0.12 }],
  roundLose: [{ wave: 'sawtooth', freq: 300, freqEnd: 200, duration: 0.18, gain: 0.06 }],
  tie: [{ wave: 'sine', freq: 440, duration: 0.1, gain: 0.07 }],
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
