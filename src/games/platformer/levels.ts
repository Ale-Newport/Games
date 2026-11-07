/**
 * The three levels of Sunny Trail, built from a list of features rather than drawn by hand, so
 * every row comes out the same length. Legend: `#` ground, `B` brick, `?` prize box with a coin,
 * `!` prize box with a berry, `=` one-way ledge, `o` coin, `e` beetle, `s` spiky beetle, `C` the
 * checkpoint, `F` the flag. Rows: 14, the bottom two are ground; gaps in them are pits.
 */
export const ROWS = 14;

interface LevelSpec {
  width: number;
  gaps: [number, number][];
  /** Rows of tiles: [x, y, text] (y from the top). */
  rows: [number, number, string][];
  /** Staircases: x, height, rising (1) or falling (-1). */
  stairs: [number, number, 1 | -1][];
  checkpoint: number;
  flag: number;
}

const SPECS: LevelSpec[] = [
  {
    width: 150,
    gaps: [
      [38, 40],
      [70, 72],
      [104, 107],
    ],
    rows: [
      [12, 8, '?'],
      [16, 8, 'B!B?B'],
      [18, 4, '?'],
      [26, 11, 'e'],
      [30, 7, 'ooo'],
      [34, 11, 'e'],
      [44, 8, '====='],
      [45, 7, 'ooo'],
      [52, 11, 'e e'],
      [58, 8, 'BB?BB'],
      [60, 4, 'o'],
      [66, 11, 'e'],
      [76, 9, '==='],
      [80, 6, '==='],
      [81, 5, 'oo'],
      [86, 11, 'e  e'],
      [94, 8, '?B?'],
      [100, 11, 'e'],
      [110, 8, 'B!B'],
      [116, 11, 'e e'],
      [126, 7, 'oooo'],
    ],
    stairs: [
      [130, 4, 1],
      [134, 4, -1],
    ],
    checkpoint: 74,
    flag: 144,
  },
  {
    width: 170,
    gaps: [
      [24, 26],
      [48, 51],
      [62, 64],
      [90, 94],
      [120, 123],
      [140, 142],
    ],
    rows: [
      [10, 8, '?B?'],
      [18, 11, 'e e'],
      [22, 7, '==='],
      [23, 6, 'oo'],
      [30, 8, 'BBBBB'],
      [32, 4, '!'],
      [36, 11, 'e  e'],
      [44, 9, '==='],
      [47, 6, '==='],
      [52, 9, '==='],
      [56, 11, 'e'],
      [62, 8, '====='],
      [63, 7, 'ooo'],
      [68, 11, 'e e e'],
      [76, 8, 'B?B?B'],
      [84, 11, 'e'],
      [88, 7, '==='],
      [93, 5, '==='],
      [94, 4, 'oo'],
      [98, 11, 'e  e'],
      [106, 8, '!'],
      [110, 11, 'e e'],
      [116, 8, '===='],
      [124, 6, '==='],
      [128, 11, 'e e e'],
      [136, 8, '?B?'],
      [146, 11, 'e'],
    ],
    stairs: [[150, 5, 1]],
    checkpoint: 86,
    flag: 162,
  },
  {
    width: 180,
    gaps: [
      [20, 23],
      [40, 44],
      [58, 61],
      [80, 85],
      [102, 105],
      [124, 128],
      [146, 149],
    ],
    rows: [
      [12, 8, '?!?'],
      [16, 11, 's'],
      [26, 11, 'e e'],
      [30, 8, 'BB'],
      [34, 11, 's'],
      [40, 8, '====='],
      [41, 7, 'ooo'],
      [48, 11, 'e s e'],
      [54, 8, 'B?B'],
      [62, 9, '=='],
      [65, 7, '=='],
      [68, 11, 'e'],
      [72, 11, 's  e'],
      [79, 8, '==='],
      [83, 6, '==='],
      [84, 5, 'oo'],
      [88, 11, 'e s'],
      [94, 8, 'B!B'],
      [98, 11, 'e e'],
      [104, 7, '==='],
      [108, 11, 's'],
      [114, 8, '?B?B?'],
      [120, 11, 'e e'],
      [125, 8, '==='],
      [130, 11, 's e s'],
      [138, 8, 'BBB'],
      [142, 11, 'e'],
      [147, 7, '=='],
      [152, 11, 'e e'],
    ],
    stairs: [[160, 6, 1]],
    checkpoint: 92,
    flag: 172,
  },
];

function build(spec: LevelSpec): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => new Array<string>(spec.width).fill('.'));
  for (let x = 0; x < spec.width; x++) {
    const pit = spec.gaps.some(([a, b]) => x >= a && x <= b);
    if (!pit) {
      g[ROWS - 2]![x] = '#';
      g[ROWS - 1]![x] = '#';
    }
  }
  for (const [x, y, text] of spec.rows)
    for (let i = 0; i < text.length; i++) if (text[i] !== ' ') g[y]![x + i] = text[i]!;
  for (const [x, h, dir] of spec.stairs)
    for (let i = 0; i < h; i++) {
      const col = x + i;
      const height = dir > 0 ? i + 1 : h - i;
      for (let k = 0; k < height; k++) g[ROWS - 3 - k]![col] = '#';
    }
  g[ROWS - 3]![spec.checkpoint] = 'C';
  for (let y = 2; y < ROWS - 2; y++) g[y]![spec.flag] = 'F';
  return g.map((r) => r.join(''));
}

export const LEVELS: readonly (readonly string[])[] = SPECS.map(build);
