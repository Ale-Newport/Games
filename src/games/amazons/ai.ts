/**
 * Computer opponents for the Amazons. The evaluation is the classic "minimum distance" territory
 * count: for every empty square, the side whose amazons reach it in fewer queen moves owns it (a
 * tie favors the side to move a little), and an amazon that can no longer move counts against its
 * side. Medium plays the full-width best turn by that count; Hard searches the best few candidates
 * one more ply against every reply, as long as its time allows. Easy is Medium with random turns.
 */
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { ARROW, EMPTY, N, queenTargets, turnsFor, type AmazonsState } from './engine';

const CELLS = N * N;
const FAR = 99;
const DX = [1, -1, 0, 0, 1, -1, 1, -1];
const DY = [0, 0, 1, -1, 1, -1, -1, 1];

/** Queen-move distance from seat's amazons to every square (FAR when unreachable). */
export function queenDistances(board: ArrayLike<number>, seat: 0 | 1, out = new Int8Array(CELLS)) {
  out.fill(FAR);
  const queue = new Int16Array(CELLS);
  let head = 0;
  let tail = 0;
  for (let c = 0; c < CELLS; c++)
    if (board[c] === seat + 1) {
      out[c] = 0;
      queue[tail++] = c;
    }
  while (head < tail) {
    const c = queue[head++]!;
    const d = out[c]! + 1;
    const x0 = c % N;
    const y0 = (c - x0) / N;
    for (let k = 0; k < 8; k++) {
      let x = x0 + DX[k]!;
      let y = y0 + DY[k]!;
      while (x >= 0 && x < N && y >= 0 && y < N) {
        const q = y * N + x;
        if (board[q] !== EMPTY) break;
        if (out[q]! > d) {
          out[q] = d;
          queue[tail++] = q;
        }
        x += DX[k]!;
        y += DY[k]!;
      }
    }
  }
  return out;
}

const mine = new Int8Array(CELLS);
const theirs = new Int8Array(CELLS);

/** Territory balance for `me` (positive is good) with `toMove` to play next. */
export function territory(board: ArrayLike<number>, me: 0 | 1, toMove: 0 | 1): number {
  queenDistances(board, me, mine);
  queenDistances(board, (1 - me) as 0 | 1, theirs);
  const tie = toMove === me ? 0.2 : -0.2;
  let score = 0;
  for (let c = 0; c < CELLS; c++) {
    if (board[c] !== EMPTY) continue;
    const a = mine[c]!;
    const b = theirs[c]!;
    if (a < b) score += 1;
    else if (b < a) score -= 1;
    else if (a < FAR) score += tie;
  }
  // Trapped amazons are lost pieces.
  for (let c = 0; c < CELLS; c++) {
    const x = board[c];
    if (x !== me + 1 && x !== 2 - me) continue;
    if (queenTargets(board, c).length === 0) score += x === me + 1 ? -2 : 2;
  }
  return score;
}

/** Empty squares each side reaches strictly first (the status line's territory count). */
export function reachCounts(board: ArrayLike<number>): [number, number] {
  const a = queenDistances(board, 0, new Int8Array(CELLS));
  const b = queenDistances(board, 1, new Int8Array(CELLS));
  let white = 0;
  let black = 0;
  for (let c = 0; c < CELLS; c++) {
    if (board[c] !== EMPTY) continue;
    if (a[c]! < b[c]!) white++;
    else if (b[c]! < a[c]!) black++;
  }
  return [white, black];
}

/** Normalized evaluation in (−1, 1) for the AI Lab and tests. */
export function evaluateAmazons(s: AmazonsState, player: PlayerId): number {
  return Math.tanh(territory(s.board, player as 0 | 1, s.toMove) / 20);
}

const WIN = 1e6;

/** Scores every turn of `seat` by the territory after it (opponent to move). */
function scoredTurns(board: number[], seat: 0 | 1) {
  const opp = (1 - seat) as 0 | 1;
  return turnsFor(board, seat).map(([f, t, a]) => {
    board[f] = EMPTY;
    board[t] = seat + 1;
    board[a] = ARROW;
    const value = territory(board, seat, opp);
    board[a] = EMPTY;
    board[t] = EMPTY;
    board[f] = seat + 1;
    return { f, t, a, value };
  });
}

export interface AmazonsAgentOptions {
  id: string;
  label: string;
  /** Candidates searched one ply deeper (0 = full-width one-ply only). */
  width: number;
  timeLimitMs?: number;
}

export class AmazonsAgent implements Agent<AmazonsState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;

  constructor(private readonly o: AmazonsAgentOptions) {
    this.id = o.id;
    this.label = o.label;
  }

  selectAction(
    _env: GameEnvironment<AmazonsState, string>,
    state: AmazonsState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const me = player as 0 | 1;
    const opp = (1 - me) as 0 | 1;
    const board = state.board.slice();
    const turns = ctx.rng.shuffle(scoredTurns(board, me)).sort((x, y) => y.value - x.value);
    if (turns.length === 0) throw new Error('AmazonsAgent: no legal turns');
    let best = turns[0]!;
    let bestValue = best.value;
    let nodes = turns.length;
    if (this.o.width > 0) {
      const start = performance.now();
      const budget = ctx.timeLimitMs ?? this.o.timeLimitMs ?? Infinity;
      bestValue = -Infinity;
      for (const [i, m] of turns.slice(0, this.o.width).entries()) {
        if (i >= 2 && performance.now() - start > budget) break;
        board[m.f] = EMPTY;
        board[m.t] = me + 1;
        board[m.a] = ARROW;
        const replies = scoredTurns(board, opp);
        nodes += replies.length;
        const value = replies.length === 0 ? WIN : -Math.max(...replies.map((r) => r.value));
        board[m.a] = EMPTY;
        board[m.t] = EMPTY;
        board[m.f] = me + 1;
        if (value > bestValue) {
          bestValue = value;
          best = m;
        }
      }
    }
    this.lastStats = { nodes, depth: this.o.width > 0 ? 2 : 1, value: Math.tanh(bestValue / 20) };
    return `${best.f}-${best.t}-${best.a}`;
  }
}

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<AmazonsState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Plays any legal turn.', es: 'Juega cualquier turno legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Grabs the most territory for one turn; a random turn 35% of the time.',
      es: 'Busca el mayor territorio en un turno; turno al azar el 35% de las veces.',
    },
    create: () =>
      new EpsilonAgent(new AmazonsAgent({ id: 'easy-core', label: 'Easy core', width: 0 }), 0.35, {
        id: 'easy',
        label: 'Easy',
      }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Plays the turn that leaves it the most territory.',
      es: 'Juega el turno que le deja más territorio.',
    },
    create: () => new AmazonsAgent({ id: 'medium', label: 'Medium', width: 0 }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Checks its best turns against every reply, for about a second and a half.',
      es: 'Comprueba sus mejores turnos contra todas las respuestas durante segundo y medio.',
    },
    create: () => new AmazonsAgent({ id: 'hard', label: 'Hard', width: 12, timeLimitMs: 1500 }),
  },
];
