/**
 * Riichi mahjong for four players, an East-only game (tonpuusen) from 25 000 points each.
 *
 * A hand: 136 tiles shuffled by the seed and the hand number; 14 form the dead wall (four
 * replacement tiles for kans, dora and ura-dora indicators), each player gets 13 and the dealer
 * draws first. On a turn a player draws, then discards — or declares a win (tsumo), riichi (closed
 * and ready, 1000 points staked), a concealed kan or an added kan. After a discard the others may
 * call it in priority order: ron (a win; the first seat in turn order takes it), pon or open kan,
 * chi (only the next player). A winning hand needs at least one yaku and a player in furiten (a
 * wait among their own discards, or a ron passed since their last discard, or passed after riichi)
 * cannot ron. The hand ends with a win or when the wall runs out (players ready share 3000 from
 * those who are not). The dealer keeps the deal on a win or when ready at a draw (adding a
 * counter, "honba", worth 300 a win); otherwise the deal passes on. The game ends after the fourth
 * dealer passes the deal, or when a score drops below zero.
 *
 * Simplifications, stated in the spec: no red fives, no abortive draws, no kans after riichi, the
 * riichi stake is paid on declaration, and simultaneous rons go to the first seat in turn order.
 *
 * Actions: "discard:<tile>", "riichi:<tile>", "tsumo", "ankan:<kind>", "kakan:<kind>" (turn
 * player); "ron", "pon", "kan", "chi:<tile>,<tile>", "pass" (claims); "next" (after a hand).
 */
import { nextUint32, seedRng } from '../../core/game-engine/random';
import { isComplete, shanten, waits } from './hand';
import { countsOf, EAST, kindOf } from './tiles';
import { payments, scoreHand, type Meld, type Score, type WinContext } from './yaku';

export const START_POINTS = 25_000;

export interface Discard {
  tile: number;
  called: boolean;
  riichi: boolean;
}

export interface Claim {
  tile: number;
  from: number;
  kind: 'discard' | 'chankan';
  /** Seats still to decide, in turn order; the first decides now. */
  queue: number[];
  calls: { seat: number; action: string }[];
}

export interface HandResult {
  kind: 'tsumo' | 'ron' | 'draw';
  winner: number | null;
  from: number | null;
  score: Score | null;
  /** Point changes per seat, honba and riichi sticks included. */
  deltas: number[];
  tenpai: boolean[];
  /** The winner's closed tiles (the winning tile last) and the ura-dora indicators shown. */
  hand: number[];
  ura: number[];
}

export interface RiichiGame {
  seed: number;
  /** Hands dealt so far in the game (shuffles the next wall). */
  hands: number;
  /** Dealer rotations so far (0–3: East 1–4). */
  round: number;
  dealer: number;
  honba: number;
  sticks: number;
  scores: number[];
  wall: number[];
  dead: number[];
  kans: number;
  tiles: number[][];
  melds: Meld[][];
  discards: Discard[][];
  turn: number;
  phase: 'discard' | 'claim' | 'handOver' | 'over';
  /** The tile just drawn (null after a call). */
  drawn: number | null;
  riichi: boolean[];
  doubleRiichi: boolean[];
  ippatsu: boolean[];
  /** Passed a ron: temporary (until the seat's next discard) or, after riichi, for the hand. */
  furiten: boolean[];
  riichiFuriten: boolean[];
  /** No calls yet and still in the first go-around. */
  firstGo: boolean;
  /** The current draw replaced a kan. */
  afterKan: boolean;
  /** Kinds the caller may not discard right after a call. */
  kuikae: number[];
  claim: Claim | null;
  result: HandResult | null;
  winner: number | null;
  history: string[];
}

export const seatWind = (g: RiichiGame, seat: number) => EAST + ((seat - g.dealer + 4) % 4);
export const doraIndicators = (g: RiichiGame) => g.dead.slice(4, 5 + g.kans).map(kindOf);
const uraIndicators = (g: RiichiGame) => g.dead.slice(9, 10 + g.kans).map(kindOf);

function shuffled(seed: number, hand: number): number[] {
  let rng = seedRng((seed ^ Math.imul(hand + 1, 0x9e3779b1)) >>> 0);
  const tiles = Array.from({ length: 136 }, (_, i) => i);
  for (let i = tiles.length - 1; i > 0; i--) {
    const [x, next] = nextUint32(rng);
    rng = next;
    const j = x % (i + 1);
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
  }
  return tiles;
}

