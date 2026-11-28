/**
 * Global Front rules (pure). Four powers in two alliances take turns (Varn, Kelt, Ossia, Tamar):
 *
 * 1. Buy units with the treasury (none while the power's capital is in enemy hands).
 * 2. Combat moves: land units through friendly land into one enemy territory; armour 2 steps;
 *    air units anywhere within range if they can still reach friendly land afterwards; warships
 *    through open water into enemy fleets; transports carry up to two land units from a coast to an
 *    enemy coast ("sail") through water free of enemy warships.
 * 3. Battles, one place at a time: every unit rolls a die each round, hitting on its attack (or
 *    defence) value or less; artillery lifts one infantry to 2; casualties go cheapest first
 *    (battleships absorb their first hit, transports go last and are lost when undefended). The
 *    attacker may retreat after any round. Land units that win take the territory (an ally's is
 *    given back); air units then fly home to friendly land in range or are lost.
 * 4. Other moves through friendly ground and water.
 * 5. Place the units bought: land and air on own factories (up to each territory's value), ships
 *    in water next to them.
 * 6. Collect income: the value of every territory held, while the capital stands.
 *
 * Taking a capital takes its treasury. An alliance holding 9 of the 12 victory cities at the end
 * of a round wins; after 15 rounds, most cities (then income) wins. Dice come from a generator
 * stored in the state. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  CAPITALS,
  CITIES,
  isSea,
  KINDS,
  LOCS,
  MAX_ROUNDS,
  openingUnits,
  POWERS,
  sideOf,
  TRANSPORT_CAPACITY,
  unitType,
  WIN_CITIES,
  type UnitKind,
} from './world';

export interface Unit {
  id: number;
  kind: UnitKind;
  owner: number;
  loc: number;
  /** Steps moved this turn. */
  moved: number;
  /** Damage taken (battleships). */
  hits: number;
  /** Took part in an attack this turn (no other moves). */
  fought: boolean;
}

export type Phase = 'buy' | 'combat' | 'battle' | 'move' | 'place' | 'over';

export interface BattleState {
  loc: number;
  round: number;
  /** Where each attacking unit came from (for a retreat). */
  from: Record<number, number>;
  last: { a: number[]; d: number[]; aHits: number; dHits: number } | null;
}

export type LogEntry =
  | { k: 'buy'; p: number; kinds: UnitKind[]; spent: number }
  | {
      k: 'battle';
      p: number;
      loc: number;
      won: boolean | null;
      lostA: number;
      lostD: number;
      retreat?: boolean;
    }
  | { k: 'capture'; p: number; loc: number; to: number; capital: boolean; plunder: number }
  | { k: 'air-lost'; p: number; n: number }
  | { k: 'income'; p: number; n: number }
  | { k: 'end'; side: number; cities: [number, number] };

export interface Front {
  seed: number;
  rng: RngState;
  round: number;
  power: number;
  phase: Phase;
  owner: number[];
  /** Owner of each territory when this power's turn began (for landing and placement). */
  startOwner: number[];
  units: Unit[];
  nextId: number;
  treasury: number[];
  bought: UnitKind[];
  /** Places still to fight this turn, the first being fought now. */
  battles: number[];
  battle: BattleState | null;
  /** Combat-move origins of attacking units (for retreats). */
  origins: Record<number, number>;
  winner: number | null;
  log: LogEntry[];
}

export type Action =
  | { t: 'buy'; kind: UnitKind }
  | { t: 'unbuy'; kind: UnitKind }
  | { t: 'move'; kind: UnitKind; from: number; to: number; n: number }
  | { t: 'sail'; from: number; sea: number; to: number; kinds: UnitKind[] }
  | { t: 'roll' }
  | { t: 'retreat' }
  | { t: 'place'; kind: UnitKind; loc: number }
  | { t: 'next' };

/* ---------- setup ---------- */

