/**
 * Diving Swarm: a 360 × 480 field at 60 steps a second. A swarm of 36 fliers sways in formation at
 * the top — 2 commanders, 6 guards and three rows of drones — and keeps sending fliers down in
 * looping dives that end in a run at your ship, firing as they come; a commander dives with up to
 * two guards. A diver that misses flies off the bottom and returns to its place from the top. Your
 * ship moves along the bottom with one missile in the air. Fliers are worth more while diving.
 * Three ships (one more at 5000 points); a cleared swarm brings a quicker one.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 360;
export const H = 480;
export const PLAYER_Y = 444;
export const PLAYER_W = 20;
const PLAYER_SPEED = 2.6;
const MISSILE_SPEED = 8;
const BULLET_SPEED = 3.2;
export const SIZE = 14;

/** Formation slots: [column, row]; row 0 commanders, 1 guards, 2–4 drones. */
const LAYOUT: [number, number][] = [
  [3, 0],
  [6, 0],
  [2, 1],
  [3, 1],
  [4, 1],
  [5, 1],
  [6, 1],
  [7, 1],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((c): [number, number] => [c, 2]),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c): [number, number] => [c, 3]),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c): [number, number] => [c, 4]),
];
/** Points in formation and diving, by row. */
const POINTS: [number, number][] = [
  [60, 150],
  [50, 100],
  [40, 80],
  [30, 60],
  [30, 60],
];

export type SwarmAction = 'left' | 'right' | 'idle' | 'fire' | 'left-fire' | 'right-fire';
export const ACTIONS: readonly SwarmAction[] = [
  'left',
  'right',
  'idle',
  'fire',
  'left-fire',
  'right-fire',
];

export interface Flier {
  slot: number;
  row: number;
  alive: boolean;
  /** null in formation; otherwise the dive's progress. */
  dive: { t: number; x: number; y: number; side: 1 | -1; aimX: number; shots: number } | null;
}

