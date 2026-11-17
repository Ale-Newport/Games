/**
 * Builds the #210 Theme Strands puzzles: for each theme, picks theme words whose lengths fill the
 * 6×8 grid exactly with the spangram, draws the spangram from one side to the opposite side, then
 * covers every remaining cell with the theme words as paths of adjacent cells (8 directions,
 * no shared cells, no crossing diagonals). Seeded; writes src/games/theme-strands/puzzles.ts.
 * Run: npx tsx tools/generate-strands.ts
 */
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/core/game-engine/random';

const COLS = 6;
const ROWS = 8;
const N = COLS * ROWS;

interface Theme {
  id: string;
  lang: 'en' | 'es';
  clue: string;
  spangram: string;
  pool: string[];
}

const THEMES: Theme[] = [
  {
    id: 'en-desserts',
    lang: 'en',
    clue: 'Sweet tooth',
    spangram: 'DESSERTS',
    pool: [
      'COOKIE',
      'BROWNIE',
      'TART',
      'FUDGE',
      'MOUSSE',
      'SUNDAE',
      'PUDDING',
      'TRIFLE',
      'ECLAIR',
      'MUFFIN',
    ],
  },
  {
    id: 'en-sky',
    lang: 'en',
    clue: 'Look up tonight',
    spangram: 'STARGAZING',
    pool: ['COMET', 'MOON', 'PLANET', 'NEBULA', 'GALAXY', 'METEOR', 'ORBIT', 'ECLIPSE'],
  },
  {
    id: 'en-orchestra',
    lang: 'en',
    clue: 'In the pit',
    spangram: 'INSTRUMENTS',
    pool: ['VIOLIN', 'CELLO', 'FLUTE', 'OBOE', 'HARP', 'TRUMPET', 'TUBA', 'CLARINET'],
  },
  {
    id: 'en-cats',
    lang: 'en',
    clue: 'Big purrs',
    spangram: 'FELINES',
    pool: ['LION', 'TIGER', 'CHEETAH', 'JAGUAR', 'PUMA', 'LYNX', 'OCELOT', 'LEOPARD', 'COUGAR'],
  },
  {
    id: 'en-weather',
    lang: 'en',
    clue: 'Bring an umbrella?',
    spangram: 'FORECAST',
    pool: [
      'RAIN',
      'SNOW',
      'SLEET',
      'THUNDER',
      'CLOUD',
      'STORM',
      'DRIZZLE',
      'BREEZE',
      'MIST',
      'HAIL',
      'FROST',
    ],
  },
  {
    id: 'en-garden',
    lang: 'en',
    clue: 'In bloom',
    spangram: 'FLOWERBED',
    pool: ['ROSE', 'TULIP', 'DAISY', 'LILY', 'ORCHID', 'PEONY', 'POPPY', 'IRIS', 'VIOLET'],
  },
  {
    id: 'en-tools',
    lang: 'en',
    clue: 'Fix it yourself',
    spangram: 'HARDWARE',
    pool: [
      'HAMMER',
      'WRENCH',
      'PLIERS',
      'DRILL',
      'CHISEL',
      'SCREW',
      'NAIL',
      'LEVEL',
      'SANDER',
      'CLAMP',
      'TAPE',
    ],
  },
  {
    id: 'en-ocean',
    lang: 'en',
    clue: 'Deep blue',
    spangram: 'UNDERWATER',
    pool: ['SHARK', 'WHALE', 'SQUID', 'CORAL', 'CRAB', 'DOLPHIN', 'OCTOPUS', 'SEAL'],
  },
  {
    id: 'en-shapes',
    lang: 'en',
    clue: 'Sides and curves',
    spangram: 'GEOMETRY',
    pool: [
      'CIRCLE',
      'SQUARE',
      'OVAL',
      'CUBE',
      'CONE',
      'SPHERE',
      'PRISM',
      'RHOMBUS',
      'TRIANGLE',
      'HEXAGON',
      'STAR',
    ],
  },
  {
    id: 'en-breakfast',
    lang: 'en',
    clue: 'Rise and shine',
    spangram: 'BREAKFAST',
    pool: [
      'TOAST',
      'BACON',
      'CEREAL',
      'WAFFLE',
      'PANCAKE',
      'OATMEAL',
      'MUFFIN',
      'JUICE',
      'EGGS',
      'GRANOLA',
      'BAGEL',
    ],
  },
  {
    id: 'en-planets',
    lang: 'en',
    clue: 'Around the sun',
    spangram: 'SOLARSYSTEM',
    pool: ['MARS', 'VENUS', 'EARTH', 'SATURN', 'URANUS', 'NEPTUNE', 'MERCURY', 'JUPITER'],
  },
  {
    id: 'en-sports',
    lang: 'en',
    clue: 'Play ball!',
    spangram: 'BALLGAMES',
    pool: ['TENNIS', 'SOCCER', 'GOLF', 'RUGBY', 'CRICKET', 'HOCKEY', 'BASEBALL', 'POLO'],
  },
  {
    id: 'es-postres',
    lang: 'es',
    clue: 'Para golosos',
    spangram: 'POSTRES',
    pool: ['FLAN', 'TARTA', 'NATILLAS', 'CHURROS', 'HELADO', 'BIZCOCHO', 'TORRIJAS', 'GALLETA'],
  },
  {
    id: 'es-cielo',
    lang: 'es',
    clue: 'Mira arriba esta noche',
    spangram: 'ESTRELLAS',
    pool: ['LUNA', 'COMETA', 'PLANETA', 'GALAXIA', 'NEBULOSA', 'ORBITA', 'ECLIPSE', 'SATURNO'],
  },
  {
    id: 'es-orquesta',
    lang: 'es',
    clue: 'En el foso',
    spangram: 'INSTRUMENTOS',
    pool: ['VIOLIN', 'FLAUTA', 'ARPA', 'OBOE', 'TROMPETA', 'TUBA', 'CLARINETE', 'FAGOT'],
  },
  {
    id: 'es-felinos',
    lang: 'es',
    clue: 'Grandes ronroneos',
    spangram: 'FELINOS',
    pool: ['LEON', 'TIGRE', 'GUEPARDO', 'JAGUAR', 'PUMA', 'LINCE', 'OCELOTE', 'LEOPARDO'],
  },
  {
    id: 'es-tiempo',
    lang: 'es',
    clue: '¿Llevo paraguas?',
    spangram: 'PRONOSTICO',
    pool: ['LLUVIA', 'NIEVE', 'GRANIZO', 'TRUENO', 'NUBE', 'TORMENTA', 'BRISA', 'NIEBLA'],
  },
  {
    id: 'es-jardin',
    lang: 'es',
    clue: 'En flor',
    spangram: 'JARDINERIA',
    pool: ['ROSA', 'TULIPAN', 'MARGARITA', 'LIRIO', 'ORQUIDEA', 'AMAPOLA', 'VIOLETA', 'CLAVEL'],
  },
  {
    id: 'es-mar',
    lang: 'es',
    clue: 'Azul profundo',
    spangram: 'OCEANO',
    pool: ['TIBURON', 'BALLENA', 'CALAMAR', 'CORAL', 'CANGREJO', 'DELFIN', 'PULPO', 'FOCA'],
  },
  {
    id: 'es-deportes',
    lang: 'es',
    clue: '¡A jugar!',
    spangram: 'DEPORTES',
    pool: ['TENIS', 'FUTBOL', 'GOLF', 'RUGBY', 'HOCKEY', 'BEISBOL', 'POLO', 'VOLEIBOL'],
  },
];

