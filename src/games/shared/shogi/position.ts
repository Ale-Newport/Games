/**
 * Mutable shogi-family position with legal move generation (board moves, promotions, drops with
 * the two-pawn, dead-piece and pawn-drop-mate rules), make/unmake, attack detection, perft and
 * Zobrist keys. Board codes are signed kind indices: positive = Sente (Black, moves first, bottom),
 * negative = Gote (White, top). Square index = row * cols + col, row 0 at the top.
 */
import type { PieceDef, ShogiVariant } from './variants';

export type Owner = 0 | 1;

export interface ShogiMove {
  /** Origin square, or -1 for a drop. */
  from: number;
  to: number;
  /** Kind index of the moving (or dropped) piece before the move. */
  kind: number;
  /** Signed board code of the captured piece (0 = none). */
  captured: number;
  promote: boolean;
}

interface Undo {
  hashHi: number;
  hashLo: number;
}

const ownerOf = (code: number): Owner => (code > 0 ? 0 : 1);

/** Deterministic 32-bit generator for the Zobrist tables. */
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

interface Geometry {
  steps: [number, number][][][]; // [owner][kind] → oriented steps
  slides: [number, number][][][];
  dirs: [number, number][];
  stepMask: number[][]; // [owner][dir] → bitmask of kinds stepping that way
  slideMask: number[][];
}

const geometryCache = new Map<string, Geometry>();

function geometryOf(v: ShogiVariant): Geometry {
  const cached = geometryCache.get(v.id);
  if (cached) return cached;
  const orient = (vec: readonly [number, number], o: Owner): [number, number] =>
    o === 0 ? [vec[0], vec[1]] : [-vec[0], -vec[1]];
  const steps: [number, number][][][] = [[], []];
  const slides: [number, number][][][] = [[], []];
  const dirs: [number, number][] = [];
  const dirIndex = (d: [number, number]) => {
    let i = dirs.findIndex(([a, b]) => a === d[0] && b === d[1]);
    if (i < 0) i = dirs.push(d) - 1;
    return i;
  };
  for (const o of [0, 1] as Owner[]) {
    v.kinds.forEach((def, k) => {
      steps[o]![k] = def ? def.steps.map((s) => orient(s, o)) : [];
      slides[o]![k] = def ? def.slides.map((s) => orient(s, o)) : [];
    });
  }
  const stepMask: number[][] = [[], []];
  const slideMask: number[][] = [[], []];
  for (const o of [0, 1] as Owner[]) {
    for (let k = 1; k < v.kinds.length; k++) {
      for (const d of steps[o]![k]!) {
        const i = dirIndex(d);
        stepMask[o]![i] = (stepMask[o]![i] ?? 0) | (1 << k);
      }
      for (const d of slides[o]![k]!) {
        const i = dirIndex(d);
        slideMask[o]![i] = (slideMask[o]![i] ?? 0) | (1 << k);
      }
    }
  }
  const g = { steps, slides, dirs, stepMask, slideMask };
  geometryCache.set(v.id, g);
  return g;
}

export class ShogiPosition {
  readonly rows: number;
  readonly cols: number;
  board: Int8Array;
  hands: [Int8Array, Int8Array];
  side: Owner = 0;
  kings: [number, number] = [-1, -1];
  hashHi = 0;
  hashLo = 0;
  private readonly g: Geometry;
  private readonly zHi: Uint32Array;
  private readonly zLo: Uint32Array;
  private readonly kinds: number;

  constructor(readonly v: ShogiVariant) {
    this.rows = v.rows;
    this.cols = v.cols;
    this.kinds = v.kinds.length;
    this.board = new Int8Array(v.rows * v.cols);
    this.hands = [new Int8Array(this.kinds), new Int8Array(this.kinds)];
    this.g = geometryOf(v);
    // Square × signed kind, plus hand counts (owner × kind × up to 20 pieces), plus side.
    const size = v.rows * v.cols * this.kinds * 2 + 2 * this.kinds * 20 + 1;
    const rand = xorshift(0x5106 + v.rows * 31 + v.cols);
    this.zHi = new Uint32Array(size).map(() => rand());
    this.zLo = new Uint32Array(size).map(() => rand());
  }

  def(kind: number): PieceDef {
    return this.v.kinds[kind]!;
  }

