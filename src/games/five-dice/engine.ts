/**
 * Five Dice scoring: thirteen boxes — ones to sixes (the sum of that face), three and four of a
 * kind (the sum of all dice), full house 25, small straight (four in a row) 30, large straight
 * (five in a row) 40, five of a kind 50, chance (the sum) — a 35-point bonus when the six upper
 * boxes reach 63, and a 100-point bonus for every further five of a kind once that box holds 50,
 * which then also scores as a joker (its face's upper box if open, otherwise any lower box at full
 * value).
 */
import type { Counts } from '../shared/scorecard/turn';
import type { ScoreRules } from '../shared/scorecard/game';
import type { Planning } from '../shared/scorecard/planner';

export const BOXES = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
  'threeKind',
  'fourKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'fiveKind',
  'chance',
] as const;
export type Box = (typeof BOXES)[number];
export const UPPER: Box[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
export const BONUS_AT = 63;
export const BONUS = 35;
export const FIVE_KIND_BONUS = 100;

export type Card = Partial<Record<Box, number>>;

const sum = (c: Counts) => c.reduce((n, k, i) => n + k * (i + 1), 0);
const most = (c: Counts) => Math.max(...c);
const run = (c: Counts) => {
  let best = 0;
  let cur = 0;
  for (const k of c) {
    cur = k > 0 ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
};

/** The score of a box for a hand, before any joker rule. */
export function boxScore(box: Box, c: Counts): number {
  const upper = UPPER.indexOf(box);
  if (upper >= 0) return c[upper]! * (upper + 1);
  switch (box) {
    case 'threeKind':
      return most(c) >= 3 ? sum(c) : 0;
    case 'fourKind':
      return most(c) >= 4 ? sum(c) : 0;
    case 'fullHouse':
      return c.includes(3) && c.includes(2) ? 25 : 0;
    case 'smallStraight':
      return run(c) >= 4 ? 30 : 0;
    case 'largeStraight':
      return run(c) >= 5 ? 40 : 0;
    case 'fiveKind':
      return most(c) === 5 ? 50 : 0;
    default:
      return sum(c);
  }
}

/** Whether a five of a kind is a joker now (the five-of-a-kind box already holds 50). */
const isJoker = (card: Card, c: Counts) => most(c) === 5 && card.fiveKind === 50;

/** Boxes that may be scored with a hand (the joker rule can force the upper box). */
export function openBoxes(card: Card, c: Counts): Box[] {
  const open = BOXES.filter((b) => card[b] === undefined);
  if (isJoker(card, c)) {
    const face = c.indexOf(5);
    const upper = UPPER[face]!;
    if (card[upper] === undefined) return [upper];
  }
  return open;
}

/** What scoring `box` with a hand is worth, joker rule included (the 100 bonus is separate). */
export function scoreFor(card: Card, box: Box, c: Counts): number {
  if (isJoker(card, c) && !UPPER.includes(box)) {
    if (box === 'fullHouse') return 25;
    if (box === 'smallStraight') return 30;
    if (box === 'largeStraight') return 40;
  }
  return boxScore(box, c);
}

export const fiveKindBonus = (card: Card, c: Counts) => (isJoker(card, c) ? FIVE_KIND_BONUS : 0);

export function upperTotal(card: Card): number {
  return UPPER.reduce((n, b) => n + (card[b] ?? 0), 0);
}

export function total(card: Card, bonuses: number): number {
  const upper = upperTotal(card);
  const lower = BOXES.filter((b) => !UPPER.includes(b)).reduce((n, b) => n + (card[b] ?? 0), 0);
  return upper + (upper >= BONUS_AT ? BONUS : 0) + lower + bonuses;
}

export const isFull = (card: Card) => BOXES.every((b) => card[b] !== undefined);

/**
 * Typical scores per box under good play: scoring a box costs its typical value (what it would
 * otherwise bring later), so the planner sacrifices cheap boxes and saves valuable ones.
 */
export const PAR: Record<Box, number> = {
  ones: 2.1,
  twos: 5.3,
  threes: 8.6,
  fours: 12.2,
  fives: 15.7,
  sixes: 19.2,
  threeKind: 21.7,
  fourKind: 13.1,
  fullHouse: 22.6,
  smallStraight: 29.5,
  largeStraight: 32.7,
  fiveKind: 16.9,
  chance: 22,
};

/** The planner's value of scoring a hand in the best open box. */
export function handValue(card: Card, c: Counts): number {
  const bonusOpen = upperTotal(card) < BONUS_AT;
  let best = -Infinity;
  for (const box of openBoxes(card, c)) {
    const score = scoreFor(card, box, c);
    let v = score - PAR[box];
    const upper = UPPER.indexOf(box);
    // Upper boxes count toward the bonus: three of a face is par for it.
    if (upper >= 0 && bonusOpen) v += (score - 3 * (upper + 1)) * 0.6;
    best = Math.max(best, v);
  }
  return best + fiveKindBonus(card, c);
}

/** The box the planner scores a final hand in. */
export function bestBox(card: Card, c: Counts): Box {
  const bonusOpen = upperTotal(card) < BONUS_AT;
  let best: Box = openBoxes(card, c)[0]!;
  let score = -Infinity;
  for (const box of openBoxes(card, c)) {
    const s = scoreFor(card, box, c);
    let v = s - PAR[box];
    const upper = UPPER.indexOf(box);
    if (upper >= 0 && bonusOpen) v += (s - 3 * (upper + 1)) * 0.6;
    if (v > score) {
      score = v;
      best = box;
    }
  }
  return best;
}

/** Five Dice on the shared scorecard table. */
export const FIVE_DICE: ScoreRules = {
  boxes: BOXES,
  upper: UPPER,
  openBoxes: (card, hand) => openBoxes(card as Card, hand),
  scoreFor: (card, box, hand) => scoreFor(card as Card, box as Box, hand),
  extraBonus: (card, hand) => fiveKindBonus(card as Card, hand),
  total: (card, bonuses) => total(card as Card, bonuses),
};

export const FIVE_DICE_PLANNING: Planning = {
  handValue: (card, hand) => handValue(card as Card, hand),
  bestBox: (card, hand) => bestBox(card as Card, hand),
};
