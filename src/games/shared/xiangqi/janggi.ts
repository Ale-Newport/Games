/**
 * Janggi (Korean chess) on the 9×10 intersections: palace diagonals for generals, guards,
 * chariots, cannons and soldiers; the long elephant; cannons that need a non-cannon screen to
 * move or capture and never capture cannons; passing; bikjang (facing generals) and point counts.
 * Board codes are signed like xiangqi: positive = Cho (moves first, bottom), negative = Han.
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import {
  ADVISOR as GUARD,
  CANNON,
  CHARIOT,
  COLS,
  ELEPHANT,
  GENERAL,
  HORSE,
  ROWS,
  SOLDIER,
  squareName,
  type Side,
} from './position';

export { GUARD };

export interface JMove {
  from: number;
  to: number;
  piece: number;
  captured: number;
}

const rowOf = (sq: number) => Math.floor(sq / COLS);
const colOf = (sq: number) => sq % COLS;
const at = (r: number, c: number) => r * COLS + c;
const inside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const sideOf = (code: number): Side => (code > 0 ? 0 : 1);

/** Palace of `s` (Cho: rows 7–9, Han: rows 0–2; files d–f). */
const inPalaceOf = (r: number, c: number, s: Side) =>
  c >= 3 && c <= 5 && (s === 0 ? r >= 7 && r <= 9 : r >= 0 && r <= 2);
const inAnyPalace = (r: number, c: number) => inPalaceOf(r, c, 0) || inPalaceOf(r, c, 1);
/** Palace points on the diagonals: the four corners and the center. */
const onDiagonal = (r: number, c: number) => {
  if (!inAnyPalace(r, c)) return false;
  const pr = r >= 7 ? r - 7 : r;
  return (pr === 1 && c === 4) || ((pr === 0 || pr === 2) && (c === 3 || c === 5));
};
/** Diagonal steps from (r, c) that stay on a palace diagonal. */
function palaceDiagonalSteps(r: number, c: number): [number, number][] {
  if (!onDiagonal(r, c)) return [];
  const out: [number, number][] = [];
  for (const dr of [-1, 1])
    for (const dc of [-1, 1]) {
      const nr = r + dr;
      const nc = c + dc;
      // Stay on the diagonals of the same palace.
      if (inside(nr, nc) && onDiagonal(nr, nc) && inPalaceOf(nr, nc, r >= 7 ? 0 : 1))
        out.push([dr, dc]);
    }
  return out;
}

const ORTHO = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

/** Back-rank orders of horses (H) and elephants (E) on files b, c and g, h. */
export const SETUPS = ['HEEH', 'EHEH', 'HEHE', 'EHHE'] as const;
export type Setup = (typeof SETUPS)[number];

export function janggiPlacement(cho: Setup, han: Setup): string {
  const rank = (s: Setup, lower: boolean) => {
    const p = [...s].map((x) => (x === 'H' ? 'n' : 'b'));
    const r = `r${p[0]}${p[1]}a1a${p[2]}${p[3]}r`;
    return lower ? r : r.toUpperCase();
  };
  // Han (top) sees the board from the other side, so its left-to-right order is mirrored.
  const hanRank = rank([...han].reverse().join('') as Setup, true);
  return [
    hanRank,
    '4k4',
    '1c5c1',
    'p1p1p1p1p',
    '9',
    '9',
    'P1P1P1P1P',
    '1C5C1',
    '4K4',
    rank(cho, false),
  ].join('/');
}

const LETTERS = ' kabnrcp';
export const POINTS = [0, 0, 3, 3, 5, 13, 7, 2];
/** Han, who moves second, gets 1.5 extra points when the game is decided by points. */
export const HAN_BONUS = 1.5;

function xorshift(seed: number) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x;
  };
}
const rand = xorshift(0x7a2691);
const Z_HI = Uint32Array.from({ length: 90 * 16 + 1 }, () => rand());
const Z_LO = Uint32Array.from({ length: 90 * 16 + 1 }, () => rand());
const zIndex = (sq: number, code: number) => sq * 16 + code + 8;

export class JanggiPosition {
  board = new Int8Array(ROWS * COLS);
  side: Side = 0;
  generals: [number, number] = [-1, -1];
  hashHi = 0;
  hashLo = 0;

  rehash() {
    this.hashHi = 0;
    this.hashLo = 0;
    this.board.forEach((code, sq) => {
      if (code === 0) return;
      this.hashHi ^= Z_HI[zIndex(sq, code)]!;
      this.hashLo ^= Z_LO[zIndex(sq, code)]!;
    });
    if (this.side === 1) {
      this.hashHi ^= Z_HI[90 * 16]!;
      this.hashLo ^= Z_LO[90 * 16]!;
    }
  }

