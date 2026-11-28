/**
 * Fading Empires rules (pure). 2–5 players, a fixed number of rounds (10, 10, 9, 8 for 2–5
 * players). On a turn without an active empire a player picks a people + trait pairing from a row
 * of six (each pairing skipped costs a coin, left on it; coins on the chosen one are taken) and
 * gets their bands. Taking a region costs 2 bands plus the bands defending it (a wild tribe is one),
 * +1 for a mountain, less the people's and trait's discounts (at least 1); the first region of a new
 * empire must be on the valley's edge, later ones next to it. When bands run short, one last
 * attempt may add the reinforcement die (0, 0, 0, 1, 2, 3). Beaten defenders lose a band (two
 * against the Merciless) and their others move to their weakest region; a declined people simply
 * loses its band. Then the attacker spreads its bands over its regions. Instead of attacking, an
 * empire may decline: one band stays on each of its regions, the older declined people leaves the
 * board, and a new pairing is picked next turn. Each turn ends with a coin per region held (active
 * and declined) and the active pairing's bonuses. Most coins after the last round wins. See
 * README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { DIE, PEOPLES, REGIONS, START_COINS, TRAITS, TURNS } from './world';

export const ROW = 6;

export interface Combo {
  people: number;
  trait: number;
  coins: number;
}
export interface Empire {
  people: number;
  trait: number;
  /** Turns played with it (for Wealthy). */
  turns: number;
}
export interface PlayerState {
  coins: number;
  active: Empire | null;
  declined: Empire | null;
  hand: number;
}
export interface Hold {
  p: number;
  declined: boolean;
}
export type Phase =
  | { k: 'pick' }
  | { k: 'start' }
  | { k: 'conquer'; taken: number; heldTaken: number }
  | { k: 'redeploy'; heldTaken: number }
  | { k: 'over' };

export type LogEntry =
  | { k: 'pick'; p: number; people: number; trait: number; paid: number; got: number }
  | { k: 'take'; p: number; r: number; cost: number; from: number | null; tribe: boolean }
  | { k: 'gamble'; p: number; r: number; roll: number; ok: boolean }
  | { k: 'decline'; p: number; people: number }
  | { k: 'score'; p: number; coins: number }
  | { k: 'end'; coins: number[] };

export interface Fading {
  seed: number;
  rng: RngState;
  players: number;
  rounds: number;
  round: number;
  turn: number;
  holds: (Hold | null)[];
  bands: number[];
  tribes: boolean[];
  row: Combo[];
  peopleDeck: number[];
  traitDeck: number[];
  ps: PlayerState[];
  phase: Phase;
  winners: number[];
  log: LogEntry[];
}

export type Action =
  | { t: 'pick'; i: number }
  | { t: 'march' }
  | { t: 'abandon'; r: number }
  | { t: 'decline' }
  | { t: 'take'; r: number }
  | { t: 'gamble'; r: number }
  | { t: 'stop' }
  | { t: 'place'; r: number }
  | { t: 'done' };

/* ---------- setup ---------- */

export function newFading(players: number, seed: number): Fading {
  if (!(players in TURNS)) throw new RangeError('Fading Empires is for 2–5 players');
  const rng = new Rng(seed >>> 0);
  const peopleDeck = rng.shuffle(PEOPLES.map((_, i) => i));
  const traitDeck = rng.shuffle(TRAITS.map((_, i) => i));
  const row: Combo[] = [];
  for (let k = 0; k < ROW; k++)
    row.push({ people: peopleDeck.shift()!, trait: traitDeck.shift()!, coins: 0 });
  return {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    rounds: TURNS[players]!,
    round: 1,
    turn: 0,
    holds: REGIONS.map(() => null),
    bands: REGIONS.map((r) => (r.tribe ? 1 : 0)),
    tribes: REGIONS.map((r) => r.tribe),
    row,
    peopleDeck,
    traitDeck,
    ps: Array.from({ length: players }, () => ({
      coins: START_COINS,
      active: null,
      declined: null,
      hand: 0,
    })),
    phase: { k: 'pick' },
    winners: [],
    log: [],
  };
}

/* ---------- queries ---------- */

export const activeRegions = (g: Fading, p: number) =>
  g.holds.map((h, i) => (h && h.p === p && !h.declined ? i : -1)).filter((i) => i >= 0);
