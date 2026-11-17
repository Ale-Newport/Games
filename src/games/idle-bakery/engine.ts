/**
 * Idle Bakery rules. Click the big cookie to bake; spend cookies on buildings that bake by
 * themselves (each costs 15 % more than the last of its kind) and on upgrades that double their
 * output or your clicks. Golden pastries appear now and then: click one in time for a lucky haul,
 * a seven-fold frenzy or a click frenzy. Ascending resets the bakery for prestige levels, each
 * worth +1 % production forever. Pure: time advances with `tick(seconds)`; randomness is seeded.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export interface Building {
  id: string;
  emoji: string;
  price: number;
  cps: number;
}

export const BUILDINGS: Building[] = [
  { id: 'cursor', emoji: '👆', price: 15, cps: 0.1 },
  { id: 'grandma', emoji: '👵', price: 100, cps: 1 },
  { id: 'farm', emoji: '🌾', price: 1100, cps: 8 },
  { id: 'mine', emoji: '⛏️', price: 12_000, cps: 47 },
  { id: 'factory', emoji: '🏭', price: 130_000, cps: 260 },
  { id: 'bank', emoji: '🏦', price: 1_400_000, cps: 1400 },
  { id: 'temple', emoji: '🛕', price: 20_000_000, cps: 7800 },
  { id: 'tower', emoji: '🧙', price: 330_000_000, cps: 44_000 },
  { id: 'shipment', emoji: '🚀', price: 5_100_000_000, cps: 260_000 },
  { id: 'lab', emoji: '⚗️', price: 75_000_000_000, cps: 1_600_000 },
  { id: 'portal', emoji: '🌀', price: 1_000_000_000_000, cps: 10_000_000 },
  { id: 'clock', emoji: '⏳', price: 14_000_000_000_000, cps: 65_000_000 },
];
export const BY_BUILDING = new Map(BUILDINGS.map((b) => [b.id, b]));

export type UpgradeKind = 'building' | 'click' | 'clickcps' | 'golden';
export interface Upgrade {
  id: string;
  kind: UpgradeKind;
  /** The building it doubles. */
  building?: string;
  price: number;
  /** When it appears in the shop. */
  unlock: (s: Bakery) => boolean;
}

const TIERS: [number, number][] = [
  [1, 10],
  [5, 50],
  [25, 500],
  [50, 50_000],
  [100, 5_000_000],
];

export const UPGRADES: Upgrade[] = [
  ...BUILDINGS.flatMap((b) =>
    TIERS.map(([owned, mult], tier) => ({
      id: `${b.id}-${tier}`,
      kind: 'building' as const,
      building: b.id,
      price: b.price * mult,
      unlock: (s: Bakery) => (s.owned[b.id] ?? 0) >= owned,
    })),
  ),
  { id: 'pin-1', kind: 'click', price: 100, unlock: (s) => (s.owned.cursor ?? 0) >= 1 },
  { id: 'pin-2', kind: 'click', price: 500, unlock: (s) => (s.owned.cursor ?? 0) >= 1 },
  { id: 'pin-3', kind: 'click', price: 10_000, unlock: (s) => (s.owned.cursor ?? 0) >= 10 },
  { id: 'whisk-1', kind: 'clickcps', price: 50_000, unlock: (s) => s.handmade >= 1000 },
  { id: 'whisk-2', kind: 'clickcps', price: 5_000_000, unlock: (s) => s.handmade >= 100_000 },
  { id: 'whisk-3', kind: 'clickcps', price: 500_000_000, unlock: (s) => s.handmade >= 10_000_000 },
  { id: 'lucky-day', kind: 'golden', price: 777_777, unlock: (s) => s.goldenClicks >= 7 },
  { id: 'serendipity', kind: 'golden', price: 77_777_777, unlock: (s) => s.goldenClicks >= 27 },
];
export const BY_UPGRADE = new Map(UPGRADES.map((u) => [u.id, u]));

export type BuffKind = 'frenzy' | 'clickfrenzy';
export interface Buff {
  kind: BuffKind;
  until: number;
}

export interface Golden {
  x: number;
  y: number;
  expires: number;
}

export interface Bakery {
  rng: RngState;
  /** Seconds played in this bakery. */
  t: number;
  cookies: number;
  /** Baked since the last ascension, and ever. */
  baked: number;
  allTime: number;
  handmade: number;
  clicks: number;
  owned: Record<string, number>;
  upgrades: string[];
  prestige: number;
  ascensions: number;
  goldenClicks: number;
  golden: Golden | null;
  nextGolden: number;
  buffs: Buff[];
  /** The last golden effect, for the message. */
  last: { effect: 'lucky' | BuffKind; amount: number; t: number } | null;
  events: string[];
}

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

