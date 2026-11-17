/**
 * Password Rules: type a password that satisfies an ever-growing list of rules. A rule appears when
 * every rule shown so far is satisfied; the newest is shown first. Some rules start events: Paul the
 * egg must be kept in the password and later hatches and must be fed bugs; a fire breaks out and
 * spreads until you put it out. Passwords are rich text: each character has its own bold, italic,
 * font and size. Pure; time advances by one-second ticks with the local clock stored in the state.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import { COUNTRIES, country } from '../shared/world/world';
import { ATOMIC, TWO_LETTER } from './elements';

export type Font = 'sans' | 'serif' | 'mono' | 'cursive';
export const FONTS: Font[] = ['sans', 'serif', 'mono', 'cursive'];
export const SIZES = [0, 1, 4, 9, 12, 16, 25, 28, 32, 36, 42, 49, 64, 81];
export const DEFAULT_SIZE = 28;

export interface PChar {
  c: string;
  b: boolean;
  i: boolean;
  f: Font;
  s: number;
}

export interface Clock {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
}

export interface Pw {
  chars: PChar[];
  /** Rules shown so far. */
  shown: number;
  rng: RngState;
  captcha: string;
  country: string;
  hex: string;
  clock: Clock;
  /** Seconds played. */
  t: number;
  /** Paul: not yet asked for, an egg, or hatched. */
  paul: 'none' | 'egg' | 'chicken';
  /** Whether Paul has been put in the password since he was asked for. */
  paulIn: boolean;
  nextFeed: number;
  fire: 'none' | 'burning' | 'out';
  /** All rules met: waiting for the final retype. */
  final: boolean;
  won: boolean;
  /** Why the game was lost (`burned`, `starved`, `overfed`, `gone`). */
  lost: string | null;
  events: string[];
}

export const EGG = '🥚';
export const CHICKEN = '🐔';
export const BUG = '🐛';
export const FIRE = '🔥';
export const STRONG = '💪';
export const MOONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
export const SPONSORS = ['zorbo', 'quixa', 'blimpo'];
export const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
export const AFFIRMATIONS = [
  'i am loved',
  'i am worthy',
  'i am enough',
  'soy suficiente',
  'me quieren',
  'valgo mucho',
];
/** Countries with shapes people tend to know. */
export const SHAPES = [
  'IT',
  'JP',
  'BR',
  'AU',
  'IN',
  'MX',
  'ES',
  'FR',
  'GB',
  'CL',
  'EG',
  'CA',
  'AR',
  'ZA',
  'GR',
  'NO',
  'TR',
  'PE',
  'NZ',
  'IS',
].filter((c) => COUNTRIES.some((k) => k.iso2 === c));

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
export function graphemes(text: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
  return Array.from(text);
}

export const plain = (p: Pw | PChar[]) => (Array.isArray(p) ? p : p.chars).map((c) => c.c).join('');
export const charOf = (c: string, style?: Partial<PChar>): PChar => ({
  c,
  b: false,
  i: false,
  f: 'sans',
  s: DEFAULT_SIZE,
  ...style,
});
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

const CAPTCHA_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
function makeCaptcha(rng: RngState): [string, RngState] {
  let r = rng;
  let s = '';
  for (let i = 0; i < 5; i++) {
    const [x, n] = rand(r);
    r = n;
    s += CAPTCHA_CHARS[Math.floor(x * CAPTCHA_CHARS.length)];
  }
  return [s, r];
}

function makeHex(rng: RngState): [string, RngState] {
  let r = rng;
  let s = '';
  for (let i = 0; i < 6; i++) {
    const [x, n] = rand(r);
    r = n;
    s += '0123456789abcdef'[Math.floor(x * 16)];
  }
  return [s, r];
}

