import type { DraughtsVariant } from './engine';

/** English draughts / American checkers (WCDF): no flying kings, any capture sequence. */
export const ENGLISH: DraughtsVariant = {
  id: 'english',
  size: 8,
  rowsOfMen: 3,
  playableParity: 1,
  menCaptureBackward: false,
  flyingKings: false,
  captureRule: 'any',
  crownEndsCapture: true,
  noProgressPlies: 80,
  fmjdEndgame: false,
};

/** International draughts (FMJD): 10×10, men capture backward, flying kings, majority capture. */
export const INTERNATIONAL: DraughtsVariant = {
  id: 'international',
  size: 10,
  rowsOfMen: 4,
  playableParity: 1,
  menCaptureBackward: true,
  flyingKings: true,
  captureRule: 'max',
  crownEndsCapture: false,
  noProgressPlies: 50,
  fmjdEndgame: true,
};

/** Spanish draughts: flying kings, men capture forward only, quantity then quality of captures. */
export const SPANISH: DraughtsVariant = {
  id: 'spanish',
  size: 8,
  rowsOfMen: 3,
  playableParity: 0,
  menCaptureBackward: false,
  flyingKings: true,
  captureRule: 'max-then-kings',
  crownEndsCapture: true,
  noProgressPlies: 80,
  fmjdEndgame: false,
};