export function newFront(seed: number): Front {
  const units: Unit[] = openingUnits().map((u, i) => ({
    id: i,
    ...u,
    moved: 0,
    hits: 0,
    fought: false,
  }));
  const owner = LOCS.map((l) => l.owner);
  return {
    seed: seed >>> 0,
    rng: new Rng(seed >>> 0).state,
    round: 1,
    power: 0,
    phase: 'buy',
    owner,
    startOwner: [...owner],
    units,
    nextId: units.length,
    treasury: POWERS.map((_, p) => income({ owner } as Front, p)),
    bought: [],
    battles: [],
    battle: null,
    origins: {},
    winner: null,
    log: [],
  };
}

/* ---------- queries ---------- */

export const allied = (a: number, b: number) => a >= 0 && b >= 0 && sideOf(a) === sideOf(b);
export const enemyOf = (p: number, owner: number) => owner >= 0 && !allied(p, owner);

/** Income of power p: its territories' values, nothing while its capital is in enemy hands. */
export function income(g: Pick<Front, 'owner'>, p: number): number {
  if (!allied(p, g.owner[CAPITALS[p]!]!)) return 0;
  return g.owner.reduce((a, o, i) => a + (o === p ? LOCS[i]!.value : 0), 0);
}
export const capitalHeld = (g: Front, p: number) => allied(p, g.owner[CAPITALS[p]!]!);
export const citiesOf = (g: Front, side: number) =>
  CITIES.filter((c) => g.owner[c]! >= 0 && sideOf(g.owner[c]!) === side).length;

export const unitsAt = (g: Front, loc: number) => g.units.filter((u) => u.loc === loc);
const enemiesAt = (g: Front, p: number, loc: number) =>
  g.units.filter((u) => u.loc === loc && !allied(p, u.owner));
const isWarship = (k: UnitKind) => k === 'cruiser' || k === 'battleship';

/** Whether power p's attack would be a fight at loc (enemy land, or enemy units there). */
export function hostile(g: Front, p: number, loc: number): boolean {
  if (enemiesAt(g, p, loc).length) return true;
  return !isSea(loc) && enemyOf(p, g.owner[loc]!);
}

/** Shortest step counts from `from` under a passability rule (BFS). */
function distances(
  from: number,
  pass: (loc: number) => boolean,
  limit: number,
): Map<number, number> {
  const dist = new Map([[from, 0]]);
  const q = [from];
  while (q.length) {
    const v = q.shift()!;
    const d = dist.get(v)!;
    if (d >= limit) continue;
    for (const w of LOCS[v]!.adj) {
      if (dist.has(w)) continue;
      dist.set(w, d + 1);
      if (pass(w)) q.push(w);
    }
  }
  return dist;
}

/** Friendly land (held by the alliance since the turn began) within `range` of loc. */
function landingWithin(g: Front, p: number, loc: number, range: number): number[] {
  const d = distances(loc, () => true, range);
  return [...d.entries()]
    .filter(
      ([l, k]) => k <= range && !isSea(l) && allied(p, g.startOwner[l]!) && allied(p, g.owner[l]!),
    )
    .map(([l]) => l);
}

/** Whether one unit can move from its place to `to` in the current phase. */
export function canMove(g: Front, u: Unit, to: number): boolean {
  if (u.owner !== g.power || u.fought || u.loc === to) return false;
  const t = unitType(u.kind);
  const left = t.move - u.moved;
  if (left <= 0) return false;
  const combat = g.phase === 'combat';
  if (g.phase !== 'combat' && g.phase !== 'move') return false;
  const p = g.power;
  if (combat && !hostile(g, p, to)) return false;
  if (!combat && hostile(g, p, to)) return false;
  if (t.domain === 'land') {
    if (isSea(to)) return false;
    // Through friendly, empty-of-enemies land; only the last step may be hostile.
    const d = distances(u.loc, (l) => !isSea(l) && !hostile(g, p, l), left);
    return (d.get(to) ?? 99) <= left;
  }
  if (t.domain === 'air') {
    const d = distances(u.loc, () => true, left).get(to) ?? 99;
    if (d > left) return false;
    if (combat) return landingWithin(g, p, to, left - d).length > 0;
    return !isSea(to) && allied(p, g.startOwner[to]!) && allied(p, g.owner[to]!);
  }
  // Ships: open water only; a fleet is stopped by enemy warships.
  if (!isSea(to)) return false;
  if (combat && !isWarship(u.kind)) return false;
  const d = distances(
    u.loc,
    (l) => isSea(l) && !enemiesAt(g, p, l).some((e) => isWarship(e.kind)),
    left,
  );
  return (d.get(to) ?? 99) <= left;
}

