/**
 * Hand-throw duels, shared by rock-paper-scissors (#162) and the five-throw version (#163). Two
 * players throw at the same time; with n throws arranged in a circle, a throw beats the (n − 1) / 2
 * throws just before it (for three: paper beats rock, scissors beat paper, rock beats scissors). A
 * match goes to the first to win `target` rounds; tied rounds do not count.
 *
 * Simultaneous throws are modelled as two decisions: seat 0 throws, then seat 1 throws without
 * seeing it (the observation hides the pending throw), then both are revealed.
 *
 * Actions: "throw:<i>".
 */
export interface Duel {
  /** Number of throws (3 or 5). */
  n: number;
  target: number;
  seed: number;
  rounds: { a: number; b: number }[];
  /** Seat 0's throw, waiting for seat 1. */
  pending: number | null;
  wins: [number, number];
  phase: 'play' | 'over';
  winner: 0 | 1 | null;
  history: string[];
}

export function newDuel(n: number, target: number, seed: number): Duel {
  return {
    n,
    target,
    seed: seed >>> 0,
    rounds: [],
    pending: null,
    wins: [0, 0],
    phase: 'play',
    winner: null,
    history: [],
  };
}

/** 1 when a beats b, −1 when b beats a, 0 for a tie. */
export function outcome(n: number, a: number, b: number): number {
  if (a === b) return 0;
  const d = (a - b + n) % n;
  return d <= (n - 1) / 2 ? 1 : -1;
}

/** The throws that beat `x`. */
export const beaters = (n: number, x: number) =>
  Array.from({ length: n }, (_, i) => i).filter((i) => outcome(n, i, x) === 1);

export const current = (g: Duel) => (g.pending === null ? 0 : 1);

export function legalActions(g: Duel): string[] {
  return g.phase === 'play' ? Array.from({ length: g.n }, (_, i) => `throw:${i}`) : [];
}

export function act(g: Duel, action: string): Duel {
  if (!legalActions(g).includes(action)) return g;
  const x = Number(action.slice(6));
  const history = [...g.history, action];
  if (g.pending === null) return { ...g, pending: x, history };
  const round = { a: g.pending, b: x };
  const r = outcome(g.n, round.a, round.b);
  const wins: [number, number] = [g.wins[0] + (r === 1 ? 1 : 0), g.wins[1] + (r === -1 ? 1 : 0)];
  const winner = wins[0] >= g.target ? 0 : wins[1] >= g.target ? 1 : null;
  return {
    ...g,
    rounds: [...g.rounds, round],
    pending: null,
    wins,
    phase: winner === null ? 'play' : 'over',
    winner,
    history,
  };
}

export function isValidDuel(d: unknown, n: number): d is Duel {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Duel;
  if (s.n !== n || ![3, 5, 10].includes(s.target) || !Number.isInteger(s.seed) || s.seed < 0)
    return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newDuel(n, s.target, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.rounds, g.pending, g.wins, g.phase]) ===
    JSON.stringify([s.rounds, s.pending, s.wins, s.phase])
  );
}

/** What a seat sees: seat 1 does not see seat 0's pending throw. */
export const observe = (g: Duel, seat: number): Duel =>
  seat === 1 && g.pending !== null ? { ...g, pending: -1 } : g;
