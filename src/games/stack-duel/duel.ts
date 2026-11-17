/**
 * Stack Duel: the modern falling-block rules (shared core, plus a half-turn rotation) in three
 * modes. Versus: you against a bot, each on a well; clearing lines sends garbage rows (attack table
 * below) that first cancel garbage waiting for you; garbage still waiting is pushed in from the
 * bottom, one hole per attack, up to eight rows each time you place a piece without clearing. A
 * player who tops out loses the round; matches are one round or first to two. From 90 s into a
 * round, every attack grows by 10 % per 30 s (margin time). Blitz: score as much as possible in
 * two minutes. Sprint: clear forty lines as fast as possible.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import {
  actionsFor,
  COLS,
  MODERN,
  newBlocks,
  ROWS,
  stepBlocks,
  type BlockRules,
  type Blocks,
  type Cell,
} from '../shared/blocks/sim';
import { BOT, botKeys, type BotLevel } from './bot';

export const RULES: BlockRules = { id: 'stack-duel', modern: true };
export type Mode = 'versus' | 'blitz' | 'sprint';
export const HZ = 60;
export const BLITZ_STEPS = 120 * HZ;
/** Steps garbage travels before it can enter a well. */
export const GARBAGE_DELAY = 20;
export const GARBAGE_CAP = 8;
export const MARGIN_START = 90 * HZ;

/** Every action: the falling-block controls plus the half turn (F). */
export const ACTIONS: string[] = (() => {
  const base = actionsFor(true);
  const out = [...base];
  for (const m of ['', 'L', 'R'])
    for (const d of ['', 'S', 'H']) for (const k of ['', 'K']) out.push(`${m}F${d}${k}`);
  return out;
})();

export interface Garbage {
  lines: number;
  hole: number;
  /** The duel step from which it can enter. */
  ready: number;
}

export interface Clear {
  /** What it was: `single`…`quad` or `tspin-single`…, then `b2b`, `combo`, `allclear`. */
  parts: string[];
  combo: number;
  attack: number;
  at: number;
}

export interface Duel {
  mode: Mode;
  bot: BotLevel;
  /** Round wins needed for the match. */
  target: number;
  boards: [Blocks, Blocks | null];
  incoming: [Garbage[], Garbage[]];
  rng: RngState;
  /** Steps in this round (and in the whole match). */
  t: number;
  total: number;
  wins: [number, number];
  round: number;
  /** Steps left before the next round starts. */
  pause: number;
  roundWinner: 0 | 1 | null;
  botWait: number;
  botSlip: number;
  sent: [number, number];
  pieces: [number, number];
  /** The latest notable clear per side (for the callouts). */
  clears: [Clear | null, Clear | null];
  allClears: number;
  quads: number;
  tspinClears: number;
  maxCombo: number;
  bonus: number;
  over: boolean;
  winner: 0 | 1 | null;
  events: string[];
}

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

function seedFrom(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x, n];
}

function versusBoard(seed: number): Blocks {
  return newBlocks(RULES, seed, { goal: 0 });
}

export function newDuel(seed: number, mode: Mode, bot: BotLevel, target: number): Duel {
  let rng = seedRng(seed >>> 0);
  const [a, r1] = seedFrom(rng);
  const [b, r2] = seedFrom(r1);
  rng = r2;
  // Both players get the same piece sequence in versus.
  const you =
    mode === 'sprint' ? newBlocks(RULES, a, { goal: 40 }) : versusBoard(mode === 'versus' ? b : a);
  return {
    mode,
    bot,
    target: mode === 'versus' ? target : 1,
    boards: [you, mode === 'versus' ? versusBoard(b) : null],
    incoming: [[], []],
    rng,
    t: 0,
    total: 0,
    wins: [0, 0],
    round: 1,
    pause: 0,
    roundWinner: null,
    botWait: BOT[bot].think,
    botSlip: 0.5,
    sent: [0, 0],
    pieces: [0, 0],
    clears: [null, null],
    allClears: 0,
    quads: 0,
    tspinClears: 0,
    maxCombo: 0,
    bonus: 0,
    over: false,
    winner: null,
    events: [],
  };
}

const BASE_ATTACK = [0, 0, 1, 2, 4];
const TSPIN_ATTACK = [0, 2, 4, 6];
const COMBO_ATTACK = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
export const ALL_CLEAR_ATTACK = 10;
const ALL_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];