const sortTiles = (ts: number[]) => [...ts].sort((a, b) => a - b);

function dealHand(
  base: Omit<RiichiGame, 'wall' | 'dead' | 'tiles' | 'melds' | 'discards' | 'turn' | 'drawn'>,
): RiichiGame {
  const all = shuffled(base.seed, base.hands);
  const dead = all.slice(0, 14);
  const tiles = [0, 1, 2, 3].map((i) =>
    sortTiles(
      all.slice(14 + ((i - base.dealer + 4) % 4) * 13, 14 + (((i - base.dealer + 4) % 4) + 1) * 13),
    ),
  );
  const wall = all.slice(14 + 52);
  const drawn = wall.shift()!;
  tiles[base.dealer] = sortTiles([...tiles[base.dealer]!, drawn]);
  return {
    ...base,
    wall,
    dead,
    tiles,
    melds: [[], [], [], []],
    discards: [[], [], [], []],
    turn: base.dealer,
    drawn,
  };
}

const freshHandFlags = {
  kans: 0,
  phase: 'discard' as const,
  riichi: [false, false, false, false],
  doubleRiichi: [false, false, false, false],
  ippatsu: [false, false, false, false],
  furiten: [false, false, false, false],
  riichiFuriten: [false, false, false, false],
  firstGo: true,
  afterKan: false,
  kuikae: [],
  claim: null,
  result: null,
};

export function newRiichi(seed: number): RiichiGame {
  return dealHand({
    seed: seed >>> 0,
    hands: 0,
    round: 0,
    dealer: 0,
    honba: 0,
    sticks: 0,
    scores: [START_POINTS, START_POINTS, START_POINTS, START_POINTS],
    ...freshHandFlags,
    winner: null,
    history: [],
  });
}

const closedCount = (g: RiichiGame, seat: number) => countsOf(g.tiles[seat]!);
const isMenzen = (g: RiichiGame, seat: number) => g.melds[seat]!.every((m) => !m.open);

function winContext(
  g: RiichiGame,
  seat: number,
  win: number,
  tsumo: boolean,
  extra: Partial<WinContext> = {},
): WinContext {
  const counts = closedCount(g, seat);
  if (!tsumo) counts[win]!++;
  const allKinds = [
    ...g.tiles[seat]!.map(kindOf),
    ...(tsumo ? [] : [win]),
    ...g.melds[seat]!.flatMap((m) => m.tiles.map(kindOf)),
  ];
  return {
    counts,
    melds: g.melds[seat]!,
    win,
    tsumo,
    seatWind: seatWind(g, seat),
    roundWind: EAST,
    dealer: seat === g.dealer,
    riichi: g.riichi[seat]!,
    doubleRiichi: g.doubleRiichi[seat]!,
    ippatsu: g.ippatsu[seat]!,
    last: g.wall.length === 0,
    rinshan: tsumo && g.afterKan,
    chankan: false,
    firstDraw: tsumo && g.firstGo && g.discards[seat]!.length === 0,
    doraIndicators: doraIndicators(g),
    uraIndicators: uraIndicators(g),
    allKinds,
    ...extra,
  };
}

/** The seat's waits (kinds) with a 13-tile closed hand, or [] when not ready. */
export function waitsOf(g: RiichiGame, seat: number): number[] {
  return waits(closedCount(g, seat), g.melds[seat]!.length);
}

const ownDiscardKinds = (g: RiichiGame, seat: number) =>
  g.discards[seat]!.map((d) => kindOf(d.tile));

function inFuriten(g: RiichiGame, seat: number): boolean {
  if (g.furiten[seat] || g.riichiFuriten[seat]) return true;
  const own = new Set(ownDiscardKinds(g, seat));
  return waitsOf(g, seat).some((k) => own.has(k));
}

/** Whether the seat may ron on this tile now. */
export function canRon(g: RiichiGame, seat: number, tile: number, chankan = false): boolean {
  const k = kindOf(tile);
  const c = closedCount(g, seat);
  c[k]!++;
  if (!isComplete(c, g.melds[seat]!.length)) return false;
  if (inFuriten(g, seat)) return false;
  return scoreHand(winContext(g, seat, k, false, { chankan })) !== null;
}