export function newPw(seed: number, clock: Clock): Pw {
  let rng = seedRng(seed >>> 0);
  const [captcha, r1] = makeCaptcha(rng);
  const [hex, r2] = makeHex(r1);
  const [x, r3] = rand(r2);
  rng = r3;
  return {
    chars: [],
    shown: 1,
    rng,
    captcha,
    country: SHAPES[Math.floor(x * SHAPES.length)]!,
    hex,
    clock,
    t: 0,
    paul: 'none',
    paulIn: false,
    nextFeed: 0,
    fire: 'none',
    final: false,
    won: false,
    lost: null,
    events: [],
  };
}

// ── Helpers used by the rules ───────────────────────────────────────────────

export const digits = (s: string) => [...s].filter((c) => c >= '0' && c <= '9').map(Number);
export const numbers = (s: string) => (s.match(/\d+/g) ?? []).map(Number);
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

export function romanValue(run: string): number {
  let total = 0;
  for (let i = 0; i < run.length; i++) {
    const v = ROMAN[run[i]!]!;
    const next = ROMAN[run[i + 1] ?? ''] ?? 0;
    total += v < next ? -v : v;
  }
  return total;
}

export const romans = (s: string) => (s.match(/[IVXLCDM]+/g) ?? []).map(romanValue);

/** Element symbols read left to right (two-letter symbols first). */
export function elementsIn(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two.length === 2 && ATOMIC[two] !== undefined && /[a-z]/.test(two[1]!)) {
      out.push(two);
      i++;
    } else if (ATOMIC[s[i]!] !== undefined && /[A-Z]/.test(s[i]!)) out.push(s[i]!);
  }
  return out;
}

/** The moon's phase (0 new … 4 full … 7 waning crescent) for a date. */
export function moonPhase(c: Clock): number {
  const known = Date.UTC(2000, 0, 6, 18, 14);
  const now = Date.UTC(c.y, c.mo - 1, c.d, c.h, c.mi);
  const days = (now - known) / 86400000;
  const age = ((days % 29.530588853) + 29.530588853) % 29.530588853;
  return Math.floor(((age + 29.530588853 / 16) / 29.530588853) * 8) % 8;
}

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false;
  return true;
};
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const count = (p: Pw, g: string) => p.chars.filter((c) => c.c === g).length;
const VOWEL = /^[aeiouáéíóúàèìòùäëïöüAEIOUÁÉÍÓÚÀÈÌÒÙÄËÏÖÜ]$/;
const LETTER = /^\p{L}$/u;
export const timeText = (c: Clock) =>
  `${String(c.h).padStart(2, '0')}:${String(c.mi).padStart(2, '0')}`;

export interface Rule {
  id: string;
  check: (p: Pw) => boolean;
}

