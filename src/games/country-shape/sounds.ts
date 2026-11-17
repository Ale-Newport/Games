import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Country Shape sounds. */
export const SHAPE_SOUNDS = {
  guess: [{ wave: 'sine', freq: 520, freqEnd: 440, duration: 0.12, gain: 0.08 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
  lose: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.45, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;