const movers = (g: Front, kind: UnitKind, from: number, to: number) =>
  g.units.filter((u) => u.kind === kind && u.loc === from && canMove(g, u, to));

/** Whether a transport at `sea` can carry `kinds` from coast `from` to coast `to` now. */
export function canSail(
  g: Front,
  from: number,
  sea: number,
  to: number,
  kinds: UnitKind[],
): boolean {
  const p = g.power;
  if (g.phase !== 'combat' && g.phase !== 'move') return false;
  if (!kinds.length || kinds.length > TRANSPORT_CAPACITY || from === to) return false;
  if (isSea(from) || isSea(to) || !isSea(sea) || !LOCS[from]!.adj.includes(sea)) return false;
  // A transport cannot slip out of water held by enemy warships.
  if (enemiesAt(g, p, sea).some((e) => isWarship(e.kind))) return false;
  if (
    !g.units.some(
      (u) => u.owner === p && u.kind === 'transport' && u.loc === sea && u.moved === 0 && !u.fought,
    )
  )
    return false;
  if (g.phase === 'combat' ? !hostile(g, p, to) : hostile(g, p, to)) return false;
  // Enough fresh land units of those kinds on the coast.
  const need = new Map<UnitKind, number>();
  for (const k of kinds) need.set(k, (need.get(k) ?? 0) + 1);
  for (const [k, n] of need) {
    if (unitType(k).domain !== 'land') return false;
    if (
      g.units.filter(
        (u) => u.owner === p && u.kind === k && u.loc === from && u.moved === 0 && !u.fought,
      ).length < n
    )
      return false;
  }
  return sailEnd(g, sea, to) !== null;
}
/** The water a transport from `sea` ends in to land at `to` (within 2 steps, clear of enemies). */
function sailEnd(g: Front, sea: number, to: number): number | null {
  const p = g.power;
  const d = distances(sea, (l) => isSea(l) && !enemiesAt(g, p, l).length, 2);
  let best: number | null = null;
  let bd = 99;
  for (const [l, k] of d)
    if (isSea(l) && k <= 2 && !enemiesAt(g, p, l).length && LOCS[to]!.adj.includes(l) && k < bd) {
      best = l;
      bd = k;
    }
  return best;
}

/* ---------- legal actions ---------- */