export const RULES: Rule[] = [
  { id: 'length5', check: (p) => p.chars.length >= 5 },
  { id: 'number', check: (p) => /\d/.test(plain(p)) },
  { id: 'upper', check: (p) => /\p{Lu}/u.test(plain(p)) },
  { id: 'special', check: (p) => p.chars.some((c) => !/^[\p{L}\p{N}\s]$/u.test(c.c)) },
  { id: 'digits25', check: (p) => digits(plain(p)).reduce((a, b) => a + b, 0) === 25 },
  { id: 'month', check: (p) => MONTHS.some((m) => fold(plain(p)).includes(m)) },
  { id: 'roman', check: (p) => /[IVXLCDM]/.test(plain(p)) },
  { id: 'sponsor', check: (p) => SPONSORS.some((s) => plain(p).toLowerCase().includes(s)) },
  {
    id: 'roman35',
    check: (p) => romans(plain(p)).reduce((a, b) => a * b, 1) === 35 && romans(plain(p)).length > 0,
  },
  { id: 'captcha', check: (p) => plain(p).includes(p.captcha) },
  { id: 'element', check: (p) => TWO_LETTER.some((s) => plain(p).includes(s)) },
  { id: 'moon', check: (p) => plain(p).includes(MOONS[moonPhase(p.clock)]!) },
  {
    id: 'country',
    check: (p) => {
      const c = country(p.country);
      const text = fold(plain(p));
      return [c.name.en, c.name.es].some((n) => text.includes(fold(n)));
    },
  },
  { id: 'leap', check: (p) => numbers(plain(p)).some(isLeap) },
  { id: 'egg', check: (p) => count(p, p.paul === 'chicken' ? CHICKEN : EGG) >= 1 },
  {
    id: 'atomic200',
    check: (p) => elementsIn(plain(p)).reduce((a, s) => a + ATOMIC[s]!, 0) === 200,
  },
  { id: 'boldVowels', check: (p) => p.chars.every((c) => !VOWEL.test(c.c) || c.b) },
  { id: 'fire', check: (p) => count(p, FIRE) === 0 },
  { id: 'strength', check: (p) => count(p, STRONG) >= 3 },
  { id: 'affirmation', check: (p) => AFFIRMATIONS.some((a) => plain(p).toLowerCase().includes(a)) },
  { id: 'feed', check: (p) => count(p, BUG) >= 1 },
  { id: 'lengthIn', check: (p) => numbers(plain(p)).includes(p.chars.length) },
  { id: 'prime', check: (p) => isPrime(p.chars.length) },
  { id: 'hex', check: (p) => plain(p).toLowerCase().includes(p.hex) },
  {
    id: 'cursive',
    check: (p) => {
      const letters = p.chars.filter((c) => LETTER.test(c.c));
      return (
        letters.length > 0 &&
        letters.filter((c) => c.f === 'cursive').length >= letters.length * 0.3
      );
    },
  },
  {
    id: 'digitSize',
    check: (p) => p.chars.every((c) => !/^\d$/.test(c.c) || c.s === Number(c.c) ** 2),
  },
  {
    id: 'italic',
    check: (p) => p.chars.filter((c) => c.i).length >= 2 * p.chars.filter((c) => c.b).length,
  },
  { id: 'time', check: (p) => plain(p).includes(timeText(p.clock)) },
];

export const RULE_INDEX = Object.fromEntries(RULES.map((r, i) => [r.id, i]));

export function passing(p: Pw): boolean[] {
  return RULES.slice(0, p.shown).map((r) => r.check(p));
}

/** Rules shown and met. */
export const metCount = (p: Pw) => passing(p).filter(Boolean).length;

/** Reveal rules while every shown rule is met, starting their events. */
function settle(p0: Pw): Pw {
  let p = p0;
  if (p.lost || p.won) return p;
  // Paul: once put in the password, losing him ends the game.
  if (p.paul !== 'none') {
    const here = count(p, p.paul === 'chicken' ? CHICKEN : EGG) > 0;
    if (here && !p.paulIn) p = { ...p, paulIn: true };
    else if (!here && p.paulIn) return { ...p, lost: 'gone', events: [...p.events, 'lost'] };
    if (p.paul === 'chicken' && count(p, BUG) > 6)
      return { ...p, lost: 'overfed', events: [...p.events, 'lost'] };
  }
  if (p.fire === 'burning' && count(p, FIRE) === 0)
    p = { ...p, fire: 'out', events: [...p.events, 'extinguished'] };
  while (passing(p).every(Boolean)) {
    if (p.shown >= RULES.length)
      return p.final ? p : { ...p, final: true, events: [...p.events, 'final'] };
    const next = RULES[p.shown]!;
    p = { ...p, shown: p.shown + 1, events: [...p.events, 'rule'] };
    if (next.id === 'egg') p = { ...p, paul: 'egg' };
    if (next.id === 'fire' && p.fire === 'none') {
      // The fire starts on a random character (never on Paul).
      const spots = p.chars
        .map((c, i) => (c.c === EGG || c.c === CHICKEN ? -1 : i))
        .filter((i) => i >= 0);
      const [x, rng] = rand(p.rng);
      const at = spots[Math.floor(x * spots.length)] ?? p.chars.length;
      const chars = [...p.chars];
      if (at < chars.length) chars[at] = { ...chars[at]!, c: FIRE };
      else chars.push(charOf(FIRE));
      p = { ...p, chars, rng, fire: 'burning', events: [...p.events, 'fire'] };
    }
    if (next.id === 'feed' && p.paul === 'egg') {
      p = {
        ...p,
        paul: 'chicken',
        nextFeed: p.t + 20,
        chars: p.chars.map((c) => (c.c === EGG ? { ...c, c: CHICKEN } : c)),
        events: [...p.events, 'hatch'],
      };
    }
  }
  if (p.final && !passing(p).every(Boolean)) p = { ...p, final: false };
  if (p.paul !== 'none' && !p.paulIn && count(p, p.paul === 'chicken' ? CHICKEN : EGG) > 0)
    p = { ...p, paulIn: true };
  return p;
}