export interface Swarm {
  rng: RngState;
  wave: number;
  fliers: Flier[];
  /** Formation sway offset and direction. */
  sway: number;
  swayDir: 1 | -1;
  diveTimer: number;
  player: number;
  missile: { x: number; y: number } | null;
  bullets: { x: number; y: number; vx: number }[];
  lives: number;
  extraGiven: boolean;
  score: number;
  dying: number;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const slotX = (s: Swarm, slot: number) => 40 + LAYOUT[slot]![0] * 28 + s.sway;
export const slotY = (slot: number) => 60 + LAYOUT[slot]![1] * 22;

export function flierPos(s: Swarm, f: Flier): { x: number; y: number } {
  return f.dive ? { x: f.dive.x, y: f.dive.y } : { x: slotX(s, f.slot), y: slotY(f.slot) };
}

export function newSwarm(seed: number): Swarm {
  return {
    rng: seedRng(seed >>> 0),
    wave: 1,
    fliers: LAYOUT.map((l, i) => ({ slot: i, row: l[1], alive: true, dive: null })),
    sway: 0,
    swayDir: 1,
    diveTimer: 120,
    player: W / 2,
    missile: null,
    bullets: [],
    lives: 3,
    extraGiven: false,
    score: 0,
    dying: 0,
    over: false,
    events: [],
    steps: 0,
  };
}

const fire = (a: SwarmAction) => a === 'fire' || a === 'left-fire' || a === 'right-fire';

/** One step of a dive: a loop out to the side, then a swaying run at the aimed column. */
function advanceDive(f: Flier, speed: number): Flier['dive'] {
  const d = { ...f.dive! };
  d.t += 1;
  if (d.t < 50) {
    // The loop: up and out, then turning down.
    const a = (d.t / 50) * Math.PI;
    d.x += d.side * 1.8 * Math.cos(a * 0.5);
    d.y += -1.2 * Math.cos(a);
  } else {
    const dx = d.aimX + Math.sin(d.t / 18) * 26 - d.x;
    d.x += Math.max(-1.6, Math.min(1.6, dx * 0.04)) * speed;
    d.y += 2.1 * speed;
  }
  return d;
}

export function stepSwarm(s: Swarm, action: SwarmAction): Swarm {
  if (s.over) return s;
  let rng = s.rng;
  const events: string[] = [];
  let { player, missile, lives, score, dying, extraGiven, wave, sway, swayDir, diveTimer } = s;
  let fliers = s.fliers.map((f) => ({ ...f, dive: f.dive ? { ...f.dive } : null }));
  let bullets = s.bullets.map((b) => ({ ...b }));
  const speed = 1 + Math.min(0.6, (wave - 1) * 0.12);

  if (dying > 0) {
    dying--;
    if (dying === 0 && lives <= 0)
      return { ...s, over: true, events: ['over'], steps: s.steps + 1 };
  } else {
    if (action === 'left' || action === 'left-fire') player -= PLAYER_SPEED;
    if (action === 'right' || action === 'right-fire') player += PLAYER_SPEED;
    player = Math.max(14, Math.min(W - 14, player));
    if (fire(action) && !missile) {
      missile = { x: player, y: PLAYER_Y - 10 };
      events.push('shoot');
    }
  }

  // The formation sways.
  sway += swayDir * 0.35;
  if (Math.abs(sway) > 18) swayDir = swayDir > 0 ? -1 : 1;

  // Sending divers.
  if (--diveTimer <= 0) {
    const [r, n] = rand(rng);
    rng = n;
    diveTimer = Math.max(40, Math.round((150 - wave * 12) * (0.6 + r * 0.8)));
    const home = fliers.filter((f) => f.alive && !f.dive);
    if (home.length && dying === 0) {
      const [r2, n2] = rand(rng);
      rng = n2;
      // Edge fliers go first, like a swarm peeling off its flanks.
      const sorted = [...home].sort(
        (a, b) => Math.abs(LAYOUT[b.slot]![0] - 4.5) - Math.abs(LAYOUT[a.slot]![0] - 4.5),
      );
      const pick = sorted[Math.floor(r2 * Math.min(6, sorted.length))]!;
      const group = [pick];
      if (pick.row === 0) {
        // A commander takes up to two guards with it.
        group.push(
          ...home
            .filter((f) => f.row === 1 && Math.abs(LAYOUT[f.slot]![0] - LAYOUT[pick.slot]![0]) <= 1)
            .slice(0, 2),
        );
        events.push('commander');
      }
      for (const g of group) {
        const side: 1 | -1 = LAYOUT[g.slot]![0] < 5 ? -1 : 1;
        g.dive = {
          t: 0,
          x: slotX(s, g.slot),
          y: slotY(g.slot),
          side,
          aimX: player + (group.indexOf(g) - 1) * 22,
          shots: 0,
        };
      }
      events.push('dive');
    }
  }

  // Divers move and shoot; those leaving the bottom come back to their place from the top.
  for (const f of fliers) {
    if (!f.alive || !f.dive) continue;
    f.dive = advanceDive(f, speed);
    if (f.dive!.t > 60 && f.dive!.shots < 2 && f.dive!.y > 160 && f.dive!.y < PLAYER_Y - 120) {
      const [r, n] = rand(rng);
      rng = n;
      if (r < 0.03) {
        bullets.push({
          x: f.dive!.x,
          y: f.dive!.y + 8,
          vx: Math.max(-1, Math.min(1, (player - f.dive!.x) / 120)),
        });
        f.dive!.shots++;
      }
    }
    if (
      dying === 0 &&
      Math.abs(f.dive!.x - player) < (SIZE + PLAYER_W) / 2 - 2 &&
      Math.abs(f.dive!.y - PLAYER_Y) < SIZE
    ) {
      // A collision costs the ship and the flier.
      f.alive = false;
      lives--;
      dying = 90;
      events.push('hit');
    } else if (f.dive!.y > H + 20) f.dive = null;
  }

  // The missile.
  if (missile) {
    missile = { x: missile.x, y: missile.y - MISSILE_SPEED };
    for (const f of fliers) {
      if (!f.alive) continue;
      const p = flierPos({ ...s, sway }, f);
      if (
        Math.abs(missile.x - p.x) <= SIZE / 2 + 1 &&
        missile.y <= p.y + SIZE / 2 &&
        missile.y + 10 >= p.y - SIZE / 2
      ) {
        f.alive = false;
        score += POINTS[f.row]![f.dive ? 1 : 0]!;
        events.push(f.row === 0 ? 'commander-down' : 'kill');
        missile = null;
        break;
      }
    }
    if (missile && missile.y < 10) missile = null;
  }

  // Bullets.
  bullets = bullets
    .map((b) => ({ ...b, x: b.x + b.vx, y: b.y + BULLET_SPEED * speed }))
    .filter((b) => {
      if (b.y > H) return false;
      if (
        dying === 0 &&
        Math.abs(b.x - player) <= PLAYER_W / 2 &&
        b.y >= PLAYER_Y - 6 &&
        b.y <= PLAYER_Y + 8
      ) {
        lives--;
        dying = 90;
        events.push('hit');
        return false;
      }
      return true;
    });
  if (dying === 90) {
    bullets = [];
    missile = null;
    // Divers go home while the ship is down.
    fliers = fliers.map((f) => (f.dive ? { ...f, dive: null } : f));
  }

  if (!extraGiven && score >= 5000) {
    lives++;
    extraGiven = true;
    events.push('extra');
  }
  if (fliers.every((f) => !f.alive)) {
    wave++;
    fliers = LAYOUT.map((l, i) => ({ slot: i, row: l[1], alive: true, dive: null }));
    diveTimer = 120;
    bullets = [];
    events.push('wave');
  }
  return {
    ...s,
    rng,
    wave,
    fliers,
    sway,
    swayDir,
    diveTimer,
    player,
    missile,
    bullets,
    lives,
    extraGiven,
    score,
    dying,
    events,
    steps: s.steps + 1,
  };
}

/**
 * A player: dodge bullets and divers heading for it, otherwise get under the nearest target —
 * divers first — and fire when lined up.
 */
export function pilotPolicy(s: Swarm): SwarmAction {
  const threat = (x: number) =>
    s.bullets.some(
      (b) =>
        b.y > PLAYER_Y - 150 &&
        Math.abs(b.x + b.vx * ((PLAYER_Y - b.y) / BULLET_SPEED) - x) < PLAYER_W,
    ) ||
    s.fliers.some(
      (f) =>
        f.alive && f.dive && f.dive.y > PLAYER_Y - 110 && Math.abs(f.dive.x - x) < SIZE + PLAYER_W,
    );
  let target = s.player;
  let best = Infinity;
  for (const f of s.fliers) {
    if (!f.alive) continue;
    const p = flierPos(s, f);
    const score = Math.abs(p.x - s.player) - (f.dive ? 80 : 0);
    if (score < best) {
      best = score;
      target = p.x;
    }
  }
  let dir = target < s.player - 2 ? -1 : target > s.player + 2 ? 1 : 0;
  if (threat(s.player + dir * PLAYER_SPEED * 5))
    dir = threat(s.player - 30) ? 1 : threat(s.player + 30) ? -1 : dir || 1;
  const lined = s.fliers.some(
    (f) => f.alive && Math.abs(flierPos(s, f).x - s.player) < SIZE / 2 + 2,
  );
  const shoot = !s.missile && lined;
  if (dir < 0) return shoot ? 'left-fire' : 'left';
  if (dir > 0) return shoot ? 'right-fire' : 'right';
  return shoot ? 'fire' : 'idle';
}

/** A simple player: sweeps side to side and fires constantly. */
export function sweeperPolicy(s: Swarm): SwarmAction {
  if (s.player < 30) return 'right-fire';
  if (s.player > W - 30) return 'left-fire';
  return Math.floor(s.steps / 120) % 2 ? 'left-fire' : 'right-fire';
}

export function isSwarm(d: unknown): d is Swarm {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Swarm;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.fliers) &&
    s.fliers.length === LAYOUT.length &&
    Number.isFinite(s.score) &&
    Number.isInteger(s.lives)
  );
}

export const FLIERS = LAYOUT.length;
