/**
 * Summit Rush, a push-your-luck climbing race for 2–4 players: eleven columns, numbered 2 to 12,
 * 3, 5, 7, 9, 11, 13, 11, 9, 7, 5 and 3 steps tall. A turn rolls four dice and pairs them into two
 * sums; three climbers mark this turn's progress on the columns of those sums. A roll with no
 * usable pairing is a bust: the turn's progress is lost. Stopping moves the player's markers up to
 * the climbers; reaching the top of a column claims it for good (nobody else may climb it). The
 * first to claim three columns wins. Dice come from a generator stored in the state.
 *
 * Actions: "roll", "stop", and "climb:<a>" or "climb:<a>,<b>" (the sums to climb with).
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const COLUMNS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const HEIGHT: Record<number, number> = {
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
  7: 13,
  8: 11,
  9: 9,
  10: 7,
  11: 5,
  12: 3,
};
export const CLIMBERS = 3;
export const TO_WIN = 3;

export interface SummitGame {
  seed: number;
  rng: RngState;
  players: number;
  /** Permanent progress per player and column. */
  marks: Record<number, number>[];
  /** Claimed columns: column → player. */
  claimed: Record<number, number>;
  turn: number;
  /** This turn's climbers: column → step reached. */
  climbers: Record<number, number>;
  dice: number[] | null;
  phase: 'roll' | 'choose' | 'over';
  winner: number | null;
  /** What just happened: a bust, or a stop that claimed columns. */
  event: { kind: 'bust' | 'stop'; player: number; claimed: number[] } | null;
  busts: number[];
  history: string[];
}

export function newSummit(players: number, seed: number): SummitGame {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    players,
    marks: Array.from({ length: players }, () => ({})),
    claimed: {},
    turn: 0,
    climbers: {},
    dice: null,
    phase: 'roll',
    winner: null,
    event: null,
    busts: new Array<number>(players).fill(0),
    history: [],
  };
}

/** Where the player to move stands in a column this turn (climber, else marker). */
export const standing = (g: SummitGame, col: number) =>
  g.climbers[col] ?? g.marks[g.turn]![col] ?? 0;

/** Whether one more step can be climbed in a column right now, given the climbers already used. */
function canStep(g: SummitGame, climbers: Record<number, number>, col: number): boolean {
  if (g.claimed[col] !== undefined) return false;
  const at = climbers[col] ?? g.marks[g.turn]![col] ?? 0;
  if (at >= HEIGHT[col]!) return false;
  return climbers[col] !== undefined || Object.keys(climbers).length < CLIMBERS;
}

/** The ways to climb with a roll: lists of sums (one or two). */
export function options(g: SummitGame): number[][] {
  if (!g.dice) return [];
  const [a, b, c, d] = g.dice as [number, number, number, number];
  const pairs: [number, number][] = [
    [a + b, c + d],
    [a + c, b + d],
    [a + d, b + c],
  ];
  const out = new Map<string, number[]>();
  const add = (sums: number[]) => {
    const key = [...sums].sort((x, y) => x - y).join(',');
    if (!out.has(key))
      out.set(
        key,
        [...sums].sort((x, y) => x - y),
      );
  };
  for (const [x, y] of pairs) {
    const climbers = { ...g.climbers };
    const okX = canStep(g, climbers, x);
    if (okX) climbers[x] = (climbers[x] ?? g.marks[g.turn]![x] ?? 0) + 1;
    const okBoth = okX && canStep(g, climbers, y);
    if (okBoth) add([x, y]);
    else {
      // Only one of the two fits: either may be chosen (when each fits alone).
      if (okX) add([x]);
      if (canStep(g, g.climbers, y)) add([y]);
    }
  }
  return [...out.values()];
}

export function legalActions(g: SummitGame): string[] {
  if (g.phase === 'roll') return Object.keys(g.climbers).length ? ['roll', 'stop'] : ['roll'];
  if (g.phase === 'choose') return options(g).map((o) => `climb:${o.join(',')}`);
  return [];
}

