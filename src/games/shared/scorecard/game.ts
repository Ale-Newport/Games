/**
 * A scorecard dice game (Five Dice, Generala): 1–4 players take turns of up to three rolls of five
 * dice, keeping any dice between rolls, then score the hand in one open box of their card. The
 * rules (boxes, scoring, bonuses, an instant win) come from a `ScoreRules` object. Dice come from a
 * generator stored in the state, so a game replays exactly from its seed and actions:
 * "roll:<mask>" (the dice kept, five 0/1 digits; all 0 for the first roll) and "score:<box>".
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';
import { countsOf, type Counts } from './turn';

export type Card = Partial<Record<string, number>>;

export interface ScoreRules {
  boxes: readonly string[];
  /** Boxes summed for the upper section (shown with its bonus). */
  upper: readonly string[];
  /** Boxes that may take a hand (the rest of the open boxes are refused). */
  openBoxes: (card: Card, hand: Counts) => string[];
  /** What a box scores with a hand; `firstRoll` marks a hand made on the turn's first roll. */
  scoreFor: (card: Card, box: string, hand: Counts, firstRoll: boolean) => number;
  /** A bonus earned alongside the box (Five Dice's extra five of a kind). */
  extraBonus: (card: Card, hand: Counts) => number;
  total: (card: Card, bonuses: number) => number;
  /** A hand that wins the game at once (Generala's on the first roll). */
  instantWin?: (hand: Counts, firstRoll: boolean) => boolean;
}

export interface DiceGame {
  seed: number;
  rng: RngState;
  players: number;
  cards: Card[];
  bonuses: number[];
  turn: number;
  dice: number[] | null;
  /** Rolls used this turn (0–3). */
  rolls: number;
  phase: 'play' | 'over';
  /** Winner by an instant win, or null (the totals decide). */
  instant: number | null;
  history: string[];
}

export function newDiceGame(players: number, seed: number): DiceGame {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    players,
    cards: Array.from({ length: players }, () => ({})),
    bonuses: new Array<number>(players).fill(0),
    turn: 0,
    dice: null,
    rolls: 0,
    phase: 'play',
    instant: null,
    history: [],
  };
}

export const handOf = (g: DiceGame): Counts | null => (g.dice ? countsOf(g.dice) : null);

export function legalActions(rules: ScoreRules, g: DiceGame): string[] {
  if (g.phase === 'over') return [];
  if (g.rolls === 0) return ['roll:00000'];
  const out: string[] = [];
  if (g.rolls < 3) for (let m = 0; m < 32; m++) out.push(`roll:${m.toString(2).padStart(5, '0')}`);
  const hand = handOf(g)!;
  for (const box of rules.openBoxes(g.cards[g.turn]!, hand)) out.push(`score:${box}`);
  return out;
}

const filled = (rules: ScoreRules, card: Card) => rules.boxes.every((b) => card[b] !== undefined);

export function act(rules: ScoreRules, g: DiceGame, action: string): DiceGame {
  if (!legalActions(rules, g).includes(action)) return g;
  const next = actInner(rules, g, action);
  return { ...next, history: [...g.history, action] };
}

function actInner(rules: ScoreRules, g: DiceGame, action: string): DiceGame {
  if (action.startsWith('roll:')) {
    const mask = action.slice(5);
    let rng = g.rng;
    const dice = (g.dice ?? [1, 1, 1, 1, 1]).map((d, i) => {
      if (mask[i] === '1') return d;
      const [x, next] = nextUint32(rng);
      rng = next;
      return 1 + (x % 6);
    });
    return { ...g, rng, dice, rolls: g.rolls + 1 };
  }
  const box = action.slice(6);
  const hand = handOf(g)!;
  const card = g.cards[g.turn]!;
  const firstRoll = g.rolls === 1;
  const cards = g.cards.map((c, p) =>
    p === g.turn ? { ...c, [box]: rules.scoreFor(card, box, hand, firstRoll) } : c,
  );
  const bonuses = g.bonuses.map((b, p) => (p === g.turn ? b + rules.extraBonus(card, hand) : b));
  if (rules.instantWin?.(hand, firstRoll))
    return { ...g, cards, bonuses, dice: null, rolls: 0, phase: 'over', instant: g.turn };
  const turn = (g.turn + 1) % g.players;
  const over = cards.every((c) => filled(rules, c));
  return { ...g, cards, bonuses, dice: null, rolls: 0, turn, phase: over ? 'over' : 'play' };
}

export const totals = (rules: ScoreRules, g: DiceGame) =>
  g.cards.map((c, p) => rules.total(c, g.bonuses[p]!));

/** The winners: the instant winner, or every player with the top total. */
export function winners(rules: ScoreRules, g: DiceGame): number[] {
  if (g.phase !== 'over') return [];
  if (g.instant !== null) return [g.instant];
  const t = totals(rules, g);
  const top = Math.max(...t);
  return t.flatMap((v, p) => (v === top ? [p] : []));
}

export function isValidDiceGame(rules: ScoreRules, d: unknown): d is DiceGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as DiceGame;
  if (![1, 2, 3, 4].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newDiceGame(s.players, s.seed);
  for (const a of s.history) {
    const next = act(rules, g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.cards, g.bonuses, g.turn, g.dice, g.rolls, g.phase, g.rng]) ===
    JSON.stringify([s.cards, s.bonuses, s.turn, s.dice, s.rolls, s.phase, s.rng])
  );
}

/** Converts the dice to keep (counts per face) into a hold mask over the current dice. */
export function maskFor(dice: readonly number[], keep: Counts): string {
  const left = [...keep];
  return dice
    .map((d) => {
      if (left[d - 1]! > 0) {
        left[d - 1]!--;
        return '1';
      }
      return '0';
    })
    .join('');
}
