import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Lights Out sounds: a switch click, a hint and the lights-out chime. */
export const LIGHTS_SOUNDS = {
  click: [{ wave: 'square', freq: 1200, freqEnd: 900, duration: 0.03, gain: 0.05 }],
  hint: [{ wave: 'sine', freq: 1320, freqEnd: 1560, duration: 0.18, gain: 0.12 }],
  win: [
    { wave: 'sine', freq: 880, freqEnd: 440, duration: 0.5, gain: 0.15 },
    { wave: 'triangle', freq: 659, duration: 0.2, delay: 0.45, gain: 0.15 },
    { wave: 'triangle', freq: 523, duration: 0.4, delay: 0.6, gain: 0.15 },
  ],
} satisfies Record<string, SoundSpec>;