const columnsWon = (g: SummitGame, p: number) =>
  Object.values(g.claimed).filter((x) => x === p).length;

function endTurn(g: SummitGame, event: SummitGame['event']): SummitGame {
  return { ...g, climbers: {}, dice: null, phase: 'roll', turn: (g.turn + 1) % g.players, event };
}

export function act(g: SummitGame, action: string): SummitGame {
  if (!legalActions(g).includes(action)) return g;
  const history = [...g.history, action];
  if (action === 'roll') {
    let rng = g.rng;
    const dice = [0, 1, 2, 3].map(() => {
      const [x, next] = nextUint32(rng);
      rng = next;
      return 1 + (x % 6);
    });
    const rolled = { ...g, rng, dice, history, event: null };
    if (!options(rolled).length) {
      const busts = [...g.busts];
      busts[g.turn]!++;
      return endTurn({ ...rolled, busts }, { kind: 'bust', player: g.turn, claimed: [] });
    }
    return { ...rolled, phase: 'choose' };
  }
  if (action === 'stop') {
    const marks = g.marks.map((m) => ({ ...m }));
    const claimed = { ...g.claimed };
    const newly: number[] = [];
    for (const [col, at] of Object.entries(g.climbers)) {
      const c = Number(col);
      marks[g.turn]![c] = at;
      if (at >= HEIGHT[c]!) {
        claimed[c] = g.turn;
        newly.push(c);
        // Everyone else's progress in a claimed column is cleared.
        marks.forEach((m, p) => {
          if (p !== g.turn) delete m[c];
        });
      }
    }
    const next = { ...g, marks, claimed, history };
    if (columnsWon(next, g.turn) >= TO_WIN)
      return {
        ...next,
        climbers: {},
        dice: null,
        phase: 'over',
        winner: g.turn,
        event: { kind: 'stop', player: g.turn, claimed: newly },
      };
    return endTurn(next, { kind: 'stop', player: g.turn, claimed: newly });
  }
  const sums = action.slice(6).split(',').map(Number);
  const climbers = { ...g.climbers };
  for (const s of sums) climbers[s] = (climbers[s] ?? g.marks[g.turn]![s] ?? 0) + 1;
  return { ...g, climbers, dice: null, phase: 'roll', history };
}

export function isValidSummit(d: unknown): d is SummitGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as SummitGame;
  if (![2, 3, 4].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newSummit(s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.marks, g.claimed, g.turn, g.climbers, g.dice, g.phase, g.rng]) ===
    JSON.stringify([s.marks, s.claimed, s.turn, s.climbers, s.dice, s.phase, s.rng])
  );
}

/**
 * The climbing judgement after Michael Keller's "rule of 28": each step is worth more on the
 * outer columns (7 is 1, 6 and 8 are 2, … 2 and 12 are 6) and placing a climber counts once more;
 * a player stops once the turn is worth 28 or more (or would claim a winning column).
 */
export const STEP_WEIGHT: Record<number, number> = {
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 2,
  9: 3,
  10: 4,
  11: 5,
  12: 6,
};

export function turnWorth(g: SummitGame): number {
  let v = 0;
  for (const [col, at] of Object.entries(g.climbers)) {
    const c = Number(col);
    const base = g.marks[g.turn]![c] ?? 0;
    // Every step counts its column's weight, and placing a climber counts once more.
    v += (at - base + 1) * STEP_WEIGHT[c]!;
  }
  return v;
}

/** The exact chance that rolling again now busts (no usable pairing), over the 1296 rolls. */
export function bustChance(g: SummitGame): number {
  let bust = 0;
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let c = 1; c <= 6; c++)
        for (let d = 1; d <= 6; d++) if (!options({ ...g, dice: [a, b, c, d] }).length) bust++;
  return bust / 1296;
}