export function legalActions(g: Front): Action[] {
  const p = g.power;
  const out: Action[] = [];
  switch (g.phase) {
    case 'over':
      return [];
    case 'buy': {
      if (capitalHeld(g, p)) {
        const spent = g.bought.reduce((a, k) => a + unitType(k).cost, 0);
        for (const k of KINDS)
          if (g.treasury[p]! - spent >= unitType(k).cost) out.push({ t: 'buy', kind: k });
      }
      for (const k of new Set(g.bought)) out.push({ t: 'unbuy', kind: k });
      out.push({ t: 'next' });
      return out;
    }
    case 'combat':
    case 'move': {
      const seen = new Set<string>();
      for (const u of g.units) {
        if (u.owner !== p) continue;
        for (let to = 0; to < LOCS.length; to++) {
          const key = `${u.kind}:${u.loc}:${to}`;
          if (seen.has(key) || !canMove(g, u, to)) continue;
          seen.add(key);
          out.push({ t: 'move', kind: u.kind, from: u.loc, to, n: 1 });
        }
      }
      // Transport moves of one or two land units.
      for (const tr of g.units.filter(
        (u) => u.owner === p && u.kind === 'transport' && u.moved === 0 && !u.fought,
      )) {
        for (const from of LOCS[tr.loc]!.adj.filter((l) => !isSea(l)))
          for (let to = 0; to < LOCS.length; to++)
            for (const kinds of [
              ['infantry'],
              ['artillery'],
              ['armor'],
              ['infantry', 'infantry'],
              ['infantry', 'artillery'],
              ['infantry', 'armor'],
            ] as UnitKind[][]) {
              const a: Action = { t: 'sail', from, sea: tr.loc, to, kinds };
              const key = JSON.stringify(a);
              if (!seen.has(key) && canSail(g, from, tr.loc, to, kinds)) {
                seen.add(key);
                out.push(a);
              }
            }
      }
      out.push({ t: 'next' });
      return out;
    }
    case 'battle': {
      out.push({ t: 'roll' });
      if (g.battle && g.battle.round > 0) out.push({ t: 'retreat' });
      return out;
    }
    case 'place': {
      for (const k of new Set(g.bought))
        for (const loc of placeSpots(g, k)) out.push({ t: 'place', kind: k, loc });
      out.push({ t: 'next' });
      return out;
    }
  }
}

/** Where a bought unit may go: own factories held since the turn began (ships next to them). */
export function placeSpots(g: Front, kind: UnitKind): number[] {
  const p = g.power;
  const factories = LOCS.map((l, i) =>
    l.factory && g.owner[i] === p && g.startOwner[i] === p ? i : -1,
  ).filter((i) => i >= 0);
  const placedAt = (f: number) =>
    g.units.filter(
      (u) =>
        u.owner === p &&
        u.moved === -1 &&
        (u.loc === f || (isSea(u.loc) && LOCS[f]!.adj.includes(u.loc))),
    ).length;
  const open = factories.filter((f) => placedAt(f) < LOCS[f]!.value);
  if (unitType(kind).domain === 'sea')
    return [
      ...new Set(
        open.flatMap((f) => LOCS[f]!.adj.filter((s) => isSea(s) && !enemiesAt(g, p, s).length)),
      ),
    ].sort((a, b) => a - b);
  return open;
}

export function isLegal(g: Front, a: Action): boolean {
  if (a.t === 'move') {
    return (
      (g.phase === 'combat' || g.phase === 'move') &&
      Number.isInteger(a.n) &&
      a.n >= 1 &&
      movers(g, a.kind, a.from, a.to).length >= a.n
    );
  }
  if (a.t === 'sail') return canSail(g, a.from, a.sea, a.to, a.kinds);
  const key = JSON.stringify(a);
  return legalActions(g).some((b) => JSON.stringify(b) === key);
}

export const currentPlayer = (g: Front) => (g.phase === 'over' ? -1 : sideOf(g.power));

/* ---------- transitions ---------- */

const LOG_KEEP = 60;
const log = (g: Front, e: LogEntry) => {
  g.log = [...g.log, e].slice(-LOG_KEEP);
};

/** Casualty order: cheapest first; battleships take a first hit; transports last. */
function takeHits(g: Front, side: Unit[], hits: number, sea: boolean) {
  for (let h = 0; h < hits; h++) {
    const alive = side.filter((u) => g.units.includes(u));
    if (!alive.length) return;
    const bs = alive.find((u) => u.kind === 'battleship' && u.hits === 0);
    if (bs) {
      bs.hits = 1;
      continue;
    }
    const order: UnitKind[] = sea
      ? ['cruiser', 'fighter', 'bomber', 'battleship', 'transport']
      : ['infantry', 'artillery', 'armor', 'fighter', 'bomber'];
    const victim = order.map((k) => alive.find((u) => u.kind === k)).find(Boolean) ?? alive[0]!;
    g.units = g.units.filter((u) => u !== victim);
  }
}

function capture(g: Front, loc: number) {
  const p = g.power;
  const old = g.owner[loc]!;
  // An ally's lost territory goes back to it (if its capital stands).
  const original = LOCS[loc]!.owner;
  const to = allied(p, original) && original !== p && capitalHeld(g, original) ? original : p;
  g.owner[loc] = to;
  let plunder = 0;
  if (LOCS[loc]!.capital && old >= 0 && enemyOf(p, old) && CAPITALS[old] === loc) {
    plunder = g.treasury[old]!;
    g.treasury[p]! += plunder;
    g.treasury[old] = 0;
  }
  log(g, { k: 'capture', p, loc, to, capital: LOCS[loc]!.capital, plunder });
}

/** Moves on to the next battle (taking empty enemy territory at once), or ends the battles. */
function nextBattle(g: Front) {
  const p = g.power;
  while (g.battles.length) {
    const loc = g.battles[0]!;
    const att = g.units.filter((u) => u.loc === loc && u.owner === p);
    const def = enemiesAt(g, p, loc);
    if (!att.length) {
      g.battles.shift();
      continue;
    }
    if (!def.length) {
      if (
        !isSea(loc) &&
        att.some((u) => unitType(u.kind).domain === 'land') &&
        enemyOf(p, g.owner[loc]!)
      )
        capture(g, loc);
      g.battles.shift();
      continue;
    }
    g.battle = {
      loc,
      round: 0,
      from: Object.fromEntries(att.map((u) => [u.id, g.origins[u.id] ?? loc])),
      last: null,
    };
    g.phase = 'battle';
    return;
  }
  g.battle = null;
  landAircraft(g);
  g.phase = 'move';
}

/** Air units away from friendly land fly to the nearest friendly land in range, or are lost. */
function landAircraft(g: Front) {
  const p = g.power;
  let lost = 0;
  for (const u of [...g.units]) {
    if (u.owner !== p || unitType(u.kind).domain !== 'air') continue;
    if (!isSea(u.loc) && allied(p, g.owner[u.loc]!) && allied(p, g.startOwner[u.loc]!)) continue;
    const left = unitType(u.kind).move - u.moved;
    const d = distances(u.loc, () => true, left);
    const spots = landingWithin(g, p, u.loc, left).sort((a, b) => d.get(a)! - d.get(b)! || a - b);
    if (spots.length) {
      u.moved += d.get(spots[0]!)!;
      u.loc = spots[0]!;
    } else {
      g.units = g.units.filter((x) => x !== u);
      lost++;
    }
  }
  if (lost) log(g, { k: 'air-lost', p, n: lost });
}