export const heldRegions = (g: Fading, p: number) =>
  g.holds.map((h, i) => (h && h.p === p ? i : -1)).filter((i) => i >= 0);

const peopleId = (e: Empire | null) => (e ? PEOPLES[e.people]!.id : '');
const traitId = (e: Empire | null) => (e ? TRAITS[e.trait]!.id : '');

/** Bands it costs player p's active empire to take region r. */
export function cost(g: Fading, p: number, r: number): number {
  const reg = REGIONS[r]!;
  const e = g.ps[p]!.active;
  const h = g.holds[r];
  // A wild tribe is one defending band, already in bands[r].
  let c = 2 + g.bands[r]! + (reg.terrain === 'mountain' ? 1 : 0);
  const pe = peopleId(e);
  const tr = traitId(e);
  if (pe === 'marshlings' && reg.terrain === 'marsh') c -= 1;
  if (pe === 'ashborn' && reg.feature === 'mine') c -= 1;
  if (pe === 'wildlings' && reg.terrain === 'forest') c -= 1;
  if (pe === 'delvers' && reg.feature === 'cave') c -= 1;
  if (pe === 'raiders' && h && h.p !== p) c -= 1;
  if (tr === 'fierce') c -= 1;
  if (tr === 'mounted' && (reg.terrain === 'hills' || reg.terrain === 'farmland')) c -= 1;
  if (tr === 'seafaring' && reg.shore) c -= 1;
  return Math.max(1, c);
}

/** Regions player p's active empire may attack now. */
export function targets(g: Fading, p: number): number[] {
  const e = g.ps[p]!.active;
  if (!e) return [];
  const mine = activeRegions(g, p);
  const pe = peopleId(e);
  return REGIONS.map((reg, r) => {
    if (reg.terrain === 'lake') return -1;
    const h = g.holds[r];
    if (h && h.p === p && !h.declined) return -1;
    if (pe === 'skyriders') return r;
    if (!mine.length) return reg.border ? r : -1;
    if (reg.adj.some((a) => mine.includes(a))) return r;
    if (
      pe === 'delvers' &&
      reg.feature === 'cave' &&
      mine.some((m) => REGIONS[m]!.feature === 'cave')
    )
      return r;
    return -1;
  }).filter((r) => r >= 0);
}

export const currentPlayer = (g: Fading) => (g.phase.k === 'over' ? -1 : g.turn);

/** Coins the current turn would earn (regions held + the active pairing's bonuses). */
export function turnCoins(g: Fading, p: number, heldTaken: number): number {
  const held = heldRegions(g, p);
  const act = activeRegions(g, p);
  const e = g.ps[p]!.active;
  let n = held.length;
  const count = (f: (r: number) => boolean) => act.filter(f).length;
  const pe = peopleId(e);
  const tr = traitId(e);
  if (pe === 'stonefolk') n += count((r) => REGIONS[r]!.terrain === 'hills');
  if (pe === 'riverkin') n += count((r) => REGIONS[r]!.shore);
  if (pe === 'ashborn') n += count((r) => REGIONS[r]!.feature === 'mine');
  if (pe === 'seers') n += count((r) => REGIONS[r]!.feature === 'spring');
  if (tr === 'highland') n += count((r) => ['hills', 'mountain'].includes(REGIONS[r]!.terrain));
  if (tr === 'woodland') n += count((r) => REGIONS[r]!.terrain === 'forest');
  if (tr === 'farming') n += count((r) => REGIONS[r]!.terrain === 'farmland');
  if (tr === 'pillaging') n += heldTaken;
  if (tr === 'wealthy' && e && e.turns === 0) n += 7;
  return n;
}

/* ---------- legal actions ---------- */

export function legalActions(g: Fading): Action[] {
  const p = g.turn;
  const me = g.ps[p]!;
  const ph = g.phase;
  switch (ph.k) {
    case 'over':
      return [];
    case 'pick':
      return g.row
        .map((_, i) => i)
        .filter((i) => i <= me.coins)
        .map((i) => ({ t: 'pick', i }));
    case 'start':
      return [
        { t: 'march' },
        { t: 'decline' },
        ...activeRegions(g, p).map((r) => ({ t: 'abandon' as const, r })),
      ];
    case 'conquer': {
      const out: Action[] = [];
      for (const r of targets(g, p)) {
        const c = cost(g, p, r);
        if (me.hand >= c) out.push({ t: 'take', r });
        else if (me.hand >= 1 && me.hand + 3 >= c) out.push({ t: 'gamble', r });
      }
      out.push({ t: 'stop' });
      return out;
    }
    case 'redeploy': {
      const mine = activeRegions(g, p);
      if (me.hand > 0 && mine.length) return mine.map((r) => ({ t: 'place', r }));
      const out: Action[] = [{ t: 'done' }];
      if (traitId(me.active) === 'stalwart' && me.active && mine.length) out.push({ t: 'decline' });
      return out;
    }
  }
}

