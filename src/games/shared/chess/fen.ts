/** FEN import/export for `Position` (supports Shredder/X-FEN castling letters for Chess960). */
import {
  BISHOP,
  EMPTY,
  KING,
  KNIGHT,
  PAWN,
  Position,
  QUEEN,
  ROOK,
  makePiece,
  pieceColor,
  pieceType,
  type VariantRules,
} from './position';

const LETTERS = ' pnbrqk';
export const pieceLetter = (p: number) => {
  const l = LETTERS[pieceType(p)]!;
  return pieceColor(p) === 0 ? l.toUpperCase() : l;
};

function letterToPiece(ch: string): number {
  const type = LETTERS.indexOf(ch.toLowerCase());
  if (type <= 0) throw new Error(`Bad FEN piece "${ch}"`);
  return makePiece(ch === ch.toUpperCase() ? 0 : 1, type);
}

export function squareName(pos: Position, sq: number): string {
  return `${'abcdefgh'[pos.fileOf(sq)]}${pos.rankOf(sq) + 1}`;
}

export function parseSquare(pos: Position, name: string): number {
  const f = name.charCodeAt(0) - 97;
  const r = Number(name.slice(1)) - 1;
  if (f < 0 || f >= pos.W || r < 0 || r >= pos.H) throw new Error(`Bad square ${name}`);
  return pos.sq(f, r);
}

export function parseFen(rules: VariantRules, fen: string): Position {
  const pos = new Position(rules);
  const [placement, side = 'w', castling = '-', ep = '-', half = '0', full = '1'] = fen
    .trim()
    .split(/\s+/);
  const rows = placement!.split('/');
  if (rows.length !== pos.H) throw new Error(`FEN has ${rows.length} ranks, expected ${pos.H}`);
  rows.forEach((row, i) => {
    const rank = pos.H - 1 - i;
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) file += Number(ch);
      else {
        pos.board[pos.sq(file, rank)] = letterToPiece(ch);
        file++;
      }
    }
    if (file !== pos.W) throw new Error(`FEN rank ${rank + 1} has ${file} files`);
  });
  pos.side = side === 'b' ? 1 : 0;
  pos.rehash();
  pos.castle = [-1, -1, -1, -1];
  if (castling !== '-') {
    for (const ch of castling) {
      const color = ch === ch.toUpperCase() ? 0 : 1;
      const rank = color === 0 ? 0 : pos.H - 1;
      const king = pos.kings[color];
      if (king < 0) continue;
      const kingFile = pos.fileOf(king);
      const rook = makePiece(color as 0 | 1, ROOK);
      let file = -1;
      const c = ch.toLowerCase();
      if (c === 'k') {
        for (let f = pos.W - 1; f > kingFile; f--)
          if (pos.board[pos.sq(f, rank)] === rook) {
            file = f;
            break;
          }
      } else if (c === 'q') {
        for (let f = 0; f < kingFile; f++)
          if (pos.board[pos.sq(f, rank)] === rook) {
            file = f;
            break;
          }
      } else file = c.charCodeAt(0) - 97;
      if (file < 0 || pos.board[pos.sq(file, rank)] !== rook) continue;
      pos.castle[color * 2 + (file > kingFile ? 0 : 1)] = pos.sq(file, rank);
    }
  }
  pos.ep = ep === '-' ? -1 : parseSquare(pos, ep);
  pos.halfmove = Number(half) || 0;
  pos.fullmove = Number(full) || 1;
  pos.rehash();
  return pos;
}

/** FEN of the position. Castling uses KQkq when rooks stand on the outermost files, file letters otherwise. */
export function toFen(pos: Position): string {
  const rows: string[] = [];
  for (let r = pos.H - 1; r >= 0; r--) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < pos.W; f++) {
      const p = pos.board[pos.sq(f, r)]!;
      if (p === EMPTY) empty++;
      else {
        if (empty) row += empty;
        empty = 0;
        row += pieceLetter(p);
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  let castling = '';
  for (const [k, upper] of [
    [0, true],
    [1, true],
    [2, false],
    [3, false],
  ] as const) {
    const rook = pos.castle[k]!;
    if (rook < 0) continue;
    const file = pos.fileOf(rook);
    const color = k < 2 ? 0 : 1;
    const rank = color === 0 ? 0 : pos.H - 1;
    const outermost =
      k % 2 === 0
        ? ![...Array(pos.W - file - 1)].some(
            (_, j) => pos.board[pos.sq(file + 1 + j, rank)] === makePiece(color, ROOK),
          )
        : ![...Array(file)].some((_, j) => pos.board[pos.sq(j, rank)] === makePiece(color, ROOK));
    let letter = outermost ? (k % 2 === 0 ? 'k' : 'q') : 'abcdefgh'[file]!;
    if (upper) letter = letter.toUpperCase();
    castling += letter;
  }
  return [
    rows.join('/'),
    pos.side === 0 ? 'w' : 'b',
    castling || '-',
    pos.ep >= 0 ? squareName(pos, pos.ep) : '-',
    pos.halfmove,
    pos.fullmove,
  ].join(' ');
}

export const STANDARD_RULES: VariantRules = {
  width: 8,
  height: 8,
  doublePush: true,
  castling: true,
  antichess: false,
};
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK };
