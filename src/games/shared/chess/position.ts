/**
 * Mutable chess position with make/unmake, shared by the rules engine (immutable game states are
 * built from it) and by the search agent. Supports board sizes up to 8×8 (Gardner 5×5 uses it) and
 * Chess960 castling (castling rights are stored as rook squares).
 *
 * Mailbox layout: the W×H board is padded by two off-board squares on every side.
 * Ranks grow upward (rank index 0 = rank 1, White's back rank). White pawns move +stride.
 */
export type Color = 0 | 1;

export const EMPTY = 0;
export const OFF = -1;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export const pieceColor = (p: number): Color => (p >= 8 ? 1 : 0);
export const pieceType = (p: number) => p & 7;
export const makePiece = (color: Color, type: number) => (color === 1 ? 8 : 0) + type;

export interface VariantRules {
  width: number;
  height: number;
  /** Pawns may advance two squares from their starting rank (and capture en passant). */
  doublePush: boolean;
  castling: boolean;
  /** Antichess: the king is not royal (no check), captures are compulsory. */
  antichess: boolean;
}

export const FLAG_DOUBLE = 1;
export const FLAG_EP = 2;
export const FLAG_CASTLE = 4;

export interface Move {
  from: number;
  to: number;
  piece: number;
  captured: number;
  promo: number;
  flags: number;
  /** Castling side: 0 kingside (toward the h-file), 1 queenside. */
  castleSide?: 0 | 1;
}

interface Undo {
  captured: number;
  capturedSq: number;
  castle: number[];
  ep: number;
  halfmove: number;
  kings: [number, number];
  hashHi: number;
  hashLo: number;
}

const ZOBRIST_SEED = 0x2545f491;
function zobristTable(size: number): Uint32Array {
  let x = ZOBRIST_SEED;
  const t = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    t[i] = x >>> 0;
  }
  return t;
}

export class Position {
  readonly W: number;
  readonly H: number;
  readonly stride: number;
  board: Int8Array;
  side: Color = 0;
  /** Rook squares with castling rights: [white kingside, white queenside, black kingside, black queenside] (-1 = none). */
  castle: number[] = [-1, -1, -1, -1];
  /** En passant target square, or -1. */
  ep = -1;
  halfmove = 0;
  fullmove = 1;
  kings: [number, number] = [-1, -1];
  hashHi = 0;
  hashLo = 0;
  private readonly zHi: Uint32Array;
  private readonly zLo: Uint32Array;
  readonly knightSteps: number[];
  readonly diagSteps: number[];
  readonly lineSteps: number[];

  constructor(readonly rules: VariantRules) {
    this.W = rules.width;
    this.H = rules.height;
    this.stride = this.W + 4;
    this.board = new Int8Array(this.stride * (this.H + 4)).fill(OFF);
    for (let r = 0; r < this.H; r++)
      for (let f = 0; f < this.W; f++) this.board[this.sq(f, r)] = EMPTY;
    const s = this.stride;
    this.knightSteps = [2 * s + 1, 2 * s - 1, -2 * s + 1, -2 * s - 1, s + 2, s - 2, -s + 2, -s - 2];
    this.diagSteps = [s + 1, s - 1, -s + 1, -s - 1];
    this.lineSteps = [s, -s, 1, -1];
    this.zHi = zobristTable(this.board.length * 16 + 64);
    this.zLo = zobristTable(this.board.length * 16 + 128).map((v, i) => v ^ (i * 0x9e3779b9));
  }

  sq(file: number, rank: number): number {
    return (rank + 2) * this.stride + file + 2;
  }

  fileOf(sq: number): number {
    return (sq % this.stride) - 2;
  }

  rankOf(sq: number): number {
    return Math.floor(sq / this.stride) - 2;
  }

  /** Squares of the real board in a1, b1, …, h8 order. */
  squares(): number[] {
    const out: number[] = [];
    for (let r = 0; r < this.H; r++) for (let f = 0; f < this.W; f++) out.push(this.sq(f, r));
    return out;
  }

