/**
 * Generala, the scorecard dice game of Latin America and Spain: eleven boxes — ones to sixes (the
 * sum of that face), straight 20 (1–5, 2–6 or 3–4–5–6–1), full house 30, four of a kind 40,
 * generala (five alike) 50 and double generala 100 (once the generala box holds 50). A straight,
 * full house or four of a kind made on the turn's first roll ("served") scores 5 more, and a
 * served generala wins the game at once. Any open box may be crossed out for 0.
 */
import type { Card, ScoreRules } from '../shared/scorecard/game';
import type { Planning } from '../shared/scorecard/planner';
import type { Counts } from '../shared/scorecard/turn';

export const BOXES = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
  'straight',
  'fullHouse',
  'fourKind',
  'generala',
  'doubleGenerala',
] as const;
export type Box = (typeof BOXES)[number];
export const UPPER: Box[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];

const most = (c: Counts) => Math.max(...c);
export const isStraight = (c: Counts) => {
  const s = c.join('');
  return s === '111110' || s === '011111' || s === '101111';
};

/** What a box scores with a hand (`served`: made on the first roll). */
export function scoreFor(card: Card, box: string, c: Counts, served: boolean): number {
  const upper = UPPER.indexOf(box as Box);
  if (upper >= 0) return c[upper]! * (upper + 1);
  const bonus = served ? 5 : 0;
  switch (box) {
    case 'straight':
      return isStraight(c) ? 20 + bonus : 0;
    case 'fullHouse':
      return c.includes(3) && c.includes(2) ? 30 + bonus : 0;
    case 'fourKind':
      return most(c) >= 4 ? 40 + bonus : 0;
    case 'generala':
      return most(c) === 5 ? 50 : 0;
    case 'doubleGenerala':
      return most(c) === 5 && card.generala === 50 ? 100 : 0;
    default:
      return 0;
  }
}

export const openBoxes = (card: Card) => BOXES.filter((b) => card[b] === undefined);

export const total = (card: Card) => BOXES.reduce((n, b) => n + (card[b] ?? 0), 0);

export const instantWin = (c: Counts, served: boolean) => served && most(c) === 5;

/** Typical box values under good play, the cost of using a box now. */
export const PAR: Record<Box, number> = {
  ones: 1.9,
  twos: 4,
  threes: 6.5,
  fours: 9,
  fives: 11.6,
  sixes: 14.4,
  straight: 13,
  fullHouse: 20,
  fourKind: 19,
  generala: 17,
  doubleGenerala: 5,
};

/** The planner's value of standing with a hand in the best open box. */
export function handValue(card: Card, c: Counts, rerollsLeft: number): number {
  const served = rerollsLeft === 2;
  if (instantWin(c, served)) return 1000;
  let best = -Infinity;
  for (const box of openBoxes(card))
    best = Math.max(best, scoreFor(card, box, c, served) - PAR[box]);
  return best;
}

export function bestBox(card: Card, c: Counts, served: boolean): string {
  let best: string = openBoxes(card)[0]!;
  let score = -Infinity;
  for (const box of openBoxes(card)) {
    const v = scoreFor(card, box, c, served) - PAR[box];
    if (v > score) {
      score = v;
      best = box;
    }
  }
  return best;
}

export const GENERALA: ScoreRules = {
  boxes: BOXES,
  upper: UPPER,
  openBoxes: (card) => openBoxes(card),
  scoreFor: (card, box, hand, firstRoll) => scoreFor(card, box, hand, firstRoll),
  extraBonus: () => 0,
  total: (card) => total(card),
  instantWin,
};

export const GENERALA_PLANNING: Planning = {
  handValue,
  bestBox: (card, hand, firstRoll) => bestBox(card, hand, firstRoll),
};
