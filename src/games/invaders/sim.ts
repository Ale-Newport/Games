/**
 * Invaders from Above: a fixed-shooter on a 360 × 480 field at 60 steps a second. A formation of
 * 5 × 11 invaders marches side to side, stepping down at each edge and quickening as its numbers
 * fall; the lowest invader of each column may drop bombs. Your cannon moves along the bottom and
 * has one shot in the air at a time; four shields erode under fire from both sides. A mystery ship
 * sometimes crosses the top. You have three lives (one more at 1500 points); a wave cleared brings a
 * new one starting lower; invaders reaching your row end the game.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 360;
export const H = 480;
export const ROWS = 5;
export const COLS = 11;
export const CELL_W = 24;
export const CELL_H = 20;
export const ALIEN_W = 16;
export const ALIEN_H = 11;
export const PLAYER_Y = 440;
export const PLAYER_W = 22;
const PLAYER_SPEED = 2.2;
const SHOT_SPEED = 7;
const BOMB_SPEED = 2.6;
const BLOCK = 4;
const SHIELD_Y = 380;
const UFO_Y = 40;

export type InvAction = 'left' | 'right' | 'idle' | 'fire' | 'left-fire' | 'right-fire';
export const ACTIONS: readonly InvAction[] = [
  'left',
  'right',
  'idle',
  'fire',
  'left-fire',
  'right-fire',
];

/** Points by row, top first. */
export const ROW_POINTS = [30, 20, 20, 10, 10];

