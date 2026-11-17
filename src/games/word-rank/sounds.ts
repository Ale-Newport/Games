import type { SoundSpec } from '../../core/audio/audio-engine';

/** Synthesized Word Rank sounds: a guess (pitch rises as it gets closer), a miss, the win. */
export const guessSound = (rank: number): SoundSpec => [
  {
    wave: 'sine',
    freq: 300 + 900 * (1 - Math.log(rank) / Math.log(30000)),
    duration: 0.12,
    gain: 0.09,
  },
];

export const RANK_SOUNDS = {
  bad: [{ wave: 'square', freq: 180, freqEnd: 140, duration: 0.12, gain: 0.05 }],
  hint: [{ wave: 'triangle', freq: 1200, freqEnd: 1500, duration: 0.18, gain: 0.1 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.16 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.16 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.18 },
  ],
  lose: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.4, gain: 0.12 }],
} satisfies Record<string, SoundSpec>;