  key(): number {
    return (this.hashHi >>> 11) * 4294967296 + (this.hashLo >>> 0);
  }

  /** Pseudo-legal moves of side `s` (passing excluded). */
  pseudoMoves(s: Side = this.side): JMove[] {
    const out: JMove[] = [];
    const b = this.board;
    const forward = s === 0 ? -1 : 1;
    const push = (from: number, r: number, c: number) => {
      if (!inside(r, c)) return false;
      const to = at(r, c);
      const target = b[to]!;
      if (target !== 0 && sideOf(target) === s) return false;
      out.push({ from, to, piece: b[from]!, captured: target });
      return target === 0;
    };
    for (let sq = 0; sq < b.length; sq++) {
      const code = b[sq]!;
      if (code === 0 || sideOf(code) !== s) continue;
      const r0 = rowOf(sq);
      const c0 = colOf(sq);
      switch (Math.abs(code)) {
        case GENERAL:
        case GUARD:
          for (const [dr, dc] of [...ORTHO, ...palaceDiagonalSteps(r0, c0)])
            if (inPalaceOf(r0 + dr, c0 + dc, s)) push(sq, r0 + dr, c0 + dc);
          break;
        case HORSE:
          for (const [dr, dc] of ORTHO) {
            if (!inside(r0 + dr, c0 + dc) || b[at(r0 + dr, c0 + dc)] !== 0) continue;
            for (const side of [-1, 1]) {
              const tr = r0 + 2 * dr + (dr === 0 ? side : 0);
              const tc = c0 + 2 * dc + (dc === 0 ? side : 0);
              push(sq, tr, tc);
            }
          }
          break;
        case ELEPHANT:
          for (const [dr, dc] of ORTHO) {
            const r1 = r0 + dr;
            const c1 = c0 + dc;
            if (!inside(r1, c1) || b[at(r1, c1)] !== 0) continue;
            for (const side of [-1, 1]) {
              const ddr = dr === 0 ? side : dr;
              const ddc = dc === 0 ? side : dc;
              const r2 = r1 + ddr;
              const c2 = c1 + ddc;
              if (!inside(r2, c2) || b[at(r2, c2)] !== 0) continue;
              push(sq, r2 + ddr, c2 + ddc);
            }
          }
          break;
        case CHARIOT:
          for (const [dr, dc] of [...ORTHO, ...palaceDiagonalSteps(r0, c0)]) {
            const diagonal = dr !== 0 && dc !== 0;
            let r = r0 + dr;
            let c = c0 + dc;
            while (inside(r, c) && (!diagonal || onDiagonal(r, c)) && push(sq, r, c)) {
              r += dr;
              c += dc;
            }
          }
          break;
        case CANNON:
          for (const [dr, dc] of [...ORTHO, ...palaceDiagonalSteps(r0, c0)]) {
            const diagonal = dr !== 0 && dc !== 0;
            let r = r0 + dr;
            let c = c0 + dc;
            const ok = (rr: number, cc: number) =>
              inside(rr, cc) && (!diagonal || onDiagonal(rr, cc));
            while (ok(r, c) && b[at(r, c)] === 0) {
              r += dr;
              c += dc;
            }
            if (!ok(r, c) || Math.abs(b[at(r, c)]!) === CANNON) continue; // no screen, or a cannon
            r += dr;
            c += dc;
            while (ok(r, c)) {
              const target = b[at(r, c)]!;
              if (target === 0) out.push({ from: sq, to: at(r, c), piece: code, captured: 0 });
              else {
                if (sideOf(target) !== s && Math.abs(target) !== CANNON)
                  out.push({ from: sq, to: at(r, c), piece: code, captured: target });
                break;
              }
              r += dr;
              c += dc;
            }
          }
          break;
        case SOLDIER: {
          push(sq, r0 + forward, c0);
          push(sq, r0, c0 - 1);
          push(sq, r0, c0 + 1);
          const enemy = (1 - s) as Side;
          if (inPalaceOf(r0, c0, enemy))
            for (const [dr, dc] of palaceDiagonalSteps(r0, c0))
              if (dr === forward && inPalaceOf(r0 + dr, c0 + dc, enemy)) push(sq, r0 + dr, c0 + dc);
          break;
        }
      }
    }
    return out;
  }

  isAttacked(sq: number, by: Side): boolean {
    return this.pseudoMoves(by).some((m) => m.to === sq);
  }