/** Garbage rows a clear sends, before margin time. */
export function attackFor(
  lines: number,
  tspin: boolean,
  b2b: boolean,
  combo: number,
  allClear: boolean,
): number {
  if (lines === 0) return 0;
  let a = tspin ? TSPIN_ATTACK[lines]! : BASE_ATTACK[lines]!;
  if (b2b) a += 1;
  a += COMBO_ATTACK[Math.min(combo, COMBO_ATTACK.length - 1)] ?? 0;
  if (allClear) a += ALL_CLEAR_ATTACK;
  return a;
}

export function marginFactor(t: number): number {
  return t < MARGIN_START ? 1 : 1 + 0.1 * (1 + Math.floor((t - MARGIN_START) / (30 * HZ)));
}

const NAMES = ['', 'single', 'double', 'triple', 'quad'];

/** Push garbage rows in from the bottom; blocks pushed out of the top end the game. */
export function addGarbage(b: Blocks, rows: { hole: number }[]): Blocks {
  const k = rows.length;
  if (!k) return b;
  const overflow = b.board.slice(0, k * COLS).some((c) => c !== null);
  const added: (Cell | null)[] = [];
  for (const r of rows) for (let x = 0; x < COLS; x++) added.push(x === r.hole ? null : 'G');
  const board = [...b.board.slice(k * COLS), ...added];
  return overflow ? { ...b, board, over: true, events: [...b.events, 'topout'] } : { ...b, board };
}

function settle(d: Duel, seat: 0 | 1, after: Blocks): Duel {
  if (!after.events.includes('lock')) return d;
  let next = d;
  const pieces: [number, number] = [...d.pieces];
  pieces[seat]++;
  next = { ...next, pieces };
  const lines = after.clearing.length;
  const last = after.last;
  if (lines > 0 && last) {
    const rest = after.board.filter(
      (c, i) => c !== null && !after.clearing.includes(Math.floor(i / COLS)),
    );
    const allClear = rest.length === 0;
    const combo = Math.max(0, after.combo);
    let attack = attackFor(lines, last.tspin, last.b2b, combo, allClear);
    attack = Math.floor(attack * marginFactor(d.t));
    const parts = [last.tspin ? `tspin-${NAMES[lines]}` : NAMES[lines]!];
    if (last.b2b) parts.push('b2b');
    if (combo > 0) parts.push('combo');
    if (allClear) parts.push('allclear');
    const clears: Duel['clears'] = [...d.clears];
    if (lines >= 2 || last.tspin || combo > 0 || allClear)
      clears[seat] = { parts, combo, attack, at: d.total };
    next = {
      ...next,
      clears,
      allClears: d.allClears + (seat === 0 && allClear ? 1 : 0),
      quads: d.quads + (seat === 0 && lines === 4 ? 1 : 0),
      tspinClears: d.tspinClears + (seat === 0 && last.tspin ? 1 : 0),
      maxCombo: seat === 0 ? Math.max(d.maxCombo, combo) : d.maxCombo,
      bonus:
        d.bonus +
        (seat === 0 && allClear && d.mode !== 'versus'
          ? ALL_CLEAR_POINTS[lines]! * after.level
          : 0),
    };
    if (allClear && seat === 0) next = { ...next, events: [...next.events, 'allclear'] };
    if (d.mode === 'versus' && attack > 0) {
      // Cancel our own waiting garbage first, then send the rest.
      const mine = next.incoming[seat].map((g) => ({ ...g }));
      let left = attack;
      while (left > 0 && mine.length) {
        const g = mine[0]!;
        const c = Math.min(left, g.lines);
        g.lines -= c;
        left -= c;
        if (g.lines === 0) mine.shift();
      }
      const incoming: Duel['incoming'] = [...next.incoming];
      incoming[seat] = mine;
      const sent: [number, number] = [...next.sent];
      sent[seat] += attack;
      let rng = next.rng;
      if (left > 0) {
        const [x, r] = rand(rng);
        rng = r;
        const other = (1 - seat) as 0 | 1;
        incoming[other] = [
          ...incoming[other],
          { lines: left, hole: Math.floor(x * COLS), ready: d.total + GARBAGE_DELAY },
        ];
        next = { ...next, events: [...next.events, seat === 0 ? 'attack' : 'attacked'] };
      } else if (seat === 0) next = { ...next, events: [...next.events, 'cancel'] };
      next = { ...next, incoming, sent, rng };
    }
    return next;
  }
  // No clear: waiting garbage that has arrived comes in (up to the cap).
  if (d.mode !== 'versus' || after.over) return next;
  const queue = next.incoming[seat].map((g) => ({ ...g }));
  const rows: { hole: number }[] = [];
  while (queue.length && queue[0]!.ready <= d.total && rows.length < GARBAGE_CAP) {
    const g = queue[0]!;
    const take = Math.min(g.lines, GARBAGE_CAP - rows.length);
    for (let i = 0; i < take; i++) rows.push({ hole: g.hole });
    g.lines -= take;
    if (g.lines === 0) queue.shift();
  }
  if (!rows.length) return next;
  const boards: Duel['boards'] = [...next.boards];
  boards[seat] = addGarbage(after, rows);
  const incoming: Duel['incoming'] = [...next.incoming];
  incoming[seat] = queue;
  return {
    ...next,
    boards,
    incoming,
    events: seat === 0 ? [...next.events, 'garbage'] : next.events,
  };
}

