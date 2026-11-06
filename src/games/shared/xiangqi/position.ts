/**
 * Mutable xiangqi (Chinese chess) position: 9 files × 10 ranks on the intersections, palace and
 * river rules, horse legs, elephant eyes, cannon screens, the flying-general rule, make/unmake,
 * Zobrist keys and perft. Board codes: positive = Red (moves first, bottom), negative = Black.
 * Square index = row * 9 + col, row 0 at the top (Black's back rank).
 */
export type Side = 0 | 1;

export const GENERAL = 1;
export const ADVISOR = 2;
export const ELEPHANT = 3;
export const HORSE = 4;
export const CHARIOT = 5;
export const CANNON = 6;
export const SOLDIER = 7;

export const COLS = 9;
export const ROWS = 10;

export interface XMove {
  from: number;
  to: number;
  piece: number;
  captured: number;
}

/** Standard xiangqi FEN letters: k general, a advisor, b elephant, n horse, r chariot, c cannon, p soldier. */
export const START_PLACEMENT = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR';
const LETTERS = ' kabnrcp';

const sideOf = (code: number): Side => (code > 0 ? 0 : 1);
const rowOf = (sq: number) => Math.floor(sq / COLS);
const colOf = (sq: number) => sq % COLS;
const at = (r: number, c: number) => r * COLS + c;
const inside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
/** Red's palace is rows 7–9, Black's rows 0–2; both span files d–f (cols 3–5). */
const inPalace = (r: number, c: number, s: Side) =>
  c >= 3 && c <= 5 && (s === 0 ? r >= 7 && r <= 9 : r >= 0 && r <= 2);
/** Red's own half is rows 5–9, Black's rows 0–4. */
const ownHalf = (r: number, s: Side) => (s === 0 ? r >= 5 : r <= 4);

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
const rand = xorshift(0x0c41e5e);
const Z_HI = Uint32Array.from({ length: 90 * 16 + 1 }, () => rand());
const Z_LO = Uint32Array.from({ length: 90 * 16 + 1 }, () => rand());
const zIndex = (sq: number, code: number) => sq * 16 + code + 8;

const ORTHO = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;
const DIAG = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;
/** Offsets from a horse to the points it attacks. */
const HORSE_OFFSETS = [
  [-2, -1],
  [-2, 1],
  [2, -1],
  [2, 1],
  [-1, -2],
  [1, -2],
  [-1, 2],
  [1, 2],
] as const;

export class XiangqiPosition {
  board = new Int8Array(ROWS * COLS);
  side: Side = 0;
  generals: [number, number] = [-1, -1];
  hashHi = 0;
  hashLo = 0;

  clone(): XiangqiPosition {
    const p = new XiangqiPosition();
    p.board = this.board.slice();
    p.side = this.side;
    p.generals = [this.generals[0], this.generals[1]];
    p.hashHi = this.hashHi;
    p.hashLo = this.hashLo;
    return p;
  }

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

  // ---- attacks -----------------------------------------------------------------------------
  /** Whether square `sq` is attacked by side `by` (pseudo-legal attacks, generals included). */
  isAttacked(sq: number, by: Side): boolean {
    const b = this.board;
    const r0 = rowOf(sq);
    const c0 = colOf(sq);
    const sign = by === 0 ? 1 : -1;
    // Chariots and cannons along files and ranks (facing generals are checked separately).
    for (const [dr, dc] of ORTHO) {
      let r = r0 + dr;
      let c = c0 + dc;
      let screens = 0;
      while (inside(r, c)) {
        const code = b[at(r, c)]!;
        if (code !== 0) {
          if (screens === 0 && code === sign * CHARIOT) return true;
          if (screens === 1 && code === sign * CANNON) return true;
          screens++;
          if (screens > 1) break;
        }
        r += dr;
        c += dc;
      }
    }
    // Horses: the leg is the point next to the horse, one step toward the long side.
    for (const [dr, dc] of HORSE_OFFSETS) {
      const hr = r0 - dr;
      const hc = c0 - dc;
      if (!inside(hr, hc) || b[at(hr, hc)] !== sign * HORSE) continue;
      const lr = hr + (Math.abs(dr) === 2 ? Math.sign(dr) : 0);
      const lc = hc + (Math.abs(dc) === 2 ? Math.sign(dc) : 0);
      if (b[at(lr, lc)] === 0) return true;
    }
    // Soldiers: Red soldiers attack upward (toward row 0) and sideways once across the river.
    const forward = by === 0 ? 1 : -1; // a soldier below (Red) attacks the square above it
    const sr = r0 + forward;
    if (inside(sr, c0) && b[at(sr, c0)] === sign * SOLDIER) return true;
    for (const dc of [-1, 1]) {
      const c = c0 + dc;
      if (inside(r0, c) && b[at(r0, c)] === sign * SOLDIER && !ownHalf(r0, by)) return true;
    }
    // Generals and advisors attack inside their palace.
    for (const [dr, dc] of ORTHO) {
      const r = r0 + dr;
      const c = c0 + dc;
      if (inside(r, c) && b[at(r, c)] === sign * GENERAL && inPalace(r0, c0, by)) return true;
    }
    for (const [dr, dc] of DIAG) {
      const r = r0 + dr;
      const c = c0 + dc;
      if (inside(r, c) && b[at(r, c)] === sign * ADVISOR && inPalace(r0, c0, by)) return true;
      // Elephants two steps diagonally with a free eye, never across the river.
      const er = r0 + 2 * dr;
      const ec = c0 + 2 * dc;
      if (
        inside(er, ec) &&
        b[at(er, ec)] === sign * ELEPHANT &&
        b[at(r, c)] === 0 &&
        ownHalf(r0, by)
      )
        return true;
    }
    return false;
  }

  inCheck(s: Side = this.side): boolean {
    const g = this.generals[s];
    return g >= 0 && this.isAttacked(g, (1 - s) as Side);
  }

  // ---- move generation ---------------------------------------------------------------------
  pseudoMoves(): XMove[] {
    const out: XMove[] = [];
    const b = this.board;
    const me = this.side;
    const sign = me === 0 ? 1 : -1;
    const push = (from: number, to: number) => {
      const target = b[to]!;
      if (target !== 0 && sideOf(target) === me) return;
      out.push({ from, to, piece: b[from]!, captured: target });
    };
    for (let sq = 0; sq < b.length; sq++) {
      const code = b[sq]!;
      if (code === 0 || sideOf(code) !== me) continue;
      const r0 = rowOf(sq);
      const c0 = colOf(sq);
      switch (Math.abs(code)) {
        case GENERAL:
          for (const [dr, dc] of ORTHO)
            if (inPalace(r0 + dr, c0 + dc, me)) push(sq, at(r0 + dr, c0 + dc));
          break;
        case ADVISOR:
          for (const [dr, dc] of DIAG)
            if (inPalace(r0 + dr, c0 + dc, me)) push(sq, at(r0 + dr, c0 + dc));
          break;
        case ELEPHANT:
          for (const [dr, dc] of DIAG) {
            const r = r0 + 2 * dr;
            const c = c0 + 2 * dc;
            if (inside(r, c) && ownHalf(r, me) && b[at(r0 + dr, c0 + dc)] === 0) push(sq, at(r, c));
          }
          break;
        case HORSE:
          for (const [dr, dc] of ORTHO) {
            const lr = r0 + dr;
            const lc = c0 + dc;
            if (!inside(lr, lc) || b[at(lr, lc)] !== 0) continue;
            const turns =
              dr === 0 ? [-1, 1].map((x) => [x, 2 * dc]) : [-1, 1].map((x) => [2 * dr, x]);
            for (const [tr, tc] of turns) {
              const r = r0 + tr!;
              const c = c0 + tc!;
              if (inside(r, c)) push(sq, at(r, c));
            }
          }
          break;
        case CHARIOT:
          for (const [dr, dc] of ORTHO) {
            let r = r0 + dr;
            let c = c0 + dc;
            while (inside(r, c)) {
              push(sq, at(r, c));
              if (b[at(r, c)] !== 0) break;
              r += dr;
              c += dc;
            }
          }
          break;
        case CANNON:
          for (const [dr, dc] of ORTHO) {
            let r = r0 + dr;
            let c = c0 + dc;
            while (inside(r, c) && b[at(r, c)] === 0) {
              push(sq, at(r, c));
              r += dr;
              c += dc;
            }
            // Jump the screen, capture the first piece beyond it.
            r += dr;
            c += dc;
            while (inside(r, c)) {
              if (b[at(r, c)] !== 0) {
                if (sideOf(b[at(r, c)]!) !== me) push(sq, at(r, c));
                break;
              }
              r += dr;
              c += dc;
            }
          }
          break;
        case SOLDIER: {
          const fr = r0 - sign; // Red moves toward row 0
          if (inside(fr, c0)) push(sq, at(fr, c0));
          if (!ownHalf(r0, me))
            for (const dc of [-1, 1]) if (inside(r0, c0 + dc)) push(sq, at(r0, c0 + dc));
          break;
        }
      }
    }
    return out;
  }

