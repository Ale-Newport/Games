/**
 * The two rule sets: classic Breakout over six walls of plain bricks, and the enhanced game over
 * fifteen designed walls with tough bricks, gold blocks and capsules. Every wall is original.
 */
import type { BrickRules, Wall } from './sim';

const FULL = '1111111111';

/** Breakout's walls: the classic full wall first, then plain one-hit patterns. */
export const BREAKOUT_WALLS: Wall[] = [
  // 1 · Classic: eight full rows of ten.
  new Array<string>(8).fill(FULL),
  // 2 · Checkerboard.
  [
    '1.1.1.1.1.',
    '.1.1.1.1.1',
    '1.1.1.1.1.',
    '.1.1.1.1.1',
    '1.1.1.1.1.',
    '.1.1.1.1.1',
    '1.1.1.1.1.',
    '.1.1.1.1.1',
  ],
  // 3 · Pyramid: a narrow, valuable peak on a solid base.
  ['....11....', '...1111...', '..111111..', '.11111111.', FULL, FULL, FULL, FULL],
  // 4 · Window: a hollow frame — break in and the ball rattles round inside.
  [FULL, FULL, '111....111', '11......11', '11......11', '111....111', FULL, FULL],
  // 5 · Pillars: a roof on four columns, with shafts to the top wall between them.
  [FULL, FULL, '.11.11.11.', '.11.11.11.', '.11.11.11.', '.11.11.11.', '.11.11.11.', '.11.11.11.'],
  // 6 · Chevrons: diagonal bands and pockets that throw the ball sideways.
  [
    '11......11',
    '111....111',
    '.111..111.',
    '..111111..',
    '1..1111..1',
    '11..11..11',
    '111....111',
    '1111..1111',
  ],
];

export const BREAKOUT: BrickRules = {
  id: 'breakout',
  walls: BREAKOUT_WALLS,
  lives: 3,
  rowPoints: [7, 7, 5, 5, 3, 3, 1, 1],
  capsules: false,
  startSpeed: 4,
  maxSpeed: 7.5,
  shrink: true,
};

/** The enhanced walls, in rising difficulty: '.' empty, 1–3 hits, 'G' gold (never breaks). */
export const ENHANCED_WALLS: Wall[] = [
  // 1 · Lintel.
  ['2222222222', FULL, FULL, FULL, FULL, FULL],
  // 2 · Badge.
  ['..333333..', '.22222222.', FULL, '11G1111G11', FULL, '.11111111.'],
  // 3 · Lattice.
  ['3.3.3.3.3.', '.2.2.2.2.2', FULL, 'G1G1G1G1G1', '2222222222', FULL],
  // 4 · Keep.
  [FULL, '1........1', '1.333333.1', '1.3GGGG3.1', '1.333333.1', '1........1', FULL],
  // 5 · Layers.
  ['3333333333', '2222222222', 'G11111111G', '2222222222', FULL, '33GG11GG33', FULL],
  // 6 · Stairs.
  [
    '3.........',
    '33........',
    '222.......',
    '2222......',
    '11111.....',
    '111111G...',
    '1111111...',
    '11111111..',
  ],
  // 7 · Hourglass.
  [
    '3333333333',
    '.22222222.',
    '..111111..',
    '...GGGG...',
    '..111111..',
    '.22222222.',
    '3333333333',
  ],
  // 8 · Bridges.
  ['3333333333', '..........', 'G2G2G2G2G2', '..........', '2222222222', FULL, FULL],
  // 9 · Fortress.
  [FULL, 'G22222222G', 'G2.3333.2G', 'G2.3GG3.2G', 'G2.3333.2G', 'G22222222G', FULL],
  // 10 · Comb.
  ['3333333333', '2.2.2.2.2.', '2.2.2.2.2.', '1.1.1.1.1.', '1.1.1.1.1.', 'G.G.G.G.G.'],
  // 11 · Diamond.
  [
    '....33....',
    '...3223...',
    '..321123..',
    '.321GG123.',
    '..321123..',
    '...3223...',
    '....33....',
  ],
  // 12 · Zigzag.
  [
    '3333......',
    '.2222.....',
    '..1111....',
    '...GGGG...',
    '....1111..',
    '.....2222.',
    '......3333',
  ],
  // 13 · Gates: narrow openings in gold bars.
  ['3333333333', 'G...GG...G', '2222222222', '...GGGG...', '2222222222', 'GG......GG', FULL],
  // 14 · Vault: a gold shell open above and below.
  [
    'GGG....GGG',
    'G33333333G',
    'G32222223G',
    'G32111123G',
    'G32222223G',
    'G33333333G',
    'GG......GG',
  ],
  // 15 · Crown.
  ['3333333333', '3G33GG33G3', '2222222222', '2222222222', FULL, '33G3333G33', '2222222222', FULL],
];

export const ENHANCED: BrickRules = {
  id: 'brick-breaker',
  walls: ENHANCED_WALLS,
  lives: 3,
  rowPoints: [10, 10, 8, 8, 6, 6, 4, 4],
  capsules: true,
  startSpeed: 4.2,
  maxSpeed: 8,
  shrink: false,
};

/** Every point a rule set's walls can give (each breakable brick scored by its row). */
export function maxScore(rules: BrickRules): number {
  let n = 0;
  for (const wall of rules.walls)
    wall.forEach((row, r) => {
      for (const ch of row)
        if (ch !== '.' && ch !== 'G')
          n += rules.rowPoints[Math.min(r, rules.rowPoints.length - 1)]!;
    });
  return n;
}