  inCheck(s: Side = this.side): boolean {
    const g = this.generals[s];
    return g >= 0 && this.isAttacked(g, (1 - s) as Side);
  }

  /** Generals on one file with nothing between them. */
  bikjang(): boolean {
    const [g0, g1] = this.generals;
    if (g0 < 0 || g1 < 0 || colOf(g0) !== colOf(g1)) return false;
    const [lo, hi] = g0 < g1 ? [g0, g1] : [g1, g0];
    for (let q = lo + COLS; q < hi; q += COLS) if (this.board[q] !== 0) return false;
    return true;
  }

  legalMoves(): JMove[] {
    const me = this.side;
    const legal: JMove[] = [];
    for (const m of this.pseudoMoves()) {
      const u = this.make(m);
      if (!this.inCheck(me)) legal.push(m);
      this.unmake(m, u);
    }
    return legal;
  }

  make(m: JMove) {
    const undo = { hashHi: this.hashHi, hashLo: this.hashLo };
    const toggle = (sq: number, code: number) => {
      this.hashHi ^= Z_HI[zIndex(sq, code)]!;
      this.hashLo ^= Z_LO[zIndex(sq, code)]!;
    };
    toggle(m.from, m.piece);
    if (m.captured) {
      toggle(m.to, m.captured);
      if (Math.abs(m.captured) === GENERAL) this.generals[sideOf(m.captured)] = -1;
    }
    toggle(m.to, m.piece);
    this.board[m.from] = 0;
    this.board[m.to] = m.piece;
    if (Math.abs(m.piece) === GENERAL) this.generals[sideOf(m.piece)] = m.to;
    this.passTurn();
    return undo;
  }

  unmake(m: JMove, undo: { hashHi: number; hashLo: number }) {
    this.board[m.from] = m.piece;
    this.board[m.to] = m.captured;
    if (Math.abs(m.piece) === GENERAL) this.generals[sideOf(m.piece)] = m.from;
    if (m.captured && Math.abs(m.captured) === GENERAL) this.generals[sideOf(m.captured)] = m.to;
    this.side = (1 - this.side) as Side;
    this.hashHi = undo.hashHi;
    this.hashLo = undo.hashLo;
  }

  passTurn() {
    this.side = (1 - this.side) as Side;
    this.hashHi ^= Z_HI[90 * 16]!;
    this.hashLo ^= Z_LO[90 * 16]!;
  }

  /** Material points of `s` (Han includes its 1.5 bonus). */
  points(s: Side): number {
    let total = s === 1 ? HAN_BONUS : 0;
    for (const code of this.board)
      if (code !== 0 && sideOf(code) === s) total += POINTS[Math.abs(code)]!;
    return total;
  }
}

export function parseJanggi(placement: string, side: Side = 0): JanggiPosition {
  const pos = new JanggiPosition();
  const ranks = placement.split('/');
  if (ranks.length !== ROWS) throw new Error('Wrong number of ranks');
  ranks.forEach((rank, r) => {
    let c = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        c += Number(ch);
        continue;
      }
      const type = LETTERS.indexOf(ch.toLowerCase());
      if (type <= 0 || c >= COLS) throw new Error(`Bad placement character ${ch}`);
      const cho = ch === ch.toUpperCase();
      pos.board[at(r, c)] = cho ? type : -type;
      if (type === GENERAL) pos.generals[cho ? 0 : 1] = at(r, c);
      c++;
    }
    if (c !== COLS) throw new Error('Rank has the wrong length');
  });
  pos.side = side;
  pos.rehash();
  return pos;
}

// ---- immutable game layer ---------------------------------------------------------------------

export type JanggiResult =
  | {
      kind: 'win';
      winner: Side;
      reason: 'checkmate' | 'points' | 'perpetual-check';
      points?: [number, number];
    }
  | { kind: 'draw'; reason: 'repetition' };

export interface JanggiState {
  startPlacement: string;
  board: number[];
  toMove: Side;
  history: string[];
  notation: string[];
  keys: number[];
  checks: boolean[];
  result: JanggiResult | null;
}

export const PASS = 'pass';
/** Plies after which the game is decided by points. */
export const JANGGI_PLY_LIMIT = 300;
const LETTER = ['', 'K', 'A', 'E', 'H', 'R', 'C', 'P'];

export const janggiMoveAction = (m: JMove) => `${squareName(m.from)}${squareName(m.to)}`;

export function janggiPositionOf(s: JanggiState): JanggiPosition {
  const pos = new JanggiPosition();
  pos.board = Int8Array.from(s.board);
  pos.side = s.toMove;
  pos.board.forEach((code, sq) => {
    if (Math.abs(code) === GENERAL) pos.generals[code > 0 ? 0 : 1] = sq;
  });
  pos.rehash();
  return pos;
}

