import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Peg Solitaire sounds: a wooden jump, a blocked tap, a hint, a win and a dead end. */
export const PEG_SOUNDS = {
  jump: [
    { wave: 'triangle', freq: 420, freqEnd: 520, duration: 0.06, gain: 0.08 },
    { wave: 'noise', freq: 0, duration: 0.04, delay: 0.06, gain: 0.06, lowpass: 1200 },
  ],
  blocked: [{ wave: 'square', freq: 140, duration: 0.06, gain: 0.05 }],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  stuck: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
} satisfies Record<string, SoundSpec>;