  clone(): Position {
    const p = new Position(this.rules);
    p.board = this.board.slice();
    p.side = this.side;
    p.castle = this.castle.slice();
    p.ep = this.ep;
    p.halfmove = this.halfmove;
    p.fullmove = this.fullmove;
    p.kings = [this.kings[0], this.kings[1]];
    p.hashHi = this.hashHi;
    p.hashLo = this.hashLo;
    return p;
  }

  // ---- hashing -----------------------------------------------------------------------------
  private toggle(index: number) {
    this.hashHi ^= this.zHi[index]!;
    this.hashLo ^= this.zLo[index]!;
  }

  private pieceKey(sq: number, piece: number) {
    return sq * 16 + piece;
  }

  rehash() {
    this.hashHi = 0;
    this.hashLo = 0;
    for (let i = 0; i < this.board.length; i++)
      if (this.board[i]! > 0) this.toggle(this.pieceKey(i, this.board[i]!));
    if (this.side === 1) this.toggle(this.board.length * 16);
    this.castle.forEach((rook, k) => rook >= 0 && this.toggle(this.board.length * 16 + 1 + k));
    if (this.ep >= 0) this.toggle(this.board.length * 16 + 5 + this.fileOf(this.ep));
    this.kings = [-1, -1];
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] === makePiece(0, KING)) this.kings[0] = i;
      if (this.board[i] === makePiece(1, KING)) this.kings[1] = i;
    }
  }

  /** 53-bit key for transposition tables. */
  key(): number {
    return (this.hashHi >>> 11) * 4294967296 + (this.hashLo >>> 0);
  }

  // ---- attacks -----------------------------------------------------------------------------
  isAttacked(sq: number, by: Color): boolean {
    const b = this.board;
    const s = this.stride;
    const pawnDir = by === 0 ? -s : s; // a pawn of `by` attacks from one rank "behind" the target
    const pawn = makePiece(by, PAWN);
    if (b[sq + pawnDir + 1] === pawn || b[sq + pawnDir - 1] === pawn) return true;
    const knight = makePiece(by, KNIGHT);
    for (const d of this.knightSteps) if (b[sq + d] === knight) return true;
    const king = makePiece(by, KING);
    for (const d of this.diagSteps) if (b[sq + d] === king) return true;
    for (const d of this.lineSteps) if (b[sq + d] === king) return true;
    const bishop = makePiece(by, BISHOP);
    const rook = makePiece(by, ROOK);
    const queen = makePiece(by, QUEEN);
    for (const d of this.diagSteps) {
      let t = sq + d;
      while (b[t] === EMPTY) t += d;
      if (b[t] === bishop || b[t] === queen) return true;
    }
    for (const d of this.lineSteps) {
      let t = sq + d;
      while (b[t] === EMPTY) t += d;
      if (b[t] === rook || b[t] === queen) return true;
    }
    return false;
  }

  inCheck(color: Color = this.side): boolean {
    if (this.rules.antichess) return false;
    const k = this.kings[color];
    return k >= 0 && this.isAttacked(k, (1 - color) as Color);
  }

  // ---- move generation ---------------------------------------------------------------------
  private promotionTypes(): number[] {
    return this.rules.antichess
      ? [QUEEN, ROOK, BISHOP, KNIGHT, KING]
      : [QUEEN, ROOK, BISHOP, KNIGHT];
  }

  pseudoMoves(out: Move[] = []): Move[] {
    const b = this.board;
    const s = this.stride;
    const me = this.side;
    const them = (1 - me) as Color;
    const fwd = me === 0 ? s : -s;
    const startRank = me === 0 ? 1 : this.H - 2;
    const lastRank = me === 0 ? this.H - 1 : 0;
    const isEnemy = (p: number) => p > 0 && pieceColor(p) === them;
    const push = (from: number, to: number, piece: number, captured: number, flags = 0) => {
      if (pieceType(piece) === PAWN && this.rankOf(to) === lastRank) {
        for (const t of this.promotionTypes())
          out.push({ from, to, piece, captured, promo: makePiece(me, t), flags });
      } else out.push({ from, to, piece, captured, promo: 0, flags });
    };
    for (let from = 0; from < b.length; from++) {
      const piece = b[from]!;
      if (piece <= 0 || pieceColor(piece) !== me) continue;
      const type = pieceType(piece);
      if (type === PAWN) {
        const one = from + fwd;
        if (b[one] === EMPTY) {
          push(from, one, piece, EMPTY);
          if (this.rules.doublePush && this.rankOf(from) === startRank && b[one + fwd] === EMPTY)
            push(from, one + fwd, piece, EMPTY, FLAG_DOUBLE);
        }
        for (const side of [1, -1]) {
          const to = one + side;
          if (isEnemy(b[to]!)) push(from, to, piece, b[to]!);
          else if (to === this.ep && this.ep >= 0)
            out.push({
              from,
              to,
              piece,
              captured: makePiece(them, PAWN),
              promo: 0,
              flags: FLAG_EP,
            });
        }
        continue;
      }
      const steps =
        type === KNIGHT
          ? this.knightSteps
          : type === BISHOP
            ? this.diagSteps
            : type === ROOK
              ? this.lineSteps
              : [...this.diagSteps, ...this.lineSteps];
      const slides = type === BISHOP || type === ROOK || type === QUEEN;
      for (const d of steps) {
        let to = from + d;
        while (b[to] !== OFF) {
          const target = b[to]!;
          if (target === EMPTY) push(from, to, piece, EMPTY);
          else {
            if (isEnemy(target)) push(from, to, piece, target);
            break;
          }
          if (!slides) break;
          to += d;
        }
      }
    }
    if (this.rules.castling) this.castleMoves(out);
    return out;
  }

  /** Castling destinations: king to the g-/c-file, rook to the f-/d-file (standard and Chess960). */
  castleTargets(color: Color, side: 0 | 1) {
    const rank = color === 0 ? 0 : this.H - 1;
    return { kingTo: this.sq(side === 0 ? 6 : 2, rank), rookTo: this.sq(side === 0 ? 5 : 3, rank) };
  }

  private castleMoves(out: Move[]) {
    const me = this.side;
    const kingFrom = this.kings[me];
    if (kingFrom < 0 || this.inCheck(me)) return;
    for (const side of [0, 1] as const) {
      const rookFrom = this.castle[me * 2 + side]!;
      if (rookFrom < 0 || this.board[rookFrom] !== makePiece(me, ROOK)) continue;
      const { kingTo, rookTo } = this.castleTargets(me, side);
      const lo = Math.min(kingFrom, kingTo, rookFrom, rookTo);
      const hi = Math.max(kingFrom, kingTo, rookFrom, rookTo);
      let clear = true;
      for (let t = lo; t <= hi; t++)
        if (t !== kingFrom && t !== rookFrom && this.board[t] !== EMPTY) clear = false;
      if (!clear) continue;
      const step = kingTo > kingFrom ? 1 : -1;
      let safe = true;
      for (let t = kingFrom; ; t += step) {
        if (this.isAttacked(t, (1 - me) as Color)) safe = false;
        if (t === kingTo) break;
      }
      if (!safe) continue;
      out.push({
        from: kingFrom,
        to: kingTo,
        piece: makePiece(me, KING),
        captured: EMPTY,
        promo: 0,
        flags: FLAG_CASTLE,
        castleSide: side,
      });
    }
  }

  legalMoves(): Move[] {
    const pseudo = this.pseudoMoves();
    if (this.rules.antichess) {
      const captures = pseudo.filter((m) => m.captured !== EMPTY);
      return captures.length ? captures : pseudo;
    }
    const me = this.side;
    const legal: Move[] = [];
    for (const m of pseudo) {
      const undo = this.make(m);
      if (!this.inCheck(me)) legal.push(m);
      this.unmake(m, undo);
    }
    return legal;
  }

  // ---- make / unmake -----------------------------------------------------------------------
  private setPiece(sq: number, piece: number) {
    const old = this.board[sq]!;
    if (old > 0) this.toggle(this.pieceKey(sq, old));
    this.board[sq] = piece;
    if (piece > 0) this.toggle(this.pieceKey(sq, piece));
  }

  private setCastle(k: number, rook: number) {
    if (this.castle[k]! >= 0) this.toggle(this.board.length * 16 + 1 + k);
    this.castle[k] = rook;
    if (rook >= 0) this.toggle(this.board.length * 16 + 1 + k);
  }

  private setEp(sq: number) {
    if (this.ep >= 0) this.toggle(this.board.length * 16 + 5 + this.fileOf(this.ep));
    this.ep = sq;
    if (sq >= 0) this.toggle(this.board.length * 16 + 5 + this.fileOf(sq));
  }

  make(m: Move): Undo {
    const undo: Undo = {
      captured: m.captured,
      capturedSq: m.to,
      castle: this.castle.slice(),
      ep: this.ep,
      halfmove: this.halfmove,
      kings: [this.kings[0], this.kings[1]],
      hashHi: this.hashHi,
      hashLo: this.hashLo,
    };
    const me = this.side;
    const type = pieceType(m.piece);
    if (m.flags & FLAG_CASTLE) {
      const rookFrom = this.castle[me * 2 + m.castleSide!]!;
      const { kingTo, rookTo } = this.castleTargets(me, m.castleSide!);
      this.setPiece(m.from, EMPTY);
      this.setPiece(rookFrom, EMPTY);
      this.setPiece(kingTo, makePiece(me, KING));
      this.setPiece(rookTo, makePiece(me, ROOK));
      this.kings[me] = kingTo;
    } else {
      if (m.flags & FLAG_EP) {
        const capSq = m.to + (me === 0 ? -this.stride : this.stride);
        undo.capturedSq = capSq;
        this.setPiece(capSq, EMPTY);
      }
      this.setPiece(m.from, EMPTY);
      this.setPiece(m.to, m.promo || m.piece);
      if (type === KING) this.kings[me] = m.to;
      if (pieceType(m.captured) === KING && m.captured !== EMPTY)
        this.kings[pieceColor(m.captured)] = -1;
    }
    // Castling rights: lost when the king moves or a castling rook moves or is captured.
    for (let k = 0; k < 4; k++) {
      const rook = this.castle[k]!;
      if (rook < 0) continue;
      const owner = k < 2 ? 0 : 1;
      if (
        (owner === me && type === KING) ||
        rook === m.from ||
        (rook === m.to && !(m.flags & FLAG_CASTLE))
      )
        this.setCastle(k, -1);
    }
    this.setEp(m.flags & FLAG_DOUBLE ? (m.from + m.to) / 2 : -1);
    this.halfmove = type === PAWN || m.captured !== EMPTY ? 0 : this.halfmove + 1;
    if (me === 1) this.fullmove++;
    this.side = (1 - me) as Color;
    this.toggle(this.board.length * 16);
    return undo;
  }

  unmake(m: Move, undo: Undo) {
    this.side = (1 - this.side) as Color;
    const me = this.side;
    if (me === 1) this.fullmove--;
    if (m.flags & FLAG_CASTLE) {
      const rookFrom = undo.castle[me * 2 + m.castleSide!]!;
      const { kingTo, rookTo } = this.castleTargets(me, m.castleSide!);
      this.board[kingTo] = EMPTY;
      this.board[rookTo] = EMPTY;
      this.board[m.from] = makePiece(me, KING);
      this.board[rookFrom] = makePiece(me, ROOK);
    } else {
      this.board[m.to] = EMPTY;
      this.board[m.from] = m.piece;
      if (undo.captured !== EMPTY) this.board[undo.capturedSq] = undo.captured;
    }
    this.castle = undo.castle;
    this.ep = undo.ep;
    this.halfmove = undo.halfmove;
    this.kings = undo.kings;
    this.hashHi = undo.hashHi;
    this.hashLo = undo.hashLo;
  }

  perft(depth: number): number {
    if (depth === 0) return 1;
    const moves = this.legalMoves();
    if (depth === 1) return moves.length;
    let nodes = 0;
    for (const m of moves) {
      const u = this.make(m);
      nodes += this.perft(depth - 1);
      this.unmake(m, u);
    }
    return nodes;
  }
}