const goldenGap = (s: Pick<Bakery, 'upgrades'>, r: number) => {
  const base = 60 + r * 120;
  return s.upgrades.includes('serendipity')
    ? base / 4
    : s.upgrades.includes('lucky-day')
      ? base / 2
      : base;
};

export function newBakery(
  seed: number,
  keep?: Pick<Bakery, 'allTime' | 'prestige' | 'ascensions' | 'goldenClicks'>,
): Bakery {
  const [r, rng] = rand(seedRng(seed >>> 0));
  return {
    rng,
    t: 0,
    cookies: 0,
    baked: 0,
    allTime: keep?.allTime ?? 0,
    handmade: 0,
    clicks: 0,
    owned: {},
    upgrades: [],
    prestige: keep?.prestige ?? 0,
    ascensions: keep?.ascensions ?? 0,
    goldenClicks: keep?.goldenClicks ?? 0,
    golden: null,
    nextGolden: goldenGap({ upgrades: [] }, r),
    buffs: [],
    last: null,
    events: [],
  };
}

export const priceOf = (s: Bakery, id: string, n = 1) => {
  const b = BY_BUILDING.get(id)!;
  const owned = s.owned[id] ?? 0;
  let total = 0;
  for (let k = 0; k < n; k++) total += Math.ceil(b.price * Math.pow(1.15, owned + k));
  return total;
};

const doublings = (s: Bakery, id: string) =>
  s.upgrades.filter((u) => BY_UPGRADE.get(u)?.building === id).length;
const frenzy = (s: Bakery) => (s.buffs.some((b) => b.kind === 'frenzy' && b.until > s.t) ? 7 : 1);

/** Cookies per second of one building type (all owned). */
export function buildingCps(s: Bakery, id: string): number {
  const b = BY_BUILDING.get(id)!;
  return (s.owned[id] ?? 0) * b.cps * Math.pow(2, doublings(s, id)) * (1 + s.prestige / 100);
}

/** Cookies per second, buffs included. */
export function cps(s: Bakery): number {
  return BUILDINGS.reduce((a, b) => a + buildingCps(s, b.id), 0) * frenzy(s);
}

export function clickPower(s: Bakery): number {
  const pins = s.upgrades.filter((u) => u.startsWith('pin-')).length;
  const whisks = s.upgrades.filter((u) => u.startsWith('whisk-')).length;
  const base = Math.pow(2, pins) * (1 + s.prestige / 100) + cps(s) * 0.01 * whisks;
  return base * (s.buffs.some((b) => b.kind === 'clickfrenzy' && b.until > s.t) ? 777 : 1);
}

const gain = (s: Bakery, n: number): Bakery => ({
  ...s,
  cookies: s.cookies + n,
  baked: s.baked + n,
  allTime: s.allTime + n,
});

export function click(s: Bakery): Bakery {
  const n = clickPower(s);
  return { ...gain(s, n), handmade: s.handmade + n, clicks: s.clicks + 1, events: ['click'] };
}

export function buy(s: Bakery, id: string, n = 1): Bakery {
  const price = priceOf(s, id, n);
  if (!BY_BUILDING.has(id) || s.cookies < price) return s;
  return {
    ...s,
    cookies: s.cookies - price,
    owned: { ...s.owned, [id]: (s.owned[id] ?? 0) + n },
    events: ['buy'],
  };
}

/** Upgrades on offer: unlocked, not bought, cheapest first. */
export function shop(s: Bakery): Upgrade[] {
  return UPGRADES.filter((u) => !s.upgrades.includes(u.id) && u.unlock(s)).sort(
    (a, b) => a.price - b.price,
  );
}

export function buyUpgrade(s: Bakery, id: string): Bakery {
  const u = BY_UPGRADE.get(id);
  if (!u || s.upgrades.includes(id) || !u.unlock(s) || s.cookies < u.price) return s;
  return { ...s, cookies: s.cookies - u.price, upgrades: [...s.upgrades, id], events: ['upgrade'] };
}