  // ---- hashing -----------------------------------------------------------------------------
  private sqIndex(sq: number, code: number) {
    return (sq * this.kinds + Math.abs(code)) * 2 + (code > 0 ? 0 : 1);
  }
  private handIndex(o: Owner, kind: number, count: number) {
    return (
      this.rows * this.cols * this.kinds * 2 + (o * this.kinds + kind) * 20 + Math.min(count, 19)
    );
  }
  private toggle(i: number) {
    this.hashHi ^= this.zHi[i]!;
    this.hashLo ^= this.zLo[i]!;
  }
  private sideIndex() {
    return this.zHi.length - 1;
  }

  rehash() {
    this.hashHi = 0;
    this.hashLo = 0;
    this.board.forEach((code, sq) => code !== 0 && this.toggle(this.sqIndex(sq, code)));
    for (const o of [0, 1] as Owner[])
      for (let k = 1; k < this.kinds; k++)
        if (this.hands[o][k]) this.toggle(this.handIndex(o, k, this.hands[o][k]!));
    if (this.side === 1) this.toggle(this.sideIndex());
  }

  /** Numeric position key (board, hands, side to move). */
  key(): number {
    return (this.hashHi >>> 11) * 4294967296 + (this.hashLo >>> 0);
  }

  clone(): ShogiPosition {
    const p = new ShogiPosition(this.v);
    p.board = this.board.slice();
    p.hands = [this.hands[0].slice(), this.hands[1].slice()];
    p.side = this.side;
    p.kings = [this.kings[0], this.kings[1]];
    p.hashHi = this.hashHi;
    p.hashLo = this.hashLo;
    return p;
  }

  // ---- geometry ----------------------------------------------------------------------------
  /** Distance of `row` from `o`'s far edge (0 = the last row for that player). */
  farDistance(row: number, o: Owner): number {
    return o === 0 ? row : this.rows - 1 - row;
  }
  inZone(sq: number, o: Owner): boolean {
    return this.farDistance(Math.floor(sq / this.cols), o) < this.v.promotionRows;
  }