export interface Invaders {
  rng: RngState;
  wave: number;
  /** Alive flags, row-major. */
  alive: boolean[];
  /** Formation origin (top-left of column 0, row 0). */
  fx: number;
  fy: number;
  dir: 1 | -1;
  /** Steps until the formation's next move, and the marching frame. */
  timer: number;
  frame: number;
  player: number;
  shot: { x: number; y: number } | null;
  bombs: { x: number; y: number; kind: number }[];
  /** Shield blocks still standing: "x,y" keys of 4-px blocks. */
  shields: string[];
  ufo: { x: number; dir: 1 | -1; value: number } | null;
  ufoTimer: number;
  lives: number;
  extraGiven: boolean;
  score: number;
  /** Steps of the player's explosion (no control meanwhile). */
  dying: number;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

/** A shield shape: an arch, as 4-px blocks. */
function shieldBlocks(): string[] {
  const out: string[] = [];
  const shape = [
    '..XXXXXX..',
    '.XXXXXXXX.',
    'XXXXXXXXXX',
    'XXXXXXXXXX',
    'XXX....XXX',
    'XX......XX',
  ];
  for (let i = 0; i < 4; i++) {
    const left = 34 + i * 82;
    shape.forEach((row, r) =>
      [...row].forEach(
        (ch, c) => ch === 'X' && out.push(`${left + c * BLOCK},${SHIELD_Y + r * BLOCK}`),
      ),
    );
  }
  return out;
}

export function newInvaders(seed: number): Invaders {
  return {
    rng: seedRng(seed >>> 0),
    wave: 1,
    alive: new Array<boolean>(ROWS * COLS).fill(true),
    fx: 30,
    fy: 90,
    dir: 1,
    timer: 0,
    frame: 0,
    player: W / 2,
    shot: null,
    bombs: [],
    shields: shieldBlocks(),
    ufo: null,
    ufoTimer: 900,
    lives: 3,
    extraGiven: false,
    score: 0,
    dying: 0,
    over: false,
    events: [],
    steps: 0,
  };
}

export const alienX = (s: Invaders, c: number) => s.fx + c * CELL_W;
export const alienY = (s: Invaders, r: number) => s.fy + r * CELL_H;
const count = (s: Invaders) => s.alive.filter(Boolean).length;

/** Steps between formation moves: the fewer the invaders, the faster they march. */
const pace = (n: number) => Math.max(2, Math.round(2 + (n / (ROWS * COLS)) * 40));

const fire = (a: InvAction) => a === 'fire' || a === 'left-fire' || a === 'right-fire';

export function stepInvaders(s: Invaders, action: InvAction): Invaders {
  if (s.over) return s;
  let rng = s.rng;
  const events: string[] = [];
  let {
    player,
    shot,
    fx,
    fy,
    dir,
    timer,
    frame,
    ufo,
    ufoTimer,
    lives,
    score,
    dying,
    extraGiven,
    wave,
  } = s;
  let alive = s.alive;
  let shields = s.shields;
  let bombs = s.bombs.map((b) => ({ ...b }));
  const shieldSet = () => new Set(shields);
  const hitShield = (x: number, y: number, radius: number): boolean => {
    const set = shieldSet();
    const bx = Math.floor(x / BLOCK) * BLOCK;
    const by = Math.floor(y / BLOCK) * BLOCK;
    let hit = false;
    const gone = new Set<string>();
    for (let dx = -radius; dx <= radius; dx += BLOCK)
      for (let dy = -radius; dy <= radius; dy += BLOCK) {
        const k = `${bx + dx},${by + dy}`;
        if (set.has(k)) {
          gone.add(k);
          hit = true;
        }
      }
    if (hit) shields = shields.filter((k) => !gone.has(k));
    return hit;
  };

  // The player.
  if (dying > 0) {
    dying--;
    if (dying === 0 && lives <= 0)
      return { ...s, over: true, events: ['over'], steps: s.steps + 1 };
  } else {
    if (action === 'left' || action === 'left-fire') player -= PLAYER_SPEED;
    if (action === 'right' || action === 'right-fire') player += PLAYER_SPEED;
    player = Math.max(PLAYER_W / 2 + 4, Math.min(W - PLAYER_W / 2 - 4, player));
    if (fire(action) && !shot) {
      shot = { x: player, y: PLAYER_Y - 8 };
      events.push('shoot');
    }
  }

  // The shot climbs: invaders, the mystery ship, shields, bombs.
  if (shot) {
    shot = { x: shot.x, y: shot.y - SHOT_SPEED };
    let used = false;
    for (let r = 0; r < ROWS && !used; r++)
      for (let c = 0; c < COLS && !used; c++) {
        const i = r * COLS + c;
        if (!alive[i]) continue;
        const ax = alienX(s, c);
        const ay = alienY(s, r);
        if (shot.x >= ax && shot.x <= ax + ALIEN_W && shot.y <= ay + ALIEN_H && shot.y + 8 >= ay) {
          alive = alive.map((v, k) => (k === i ? false : v));
          score += ROW_POINTS[r]!;
          events.push('kill');
          used = true;
        }
      }
    if (!used && ufo && shot.y <= UFO_Y + 8 && Math.abs(shot.x - ufo.x) <= 14) {
      score += ufo.value;
      events.push('ufo-hit');
      ufo = null;
      used = true;
    }
    if (!used && hitShield(shot.x, shot.y, 0)) used = true;
    if (!used) {
      const b = bombs.findIndex((x) => Math.abs(x.x - shot!.x) < 4 && Math.abs(x.y - shot!.y) < 8);
      if (b >= 0) {
        bombs.splice(b, 1);
        used = true;
      }
    }
    if (used || shot.y < 20) shot = null;
  }

  // The formation marches.
  const n = count({ ...s, alive });
  if (n > 0) {
    timer--;
    if (timer <= 0) {
      timer = pace(n);
      frame ^= 1;
      events.push('march');
      const cols = [...Array(COLS).keys()].filter((c) =>
        [...Array(ROWS).keys()].some((r) => alive[r * COLS + c]),
      );
      const minX = fx + Math.min(...cols) * CELL_W;
      const maxX = fx + Math.max(...cols) * CELL_W + ALIEN_W;
      if ((dir > 0 && maxX + 4 > W - 6) || (dir < 0 && minX - 4 < 6)) {
        fy += 10;
        dir = dir > 0 ? -1 : 1;
      } else fx += dir * 4;
    }
  }

  // Bombs: the lowest invader of a random column, more often as the waves go on.
  const [r1, n1] = rand(rng);
  rng = n1;
  // No bombs in the first two seconds of a game; more of them in later waves.
  if (n > 0 && s.steps > 120 && bombs.length < 2 + Math.min(3, wave) && r1 < 0.008 + wave * 0.003) {
    const [r2, n2] = rand(rng);
    rng = n2;
    const cols = [...Array(COLS).keys()].filter((c) =>
      [...Array(ROWS).keys()].some((r) => alive[r * COLS + c]),
    );
    // A third of the time, the column closest to the player.
    const near = cols.reduce(
      (a, c) =>
        Math.abs(fx + c * CELL_W + ALIEN_W / 2 - player) <
        Math.abs(fx + a * CELL_W + ALIEN_W / 2 - player)
          ? c
          : a,
      cols[0]!,
    );
    const col = r2 < 0.34 ? near : cols[Math.floor(r2 * 3 * cols.length) % cols.length]!;
    const row = Math.max(...[...Array(ROWS).keys()].filter((r) => alive[r * COLS + col]));
    bombs.push({
      x: fx + col * CELL_W + ALIEN_W / 2,
      y: fy + row * CELL_H + ALIEN_H,
      kind: Math.floor(r2 * 3),
    });
  }
  bombs = bombs
    .map((b) => ({ ...b, y: b.y + BOMB_SPEED }))
    .filter((b) => {
      if (b.y > H - 10) return false;
      if (hitShield(b.x, b.y, 4)) return false;
      if (
        dying === 0 &&
        b.y >= PLAYER_Y - 6 &&
        b.y <= PLAYER_Y + 8 &&
        Math.abs(b.x - player) <= PLAYER_W / 2
      ) {
        lives--;
        dying = 90;
        events.push('hit');
        return false;
      }
      return true;
    });
  if (dying === 90) {
    bombs = [];
    shot = null;
  }

  // Invaders erode the shields they pass through, and reaching the cannon's row ends the game.
  if (n > 0) {
    let lowest = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (alive[r * COLS + c]) lowest = Math.max(lowest, fy + r * CELL_H + ALIEN_H);
    if (lowest >= SHIELD_Y) {
      const set = shieldSet();
      shields = [...set].filter((k) => {
        const [x, y] = k.split(',').map(Number) as [number, number];
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (
              alive[r * COLS + c] &&
              x >= fx + c * CELL_W - 2 &&
              x <= fx + c * CELL_W + ALIEN_W + 2 &&
              y >= fy + r * CELL_H &&
              y <= fy + r * CELL_H + ALIEN_H
            )
              return false;
        return true;
      });
    }
    if (lowest >= PLAYER_Y - 6)
      return {
        ...s,
        rng,
        alive,
        fx,
        fy,
        shields,
        score,
        lives: 0,
        over: true,
        events: [...events, 'invaded'],
        steps: s.steps + 1,
      };
  }

  // The mystery ship.
  if (ufo) {
    const nx = ufo.x + ufo.dir * 1.3;
    ufo = nx < -20 || nx > W + 20 ? null : { ...ufo, x: nx };
  } else if (--ufoTimer <= 0) {
    const [r3, n3] = rand(rng);
    rng = n3;
    const d: 1 | -1 = r3 < 0.5 ? 1 : -1;
    ufo = { x: d > 0 ? -16 : W + 16, dir: d, value: [50, 100, 150, 300][Math.floor(r3 * 8) % 4]! };
    ufoTimer = 1200 + Math.floor(r3 * 600);
    events.push('ufo');
  }

  if (!extraGiven && score >= 1500) {
    lives++;
    extraGiven = true;
    events.push('extra');
  }

  // A new wave, starting lower each time (up to a limit).
  if (count({ ...s, alive }) === 0) {
    wave++;
    alive = new Array<boolean>(ROWS * COLS).fill(true);
    fx = 30;
    fy = 90 + Math.min(4, wave - 1) * 14;
    dir = 1;
    timer = 30;
    bombs = [];
    shot = null;
    events.push('wave');
  }
  if (dying > 0 && lives <= 0 && dying === 1)
    return { ...s, over: true, events, steps: s.steps + 1 };
  return {
    ...s,
    rng,
    wave,
    alive,
    fx,
    fy,
    dir,
    timer,
    frame,
    player,
    shot,
    bombs,
    shields,
    ufo,
    ufoTimer,
    lives,
    extraGiven,
    score,
    dying,
    events,
    steps: s.steps + 1,
  };
}

/**
 * A player: steer clear of bombs that will land near it, otherwise line up under the invader
 * column nearest to it (the mystery ship when it is over), and fire whenever the shot is free and
 * something is above.
 */
export function gunnerPolicy(s: Invaders): InvAction {
  const danger = (x: number) =>
    s.bombs.some((b) => Math.abs(b.x - x) < PLAYER_W / 2 + 6 && b.y > PLAYER_Y - 140);
  let target = s.player;
  if (s.ufo && s.ufo.dir * (s.ufo.x - s.player) < 60) target = s.ufo.x + s.ufo.dir * 20;
  else {
    let best = Infinity;
    for (let c = 0; c < COLS; c++) {
      if (![...Array(ROWS).keys()].some((r) => s.alive[r * COLS + c])) continue;
      const x = alienX(s, c) + ALIEN_W / 2 + s.dir * 4;
      if (Math.abs(x - s.player) < best) {
        best = Math.abs(x - s.player);
        target = x;
      }
    }
  }
  let dir = target < s.player - 2 ? -1 : target > s.player + 2 ? 1 : 0;
  if (danger(s.player + dir * PLAYER_SPEED * 6)) {
    // Step out of the way, towards the safer side.
    dir = danger(s.player - 24) ? 1 : danger(s.player + 24) ? -1 : dir || 1;
  }
  const above =
    s.alive.some(
      (v, i) => v && Math.abs(alienX(s, i % COLS) + ALIEN_W / 2 - s.player) < ALIEN_W / 2 + 2,
    ) ||
    (s.ufo !== null && Math.abs(s.ufo.x - s.player) < 30);
  const shoot = !s.shot && above;
  if (dir < 0) return shoot ? 'left-fire' : 'left';
  if (dir > 0) return shoot ? 'right-fire' : 'right';
  return shoot ? 'fire' : 'idle';
}

/** A simple player: drifts left and right, firing whenever it can. */
export function sweeperPolicy(s: Invaders): InvAction {
  const phase = Math.floor(s.steps / 150) % 2;
  if (s.player < 30) return 'right-fire';
  if (s.player > W - 30) return 'left-fire';
  return phase ? 'left-fire' : 'right-fire';
}

export function isInvaders(d: unknown): d is Invaders {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Invaders;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.alive) &&
    s.alive.length === ROWS * COLS &&
    Array.isArray(s.shields) &&
    Number.isFinite(s.score) &&
    Number.isInteger(s.lives)
  );
}