/** Time passes: buildings bake, buffs wear off, golden pastries come and go. */
export function tick(s0: Bakery, seconds: number): Bakery {
  let s: Bakery = { ...gain(s0, cps(s0) * seconds), t: s0.t + seconds, events: [] };
  s = { ...s, buffs: s.buffs.filter((b) => b.until > s.t) };
  if (s.golden && s.golden.expires <= s.t) s = { ...s, golden: null };
  if (!s.golden && s.t >= s.nextGolden) {
    const [x, r1] = rand(s.rng);
    const [y, r2] = rand(r1);
    const [g, r3] = rand(r2);
    const life = s.upgrades.includes('lucky-day') ? 26 : 13;
    s = {
      ...s,
      rng: r3,
      golden: { x: 0.1 + x * 0.8, y: 0.1 + y * 0.8, expires: s.t + life },
      nextGolden: s.t + goldenGap(s, g) + life,
      events: [...s.events, 'golden'],
    };
  }
  return s;
}

/** Click the golden pastry: a lucky haul, a frenzy or a click frenzy. */
export function clickGolden(s: Bakery): Bakery {
  if (!s.golden) return s;
  const [r, rng] = rand(s.rng);
  const base: Bakery = { ...s, rng, golden: null, goldenClicks: s.goldenClicks + 1 };
  if (r < 0.45) {
    const amount = Math.min(s.cookies * 0.15, cps(s) * 900) + 13;
    return { ...gain(base, amount), last: { effect: 'lucky', amount, t: s.t }, events: ['lucky'] };
  }
  if (r < 0.9)
    return {
      ...base,
      buffs: [...s.buffs, { kind: 'frenzy', until: s.t + 77 }],
      last: { effect: 'frenzy', amount: 7, t: s.t },
      events: ['frenzy'],
    };
  return {
    ...base,
    buffs: [...s.buffs, { kind: 'clickfrenzy', until: s.t + 13 }],
    last: { effect: 'clickfrenzy', amount: 777, t: s.t },
    events: ['clickfrenzy'],
  };
}

/** Prestige levels earned in total for cookies baked ever (one per trillion, cube-root growth). */
export const prestigeFor = (allTime: number) => Math.floor(Math.cbrt(allTime / 1e12));

/** Ascend: start over with the prestige earned so far. */
export function ascend(s: Bakery, seed: number): Bakery {
  const prestige = prestigeFor(s.allTime);
  if (prestige <= s.prestige) return s;
  return {
    ...newBakery(seed, {
      allTime: s.allTime,
      prestige,
      ascensions: s.ascensions + 1,
      goldenClicks: s.goldenClicks,
    }),
    events: ['ascend'],
  };
}

/** While the game was closed: a tenth of normal production, for up to twelve hours. */
export function offline(s: Bakery, seconds: number): [Bakery, number] {
  const secs = Math.min(Math.max(0, seconds), 12 * 3600);
  const n = cps({ ...s, buffs: [] }) * secs * 0.1;
  return [gain(s, n), n];
}

export function isBakery(v: unknown): v is Bakery {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Bakery;
  return (
    Array.isArray(s.rng) &&
    [s.t, s.cookies, s.baked, s.allTime, s.prestige].every(
      (n) => typeof n === 'number' && Number.isFinite(n),
    ) &&
    typeof s.owned === 'object' &&
    Object.keys(s.owned).every((k) => BY_BUILDING.has(k)) &&
    Array.isArray(s.upgrades) &&
    s.upgrades.every((u) => BY_UPGRADE.has(u)) &&
    Array.isArray(s.buffs)
  );
}

/** Big-number names. */
const NAMES_EN = [
  '',
  ' thousand',
  ' million',
  ' billion',
  ' trillion',
  ' quadrillion',
  ' quintillion',
  ' sextillion',
  ' septillion',
  ' octillion',
];
const NAMES_ES = [
  '',
  ' mil',
  ' millones',
  ' mil millones',
  ' billones',
  ' mil billones',
  ' trillones',
  ' mil trillones',
  ' cuatrillones',
  ' mil cuatrillones',
];
export function short(n: number, lang: 'en' | 'es', decimals = false): string {
  if (n < 1000)
    return decimals && n < 100 ? n.toFixed(1).replace(/\.0$/, '') : String(Math.floor(n + 1e-9));
  if (n < 1e6) return Math.floor(n).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US');
  const k = Math.min(NAMES_EN.length - 1, Math.floor(Math.log10(n) / 3));
  const v = n / Math.pow(1000, k);
  return `${v.toFixed(3).replace(/\.?0+$/, '')}${(lang === 'es' ? NAMES_ES : NAMES_EN)[k]}`;
}