/** Replace the password (typing, formatting). */
export function edit(p: Pw, chars: PChar[]): Pw {
  if (p.lost || p.won) return p;
  return settle({ ...p, chars, events: [] });
}

/** One second passes: the fire spreads, Paul gets hungry, the clock moves. */
export function tick(p0: Pw, clock: Clock): Pw {
  if (p0.lost || p0.won) return p0;
  let p: Pw = { ...p0, t: p0.t + 1, clock, events: [] };
  if (p.fire === 'burning') {
    const fires = p.chars.map((c, i) => (c.c === FIRE ? i : -1)).filter((i) => i >= 0);
    if (fires.length) {
      const [x, r1] = rand(p.rng);
      const [y, r2] = rand(r1);
      const from = fires[Math.floor(x * fires.length)]!;
      const to = from + (y < 0.5 ? -1 : 1);
      p = { ...p, rng: r2 };
      const target = p.chars[to];
      if (target && target.c !== FIRE) {
        if (target.c === EGG || target.c === CHICKEN)
          return { ...p, lost: 'burned', events: ['lost'] };
        const chars = [...p.chars];
        chars[to] = { ...target, c: FIRE };
        p = { ...p, chars, events: ['spread'] };
      }
    }
  }
  if (p.paul === 'chicken' && p.t >= p.nextFeed) {
    const at = p.chars.findIndex((c) => c.c === BUG);
    if (at < 0) return { ...p, lost: 'starved', events: ['lost'] };
    p = {
      ...p,
      chars: p.chars.filter((_, i) => i !== at),
      nextFeed: p.t + 20,
      events: [...p.events, 'eat'],
    };
  }
  return settle(p);
}

export function newCaptcha(p: Pw): Pw {
  if (p.lost || p.won) return p;
  const [captcha, rng] = makeCaptcha(p.rng);
  return settle({ ...p, captcha, rng, events: [] });
}

export function newColour(p: Pw): Pw {
  if (p.lost || p.won) return p;
  const [hex, rng] = makeHex(p.rng);
  return settle({ ...p, hex, rng, events: [] });
}

/** The final step: retype the password exactly. */
export function confirm(p: Pw, typed: string): Pw {
  if (!p.final || p.lost || p.won) return p;
  return typed === plain(p) ? { ...p, won: true, events: ['win'] } : { ...p, events: ['mismatch'] };
}

export function isPw(v: unknown): v is Pw {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Pw;
  return (
    Array.isArray(p.chars) &&
    p.chars.every(
      (c) =>
        typeof c.c === 'string' &&
        typeof c.b === 'boolean' &&
        typeof c.i === 'boolean' &&
        FONTS.includes(c.f) &&
        typeof c.s === 'number',
    ) &&
    typeof p.shown === 'number' &&
    p.shown >= 1 &&
    p.shown <= RULES.length &&
    Array.isArray(p.rng) &&
    typeof p.captcha === 'string' &&
    SHAPES.includes(p.country) &&
    /^[0-9a-f]{6}$/.test(p.hex)
  );
}

export function clockOf(d: Date): Clock {
  return {
    y: d.getFullYear(),
    mo: d.getMonth() + 1,
    d: d.getDate(),
    h: d.getHours(),
    mi: d.getMinutes(),
  };
}
