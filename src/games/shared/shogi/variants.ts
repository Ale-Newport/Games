/**
 * Piece sets and rule switches for the shogi family (#021 Shogi, #022 Animal Shogi 3×4).
 * Vectors are [dRow, dCol] for the first player (Sente/Black, who moves "up", toward row 0);
 * they are rotated 180° for the second player.
 */

export interface PieceDef {
  /** Letter used in SFEN-like strings and notation; promoted pieces start with '+'. */
  letter: string;
  steps: readonly (readonly [number, number])[];
  slides: readonly (readonly [number, number])[];
  /** Kind index this piece promotes to (0 = never promotes). */
  promotesTo: number;
  /** Unpromoted kind index (itself when unpromoted); captured pieces go to hand as this kind. */
  base: number;
  royal: boolean;
  /** The piece may not stand (by drop or non-promoting move) within this many far rows. */
  deadRows: number;
  /** Material value in centipawn-like units. */
  value: number;
}

export interface ShogiVariant {
  id: string;
  rows: number;
  cols: number;
  /** Index 0 is unused; kinds are 1-based so board codes can be signed (+ Sente, − Gote). */
  kinds: readonly (PieceDef | null)[];
  /** SFEN-like placement, rank by rank from the top (Gote's side); uppercase = Sente. */
  start: string;
  /** Number of far rows forming the promotion zone. */
  promotionRows: number;
  /** Shogi: promotion is optional unless the piece would be dead. Animal shogi: compulsory. */
  optionalPromotion: boolean;
  /** Kind index of the pawn for the two-pawns and pawn-drop-mate rules (0 = no such rules). */
  pawnKind: number;
  nifu: boolean;
  uchifuzume: boolean;
  /** 'checkmate' (shogi) or 'capture' (the royal piece is captured, as in animal shogi). */
  goal: 'checkmate' | 'capture';
  /** Animal shogi "try": a royal piece that safely reaches the far row wins. */
  tryRule: boolean;
  /** Occurrences of the same position that end the game. */
  repetitionLimit: number;
  /** Repetition caused by continuous checks loses for the checking side (shogi). */
  perpetualCheckLoses: boolean;
  /** Plies after which the game is drawn (impasse is not adjudicated by points). */
  maxPlies: number;
}

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
const ALL8 = [...ORTHO, ...DIAG] as const;
const GOLD = [
  [-1, 0],
  [-1, -1],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, 0],
] as const;
const SILVER = [
  [-1, 0],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

const piece = (p: Partial<PieceDef> & Pick<PieceDef, 'letter' | 'base' | 'value'>): PieceDef => ({
  steps: [],
  slides: [],
  promotesTo: 0,
  royal: false,
  deadRows: 0,
  ...p,
});

// 1 K, 2 R, 3 B, 4 G, 5 S, 6 N, 7 L, 8 P, 9 +R, 10 +B, 11 +S, 12 +N, 13 +L, 14 +P
export const SHOGI_KINDS: readonly (PieceDef | null)[] = [
  null,
  piece({ letter: 'K', steps: ALL8, base: 1, royal: true, value: 0 }),
  piece({ letter: 'R', slides: ORTHO, promotesTo: 9, base: 2, value: 1000 }),
  piece({ letter: 'B', slides: DIAG, promotesTo: 10, base: 3, value: 850 }),
  piece({ letter: 'G', steps: GOLD, base: 4, value: 600 }),
  piece({ letter: 'S', steps: SILVER, promotesTo: 11, base: 5, value: 550 }),
  piece({
    letter: 'N',
    steps: [
      [-2, -1],
      [-2, 1],
    ],
    promotesTo: 12,
    base: 6,
    deadRows: 2,
    value: 400,
  }),
  piece({ letter: 'L', slides: [[-1, 0]], promotesTo: 13, base: 7, deadRows: 1, value: 350 }),
  piece({ letter: 'P', steps: [[-1, 0]], promotesTo: 14, base: 8, deadRows: 1, value: 100 }),
  piece({ letter: '+R', slides: ORTHO, steps: DIAG, base: 2, value: 1300 }),
  piece({ letter: '+B', slides: DIAG, steps: ORTHO, base: 3, value: 1150 }),
  piece({ letter: '+S', steps: GOLD, base: 5, value: 600 }),
  piece({ letter: '+N', steps: GOLD, base: 6, value: 600 }),
  piece({ letter: '+L', steps: GOLD, base: 7, value: 600 }),
  piece({ letter: '+P', steps: GOLD, base: 8, value: 600 }),
];

export const SHOGI: ShogiVariant = {
  id: 'shogi',
  rows: 9,
  cols: 9,
  kinds: SHOGI_KINDS,
  start: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL',
  promotionRows: 3,
  optionalPromotion: true,
  pawnKind: 8,
  nifu: true,
  uchifuzume: true,
  goal: 'checkmate',
  tryRule: false,
  repetitionLimit: 4,
  perpetualCheckLoses: true,
  maxPlies: 512,
};

// Animal shogi: 1 Lion (royal), 2 Giraffe, 3 Elephant, 4 Chick, 5 Hen (promoted chick).
export const ANIMAL_KINDS: readonly (PieceDef | null)[] = [
  null,
  piece({ letter: 'L', steps: ALL8, base: 1, royal: true, value: 0 }),
  piece({ letter: 'G', steps: ORTHO, base: 2, value: 500 }),
  piece({ letter: 'E', steps: DIAG, base: 3, value: 400 }),
  piece({ letter: 'C', steps: [[-1, 0]], promotesTo: 5, base: 4, value: 150 }),
  piece({ letter: '+C', steps: GOLD, base: 4, value: 550 }),
];

export const ANIMAL: ShogiVariant = {
  id: 'animal-shogi',
  rows: 4,
  cols: 3,
  kinds: ANIMAL_KINDS,
  start: 'gle/1c1/1C1/ELG',
  promotionRows: 1,
  optionalPromotion: false,
  pawnKind: 0,
  nifu: false,
  uchifuzume: false,
  goal: 'capture',
  tryRule: true,
  repetitionLimit: 3,
  perpetualCheckLoses: false,
  maxPlies: 300,
};