export function canTsumo(g: RiichiGame): boolean {
  if (g.phase !== 'discard' || g.drawn === null) return false;
  const seat = g.turn;
  const c = closedCount(g, seat);
  if (!isComplete(c, g.melds[seat]!.length)) return false;
  return scoreHand(winContext(g, seat, kindOf(g.drawn), true)) !== null;
}

/** Tiles whose discard leaves a closed, ready hand (for riichi). */
export function riichiDiscards(g: RiichiGame): number[] {
  const seat = g.turn;
  if (
    g.riichi[seat] ||
    !isMenzen(g, seat) ||
    g.scores[seat]! < 1000 ||
    g.wall.length < 4 ||
    g.drawn === null
  )
    return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const t of g.tiles[seat]!) {
    if (seen.has(kindOf(t))) continue;
    seen.add(kindOf(t));
    const c = closedCount(g, seat);
    c[kindOf(t)]!--;
    if (shanten(c, g.melds[seat]!.length) === 0)
      out.push(...g.tiles[seat]!.filter((x) => kindOf(x) === kindOf(t)));
  }
  return out;
}

/** The claims a seat could make on a discard. */
export function claimOptions(
  g: RiichiGame,
  seat: number,
  tile: number,
  from: number,
  kind: Claim['kind'],
): string[] {
  const out: string[] = [];
  if (canRon(g, seat, tile, kind === 'chankan')) out.push('ron');
  if (kind === 'chankan' || g.riichi[seat] || g.wall.length === 0) return out;
  const k = kindOf(tile);
  const same = g.tiles[seat]!.filter((t) => kindOf(t) === k);
  if (same.length >= 2) out.push('pon');
  if (same.length >= 3 && g.kans < 4) out.push('kan');
  if (seat === (from + 1) % 4 && k < 27) {
    const pick = (kk: number) => g.tiles[seat]!.find((t) => kindOf(t) === kk);
    const n = k % 9;
    for (const [a, b] of [
      [k - 2, k - 1],
      [k - 1, k + 1],
      [k + 1, k + 2],
    ] as const) {
      if (a < k - n || b > k - n + 8) continue;
      const ta = pick(a);
      const tb = pick(b);
      if (ta !== undefined && tb !== undefined) out.push(`chi:${ta},${tb}`);
    }
  }
  return out;
}

export function legalActions(g: RiichiGame): string[] {
  if (g.phase === 'over') return [];
  if (g.phase === 'handOver') return ['next'];
  if (g.phase === 'claim') {
    const c = g.claim!;
    return ['pass', ...claimOptions(g, c.queue[0]!, c.tile, c.from, c.kind)];
  }
  const seat = g.turn;
  const out: string[] = [];
  if (canTsumo(g)) out.push('tsumo');
  if (g.riichi[seat]) {
    out.push(`discard:${g.drawn!}`);
    return out;
  }
  for (const t of g.tiles[seat]!) if (!g.kuikae.includes(kindOf(t))) out.push(`discard:${t}`);
  for (const t of riichiDiscards(g)) out.push(`riichi:${t}`);
  if (g.drawn !== null && g.wall.length > 0 && g.kans < 4) {
    const c = closedCount(g, seat);
    for (let k = 0; k < 34; k++) if (c[k] === 4) out.push(`ankan:${k}`);
    for (const m of g.melds[seat]!)
      if (m.type === 'pon' && c[m.kind] === 1) out.push(`kakan:${m.kind}`);
  }
  return out;
}

/** The seat that decides now. */
export const decider = (g: RiichiGame) => (g.phase === 'claim' ? g.claim!.queue[0]! : g.turn);