export function isLegal(g: Fading, a: Action): boolean {
  const key = JSON.stringify(a);
  return legalActions(g).some((b) => JSON.stringify(b) === key);
}

/* ---------- transitions ---------- */

const LOG_KEEP = 60;
const log = (g: Fading, e: LogEntry) => {
  g.log = [...g.log, e].slice(-LOG_KEEP);
};

/** An empire leaving the board: its people and trait go back under their decks. */
function retire(g: Fading, e: Empire) {
  g.peopleDeck.push(e.people);
  g.traitDeck.push(e.trait);
}

function decline(g: Fading, p: number) {
  const me = g.ps[p]!;
  // The older declined people leaves the board.
  if (me.declined) {
    g.holds.forEach((h, r) => {
      if (h && h.p === p && h.declined) {
        g.holds[r] = null;
        g.bands[r] = 0;
      }
    });
    retire(g, me.declined);
  }
  for (const r of activeRegions(g, p)) {
    g.holds[r] = { p, declined: true };
    g.bands[r] = 1;
  }
  log(g, { k: 'decline', p, people: me.active!.people });
  me.declined = me.active;
  me.active = null;
  me.hand = 0;
}

/** Takes region r for player p with `used` bands. */
function occupy(g: Fading, p: number, r: number, used: number) {
  const h = g.holds[r];
  const from = h ? h.p : null;
  const tribe = g.tribes[r]!;
  if (h) {
    const owner = g.ps[h.p]!;
    // A declined people's band is simply lost; an active defender's others withdraw.
    if (!h.declined) {
      const loss = traitId(g.ps[p]!.active) === 'merciless' ? 2 : 1;
      const back = Math.max(0, g.bands[r]! - loss);
      g.holds[r] = null;
      // The rest go to the defender's weakest active region, or back to their hand.
      const others = activeRegions(g, h.p);
      if (others.length) {
        const weakest = others.reduce((a, b) => (g.bands[b]! < g.bands[a]! ? b : a), others[0]!);
        g.bands[weakest]! += back;
      } else owner.hand += back;
    }
  }
  g.tribes[r] = false;
  g.holds[r] = { p, declined: false };
  g.bands[r] = used;
  g.ps[p]!.hand -= used;
  log(g, { k: 'take', p, r, cost: used, from, tribe });
  // A declined empire with no regions left is gone.
  if (h && h.declined && !heldRegions(g, h.p).some((x) => g.holds[x]!.declined)) {
    const owner = g.ps[h.p]!;
    if (owner.declined) {
      retire(g, owner.declined);
      owner.declined = null;
    }
  }
}

function endTurn(g: Fading, heldTaken: number) {
  const p = g.turn;
  const me = g.ps[p]!;
  const coins = turnCoins(g, p, heldTaken);
  me.coins += coins;
  log(g, { k: 'score', p, coins });
  if (me.active) me.active.turns += 1;
  g.turn = (g.turn + 1) % g.players;
  if (g.turn === 0) g.round += 1;
  if (g.round > g.rounds) {
    const best = Math.max(...g.ps.map((x) => x.coins));
    g.winners = g.ps.map((x, q) => (x.coins === best ? q : -1)).filter((q) => q >= 0);
    g.phase = { k: 'over' };
    log(g, { k: 'end', coins: g.ps.map((x) => x.coins) });
    return;
  }
  const next = g.ps[g.turn]!;
  g.phase = next.active ? { k: 'start' } : { k: 'pick' };
}