function fight(g: Front) {
  const b = g.battle!;
  const p = g.power;
  const sea = isSea(b.loc);
  const att = g.units.filter((u) => u.loc === b.loc && u.owner === p);
  const def = enemiesAt(g, p, b.loc);
  const rng = new Rng(g.rng);
  const roll = () => rng.range(1, 6);
  // Artillery lifts as many infantry to 2.
  let support = att.filter((u) => u.kind === 'artillery').length;
  const aRolls: number[] = [];
  let aHits = 0;
  for (const u of att) {
    let v = unitType(u.kind).attack;
    if (u.kind === 'infantry' && support > 0) {
      support--;
      v = 2;
    }
    if (v <= 0) continue;
    const d = roll();
    aRolls.push(d);
    if (d <= v) aHits++;
  }
  const dRolls: number[] = [];
  let dHits = 0;
  for (const u of def) {
    const v = unitType(u.kind).defense;
    if (v <= 0) continue;
    const d = roll();
    dRolls.push(d);
    if (d <= v) dHits++;
  }
  g.rng = rng.state;
  const beforeA = att.length;
  const beforeD = def.length;
  takeHits(g, def, aHits, sea);
  takeHits(g, att, dHits, sea);
  // Undefended transports are lost.
  const leftD = enemiesAt(g, p, b.loc);
  if (
    leftD.length &&
    leftD.every((u) => u.kind === 'transport') &&
    g.units.some((u) => u.loc === b.loc && u.owner === p && unitType(u.kind).attack > 0)
  )
    g.units = g.units.filter((u) => !leftD.includes(u));
  b.round += 1;
  b.last = { a: aRolls, d: dRolls, aHits, dHits };
  const nowA = g.units.filter((u) => u.loc === b.loc && u.owner === p);
  const nowD = enemiesAt(g, p, b.loc);
  if (!nowA.length || !nowD.length) {
    const won = nowA.length > 0 && !nowD.length;
    log(g, { k: 'battle', p, loc: b.loc, won, lostA: 0, lostD: 0 });
    const e = g.log[g.log.length - 1] as Extract<LogEntry, { k: 'battle' }>;
    e.lostA = beforeA - nowA.length;
    e.lostD = beforeD - nowD.length;
    if (
      won &&
      !sea &&
      nowA.some((u) => unitType(u.kind).domain === 'land') &&
      enemyOf(p, g.owner[b.loc]!)
    )
      capture(g, b.loc);
    g.battles.shift();
    nextBattle(g);
  }
}

function retreat(g: Front) {
  const b = g.battle!;
  const p = g.power;
  for (const u of g.units) {
    if (u.loc !== b.loc || u.owner !== p) continue;
    // Back where it came from (air units land afterwards).
    u.loc = b.from[u.id] ?? u.loc;
  }
  log(g, { k: 'battle', p, loc: b.loc, won: null, lostA: 0, lostD: 0, retreat: true });
  g.battles.shift();
  nextBattle(g);
}

function endTurn(g: Front) {
  const p = g.power;
  // Anything still bought is placed on the first open spot, or refunded.
  for (const k of [...g.bought]) {
    const spot = placeSpots(g, k)[0];
    g.bought.splice(g.bought.indexOf(k), 1);
    if (spot === undefined) g.treasury[p]! += unitType(k).cost;
    else
      g.units.push({
        id: g.nextId++,
        kind: k,
        owner: p,
        loc: spot,
        moved: -1,
        hits: 0,
        fought: false,
      });
  }
  const n = income(g, p);
  g.treasury[p]! += n;
  log(g, { k: 'income', p, n });
  for (const u of g.units) {
    u.moved = 0;
    u.fought = false;
    if (u.kind === 'battleship') u.hits = 0;
  }
  g.origins = {};
  g.power = (g.power + 1) % POWERS.length;
  if (g.power === 0) {
    const cities: [number, number] = [citiesOf(g, 0), citiesOf(g, 1)];
    const done = cities[0] >= WIN_CITIES || cities[1] >= WIN_CITIES || g.round >= MAX_ROUNDS;
    if (done) {
      const inc = [0, 1].map((s) =>
        POWERS.reduce((a, _, q) => a + (sideOf(q) === s ? income(g, q) : 0), 0),
      );
      g.winner =
        cities[0] !== cities[1] ? (cities[0] > cities[1] ? 0 : 1) : inc[0]! >= inc[1]! ? 0 : 1;
      g.phase = 'over';
      log(g, { k: 'end', side: g.winner, cities });
      return;
    }
    g.round += 1;
  }
  g.startOwner = [...g.owner];
  g.phase = 'buy';
  // A power with nothing left on the board and no capital passes straight through.
  if (!g.units.some((u) => u.owner === g.power) && !capitalHeld(g, g.power)) {
    g.phase = 'place';
    endTurn(g);
  }
}