function endHand(g: RiichiGame, result: HandResult): RiichiGame {
  const scores = g.scores.map((s, i) => s + result.deltas[i]!);
  const dealerKeeps =
    result.winner === g.dealer || (result.kind === 'draw' && result.tenpai[g.dealer]!);
  const honba = dealerKeeps || result.kind === 'draw' ? g.honba + 1 : 0;
  const round = dealerKeeps ? g.round : g.round + 1;
  const over = scores.some((s) => s < 0) || round >= 4;
  const next = {
    ...g,
    scores,
    result,
    honba,
    round,
    dealer: dealerKeeps ? g.dealer : (g.dealer + 1) % 4,
    sticks: result.kind === 'draw' ? g.sticks : 0,
    claim: null,
    phase: 'handOver' as const,
  };
  if (!over) return next;
  // Left-over riichi sticks go to the leader; ties go to the seat nearest the first dealer.
  const final = [...scores];
  const top = final.indexOf(Math.max(...final));
  final[top]! += next.sticks * 1000;
  return { ...next, scores: final, sticks: 0, phase: 'over', winner: top };
}

function win(
  g: RiichiGame,
  seat: number,
  from: number | null,
  tile: number,
  ctx: WinContext,
): RiichiGame {
  const score = scoreHand(ctx)!;
  const deltas = payments(score.basic, seat, g.dealer, from);
  // Honba: 300 a win, paid by the discarder or 100 by each on a tsumo; riichi sticks to the winner.
  if (from !== null) {
    deltas[from]! -= 300 * g.honba;
    deltas[seat]! += 300 * g.honba;
  } else
    for (let s = 0; s < 4; s++)
      if (s !== seat) {
        deltas[s]! -= 100 * g.honba;
        deltas[seat]! += 100 * g.honba;
      }
  deltas[seat]! += 1000 * g.sticks;
  const hand =
    from === null ? [...g.tiles[seat]!.filter((t) => t !== tile), tile] : [...g.tiles[seat]!, tile];
  return endHand(g, {
    kind: from === null ? 'tsumo' : 'ron',
    winner: seat,
    from,
    score,
    deltas,
    tenpai: [false, false, false, false],
    hand,
    ura: g.riichi[seat] ? uraIndicators(g).map((k) => k) : [],
  });
}

function exhaustiveDraw(g: RiichiGame): RiichiGame {
  const tenpai = [0, 1, 2, 3].map((s) => shanten(closedCount(g, s), g.melds[s]!.length) === 0);
  const n = tenpai.filter(Boolean).length;
  const deltas = tenpai.map((t) => (n === 0 || n === 4 ? 0 : t ? 3000 / n : -3000 / (4 - n)));
  return endHand(g, {
    kind: 'draw',
    winner: null,
    from: null,
    score: null,
    deltas,
    tenpai,
    hand: [],
    ura: [],
  });
}

/** Draws for `seat` (from the wall, or a kan replacement), or ends the hand when the wall is empty. */
function drawFor(g: RiichiGame, seat: number, replacement = false): RiichiGame {
  if (replacement) {
    const t = g.dead[g.kans - 1]!;
    // The live wall gives up its last tile to keep the dead wall at fourteen.
    const wall = g.wall.slice(0, -1);
    return {
      ...g,
      wall,
      turn: seat,
      drawn: t,
      tiles: g.tiles.map((h, i) => (i === seat ? sortTiles([...h, t]) : h)),
      afterKan: true,
      kuikae: [],
      claim: null,
      phase: 'discard',
    };
  }
  if (!g.wall.length) return exhaustiveDraw(g);
  const [t, ...wall] = g.wall;
  return {
    ...g,
    wall,
    turn: seat,
    drawn: t!,
    tiles: g.tiles.map((h, i) => (i === seat ? sortTiles([...h, t!]) : h)),
    afterKan: false,
    kuikae: [],
    claim: null,
    phase: 'discard',
  };
}

function openClaims(g: RiichiGame, tile: number, from: number, kind: Claim['kind']): Claim | null {
  const queue = [1, 2, 3]
    .map((d) => (from + d) % 4)
    .filter((s) => claimOptions(g, s, tile, from, kind).length > 0);
  return queue.length ? { tile, from, kind, queue, calls: [] } : null;
}

