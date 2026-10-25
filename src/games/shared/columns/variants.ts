/** The column patiences built on the shared engine. */
import type { ColumnsVariant } from './engine';

/** Yukon: seven columns (1, then 1–6 down + 5 up), no stock, any face-up group moves. */
export const YUKON: ColumnsVariant = {
  id: 'yukon',
  decks: 1,
  deal: [
    [0, 1],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [5, 5],
    [6, 5],
  ],
  stock: { kind: 'none' },
  build: 'alt',
  move: 'group',
  empty: 'king',
  foundations: 4,
  moveLimit: 1000,
};

/** Scorpion: seven columns of seven (three down in the first four), three cards in reserve. */
export const SCORPION: ColumnsVariant = {
  id: 'scorpion',
  decks: 1,
  deal: [
    [3, 4],
    [3, 4],
    [3, 4],
    [3, 4],
    [0, 7],
    [0, 7],
    [0, 7],
  ],
  stock: { kind: 'columns', columns: 3 },
  build: 'suit',
  move: 'group',
  empty: 'king',
  foundations: 0,
  moveLimit: 1000,
};

/** Forty Thieves: two decks, ten columns of four face up, one card at a time, a single pass. */
export const FORTY_THIEVES: ColumnsVariant = {
  id: 'forty-thieves',
  decks: 2,
  deal: Array.from({ length: 10 }, () => [0, 4] as const),
  stock: { kind: 'waste', redeals: 0 },
  build: 'suit',
  move: 'single',
  empty: 'any',
  foundations: 8,
  moveLimit: 1500,
};