  /** Generals on the same file with nothing between them (illegal). */
  generalsFace(): boolean {
    const [g0, g1] = this.generals;
    if (g0 < 0 || g1 < 0 || colOf(g0) !== colOf(g1)) return false;
    for (let sq = g1 + COLS; sq < g0; sq += COLS) if (this.board[sq] !== 0) return false;
    return true;
  }

  legalMoves(): XMove[] {
    const me = this.side;
    const legal: XMove[] = [];
    for (const m of this.pseudoMoves()) {
      const u = this.make(m);
      if (!this.inCheck(me) && !this.generalsFace()) legal.push(m);
      this.unmake(m, u);
    }
    return legal;
  }

  make(m: XMove): { hashHi: number; hashLo: number } {
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
    this.side = (1 - this.side) as Side;
    this.hashHi ^= Z_HI[90 * 16]!;
    this.hashLo ^= Z_LO[90 * 16]!;
    return undo;
  }

  unmake(m: XMove, undo: { hashHi: number; hashLo: number }) {
    this.board[m.from] = m.piece;
    this.board[m.to] = m.captured;
    if (Math.abs(m.piece) === GENERAL) this.generals[sideOf(m.piece)] = m.from;
    if (m.captured && Math.abs(m.captured) === GENERAL) this.generals[sideOf(m.captured)] = m.to;
    this.side = (1 - this.side) as Side;
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

/** Square name in the WXF-style coordinates used here: file a–i from Red's left, rank 0–9 from Red's side. */
export function squareName(sq: number): string {
  return `${'abcdefghi'[colOf(sq)]}${ROWS - 1 - rowOf(sq)}`;
}

export function parseSquare(name: string): number {
  const c = name.charCodeAt(0) - 97;
  const r = ROWS - 1 - Number(name.slice(1));
  if (!inside(r, c)) throw new Error(`Bad square ${name}`);
  return at(r, c);
}

export function parsePlacement(placement: string, side: Side = 0): XiangqiPosition {
  const pos = new XiangqiPosition();
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
      const red = ch === ch.toUpperCase();
      pos.board[at(r, c)] = red ? type : -type;
      if (type === GENERAL) pos.generals[red ? 0 : 1] = at(r, c);
      c++;
    }
    if (c !== COLS) throw new Error('Rank has the wrong length');
  });
  pos.side = side;
  pos.rehash();
  return pos;
}

export function formatPlacement(pos: XiangqiPosition): string {
  const ranks: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    let s = '';
    let empty = 0;
    for (let c = 0; c < COLS; c++) {
      const code = pos.board[at(r, c)]!;
      if (code === 0) {
        empty++;
        continue;
      }
      if (empty) s += empty;
      empty = 0;
      const letter = LETTERS[Math.abs(code)]!;
      s += code > 0 ? letter.toUpperCase() : letter;
    }
    if (empty) s += empty;
    ranks.push(s);
  }
  return ranks.join('/');
}

export const moveAction = (m: XMove) => `${squareName(m.from)}${squareName(m.to)}`;