const rc = (i: number) => [Math.floor(i / COLS), i % COLS] as const;
const neighbours = (i: number) => {
  const [r, c] = rc(i);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push(nr * COLS + nc);
    }
  return out;
};
const NB = Array.from({ length: N }, (_, i) => neighbours(i));

/** Key of the other diagonal of the 2×2 square a diagonal step a→b lies in. */
function crossKey(a: number, b: number): string | null {
  const [r1, c1] = rc(a);
  const [r2, c2] = rc(b);
  if (r1 === r2 || c1 === c2) return null;
  const top = Math.min(r1, r2);
  const left = Math.min(c1, c2);
  const main = (r1 === top) === (c1 === left); // ↘ diagonal
  return `${top},${left},${main ? 'anti' : 'main'}`;
}
const diagKey = (a: number, b: number) => {
  const [r1, c1] = rc(a);
  const [r2, c2] = rc(b);
  const top = Math.min(r1, r2);
  const left = Math.min(c1, c2);
  return `${top},${left},${(r1 === top) === (c1 === left) ? 'main' : 'anti'}`;
};

function subsetFor(pool: string[], target: number, rng: Rng): string[] | null {
  const order = rng.shuffle(pool);
  let best: string[] | null = null;
  const rec = (i: number, acc: string[], sum: number) => {
    if (sum === target) {
      if (!best || acc.length > best.length) best = [...acc];
      return;
    }
    if (sum > target || i >= order.length) return;
    rec(i + 1, [...acc, order[i]!], sum + order[i]!.length);
    rec(i + 1, acc, sum);
  };
  rec(0, [], 0);
  return best;
}

function components(free: boolean[]): number[] {
  const seen = new Array<boolean>(N).fill(false);
  const sizes: number[] = [];
  for (let i = 0; i < N; i++) {
    if (!free[i] || seen[i]) continue;
    let size = 0;
    const stack = [i];
    seen[i] = true;
    while (stack.length) {
      const x = stack.pop()!;
      size++;
      for (const y of NB[x]!)
        if (free[y] && !seen[y]) {
          seen[y] = true;
          stack.push(y);
        }
    }
    sizes.push(size);
  }
  return sizes;
}

function subsetSums(lengths: number[]): Set<number> {
  let sums = new Set([0]);
  for (const l of lengths) sums = new Set([...sums, ...[...sums].map((s) => s + l)]);
  return sums;
}

