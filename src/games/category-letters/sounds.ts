import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Category Letters sounds: the die, the landing letter, clock ticks, buzzer, win. */
export const CL_SOUNDS = {
  roll: [
    { wave: 'square', freq: 300, duration: 0.03, gain: 0.04 },
    { wave: 'square', freq: 340, duration: 0.03, delay: 0.09, gain: 0.04 },
    { wave: 'square', freq: 320, duration: 0.03, delay: 0.18, gain: 0.04 },
    { wave: 'square', freq: 360, duration: 0.03, delay: 0.27, gain: 0.04 },
  ],
  land: [{ wave: 'triangle', freq: 660, freqEnd: 880, duration: 0.18, gain: 0.14 }],
  tick: [{ wave: 'sine', freq: 1100, duration: 0.03, gain: 0.05 }],
  stop: [{ wave: 'triangle', freq: 520, freqEnd: 420, duration: 0.15, gain: 0.1 }],
  buzzer: [{ wave: 'sawtooth', freq: 160, duration: 0.5, gain: 0.08 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
} satisfies Record<string, SoundSpec>;