export function act(g0: Fading, a: Action): Fading {
  if (!isLegal(g0, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g: Fading = structuredClone(g0);
  const p = g.turn;
  const me = g.ps[p]!;
  const ph = g.phase;
  switch (a.t) {
    case 'pick': {
      for (let k = 0; k < a.i; k++) g.row[k]!.coins += 1;
      const c = g.row.splice(a.i, 1)[0]!;
      me.coins += c.coins - a.i;
      me.active = { people: c.people, trait: c.trait, turns: 0 };
      me.hand += PEOPLES[c.people]!.bands + TRAITS[c.trait]!.bands;
      log(g, { k: 'pick', p, people: c.people, trait: c.trait, paid: a.i, got: c.coins });
      if (g.peopleDeck.length && g.traitDeck.length)
        g.row.push({ people: g.peopleDeck.shift()!, trait: g.traitDeck.shift()!, coins: 0 });
      g.phase = { k: 'conquer', taken: 0, heldTaken: 0 };
      break;
    }
    case 'march':
      // Every active region keeps one band; the rest are ready to march.
      for (const r of activeRegions(g, p)) {
        me.hand += g.bands[r]! - 1;
        g.bands[r] = 1;
      }
      g.phase = { k: 'conquer', taken: 0, heldTaken: 0 };
      break;
    case 'abandon':
      me.hand += g.bands[a.r]!;
      g.bands[a.r] = 0;
      g.holds[a.r] = null;
      break;
    case 'decline':
      decline(g, p);
      endTurn(g, ph.k === 'redeploy' ? ph.heldTaken : 0);
      break;
    case 'take': {
      if (ph.k !== 'conquer') break;
      const held = g.holds[a.r] !== null && g.holds[a.r]!.p !== p;
      occupy(g, p, a.r, cost(g, p, a.r));
      g.phase = { k: 'conquer', taken: ph.taken + 1, heldTaken: ph.heldTaken + (held ? 1 : 0) };
      break;
    }
    case 'gamble': {
      if (ph.k !== 'conquer') break;
      const rng = new Rng(g.rng);
      let roll = DIE[rng.int(6)]!;
      g.rng = rng.state;
      if (traitId(me.active) === 'lucky') roll = Math.min(3, roll + 1);
      const c = cost(g, p, a.r);
      const ok = me.hand + roll >= c;
      log(g, { k: 'gamble', p, r: a.r, roll, ok });
      let heldTaken = ph.heldTaken;
      if (ok) {
        if (g.holds[a.r] && g.holds[a.r]!.p !== p) heldTaken += 1;
        occupy(g, p, a.r, me.hand);
      }
      // The attempt ends the conquest either way.
      g.phase = { k: 'redeploy', heldTaken };
      break;
    }
    case 'stop':
      if (ph.k === 'conquer') g.phase = { k: 'redeploy', heldTaken: ph.heldTaken };
      break;
    case 'place':
      me.hand -= 1;
      g.bands[a.r]! += 1;
      break;
    case 'done':
      endTurn(g, ph.k === 'redeploy' ? ph.heldTaken : 0);
      break;
  }
  return g;
}

/* ---------- validation ---------- */

export function isValidFading(v: unknown): v is Fading {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as Fading;
  if (!(g.players in TURNS)) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  const n = REGIONS.length;
  if (
    !Array.isArray(g.holds) ||
    g.holds.length !== n ||
    !Array.isArray(g.bands) ||
    g.bands.length !== n
  )
    return false;
  if (!g.bands.every((b) => Number.isInteger(b) && b >= 0)) return false;
  if (!g.holds.every((h, r) => h === null || (h.p >= 0 && h.p < g.players && g.bands[r]! >= 1)))
    return false;
  if (!Array.isArray(g.ps) || g.ps.length !== g.players) return false;
  if (!g.ps.every((x) => Number.isInteger(x.coins) && Number.isInteger(x.hand) && x.hand >= 0))
    return false;
  // Every people and trait is in a deck, in the row or on the board, exactly once.
  const peoples = [
    ...g.peopleDeck,
    ...g.row.map((c) => c.people),
    ...g.ps.flatMap((x) => [x.active, x.declined].filter(Boolean).map((e) => e!.people)),
  ];
  const traits = [
    ...g.traitDeck,
    ...g.row.map((c) => c.trait),
    ...g.ps.flatMap((x) => [x.active, x.declined].filter(Boolean).map((e) => e!.trait)),
  ];
  if (new Set(peoples).size !== peoples.length || peoples.length !== PEOPLES.length) return false;
  if (new Set(traits).size !== traits.length || traits.length !== TRAITS.length) return false;
  const kinds = ['pick', 'start', 'conquer', 'redeploy', 'over'];
  return typeof g.phase === 'object' && g.phase !== null && kinds.includes(g.phase.k);
}
