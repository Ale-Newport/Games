import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Theme Strands sounds. */
export const STRANDS_SOUNDS = {
  theme: [
    { wave: 'triangle', freq: 660, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.16, delay: 0.08, gain: 0.12 },
  ],
  spangram: [
    { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.14 },
    { wave: 'triangle', freq: 784, duration: 0.1, delay: 0.08, gain: 0.14 },
    { wave: 'triangle', freq: 1047, duration: 0.25, delay: 0.16, gain: 0.16 },
  ],
  extra: [{ wave: 'sine', freq: 740, freqEnd: 900, duration: 0.12, gain: 0.08 }],
  bad: [{ wave: 'square', freq: 200, freqEnd: 160, duration: 0.12, gain: 0.05 }],
  hint: [{ wave: 'sine', freq: 1200, freqEnd: 1500, duration: 0.18, gain: 0.1 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
} satisfies Record<string, SoundSpec>;
