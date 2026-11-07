/**
 * Colour Rows players: random, a careful player (crosses only numbers that skip nothing, and when
 * it threw and has crossed nothing, the closest number that skips two or fewer) and the planner,
 * which values a sheet by its crosses plus the crosses it can still expect in each row — the
 * numbers left, weighted by how often two dice make them — and, when it threw, plans the white
 * and colour steps together, penalty included.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import {
  CELLS,
  MARKS_TO_LOCK,
  ROWS,
  canMark,
  decider,
  legalActions,
  markOptions,
  numberAt,
  posOf,
  triangle,
  type RowsGame,
  type Sheet,
} from './engine';

/** How often two dice make a number, relative to a 7. */
const WEIGHT = (n: number) => (6 - Math.abs(7 - n)) / 6;

/** The share of the open numbers a row can still expect to cross (tuned by self-play, 0.3–1.2). */
const RHO = 0.8;

/** A sheet's value: crosses plus the crosses each open row can still expect, squared up by row. */
export function sheetValue(g: RowsGame, s: Sheet, locked: boolean[] = g.locked): number {
  let v = -5 * s.penalties;
  for (let r = 0; r < ROWS; r++) {
    const marks = s.marks[r]!;
    const n = marks.length + (s.locks[r] ? 1 : 0);
    let future = 0;
    if (!locked[r] && !s.locks[r]) {
      const last = marks.length ? marks[marks.length - 1]! : -1;
      for (let pos = last + 1; pos < CELLS - 1; pos++) future += WEIGHT(numberAt(r, pos));
      future *= RHO;
      // The lock needs five crosses first; count it (and its bonus) only when that is in reach.
      if (n + future >= MARKS_TO_LOCK) future += 2 * RHO * WEIGHT(numberAt(r, CELLS - 1));
    }
    v += triangle(n + future);
  }
  return v;
}

function withMark(s: Sheet, row: number, n: number): Sheet {
  const pos = posOf(row, n);
  const marks = s.marks.map((m, r) => (r === row ? [...m, pos] : m));
  const locks = s.locks.map((l, r) => l || (r === row && pos === CELLS - 1));
  return { ...s, marks, locks };
}

const withPenalty = (s: Sheet): Sheet => ({ ...s, penalties: s.penalties + 1 });

/** Colour options for the thrower's sheet `s` (after a white step that may have locked a row). */
function colourOptions(g: RowsGame, s: Sheet): [number, number][] {
  const out: [number, number][] = [];
  const d = g.dice!;
  for (let r = 0; r < ROWS; r++) {
    const c = d.colour[r];
    if (c === null || c === undefined || s.locks[r]) continue;
    for (const n of new Set(d.white.map((w) => w + c))) if (canMark(g, s, r, n)) out.push([r, n]);
  }
  return out;
}

export function plannerAction(g: RowsGame): string {
  if (g.phase === 'roll') return 'roll';
  const seat = decider(g);
  const sheet = g.sheets[seat]!;
  if (g.phase === 'colour') {
    let best = 'pass';
    let score = sheetValue(g, g.activeMarked ? sheet : withPenalty(sheet));
    for (const [r, n] of markOptions(g)) {
      const v = sheetValue(g, withMark(sheet, r, n));
      if (v > score) {
        score = v;
        best = `mark:${r}:${n}`;
      }
    }
    return best;
  }
  const whiteOpts: ([number, number] | null)[] = [null, ...markOptions(g)];
  let best = 'pass';
  let score = -Infinity;
  for (const w of whiteOpts) {
    const s1 = w ? withMark(sheet, w[0], w[1]) : sheet;
    let v: number;
    if (seat !== g.active) v = sheetValue(g, s1);
    else {
      // The thrower plans both steps: the best colour follow-up, or a penalty if nothing at all.
      v = sheetValue(g, w ? s1 : withPenalty(s1));
      for (const [r, n] of colourOptions(g, s1)) v = Math.max(v, sheetValue(g, withMark(s1, r, n)));
    }
    if (v > score + 1e-9) {
      score = v;
      best = w ? `mark:${w[0]}:${w[1]}` : 'pass';
    }
  }
  return best;
}

const skipOf = (s: Sheet, row: number, n: number) => {
  const marks = s.marks[row]!;
  return posOf(row, n) - (marks.length ? marks[marks.length - 1]! : -1) - 1;
};

export function carefulAction(g: RowsGame): string {
  if (g.phase === 'roll') return 'roll';
  const sheet = g.sheets[decider(g)]!;
  const opts = markOptions(g).map(([r, n]) => ({ r, n, skip: skipOf(sheet, r, n) }));
  const free = opts.find((o) => o.skip === 0);
  if (free) return `mark:${free.r}:${free.n}`;
  if (g.phase === 'colour' && !g.activeMarked && opts.length) {
    const closest = opts.reduce((a, b) => (b.skip < a.skip ? b : a));
    if (closest.skip <= 2) return `mark:${closest.r}:${closest.n}`;
  }
  return 'pass';
}

class RowsAgent implements Agent<RowsGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (g: RowsGame) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<RowsGame, string>,
    g: RowsGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    const a = this.pick(g);
    return legalActions(g).includes(a) ? a : legalActions(g)[0]!;
  }
}

export const AGENT_PRESETS: AgentPreset<RowsGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal choice.', es: 'Cualquier elección legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'careful',
    kind: 'heuristic',
    label: { en: 'Careful', es: 'Cuidadoso' },
    description: {
      en: 'Crosses only numbers that skip nothing, and avoids a penalty with a short skip.',
      es: 'Solo tacha números que no saltan nada y evita la penalización con un salto corto.',
    },
    create: () => new RowsAgent('careful', 'Careful', carefulAction),
  },
  {
    id: 'planner',
    kind: 'heuristic',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Values every sheet by the crosses it can still expect and plans both steps of its throw.',
      es: 'Valora cada hoja por las cruces que aún puede esperar y planea los dos pasos de su tirada.',
    },
    create: () => new RowsAgent('planner', 'Planner', plannerAction),
  },
];
