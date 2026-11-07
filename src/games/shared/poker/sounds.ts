import type { SoundSpec } from '../../../core/audio/audio-engine';
import { CARD_SOUNDS } from '../solitaire/sounds';

/** Synthesized table sounds: clinking chips, a knock for a check, a swish for a fold. */
export const POKER_SOUNDS = {
  deal: CARD_SOUNDS.draw,
  chips: [
    { wave: 'triangle', freq: 2400, freqEnd: 2100, duration: 0.04, gain: 0.07 },
    { wave: 'triangle', freq: 2900, freqEnd: 2500, duration: 0.05, delay: 0.05, gain: 0.06 },
    { wave: 'noise', freq: 0, duration: 0.03, delay: 0.02, gain: 0.05, lowpass: 6000 },
  ],
  check: [
    { wave: 'sine', freq: 160, freqEnd: 110, duration: 0.06, gain: 0.2 },
    { wave: 'sine', freq: 160, freqEnd: 110, duration: 0.06, delay: 0.12, gain: 0.18 },
  ],
  fold: [{ wave: 'noise', freq: 0, duration: 0.12, gain: 0.08, lowpass: 1800 }],
  pot: [
    { wave: 'triangle', freq: 2200, duration: 0.05, gain: 0.06 },
    { wave: 'triangle', freq: 2600, duration: 0.05, delay: 0.06, gain: 0.06 },
    { wave: 'triangle', freq: 2400, duration: 0.05, delay: 0.12, gain: 0.06 },
  ],
  win: CARD_SOUNDS.win,
  lose: CARD_SOUNDS.lose,
  invalid: CARD_SOUNDS.invalid,
  hint: CARD_SOUNDS.hint,
} satisfies Record<string, SoundSpec>;