/** In versus the gravity stays at level 1 and level-up chimes are not played. */
function levelled(d: Duel, b: Blocks): Blocks {
  return d.mode === 'versus'
    ? { ...b, level: 1, events: b.events.filter((e) => e !== 'level') }
    : b;
}

function newRound(d: Duel): Duel {
  const [a, r] = seedFrom(d.rng);
  return {
    ...d,
    rng: r,
    boards: [versusBoard(a), versusBoard(a)],
    incoming: [[], []],
    t: 0,
    round: d.round + 1,
    roundWinner: null,
    botWait: BOT[d.bot].think,
    clears: [null, null],
    events: ['round'],
  };
}

/** One step: your keys, and the bot's when there is one. */
export function stepDuel(d: Duel, action: string): Duel {
  if (d.over) return d;
  if (d.pause > 0) {
    const pause = d.pause - 1;
    return pause === 0 ? newRound({ ...d, pause }) : { ...d, pause, events: [] };
  }
  let next: Duel = { ...d, t: d.t + 1, total: d.total + 1, events: [] };
  // You.
  const you0 = d.boards[0];
  const you1 = levelled(d, stepBlocks(RULES, you0, action));
  next = { ...next, boards: [you1, next.boards[1]] };
  next = settle(next, 0, you1);
  // The bot.
  const bot0 = next.boards[1];
  if (bot0) {
    let botWait = next.botWait;
    let botSlip = next.botSlip;
    let keys = 'idle';
    if (bot0.piece) {
      if (botWait > 0) botWait--;
      else keys = botKeys(bot0, d.bot, botSlip);
    }
    const bot1 = levelled(d, stepBlocks(RULES, bot0, keys));
    if (!bot0.piece && bot1.piece) {
      botWait = BOT[d.bot].think;
      const [x, r] = rand(next.rng);
      botSlip = x;
      next = { ...next, rng: r };
    }
    next = { ...next, boards: [next.boards[0], bot1], botWait, botSlip };
    next = settle(next, 1, bot1);
  }
  next = { ...next, events: [...next.boards[0].events, ...next.events] };
  return finish(next);
}

function finish(d: Duel): Duel {
  const [you, bot] = d.boards;
  if (d.mode === 'blitz')
    return d.t >= BLITZ_STEPS || you.over
      ? { ...d, over: true, winner: 0, events: [...d.events, 'end'] }
      : d;
  if (d.mode === 'sprint') return you.over ? { ...d, over: true, winner: you.won ? 0 : null } : d;
  if (!you.over && !bot!.over) return d;
  const roundWinner: 0 | 1 | null = you.over && bot!.over ? null : you.over ? 1 : 0;
  const wins: [number, number] = [...d.wins];
  if (roundWinner !== null) wins[roundWinner]++;
  const events = [...d.events, roundWinner === 0 ? 'ko' : 'koed'];
  if (wins[0] >= d.target || wins[1] >= d.target)
    return {
      ...d,
      wins,
      roundWinner,
      over: true,
      winner: wins[0] >= d.target ? 0 : 1,
      events: [...events, wins[0] >= d.target ? 'win' : 'lose'],
    };
  return { ...d, wins, roundWinner, pause: 150, events };
}

/** Points for blitz (with all-clear bonuses). */
export function points(d: Duel): number {
  return d.boards[0].score + d.bonus;
}

export function seconds(d: Duel): number {
  return d.t / HZ;
}

/** Garbage rows waiting for a side. */
export function waiting(d: Duel, seat: 0 | 1): number {
  return d.incoming[seat].reduce((n, g) => n + g.lines, 0);
}

export function isDuel(v: unknown): v is Duel {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Duel;
  return (
    (d.mode === 'versus' || d.mode === 'blitz' || d.mode === 'sprint') &&
    Array.isArray(d.boards) &&
    typeof d.boards[0] === 'object' &&
    Array.isArray(d.boards[0].board) &&
    d.boards[0].board.length === COLS * ROWS &&
    Array.isArray(d.incoming) &&
    Array.isArray(d.rng) &&
    typeof d.t === 'number'
  );
}

export { MODERN };
