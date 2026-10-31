/**
 * Riichi players, deciding from what their seat sees (`observe`): own tiles, every discard and
 * meld, the dora indicators and who is in riichi.
 *
 * - The efficient player discards to the fewest tiles from ready (shanten), breaking ties by the
 *   number of unseen tiles that would improve the hand (ukeire); it declares riichi when it can,
 *   takes every win and calls pon only on dragons and its own or the round wind.
 * - The careful player plays the same way but defends: once another player is in riichi and its
 *   own hand is not yet ready, it discards the safest tile it has — tiles that
 *   player already discarded, then "suji" partners of them, then honours already out.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import {
  decider,
  doraIndicators,
  legalActions,
  observe,
  seatWind,
  type RiichiGame,
} from './engine';
import { shanten } from './hand';
import { countsOf, doraOf, EAST, isDragon, isHonor, isTerminal, kindOf, numOf } from './tiles';

/** Copies of each kind the seat can see (own tiles, discards, melds, dora indicators). */
export function visibleCounts(g: RiichiGame, seat: number): number[] {
  const c = countsOf(g.tiles[seat]!.filter((t) => t >= 0));
  for (const ds of g.discards) for (const d of ds) if (!d.called) c[kindOf(d.tile)]!++;
  for (const ms of g.melds) for (const m of ms) for (const t of m.tiles) c[kindOf(t)]!++;
  for (const k of doraIndicators(g)) c[k]!++;
  return c;
}

/** Shanten after discarding each kind, and the unseen tiles that would then improve the hand. */
export function discardTable(
  g: RiichiGame,
  seat: number,
): { kind: number; shanten: number; ukeire: number }[] {
  const c = countsOf(g.tiles[seat]!);
  const melds = g.melds[seat]!.length;
  const seen = visibleCounts(g, seat);
  const out: { kind: number; shanten: number; ukeire: number }[] = [];
  for (let k = 0; k < 34; k++) {
    if (!c[k]) continue;
    c[k]!--;
    const s = shanten(c, melds);
    let uke = 0;
    for (let d = 0; d < 34; d++) {
      const left = 4 - seen[d]!;
      if (left <= 0 || c[d]! >= 4) continue;
      c[d]!++;
      if (shanten(c, melds) < s) uke += left;
      c[d]!--;
    }
    c[k]!++;
    out.push({ kind: k, shanten: s, ukeire: uke });
  }
  return out;
}

/** How dangerous a kind is against the players in riichi (0 = safe). */
function danger(g: RiichiGame, seat: number, k: number): number {
  const threats = [0, 1, 2, 3].filter((s) => s !== seat && g.riichi[s]);
  let worst = 0;
  const seen = visibleCounts(g, seat);
  for (const s of threats) {
    const theirs = new Set(g.discards[s]!.map((d) => kindOf(d.tile)));
    let d: number;
    if (theirs.has(k)) d = 0;
    else if (isHonor(k)) d = seen[k]! >= 3 ? 0.5 : seen[k]! === 2 ? 2 : 4;
    else {
      const n = numOf(k);
      // Suji: 1-4-7, 2-5-8, 3-6-9 — a discarded partner makes the ryanmen wait impossible.
      const partners = [k - 3, k + 3].filter((x) => x >= k - n + 1 && x <= k - n + 9);
      const suji = partners.length > 0 && partners.every((x) => theirs.has(x));
      d = suji ? (isTerminal(k) ? 1 : 2) : isTerminal(k) ? 5 : n === 2 || n === 8 ? 7 : 8;
    }
    worst = Math.max(worst, d);
  }
  return worst;
}

function yakuhaiFor(g: RiichiGame, seat: number, k: number): boolean {
  return isDragon(k) || k === seatWind(g, seat) || k === EAST;
}

/** The careful player folds when this many tiles or more from ready (tuned: 1 beat 2, 3 and never). */
const FOLD_AT = 1;

