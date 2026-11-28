import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Gap Graph sounds. */
export const SOUNDS = {
  great: [
    { wave: 'triangle', freq: 659, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 880, duration: 0.1, delay: 0.09, gain: 0.12 },
    { wave: 'triangle', freq: 1175, duration: 0.3, delay: 0.18, gain: 0.14 },
  ],
  good: [
    { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.1 },
    { wave: 'triangle', freq: 698, duration: 0.2, delay: 0.09, gain: 0.1 },
  ],
  poor: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.4, gain: 0.1 }],
} satisfies Record<string, SoundSpec>;