  isAttacked(sq: number, by: Owner): boolean {
    const { dirs, stepMask, slideMask } = this.g;
    const r0 = Math.floor(sq / this.cols);
    const c0 = sq % this.cols;
    for (let d = 0; d < dirs.length; d++) {
      const sm = stepMask[by]![d] ?? 0;
      const lm = slideMask[by]![d] ?? 0;
      if (!sm && !lm) continue;
      const [dr, dc] = dirs[d]!;
      let r = r0 - dr;
      let c = c0 - dc;
      let dist = 1;
      while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        const code = this.board[r * this.cols + c]!;
        if (code !== 0) {
          if (ownerOf(code) === by) {
            const bit = 1 << Math.abs(code);
            if ((dist === 1 && sm & bit) || lm & bit) return true;
          }
          break;
        }
        if (!lm) break;
        r -= dr;
        c -= dc;
        dist++;
      }
    }
    return false;
  }

  inCheck(o: Owner = this.side): boolean {
    const k = this.kings[o];
    return k >= 0 && this.isAttacked(k, (1 - o) as Owner);
  }

  // ---- move generation ---------------------------------------------------------------------
  pseudoMoves(): ShogiMove[] {
    const out: ShogiMove[] = [];
    const me = this.side;
    const { steps, slides } = this.g;
    const { rows, cols } = this;
    for (let sq = 0; sq < this.board.length; sq++) {
      const code = this.board[sq]!;
      if (code === 0 || ownerOf(code) !== me) continue;
      const kind = Math.abs(code);
      const r0 = Math.floor(sq / cols);
      const c0 = sq % cols;
      const add = (to: number) => {
        const target = this.board[to]!;
        if (target !== 0 && ownerOf(target) === me) return false;
        this.addBoardMove(out, sq, to, kind, target);
        return target === 0;
      };
      for (const [dr, dc] of steps[me]![kind]!) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) add(r * cols + c);
      }
      for (const [dr, dc] of slides[me]![kind]!) {
        let r = r0 + dr;
        let c = c0 + dc;
        while (r >= 0 && r < rows && c >= 0 && c < cols && add(r * cols + c)) {
          r += dr;
          c += dc;
        }
      }
    }
    this.addDrops(out);
    return out;
  }

  private addBoardMove(out: ShogiMove[], from: number, to: number, kind: number, captured: number) {
    const def = this.def(kind);
    const me = this.side;
    const canPromote = def.promotesTo > 0 && (this.inZone(from, me) || this.inZone(to, me));
    const dead = this.farDistance(Math.floor(to / this.cols), me) < def.deadRows;
    if (canPromote) out.push({ from, to, kind, captured, promote: true });
    if (!canPromote || (this.v.optionalPromotion && !dead))
      out.push({ from, to, kind, captured, promote: false });
  }

  private addDrops(out: ShogiMove[]) {
    const me = this.side;
    const hand = this.hands[me];
    const { cols } = this;
    let pawnFiles = 0;
    if (this.v.nifu && hand[this.v.pawnKind]) {
      const pawn = me === 0 ? this.v.pawnKind : -this.v.pawnKind;
      this.board.forEach((code, sq) => code === pawn && (pawnFiles |= 1 << (sq % cols)));
    }
    for (let kind = 1; kind < this.kinds; kind++) {
      if (!hand[kind]) continue;
      const def = this.def(kind);
      for (let to = 0; to < this.board.length; to++) {
        if (this.board[to] !== 0) continue;
        if (this.farDistance(Math.floor(to / cols), me) < def.deadRows) continue;
        if (kind === this.v.pawnKind && this.v.nifu && pawnFiles & (1 << (to % cols))) continue;
        out.push({ from: -1, to, kind, captured: 0, promote: false });
      }
    }
  }

  /** Whether the side to move has at least one legal move (pawn-drop mates not excluded). */
  hasLegalMove(): boolean {
    const me = this.side;
    for (const m of this.pseudoMoves()) {
      if (this.v.goal === 'capture') return true;
      const u = this.make(m);
      const ok = !this.inCheck(me);
      this.unmake(m, u);
      if (ok) return true;
    }
    return false;
  }

  /** Whether `m` (pseudo-legal, already known not to expose the own king) is a pawn-drop mate. */
  isPawnDropMate(m: ShogiMove): boolean {
    if (!this.v.uchifuzume || m.from >= 0 || m.kind !== this.v.pawnKind) return false;
    const u = this.make(m);
    const mate = this.inCheck() && !this.hasLegalMove();
    this.unmake(m, u);
    return mate;
  }

  legalMoves(): ShogiMove[] {
    const pseudo = this.pseudoMoves();
    if (this.v.goal === 'capture') return pseudo;
    const me = this.side;
    const legal: ShogiMove[] = [];
    for (const m of pseudo) {
      const u = this.make(m);
      const ok = !this.inCheck(me);
      this.unmake(m, u);
      if (ok && !this.isPawnDropMate(m)) legal.push(m);
    }
    return legal;
  }

  // ---- make / unmake -----------------------------------------------------------------------
  make(m: ShogiMove): Undo {
    const undo = { hashHi: this.hashHi, hashLo: this.hashLo };
    const me = this.side;
    const sign = me === 0 ? 1 : -1;
    const hand = this.hands[me];
    if (m.from < 0) {
      this.toggle(this.handIndex(me, m.kind, hand[m.kind]!));
      hand[m.kind]!--;
      if (hand[m.kind]) this.toggle(this.handIndex(me, m.kind, hand[m.kind]!));
      this.board[m.to] = sign * m.kind;
      this.toggle(this.sqIndex(m.to, sign * m.kind));
    } else {
      const code = this.board[m.from]!;
      this.toggle(this.sqIndex(m.from, code));
      this.board[m.from] = 0;
      if (m.captured !== 0) {
        this.toggle(this.sqIndex(m.to, m.captured));
        const base = this.def(Math.abs(m.captured)).base;
        if (hand[base]) this.toggle(this.handIndex(me, base, hand[base]!));
        hand[base]!++;
        this.toggle(this.handIndex(me, base, hand[base]!));
        if (this.def(Math.abs(m.captured)).royal) this.kings[(1 - me) as Owner] = -1;
      }
      const kind = m.promote ? this.def(m.kind).promotesTo : m.kind;
      this.board[m.to] = sign * kind;
      this.toggle(this.sqIndex(m.to, sign * kind));
      if (this.def(m.kind).royal) this.kings[me] = m.to;
    }
    this.side = (1 - me) as Owner;
    this.toggle(this.sideIndex());
    return undo;
  }

  unmake(m: ShogiMove, undo: Undo) {
    this.side = (1 - this.side) as Owner;
    const me = this.side;
    const sign = me === 0 ? 1 : -1;
    const hand = this.hands[me];
    if (m.from < 0) {
      hand[m.kind]!++;
      this.board[m.to] = 0;
    } else {
      this.board[m.from] = sign * m.kind;
      this.board[m.to] = m.captured;
      if (m.captured !== 0) {
        hand[this.def(Math.abs(m.captured)).base]!--;
        if (this.def(Math.abs(m.captured)).royal) this.kings[(1 - me) as Owner] = m.to;
      }
      if (this.def(m.kind).royal) this.kings[me] = m.from;
    }
    this.hashHi = undo.hashHi;
    this.hashLo = undo.hashLo;
  }

  perft(depth: number): number {
    if (depth === 0) return 1;
    const moves = this.legalMoves();
    if (depth === 1) return moves.length;
    let n = 0;
    for (const m of moves) {
      const u = this.make(m);
      n += this.perft(depth - 1);
      this.unmake(m, u);
    }
    return n;
  }
}

