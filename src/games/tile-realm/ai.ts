/**
 * Tile Realm computer players. They see the board, the wardens, the scores, the tile in hand and
 * how many tiles of each type are left (public, as players can count) — never the bag order.
 *
 * - Apprentice: takes the placement that completes the most for itself right now, and stands a
 *   warden on the new tile's biggest unclaimed town, road or shrine while it has wardens to spare.
 * - Master: evaluates every placement and warden choice by the board it leaves: each feature's
 *   expected worth (points if finished, weighted by how likely its open sides are to close with
 *   the tiles left, or its unfinished value at the end), who holds it, meadow value against towns
 *   later in the game, and the worth of wardens still in hand — minus the best rival's share.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import {
  analyze,
  boardIndex,
  holders,
  legalActions,
  placements,
  shrineNeighbours,
  WARDENS,
  wardenSpots,
  type Action,
  type Feature,
  type Realm,
} from './engine';
import { TILE_TYPES, TOTAL_TILES } from './tiles';

export type Style = 'apprentice' | 'master';

/** Expected worth of a feature for its holders, from the master's point of view. */
function potential(g: Realm, a: ReturnType<typeof analyze>, F: Feature, left: number): number {
  const late = 1 - left / TOTAL_TILES;
  switch (F.kind) {
    case 'road': {
      if (F.complete) return F.tiles.size;
      const pc = Math.min(0.9, left / (8 * F.open + 4));
      return F.tiles.size * (pc + (1 - pc) * 1);
    }
    case 'town': {
      const base = F.tiles.size + F.banners;
      if (F.complete) return 2 * base;
      const pc = Math.min(0.85, left / (10 * F.open + 6));
      return base * (2 * pc + (1 - pc));
    }
    case 'shrine': {
      const n = shrineNeighbours(g, boardIndex(g), F.nodes[0]![0]);
      return 1 + n + (8 - n) * Math.min(0.8, left / 30);
    }
    case 'meadow': {
      let v = 0;
      for (const r of F.towns) {
        const T = a.features.get(r);
        if (!T) continue;
        v += T.complete ? 3 : 3 * Math.min(0.7, 0.3 + late * 0.5);
      }
      return v;
    }
  }
}

/** The master's view of a board for player p. */
function evaluate(g: Realm, p: number, left: number): number {
  const a = analyze(g);
  const val = Array<number>(g.players).fill(0);
  for (const F of a.features.values()) {
    const who = holders(F);
    if (!who.length) continue;
    const v = potential(g, a, F, left);
    for (const q of who) val[q]! += v;
  }
  const late = 1 - left / TOTAL_TILES;
  for (let q = 0; q < g.players; q++) {
    const free = WARDENS - g.wardens.filter((w) => w.p === q).length;
    val[q]! += g.scores[q]! + free * (1.6 * (1 - late) + 0.2);
  }
  const best = Math.max(...val.filter((_, q) => q !== p));
  return val[p]! - best;
}

/** Applies a placement (and its immediate scoring) without drawing the next tile. */
function preview(g: Realm, a: Action): Realm {
  const next: Realm = {
    ...g,
    board: [...g.board, { x: a.x, y: a.y, type: g.current!, rot: a.r }],
    wardens:
      a.warden === null
        ? g.wardens
        : [...g.wardens, { tile: g.board.length, feature: a.warden, p: g.turn }],
    scores: [...g.scores],
  };
  const an = analyze(next);
  const done = new Set<number>();
  for (const [r, F] of an.features) {
    if (!F.complete || F.kind === 'meadow') continue;
    const who = holders(F);
    if (!who.length) continue;
    const v =
      F.kind === 'road' ? F.tiles.size : F.kind === 'town' ? 2 * (F.tiles.size + F.banners) : 9;
    for (const q of who) next.scores[q]! += v;
    done.add(r);
  }
  if (done.size)
    next.wardens = next.wardens.filter((w) => !done.has(an.root.get(w.tile * 16 + w.feature)!));
  return next;
}

export function decide(g: Realm, style: Style, rng: Rng): Action {
  const p = g.turn;
  const type = g.current!;
  const left = g.bag.length;
  if (style === 'apprentice') {
    let best: Action | null = null;
    let bv = -Infinity;
    for (const [x, y, r] of placements(g, type)) {
      const base: Action = { t: 'place', x, y, r, warden: null };
      const after = preview(g, base);
      const gain = after.scores[p]! - g.scores[p]!;
      let v = gain + rng.float() * 0.01;
      let warden: number | null = null;
      if (WARDENS - g.wardens.filter((w) => w.p === p).length >= 3) {
        const spots = wardenSpots(g, x, y, type, r).filter(
          (f) => TILE_TYPES[type]!.features[f]!.kind !== 'meadow',
        );
        if (spots.length) {
          const a2 = analyze(after);
          const size = (f: number) =>
            a2.features.get(a2.root.get(g.board.length * 16 + f)!)!.tiles.size;
          warden = spots.reduce((b, f) => (size(f) > size(b) ? f : b), spots[0]!);
          v += 0.5 + size(warden) * 0.2;
        }
      }
      if (v > bv) {
        bv = v;
        best = { ...base, warden };
      }
    }
    return best ?? legalActions(g)[0]!;
  }
  let best: Action | null = null;
  let bv = -Infinity;
  for (const a of legalActions(g)) {
    const v = evaluate(preview(g, a), p, left) + rng.float() * 0.001;
    if (v > bv) {
      bv = v;
      best = a;
    }
  }
  return best!;
}

class RealmAgent implements Agent<Realm, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Realm, Action>, g: Realm, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Realm, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal placement.', es: 'Cualquier colocación legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'apprentice',
    kind: 'heuristic',
    label: { en: 'Apprentice', es: 'Aprendiz' },
    description: {
      en: 'Completes what it can now and claims the biggest feature of each new tile.',
      es: 'Completa lo que puede ya y ocupa el elemento más grande de cada pieza nueva.',
    },
    create: () => new RealmAgent('apprentice', 'Apprentice', 'apprentice'),
  },
  {
    id: 'master',
    kind: 'search',
    label: { en: 'Master', es: 'Maestro' },
    description: {
      en: 'Weighs every placement and warden by the expected worth of the board it leaves — finishing odds, meadows, wardens in hand — against the best rival.',
      es: 'Valora cada colocación y guardián por lo que vale el tablero resultante —probabilidad de cerrar, praderas, guardianes en mano— frente al mejor rival.',
    },
    create: () => new RealmAgent('master', 'Master', 'master'),
  },
];