export function act(g0: Front, a: Action): Front {
  if (!isLegal(g0, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g: Front = structuredClone(g0);
  const p = g.power;
  switch (a.t) {
    case 'buy':
      g.bought.push(a.kind);
      break;
    case 'unbuy':
      g.bought.splice(g.bought.indexOf(a.kind), 1);
      break;
    case 'move': {
      const list = movers(g, a.kind, a.from, a.to).slice(0, a.n);
      const t = unitType(a.kind);
      for (const u of list) {
        const pass =
          t.domain === 'land'
            ? (l: number) => !isSea(l) && !hostile(g, p, l)
            : t.domain === 'air'
              ? () => true
              : (l: number) => isSea(l);
        const d = distances(u.loc, pass, t.move).get(a.to)!;
        if (g.phase === 'combat') {
          g.origins[u.id] = u.loc;
          u.fought = true;
        }
        u.moved += d;
        u.loc = a.to;
      }
      break;
    }
    case 'sail': {
      const tr = g.units.find(
        (u) =>
          u.owner === p && u.kind === 'transport' && u.loc === a.sea && u.moved === 0 && !u.fought,
      )!;
      const end = sailEnd(g, a.sea, a.to)!;
      tr.moved = unitType('transport').move;
      tr.loc = end;
      for (const k of a.kinds) {
        const u = g.units.find(
          (x) => x.owner === p && x.kind === k && x.loc === a.from && x.moved === 0 && !x.fought,
        )!;
        if (g.phase === 'combat') {
          g.origins[u.id] = a.from;
          u.fought = true;
        }
        u.moved = unitType(k).move;
        u.loc = a.to;
      }
      break;
    }
    case 'roll':
      fight(g);
      break;
    case 'retreat':
      retreat(g);
      break;
    case 'place':
      g.bought.splice(g.bought.indexOf(a.kind), 1);
      // moved = −1 marks units placed this turn (counted against the factory's limit).
      g.units.push({
        id: g.nextId++,
        kind: a.kind,
        owner: p,
        loc: a.loc,
        moved: -1,
        hits: 0,
        fought: false,
      });
      break;
    case 'next':
      if (g.phase === 'buy') {
        const spent = g.bought.reduce((s, k) => s + unitType(k).cost, 0);
        g.treasury[p]! -= spent;
        if (g.bought.length) log(g, { k: 'buy', p, kinds: [...g.bought], spent });
        g.phase = 'combat';
      } else if (g.phase === 'combat') {
        // Every place the power moved into for a fight.
        g.battles = [
          ...new Set(g.units.filter((u) => u.owner === p && u.fought).map((u) => u.loc)),
        ].sort((x, y) => x - y);
        nextBattle(g);
        if (g.phase === 'combat') g.phase = 'move';
      } else if (g.phase === 'move') g.phase = 'place';
      else if (g.phase === 'place') endTurn(g);
      break;
  }
  return g;
}

/* ---------- validation ---------- */

export function isValidFront(v: unknown): v is Front {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as Front;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  if (!Array.isArray(g.owner) || g.owner.length !== LOCS.length) return false;
  if (
    !Array.isArray(g.units) ||
    !g.units.every(
      (u) =>
        KINDS.includes(u.kind) &&
        Number.isInteger(u.loc) &&
        u.loc >= 0 &&
        u.loc < LOCS.length &&
        u.owner >= 0 &&
        u.owner < POWERS.length,
    )
  )
    return false;
  // Land units on land, ships at sea.
  if (
    !g.units.every(
      (u) =>
        (unitType(u.kind).domain === 'sea') === isSea(u.loc) || unitType(u.kind).domain === 'air',
    )
  )
    return false;
  if (new Set(g.units.map((u) => u.id)).size !== g.units.length) return false;
  if (
    !Array.isArray(g.treasury) ||
    g.treasury.length !== POWERS.length ||
    !g.treasury.every((x) => Number.isInteger(x) && x >= 0)
  )
    return false;
  return ['buy', 'combat', 'battle', 'move', 'place', 'over'].includes(g.phase);
}