export function isAllowedJanggiStart(placement: string): boolean {
  return SETUPS.some((a) => SETUPS.some((b) => janggiPlacement(a, b) === placement));
}

export function createJanggiState(placement = janggiPlacement('EHEH', 'EHEH')): JanggiState {
  const pos = parseJanggi(placement);
  return {
    startPlacement: placement,
    board: Array.from(pos.board),
    toMove: 0,
    history: [],
    notation: [],
    keys: [pos.key()],
    checks: [],
    result: null,
  };
}

/** Legal actions: moves, plus passing when not in check. */
export function janggiLegalActions(s: JanggiState): string[] {
  if (s.result) return [];
  const pos = janggiPositionOf(s);
  const actions = pos.legalMoves().map(janggiMoveAction);
  if (!pos.inCheck()) actions.push(PASS);
  return actions;
}

function byPoints(pos: JanggiPosition): JanggiResult {
  const points: [number, number] = [pos.points(0), pos.points(1)];
  return { kind: 'win', winner: points[0] > points[1] ? 0 : 1, reason: 'points', points };
}

function advanceJanggi(pos: JanggiPosition, s: JanggiState, action: string): JanggiState {
  if (s.result) throw new IllegalActionError('The game is over');
  const mover = pos.side;
  let notation: string;
  const wasBikjang = pos.bikjang();
  if (action === PASS) {
    if (pos.inCheck()) throw new IllegalActionError('Cannot pass while in check');
    pos.passTurn();
    notation = PASS;
  } else {
    const move = pos.legalMoves().find((m) => janggiMoveAction(m) === action);
    if (!move) throw new IllegalActionError(`Move ${action} is not legal`);
    pos.make(move);
    notation = `${LETTER[Math.abs(move.piece)]}${squareName(move.from)}${move.captured ? 'x' : '-'}${squareName(move.to)}`;
  }
  const opponent = pos.side;
  const givesCheck = pos.inCheck(opponent);
  const key = pos.key();
  const keys = [...s.keys, key];
  const checks = [...s.checks, givesCheck];
  const history = [...s.history, action];
  let result: JanggiResult | null = null;
  const passes = action === PASS && s.history[s.history.length - 1] === PASS;
  if (givesCheck && pos.legalMoves().length === 0) {
    result = { kind: 'win', winner: mover, reason: 'checkmate' };
  } else if (wasBikjang && pos.bikjang()) {
    // A bikjang left standing ends the game: it is decided by points.
    result = byPoints(pos);
  } else if (passes || history.length >= JANGGI_PLY_LIMIT) {
    result = byPoints(pos);
  } else if (keys.filter((k) => k === key).length >= 3) {
    const first = keys.indexOf(key);
    const span = checks.slice(first);
    const always = (o: Side) =>
      span.some((_, i) => (first + i) % 2 === o) &&
      span.every((c, i) => (first + i) % 2 !== o || c);
    result =
      always(mover) && !always(opponent)
        ? { kind: 'win', winner: opponent, reason: 'perpetual-check' }
        : { kind: 'draw', reason: 'repetition' };
  }
  return {
    startPlacement: s.startPlacement,
    board: Array.from(pos.board),
    toMove: opponent,
    history,
    notation: [...s.notation, notation],
    keys,
    checks,
    result,
  };
}

export function applyJanggiAction(s: JanggiState, action: string): JanggiState {
  return advanceJanggi(janggiPositionOf(s), s, action);
}

const replayCache: JanggiState[] = [];

export function replayJanggi(startPlacement: string, history: readonly string[]): JanggiState {
  let cached: JanggiState | null = null;
  for (const e of replayCache) {
    if (e.startPlacement !== startPlacement || e.history.length > history.length) continue;
    if ((cached?.history.length ?? -1) >= e.history.length) continue;
    if (e.history.every((a, i) => a === history[i])) cached = e;
  }
  let s = cached ?? createJanggiState(startPlacement);
  const pos = janggiPositionOf(s);
  for (let i = s.history.length; i < history.length; i++) s = advanceJanggi(pos, s, history[i]!);
  replayCache.unshift(s);
  if (replayCache.length > 12) replayCache.pop();
  return s;
}

export function isValidJanggiState(data: unknown): data is JanggiState {
  if (!isRecord(data) || typeof data.startPlacement !== 'string' || !Array.isArray(data.history))
    return false;
  if (!isAllowedJanggiStart(data.startPlacement)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayJanggi(data.startPlacement, data.history as string[])) ===
      JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
