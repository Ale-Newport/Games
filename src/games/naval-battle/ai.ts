/**
 * Naval Battle players. They use only their own shot results and the lengths of the enemy ships
 * still afloat (announced as ships sink).
 *
 * - The random player fires at any cell not tried yet.
 * - The hunter fires at random on a checkerboard until it hits, then tries the cells next to its
 *   unsunk hits, along the line when two hits line up.
 * - The analyst counts, for every untried cell, how many placements of the ships still afloat are
 *   consistent with its misses and sunk ships and pass through it — placements through unsunk hits
 *   count many times over — and fires at the most likely cell.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { nextUint32, seedRng } from '../../core/game-engine/random';
import { afloat, SIZE, shipCells, type NavalGame } from './engine';

const pick = (g: NavalGame, cells: number[]) => {
  const [x] = nextUint32(seedRng((g.seed ^ Math.imul(g.history.length + 1, 0x85ebca6b)) >>> 0));
  return cells[x % cells.length]!;
};

const neighbours = (c: number) => {
  const r = Math.floor(c / SIZE);
  const k = c % SIZE;
  return [
    r > 0 ? c - SIZE : -1,
    r < SIZE - 1 ? c + SIZE : -1,
    k > 0 ? c - 1 : -1,
    k < SIZE - 1 ? c + 1 : -1,
  ].filter((x) => x >= 0);
};

export function hunterShot(g: NavalGame): number {
  const shots = g.shots[g.turn];
  const open = Array.from({ length: SIZE * SIZE }, (_, i) => i).filter((i) => !(i in shots));
  const hits = Object.entries(shots)
    .filter(([, r]) => r === 'hit')
    .map(([c]) => Number(c));
  if (hits.length) {
    // Two hits in a row: keep going along that line.
    for (const h of hits) {
      for (const d of [1, SIZE]) {
        if (
          !hits.includes(h + d) ||
          (d === 1 && Math.floor(h / SIZE) !== Math.floor((h + d) / SIZE))
        )
          continue;
        let a = h;
        while (
          hits.includes(a - d) &&
          (d === SIZE || Math.floor((a - d) / SIZE) === Math.floor(a / SIZE))
        )
          a -= d;
        let b = h + d;
        while (
          hits.includes(b + d) &&
          (d === SIZE || Math.floor((b + d) / SIZE) === Math.floor(b / SIZE))
        )
          b += d;
        const ends = [a - d, b + d].filter(
          (x) =>
            x >= 0 &&
            x < SIZE * SIZE &&
            !(x in shots) &&
            (d === SIZE || Math.floor(x / SIZE) === Math.floor(a / SIZE)),
        );
        if (ends.length) return pick(g, ends);
      }
    }
    const next = [...new Set(hits.flatMap(neighbours))].filter((x) => !(x in shots));
    if (next.length) return pick(g, next);
  }
  const parity = open.filter((i) => (Math.floor(i / SIZE) + (i % SIZE)) % 2 === 0);
  return pick(g, parity.length ? parity : open);
}

/** How many placements of the ships still afloat pass through each cell (hits weigh heavily). */
export function density(g: NavalGame, seat: 0 | 1): number[] {
  const shots = g.shots[seat];
  const dens = new Array<number>(SIZE * SIZE).fill(0);
  const hits = new Set(
    Object.entries(shots)
      .filter(([, r]) => r === 'hit')
      .map(([c]) => Number(c)),
  );
  for (const len of afloat(g, seat))
    for (let c = 0; c < SIZE * SIZE; c++)
      for (const v of [false, true]) {
        const cells = shipCells(c, len, v);
        if (!cells || cells.some((x) => shots[x] === 'miss' || shots[x] === 'sunk')) continue;
        const through = cells.filter((x) => hits.has(x)).length;
        const w = through ? 1 + 40 * through : 1;
        for (const x of cells) if (!(x in shots)) dens[x]! += w;
      }
  return dens;
}

export function analystShot(g: NavalGame): number {
  const dens = density(g, g.turn);
  const shots = g.shots[g.turn];
  let best = -1;
  const ties: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (i in shots) continue;
    if (dens[i]! > best) {
      best = dens[i]!;
      ties.length = 0;
    }
    if (dens[i] === best) ties.push(i);
  }
  return pick(g, ties);
}

class NavalAgent implements Agent<NavalGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly shot: (g: NavalGame) => number,
  ) {}
  selectAction(
    _env: GameEnvironment<NavalGame, string>,
    g: NavalGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return `fire:${this.shot(g)}`;
  }
}

export const AGENT_PRESETS: AgentPreset<NavalGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Fires at any untried cell.',
      es: 'Dispara a cualquier casilla sin probar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'hunter',
    kind: 'heuristic',
    label: { en: 'Hunter', es: 'Cazador' },
    description: {
      en: 'Searches on a checkerboard, then closes in around its hits.',
      es: 'Busca en damero y luego cerca sus impactos.',
    },
    create: () => new NavalAgent('hunter', 'Hunter', hunterShot),
  },
  {
    id: 'analyst',
    kind: 'heuristic',
    label: { en: 'Analyst', es: 'Analista' },
    description: {
      en: 'Fires where the ships still afloat fit in the most ways.',
      es: 'Dispara donde caben de más maneras los barcos que quedan a flote.',
    },
    create: () => new NavalAgent('analyst', 'Analyst', analystShot),
  },
];