// ---- text formats ----------------------------------------------------------------------------

/** Square name: file number counted from the right (Sente's view), rank letter from the top. */
export function squareName(v: ShogiVariant, sq: number): string {
  return `${v.cols - (sq % v.cols)}${String.fromCharCode(97 + Math.floor(sq / v.cols))}`;
}

export function parseSquare(v: ShogiVariant, name: string): number {
  const file = Number(name.slice(0, -1));
  const row = name.charCodeAt(name.length - 1) - 97;
  const col = v.cols - file;
  if (!(file >= 1 && file <= v.cols && row >= 0 && row < v.rows))
    throw new Error(`Bad square ${name}`);
  return row * v.cols + col;
}

/** Kind index for a letter like 'P' or '+P' (case-insensitive). */
export function kindOf(v: ShogiVariant, letter: string): number {
  const k = v.kinds.findIndex((d) => d?.letter === letter.toUpperCase());
  if (k <= 0) throw new Error(`Unknown piece ${letter}`);
  return k;
}

/** Position from an SFEN-like placement ("lnsgkgsnl/1r5b1/…"), side and hands ("-" or "2Pp"). */
export function parsePlacement(
  v: ShogiVariant,
  placement: string,
  side: Owner = 0,
  hands = '-',
): ShogiPosition {
  const pos = new ShogiPosition(v);
  const ranks = placement.split('/');
  if (ranks.length !== v.rows) throw new Error('Wrong number of ranks');
  ranks.forEach((rank, r) => {
    let c = 0;
    for (let i = 0; i < rank.length; i++) {
      const ch = rank[i]!;
      if (/\d/.test(ch)) {
        c += Number(ch);
        continue;
      }
      let letter = ch;
      if (ch === '+') letter = `+${rank[++i]!}`;
      const kind = kindOf(v, letter);
      const sente = letter[letter.length - 1] === letter[letter.length - 1]!.toUpperCase();
      if (c >= v.cols) throw new Error('Rank too long');
      pos.board[r * v.cols + c] = sente ? kind : -kind;
      if (v.kinds[kind]!.royal) pos.kings[sente ? 0 : 1] = r * v.cols + c;
      c++;
    }
    if (c !== v.cols) throw new Error('Rank has the wrong length');
  });
  if (hands !== '-') {
    for (const [, count, letter] of hands.matchAll(/(\d*)([A-Za-z])/g)) {
      const kind = kindOf(v, letter!);
      pos.hands[letter === letter!.toUpperCase() ? 0 : 1][kind]! += Number(count || 1);
    }
  }
  pos.side = side;
  pos.rehash();
  return pos;
}

export function formatPlacement(pos: ShogiPosition): string {
  const v = pos.v;
  const ranks: string[] = [];
  for (let r = 0; r < v.rows; r++) {
    let s = '';
    let empty = 0;
    for (let c = 0; c < v.cols; c++) {
      const code = pos.board[r * v.cols + c]!;
      if (code === 0) {
        empty++;
        continue;
      }
      if (empty) s += empty;
      empty = 0;
      const letter = v.kinds[Math.abs(code)]!.letter;
      s += code > 0 ? letter : letter.toLowerCase();
    }
    if (empty) s += empty;
    ranks.push(s);
  }
  return ranks.join('/');
}

export function formatHands(pos: ShogiPosition): string {
  let s = '';
  for (const o of [0, 1] as Owner[])
    pos.v.kinds.forEach((def, k) => {
      const n = pos.hands[o][k] ?? 0;
      if (!def || !n) return;
      s += `${n > 1 ? n : ''}${o === 0 ? def.letter : def.letter.toLowerCase()}`;
    });
  return s || '-';
}

/** USI-style action: "7g7f", "8h2b+" or "P*5e". */
export function moveAction(pos: ShogiPosition, m: ShogiMove): string {
  const v = pos.v;
  if (m.from < 0) return `${v.kinds[m.kind]!.letter}*${squareName(v, m.to)}`;
  return `${squareName(v, m.from)}${squareName(v, m.to)}${m.promote ? '+' : ''}`;
}
