import type { SoundSpec } from '../../../core/audio/audio-engine';

/** Synthesized survey sounds: sonar ping / whoosh on an answer, a miss, the clock and the end. */
export const SURVEY_SOUNDS = {
  ping: [
    { wave: 'sine', freq: 1240, freqEnd: 1180, duration: 0.5, gain: 0.12 },
    { wave: 'sine', freq: 1240, freqEnd: 1180, duration: 0.4, delay: 0.32, gain: 0.04 },
  ],
  whoosh: [{ wave: 'triangle', freq: 300, freqEnd: 900, duration: 0.35, gain: 0.1 }],
  prize: [
    { wave: 'triangle', freq: 784, duration: 0.1, gain: 0.15 },
    { wave: 'triangle', freq: 988, duration: 0.1, delay: 0.09, gain: 0.15 },
    { wave: 'triangle', freq: 1319, duration: 0.3, delay: 0.18, gain: 0.17 },
  ],
  miss: [{ wave: 'square', freq: 180, freqEnd: 140, duration: 0.16, gain: 0.05 }],
  tick: [{ wave: 'sine', freq: 1000, duration: 0.03, gain: 0.05 }],
  timeout: [
    { wave: 'triangle', freq: 330, duration: 0.15, gain: 0.12 },
    { wave: 'triangle', freq: 247, duration: 0.3, delay: 0.14, gain: 0.12 },
  ],
  end: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
} satisfies Record<string, SoundSpec>;
