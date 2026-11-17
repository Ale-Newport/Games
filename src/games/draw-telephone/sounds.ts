import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Draw Telephone sounds. */
export const TELEPHONE_SOUNDS = {
  send: [{ wave: 'triangle', freq: 520, freqEnd: 780, duration: 0.15, gain: 0.1 }],
  album: [
    { wave: 'triangle', freq: 392, duration: 0.12, gain: 0.14 },
    { wave: 'triangle', freq: 523, duration: 0.12, delay: 0.1, gain: 0.14 },
    { wave: 'triangle', freq: 659, duration: 0.25, delay: 0.2, gain: 0.16 },
  ],
} satisfies Record<string, SoundSpec>;