function build(theme: Theme, seed: number) {
  const rng = new Rng(seed);
  const words = subsetFor(theme.pool, N - theme.spangram.length, rng);
  if (!words) throw new Error(`${theme.id}: no subset of the pool fills the grid`);
  for (let attempt = 0; attempt < 4000; attempt++) {
    const letters = new Array<string>(N).fill('');
    const free = new Array<boolean>(N).fill(true);
    const diags = new Set<string>();
    const paths: Record<string, number[]> = {};
    let budget = 20000;

    const walk = (word: string, path: number[], cond?: (p: number[]) => boolean): boolean => {
      if (--budget < 0) return false;
      if (path.length === word.length) {
        if (cond && !cond(path)) return false;
        const left = free.filter(Boolean).length;
        if (left === 0) return true;
        const remaining = words.filter((w) => !paths[w]).map((w) => w.length);
        const sums = subsetSums(remaining);
        return components(free).every((s) => sums.has(s));
      }
      const last = path[path.length - 1]!;
      for (const nb of rng.shuffle(NB[last]!)) {
        if (!free[nb]) continue;
        const ck = crossKey(last, nb);
        if (ck && diags.has(ck)) continue;
        free[nb] = false;
        letters[nb] = word[path.length]!;
        const dk = ck ? diagKey(last, nb) : null;
        if (dk) diags.add(dk);
        path.push(nb);
        if (walk(word, path, cond)) return true;
        path.pop();
        if (dk) diags.delete(dk);
        free[nb] = true;
        letters[nb] = '';
      }
      return false;
    };

    const place = (
      word: string,
      start: number,
      cond?: (p: number[]) => boolean,
    ): number[] | null => {
      if (!free[start]) return null;
      free[start] = false;
      letters[start] = word[0]!;
      const path = [start];
      if (walk(word, path, cond)) return path;
      free[start] = true;
      letters[start] = '';
      return null;
    };

    // Spangram: left↔right if it can, otherwise top↔bottom.
    const sp = theme.spangram;
    const horizontal = sp.length >= COLS && rng.chance(sp.length >= ROWS ? 0.5 : 1);
    const starts = horizontal
      ? Array.from({ length: ROWS }, (_, r) => r * COLS)
      : Array.from({ length: COLS }, (_, c) => c);
    const touches = (p: number[]) =>
      horizontal ? p.some((i) => rc(i)[1] === COLS - 1) : p.some((i) => rc(i)[0] === ROWS - 1);
    const spPath = place(sp, rng.pick(starts), touches);
    if (!spPath) continue;
    paths[sp] = spPath;

    let ok = true;
    for (const w of rng.shuffle(words)) {
      // Start from the free cell with the fewest free neighbours (a likely path end).
      const cells = rng.shuffle(free.flatMap((f, i) => (f ? [i] : [])));
      cells.sort(
        (a, b) => NB[a]!.filter((x) => free[x]).length - NB[b]!.filter((x) => free[x]).length,
      );
      let placed: number[] | null = null;
      for (const c of cells.slice(0, 6)) {
        for (const rev of [false, true]) {
          budget = 20000;
          const spelled = rev ? [...w].reverse().join('') : w;
          const p = place(spelled, c);
          if (p) {
            placed = rev ? [...p].reverse() : p;
            break;
          }
        }
        if (placed) break;
      }
      if (!placed) {
        ok = false;
        break;
      }
      paths[w] = placed;
    }
    if (!ok || free.some(Boolean)) continue;
    const rows = Array.from({ length: ROWS }, (_, r) =>
      letters.slice(r * COLS, r * COLS + COLS).join(''),
    );
    return { ...theme, words, rows, paths, horizontal };
  }
  throw new Error(`${theme.id}: could not fill the grid`);
}

const out = THEMES.map((t, i) => build(t, 1000 + i * 37));
const body = out
  .map(
    (p) => `  {
    id: ${JSON.stringify(p.id)},
    lang: ${JSON.stringify(p.lang)},
    clue: ${JSON.stringify(p.clue)},
    spangram: ${JSON.stringify(p.spangram)},
    words: ${JSON.stringify(p.words)},
    rows: ${JSON.stringify(p.rows)},
    paths: ${JSON.stringify(p.paths)},
  },`,
  )
  .join('\n');
writeFileSync(
  new URL('../src/games/theme-strands/puzzles.ts', import.meta.url),
  `/** GENERATED by tools/generate-strands.ts (themes and word pools are original). Do not edit. */\n` +
    `export interface StrandsPuzzle {\n  id: string;\n  lang: 'en' | 'es';\n  clue: string;\n  spangram: string;\n  words: string[];\n  /** Eight rows of six letters. */\n  rows: string[];\n  /** Cell indices (row * 6 + col) of each answer, spangram included, in reading order. */\n  paths: Record<string, number[]>;\n}\n\n` +
    `export const PUZZLES: StrandsPuzzle[] = [\n${body}\n];\n`,
);
console.log(`strands: ${out.length} puzzles`);