export function chooseAction(full: RiichiGame, careful: boolean): string {
  const seat = decider(full);
  const g = observe(full, seat);
  const legal = legalActions(full);
  if (legal.length === 1) return legal[0]!;
  if (legal.includes('tsumo')) return 'tsumo';
  if (legal.includes('ron')) return 'ron';
  if (full.phase === 'claim') {
    const k = kindOf(full.claim!.tile);
    if (legal.includes('pon') && yakuhaiFor(g, seat, k)) return 'pon';
    // Already open: pon or chi when it moves the hand closer to ready.
    if (g.melds[seat]!.some((m) => m.open)) {
      const before = shanten(countsOf(g.tiles[seat]!), g.melds[seat]!.length);
      for (const a of legal.filter((x) => x === 'pon' || x.startsWith('chi:'))) {
        const used =
          a === 'pon'
            ? g.tiles[seat]!.filter((t) => kindOf(t) === k).slice(0, 2)
            : a.slice(4).split(',').map(Number);
        const rest = countsOf(g.tiles[seat]!.filter((t) => !used.includes(t)));
        // After the call one tile goes out: the best remaining discard.
        let best = 99;
        for (let d = 0; d < 34; d++)
          if (rest[d]) {
            rest[d]!--;
            best = Math.min(best, shanten(rest, g.melds[seat]!.length + 1));
            rest[d]!++;
          }
        if (best < before) return a;
      }
    }
    return 'pass';
  }
  if (g.riichi[seat]) return legal.find((a) => a.startsWith('discard:'))!;
  const table = discardTable(g, seat);
  const minS = Math.min(...table.map((r) => r.shanten));
  const threatened = careful && [0, 1, 2, 3].some((s) => s !== seat && g.riichi[s]);
  const allowed = new Set(
    legal
      .filter((a) => a.startsWith('discard:') || a.startsWith('riichi:'))
      .map((a) => kindOf(Number(a.split(':')[1]))),
  );
  const dora = new Set(doraIndicators(g).map(doraOf));
  let rows = table.filter((r) => allowed.has(r.kind));
  if (threatened && minS >= FOLD_AT) {
    // Fold: the safest tile, then the one that keeps the hand best.
    rows = [...rows].sort(
      (a, b) =>
        danger(g, seat, a.kind) - danger(g, seat, b.kind) ||
        a.shanten - b.shanten ||
        b.ukeire - a.ukeire,
    );
  } else {
    const isolated = (k: number) => (isHonor(k) ? 2 : isTerminal(k) ? 1 : 0);
    rows = [...rows].sort(
      (a, b) =>
        a.shanten - b.shanten ||
        b.ukeire - a.ukeire ||
        (dora.has(a.kind) ? 1 : 0) - (dora.has(b.kind) ? 1 : 0) ||
        isolated(b.kind) - isolated(a.kind) ||
        (threatened ? danger(g, seat, a.kind) - danger(g, seat, b.kind) : 0),
    );
  }
  const kind = rows[0]!.kind;
  const tile = g.tiles[seat]!.find((t) => kindOf(t) === kind)!;
  if (legal.includes(`riichi:${tile}`) && !(threatened && minS > 0)) return `riichi:${tile}`;
  return `discard:${tile}`;
}

class RiichiAgent implements Agent<RiichiGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly careful: boolean,
  ) {}
  selectAction(
    _env: GameEnvironment<RiichiGame, string>,
    g: RiichiGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return chooseAction(g, this.careful);
  }
}

export const AGENT_PRESETS: AgentPreset<RiichiGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal action.', es: 'Cualquier acción legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'efficient',
    kind: 'heuristic',
    label: { en: 'Efficient', es: 'Eficiente' },
    description: {
      en: 'Discards towards ready by shanten and tile acceptance, declares riichi, calls only value tiles.',
      es: 'Descarta hacia la espera por shanten y aceptación, declara riichi y solo canta fichas de valor.',
    },
    create: () => new RiichiAgent('efficient', 'Efficient', false),
  },
  {
    id: 'careful',
    kind: 'heuristic',
    label: { en: 'Careful', es: 'Prudente' },
    description: {
      en: 'Plays efficiently but folds against riichi with safe tiles when its hand is far from ready.',
      es: 'Juega con eficiencia pero se retira ante un riichi con fichas seguras si su mano está lejos.',
    },
    create: () => new RiichiAgent('careful', 'Careful', true),
  },
];