function resolveClaims(g: RiichiGame): RiichiGame {
  const c = g.claim!;
  // Passing a possible ron is furiten: until the next own discard, or for the hand after riichi.
  let next = g;
  for (const { seat, action } of c.calls)
    if (action === 'pass' && canRon(g, seat, c.tile, c.kind === 'chankan')) {
      next = g.riichi[seat]
        ? { ...next, riichiFuriten: next.riichiFuriten.map((f, i) => f || i === seat) }
        : { ...next, furiten: next.furiten.map((f, i) => f || i === seat) };
    }
  const order = [1, 2, 3].map((d) => (c.from + d) % 4);
  const byOrder = [...c.calls].sort((a, b) => order.indexOf(a.seat) - order.indexOf(b.seat));
  const ron = byOrder.find((x) => x.action === 'ron');
  if (ron)
    return win(
      next,
      ron.seat,
      c.from,
      c.tile,
      winContext(next, ron.seat, kindOf(c.tile), false, { chankan: c.kind === 'chankan' }),
    );
  if (c.kind === 'chankan') {
    // Nobody robbed the kan: it stands, and the declarer draws a replacement.
    return drawFor({ ...next, claim: null }, c.from, true);
  }
  const call =
    byOrder.find((x) => x.action === 'pon' || x.action === 'kan') ??
    byOrder.find((x) => x.action.startsWith('chi:'));
  const discards = next.discards.map((d, i) =>
    i === c.from ? d.map((x, j) => (j === d.length - 1 ? { ...x, called: true } : x)) : d,
  );
  if (!call) return drawFor({ ...next, claim: null }, (c.from + 1) % 4);
  const seat = call.seat;
  const k = kindOf(c.tile);
  let used: number[];
  let meld: Meld;
  if (call.action === 'pon' || call.action === 'kan') {
    used = next.tiles[seat]!.filter((t) => kindOf(t) === k).slice(0, call.action === 'pon' ? 2 : 3);
    meld = { type: call.action, kind: k, open: true, tiles: sortTiles([...used, c.tile]) };
  } else {
    used = call.action.slice(4).split(',').map(Number);
    meld = {
      type: 'chi',
      kind: Math.min(k, ...used.map(kindOf)),
      open: true,
      tiles: sortTiles([...used, c.tile]),
    };
  }
  const called: RiichiGame = {
    ...next,
    discards,
    tiles: next.tiles.map((h, i) => (i === seat ? h.filter((t) => !used.includes(t)) : h)),
    melds: next.melds.map((m, i) => (i === seat ? [...m, meld] : m)),
    firstGo: false,
    ippatsu: [false, false, false, false],
    claim: null,
    turn: seat,
    drawn: null,
    phase: 'discard',
  };
  if (call.action === 'kan') return drawFor({ ...called, kans: called.kans + 1 }, seat, true);
  // Kuikae: no discarding the called kind (or, for a chi, the other end of the run) at once.
  const ban = [k];
  if (meld.type === 'chi') {
    if (k === meld.kind && (k % 9) + 3 <= 8) ban.push(k + 3);
    if (k === meld.kind + 2 && k % 9 >= 3) ban.push(k - 3);
  }
  const kuikae = ban.filter((b) => called.tiles[seat]!.some((t) => kindOf(t) === b));
  // A call with nothing else left to discard is not possible in practice; keep at least one choice.
  return {
    ...called,
    kuikae: kuikae.length < new Set(called.tiles[seat]!.map(kindOf)).size ? kuikae : [],
  };
}

export function act(g: RiichiGame, action: string): RiichiGame {
  if (!legalActions(g).includes(action)) return g;
  const history = [...g.history, action];
  const next = actInner(g, action);
  return { ...next, history };
}

