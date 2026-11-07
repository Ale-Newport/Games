/**
 * Computer opponents for Gale, after Claude Shannon's own machine for this game: each side's
 * network is treated as an electrical circuit — its bridges are wires, free slots are unit
 * resistors, slots taken by the opponent are cut — and the side with the lower resistance between
 * its two edges is ahead. Searched with alpha-beta (generic agent with a transposition table).
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { S, SLOTS, bridgeEnds, isDot, type GaleState } from './engine';

const WIRE = 200;
const EDGE = 1000;

/** Each seat's dots, numbered 0…29, plus the two edge terminals. */
const DOTS: [number[], number[]] = [[], []];
for (let p = 0; p < S * S; p++)
  for (const seat of [0, 1] as const) if (isDot(seat, Math.floor(p / S), p % S)) DOTS[seat].push(p);
const INDEX: [Map<number, number>, Map<number, number>] = [
  new Map(DOTS[0].map((p, i) => [p, i])),
  new Map(DOTS[1].map((p, i) => [p, i])),
];

/** Effective resistance between seat's two edges (Infinity when they are cut apart). */
export function resistance(bridges: readonly number[], seat: 0 | 1): number {
  const n = DOTS[seat].length;
  // Unknown potentials for the dots; the source edge is held at 1 and the sink at 0.
  const A = Array.from({ length: n }, () => new Float64Array(n + 1));
  const link = (i: number, j: number, g: number) => {
    A[i]![i]! += g;
    A[j]![j]! += g;
    A[i]![j]! -= g;
    A[j]![i]! -= g;
  };
  for (const slot of SLOTS) {
    const owner = bridges[slot];
    if (owner === 2 - seat) continue; // the opponent's bridge cuts this link
    const [a, b] = bridgeEnds(seat, slot);
    const i = INDEX[seat].get(a);
    const j = INDEX[seat].get(b);
    if (i === undefined || j === undefined) continue;
    link(i, j, owner === seat + 1 ? WIRE : 1);
  }
  const atSource = (p: number) => (seat === 0 ? p < S : p % S === 0);
  const atSink = (p: number) => (seat === 0 ? p >= S * (S - 1) : p % S === S - 1);
  DOTS[seat].forEach((p, i) => {
    if (atSource(p)) {
      A[i]![i]! += EDGE;
      A[i]![n]! += EDGE; // right-hand side: EDGE · 1
    } else if (atSink(p)) A[i]![i]! += EDGE;
  });
  // Gaussian elimination with partial pivoting.
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r]![col]!) > Math.abs(A[piv]![col]!)) piv = r;
    [A[col], A[piv]] = [A[piv]!, A[col]!];
    const d = A[col]![col]!;
    if (Math.abs(d) < 1e-12) continue;
    for (let r = col + 1; r < n; r++) {
      const f = A[r]![col]! / d;
      if (f === 0) continue;
      for (let k = col; k <= n; k++) A[r]![k]! -= f * A[col]![k]!;
    }
  }
  const v = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let sum = A[r]![n]!;
    for (let k = r + 1; k < n; k++) sum -= A[r]![k]! * v[k]!;
    const d = A[r]![r]!;
    v[r] = Math.abs(d) < 1e-12 ? 0 : sum / d;
  }
  // Current flowing out of the source edge.
  let current = 0;
  DOTS[seat].forEach((p, i) => {
    if (atSource(p)) current += EDGE * (1 - v[i]!);
  });
  return current < 1e-9 ? Infinity : 1 / current;
}

export function evaluateGale(s: GaleState, player: PlayerId): number {
  const me = player as 0 | 1;
  const mine = resistance(s.bridges, me);
  const theirs = resistance(s.bridges, (1 - me) as 0 | 1);
  if (mine === Infinity && theirs === Infinity) return 0;
  if (mine === Infinity) return -0.99;
  if (theirs === Infinity) return 0.99;
  return Math.tanh(Math.log(theirs / mine));
}

/** Slots near the middle first. */
function order(_s: GaleState, actions: string[]): string[] {
  const dist = (a: string) => {
    const p = Number(a);
    return Math.abs(Math.floor(p / S) - 5) + Math.abs((p % S) - 5);
  };
  return [...actions].sort((a, b) => dist(a) - dist(b));
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<GaleState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateGale(s, player),
    orderActions: order,
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<GaleState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Builds any free bridge.', es: 'Construye cualquier puente libre.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Builds the bridge that lowers its resistance most; a random one 30% of the time.',
      es: 'Construye el puente que más baja su resistencia; uno al azar el 30% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 1), 0.3, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Shannon’s resistance measure, two moves ahead.',
      es: 'La medida de resistencia de Shannon, a dos jugadas.',
    },
    create: () => search('medium', 'Medium', 2),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening for about a second.',
      es: 'Profundización iterativa durante un segundo.',
    },
    create: () => search('hard', 'Hard', 20, 1000),
  },
];