function actInner(g: RiichiGame, action: string): RiichiGame {
  if (action === 'next') {
    const base = {
      ...g,
      ...freshHandFlags,
      hands: g.hands + 1,
      riichi: [false, false, false, false],
      doubleRiichi: [false, false, false, false],
      ippatsu: [false, false, false, false],
      furiten: [false, false, false, false],
      riichiFuriten: [false, false, false, false],
      kuikae: [],
    };
    return dealHand(base);
  }
  if (g.phase === 'claim') {
    const c = g.claim!;
    const seat = c.queue[0]!;
    const claim = { ...c, queue: c.queue.slice(1), calls: [...c.calls, { seat, action }] };
    // A ron by the first seat in turn order cannot be overtaken: settle at once.
    const next = { ...g, claim };
    if (claim.queue.length && !(action === 'ron' && seat === (c.from + 1) % 4)) return next;
    return resolveClaims(next);
  }
  const seat = g.turn;
  if (action === 'tsumo')
    return win(g, seat, null, g.drawn!, winContext(g, seat, kindOf(g.drawn!), true));
  if (action.startsWith('ankan:') || action.startsWith('kakan:')) {
    const k = Number(action.slice(6));
    if (action.startsWith('ankan:')) {
      const used = g.tiles[seat]!.filter((t) => kindOf(t) === k);
      const melds = g.melds.map((m, i) =>
        i === seat ? [...m, { type: 'kan' as const, kind: k, open: false, tiles: used }] : m,
      );
      const tiles = g.tiles.map((h, i) => (i === seat ? h.filter((t) => kindOf(t) !== k) : h));
      return drawFor(
        {
          ...g,
          melds,
          tiles,
          kans: g.kans + 1,
          firstGo: false,
          ippatsu: [false, false, false, false],
        },
        seat,
        true,
      );
    }
    const t = g.tiles[seat]!.find((x) => kindOf(x) === k)!;
    const melds = g.melds.map((m, i) =>
      i === seat
        ? m.map((x) =>
            x.type === 'pon' && x.kind === k
              ? { ...x, type: 'kan' as const, tiles: sortTiles([...x.tiles, t]) }
              : x,
          )
        : m,
    );
    const tiles = g.tiles.map((h, i) => (i === seat ? h.filter((x) => x !== t) : h));
    const after = {
      ...g,
      melds,
      tiles,
      kans: g.kans + 1,
      firstGo: false,
      ippatsu: [false, false, false, false],
    };
    // Others may rob the added tile (chankan).
    const claim = openClaims(after, t, seat, 'chankan');
    return claim ? { ...after, claim, phase: 'claim' } : drawFor(after, seat, true);
  }
  // A discard, possibly declaring riichi.
  const isRiichi = action.startsWith('riichi:');
  const t = Number(action.split(':')[1]);
  const tiles = g.tiles.map((h, i) => (i === seat ? h.filter((x) => x !== t) : h));
  const discards = g.discards.map((d, i) =>
    i === seat ? [...d, { tile: t, called: false, riichi: isRiichi }] : d,
  );
  let next: RiichiGame = {
    ...g,
    tiles,
    discards,
    drawn: null,
    kuikae: [],
    afterKan: false,
    furiten: g.furiten.map((f, i) => (i === seat ? false : f)),
    ippatsu: g.ippatsu.map((x, i) => (i === seat ? isRiichi : x)),
  };
  if (isRiichi) {
    next = {
      ...next,
      riichi: next.riichi.map((x, i) => x || i === seat),
      doubleRiichi: next.doubleRiichi.map(
        (x, i) => x || (i === seat && g.firstGo && g.discards[seat]!.length === 0),
      ),
      scores: next.scores.map((s, i) => (i === seat ? s - 1000 : s)),
      sticks: next.sticks + 1,
    };
  }
  // The first go-around ends once the last seat before the dealer has discarded.
  if (seat === (g.dealer + 3) % 4) next = { ...next, firstGo: false };
  const claim = openClaims(next, t, seat, 'discard');
  if (claim) return { ...next, claim, phase: 'claim' };
  return drawFor(next, (seat + 1) % 4);
}

/** What a seat may see: its own tiles; the others' closed tiles, the walls and their draws hidden. */
export function observe(g: RiichiGame, seat: number): RiichiGame {
  if (g.phase === 'handOver' || g.phase === 'over')
    return {
      ...g,
      wall: g.wall.map(() => -1),
      dead: g.dead.map((t, i) => (i >= 4 && i < 5 + g.kans ? t : -1)),
    };
  return {
    ...g,
    tiles: g.tiles.map((h, i) => (i === seat ? h : h.map(() => -1))),
    wall: g.wall.map(() => -1),
    dead: g.dead.map((t, i) => (i >= 4 && i < 5 + g.kans ? t : -1)),
    drawn: g.turn === seat ? g.drawn : g.drawn === null ? null : -1,
  };
}

export function isValidRiichi(d: unknown): d is RiichiGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as RiichiGame;
  if (!Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newRiichi(s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.tiles, g.melds, g.scores, g.turn, g.phase, g.wall.length, g.hands]) ===
    JSON.stringify([s.tiles, s.melds, s.scores, s.turn, s.phase, s.wall?.length, s.hands])
  );
}
