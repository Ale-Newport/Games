/**
 * Pure simulation of #218 Disc Soccer (ruleset `disc-soccer-classic`), a top-down physics football
 * game played with discs: players accelerate in eight directions and kick the ball when it is
 * close. Discs collide elastically by mass; the ball bounces off the touchlines and the posts and
 * scores between the posts. After a goal, the team that conceded kicks off while the other team
 * waits in its half outside the centre circle. Fixed 60 Hz steps; all randomness is seeded.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

export const W = 840;
export const H = 440;
/** The pitch rectangle (touchlines and goal lines). */
export const PX0 = 60;
export const PX1 = W - 60;
export const PY0 = 40;
export const PY1 = H - 40;
export const CY = H / 2;
export const GOAL_HALF = 64;
export const GOAL_DEPTH = 34;
export const PLAYER_R = 15;
export const BALL_R = 10;
export const POST_R = 8;
const PLAYER_ACC = 0.1;
const KICKING_ACC = 0.07;
const PLAYER_DAMP = 0.96;
const BALL_DAMP = 0.99;
const KICK = 5;
const KICK_REACH = PLAYER_R + BALL_R + 4;
const CENTRE_R = 70;

export type Team = 0 | 1;
export type Dir = '' | 'u' | 'd' | 'l' | 'r' | 'ul' | 'ur' | 'dl' | 'dr';
export type SoccerAction = 'idle' | Exclude<Dir, ''> | `${Dir}k` | 'k';

const DIRS: Dir[] = ['', 'u', 'd', 'l', 'r', 'ul', 'ur', 'dl', 'dr'];
export const ACTIONS: SoccerAction[] = [
  'idle',
  ...(DIRS.filter(Boolean) as Exclude<Dir, ''>[]),
  'k',
  ...(DIRS.filter(Boolean).map((d) => `${d}k`) as `${Dir}k`[]),
];

export interface Disc {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Player extends Disc {
  team: Team;
  kicking: boolean;
  /** Steps until this player may kick again (a kick needs the key released, like the original). */
  kickLock: boolean;
}

export type Level = 'easy' | 'medium' | 'hard';

export interface Soccer {
  players: Player[];
  ball: Disc;
  score: [number, number];
  /** Steps played and the regulation length. */
  t: number;
  length: number;
  scoreLimit: number;
  /** Team taking the kick-off, until the ball is first touched. */
  kickoff: Team | null;
  /** Steps of the post-goal pause. */
  pause: number;
  overtime: boolean;
  level: Level;
  rng: RngState;
  events: ('kick' | 'bounce' | 'goal-red' | 'goal-blue' | 'whistle')[];
  /** Ball touches per player, for achievements. */
  touches: number[];
  lastTouch: number | null;
  goalsBy: number[];
}

const sign = (team: Team) => (team === 0 ? 1 : -1);

function formation(n: number, team: Team): [number, number][] {
  const s = sign(team);
  const cx = W / 2 - s * 130;
  if (n === 1) return [[cx, CY]];
  if (n === 2)
    return [
      [cx, CY - 60],
      [W / 2 - s * 250, CY + 40],
    ];
  return [
    [cx, CY],
    [W / 2 - s * 240, CY - 90],
    [W / 2 - s * 240, CY + 90],
  ];
}

function placeKickoff(s: Soccer, team: Team): Soccer {
  const perTeam = s.players.length / 2;
  const players = s.players.map((p, i) => {
    const k = i % perTeam;
    const [x, y] = formation(perTeam, p.team)[k]!;
    return { ...p, x, y, vx: 0, vy: 0, kicking: false, kickLock: false };
  });
  return { ...s, players, ball: { x: W / 2, y: CY, vx: 0, vy: 0 }, kickoff: team };
}

export function newSoccer(
  seed: number,
  size: 1 | 2 | 3,
  level: Level,
  minutes: number,
  scoreLimit: number,
): Soccer {
  const rng = new Rng(seed >>> 0);
  const players: Player[] = [];
  for (const team of [0, 1] as Team[])
    for (let i = 0; i < size; i++)
      players.push({ team, x: 0, y: 0, vx: 0, vy: 0, kicking: false, kickLock: false });
  const base: Soccer = {
    players,
    ball: { x: W / 2, y: CY, vx: 0, vy: 0 },
    score: [0, 0],
    t: 0,
    length: Math.round(minutes * 60 * 60),
    scoreLimit,
    kickoff: 0,
    pause: 0,
    overtime: false,
    level,
    rng: rng.state,
    events: [],
    touches: players.map(() => 0),
    lastTouch: null,
    goalsBy: players.map(() => 0),
  };
  return placeKickoff(base, rng.chance(0.5) ? 0 : 1);
}

export function parse(a: SoccerAction): { dx: number; dy: number; kick: boolean } {
  const kick = a.endsWith('k');
  const d = a === 'idle' || a === 'k' ? '' : a.replace('k', '');
  let dx = 0;
  let dy = 0;
  if (d.includes('u')) dy -= 1;
  if (d.includes('d')) dy += 1;
  if (d.includes('l')) dx -= 1;
  if (d.includes('r')) dx += 1;
  const n = Math.hypot(dx, dy) || 1;
  return { dx: dx / n, dy: dy / n, kick };
}

function collide(
  a: Disc,
  ra: number,
  ima: number,
  b: Disc,
  rb: number,
  imb: number,
  bounce = 0.5,
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d >= ra + rb) return false;
  const nx = dx / d;
  const ny = dy / d;
  const overlap = ra + rb - d;
  const total = ima + imb;
  a.x -= nx * overlap * (ima / total);
  a.y -= ny * overlap * (ima / total);
  b.x += nx * overlap * (imb / total);
  b.y += ny * overlap * (imb / total);
  const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rel < 0) {
    const j = (-(1 + bounce) * rel) / total;
    a.vx -= j * ima * nx;
    a.vy -= j * ima * ny;
    b.vx += j * imb * nx;
    b.vy += j * imb * ny;
  }
  return true;
}

const POSTS: Disc[] = [
  { x: PX0, y: CY - GOAL_HALF, vx: 0, vy: 0 },
  { x: PX0, y: CY + GOAL_HALF, vx: 0, vy: 0 },
  { x: PX1, y: CY - GOAL_HALF, vx: 0, vy: 0 },
  { x: PX1, y: CY + GOAL_HALF, vx: 0, vy: 0 },
];

/** One 1/60 s step. `actions[i]` drives player i (bots and the human alike). */
export function stepSoccer(s: Soccer, actions: readonly SoccerAction[]): Soccer {
  if (soccerOver(s)) return s;
  const events: Soccer['events'] = [];
  if (s.pause > 0) {
    const pause = s.pause - 1;
    return pause === 0
      ? { ...placeKickoff({ ...s, pause, events: ['whistle'] }, s.kickoff ?? 0) }
      : { ...s, pause, events };
  }
  const players = s.players.map((p) => ({ ...p }));
  const ball = { ...s.ball };
  const touches = [...s.touches];
  let lastTouch = s.lastTouch;
  let kickoff = s.kickoff;

  players.forEach((p, i) => {
    const { dx, dy, kick } = parse(actions[i] ?? 'idle');
    const acc = kick ? KICKING_ACC : PLAYER_ACC;
    p.vx = (p.vx + dx * acc) * PLAYER_DAMP;
    p.vy = (p.vy + dy * acc) * PLAYER_DAMP;
    p.kicking = kick;
    if (!kick) p.kickLock = false;
    if (kick && !p.kickLock) {
      const d = Math.hypot(ball.x - p.x, ball.y - p.y);
      if (d <= KICK_REACH) {
        const nx = (ball.x - p.x) / d;
        const ny = (ball.y - p.y) / d;
        ball.vx += nx * KICK;
        ball.vy += ny * KICK;
        p.kickLock = true;
        touches[i]!++;
        lastTouch = i;
        kickoff = null;
        events.push('kick');
      }
    }
  });

  for (const p of players) {
    p.x += p.vx;
    p.y += p.vy;
  }
  ball.vx *= BALL_DAMP;
  ball.vy *= BALL_DAMP;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Disc collisions: players with players, players with the ball (player mass 2, ball mass 1).
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++)
      collide(players[i]!, PLAYER_R, 0.5, players[j]!, PLAYER_R, 0.5);
    if (collide(players[i]!, PLAYER_R, 0.5, ball, BALL_R, 1)) {
      touches[i]!++;
      lastTouch = i;
      kickoff = null;
    }
  }
  // Posts are fixed discs.
  for (const post of POSTS) {
    const fixed = { ...post };
    if (collide(fixed, POST_R, 0, ball, BALL_R, 1, 0.6)) events.push('bounce');
    for (const p of players) collide({ ...post }, POST_R, 0, p, PLAYER_R, 1, 0.3);
  }

  // Kick-off barrier: the defending team stays in its half and outside the centre circle.
  if (kickoff !== null)
    for (const p of players) {
      if (p.team === kickoff) continue;
      const s0 = sign(p.team);
      const minX = s0 > 0 ? -Infinity : W / 2 + PLAYER_R;
      const maxX = s0 > 0 ? W / 2 - PLAYER_R : Infinity;
      p.x = Math.min(maxX, Math.max(minX, p.x));
      const d = Math.hypot(p.x - W / 2, p.y - CY);
      if (d < CENTRE_R + PLAYER_R) {
        const k = (CENTRE_R + PLAYER_R) / (d || 1);
        p.x = W / 2 + (p.x - W / 2) * k;
        p.y = CY + (p.y - CY) * k;
      }
    }

  // Players stay on the field (the area around the pitch included).
  for (const p of players) {
    p.x = Math.min(W - PLAYER_R, Math.max(PLAYER_R, p.x));
    p.y = Math.min(H - PLAYER_R, Math.max(PLAYER_R, p.y));
  }

  // The ball bounces off the touchlines, and off the goal lines outside the goal mouth.
  const inMouth = Math.abs(ball.y - CY) < GOAL_HALF;
  if (ball.y - BALL_R < PY0 && ball.vy < 0) {
    ball.y = PY0 + BALL_R;
    ball.vy = -ball.vy * 0.5;
    events.push('bounce');
  }
  if (ball.y + BALL_R > PY1 && ball.vy > 0) {
    ball.y = PY1 - BALL_R;
    ball.vy = -ball.vy * 0.5;
    events.push('bounce');
  }
  if (!inMouth) {
    if (ball.x - BALL_R < PX0 && ball.vx < 0) {
      ball.x = PX0 + BALL_R;
      ball.vx = -ball.vx * 0.5;
      events.push('bounce');
    }
    if (ball.x + BALL_R > PX1 && ball.vx > 0) {
      ball.x = PX1 - BALL_R;
      ball.vx = -ball.vx * 0.5;
      events.push('bounce');
    }
  } else {
    // Inside a goal: the net stops the ball.
    if (ball.x - BALL_R < PX0 - GOAL_DEPTH) {
      ball.x = PX0 - GOAL_DEPTH + BALL_R;
      ball.vx = Math.abs(ball.vx) * 0.2;
    }
    if (ball.x + BALL_R > PX1 + GOAL_DEPTH) {
      ball.x = PX1 + GOAL_DEPTH - BALL_R;
      ball.vx = -Math.abs(ball.vx) * 0.2;
    }
  }

  let score = s.score;
  let pause = 0;
  const goalsBy = [...s.goalsBy];
  const scoredLeft = ball.x < PX0 && inMouth; // blue scores in red's goal
  const scoredRight = ball.x > PX1 && inMouth; // red scores in blue's goal
  if (scoredLeft || scoredRight) {
    const team: Team = scoredRight ? 0 : 1;
    score = team === 0 ? [s.score[0] + 1, s.score[1]] : [s.score[0], s.score[1] + 1];
    if (lastTouch !== null && players[lastTouch]!.team === team) goalsBy[lastTouch]!++;
    events.push(team === 0 ? 'goal-red' : 'goal-blue');
    pause = 120;
    kickoff = team === 0 ? 1 : 0;
  }
  const t = s.t + 1;
  const overtime = s.overtime || (t >= s.length && score[0] === score[1]);
  return {
    ...s,
    players,
    ball,
    score,
    t,
    pause,
    kickoff,
    overtime,
    events,
    touches,
    lastTouch,
    goalsBy,
  };
}

export function soccerOver(s: Soccer): boolean {
  if (s.score[0] >= s.scoreLimit || s.score[1] >= s.scoreLimit) return true;
  if (s.t >= s.length && s.score[0] !== s.score[1]) return true;
  return false;
}

export const winner = (s: Soccer): Team | null =>
  s.score[0] > s.score[1] ? 0 : s.score[1] > s.score[0] ? 1 : null;

// ---------------------------------------------------------------- bots

function toward(px: number, py: number, tx: number, ty: number, slack = 6): Dir {
  const dx = tx - px;
  const dy = ty - py;
  let d = '';
  if (dy < -slack) d += 'u';
  else if (dy > slack) d += 'd';
  if (dx < -slack) d += 'l';
  else if (dx > slack) d += 'r';
  return d as Dir;
}

const LEVEL_NOISE: Record<Level, number> = { easy: 26, medium: 12, hard: 4 };

/**
 * A bot's action for player i. The player of each team closest to the ball attacks: it runs to the
 * spot behind the ball on the line from the opponent's goal and kicks when lined up; the others hold
 * a defensive spot between the ball and their own goal. Lower levels aim worse and react late.
 */
export function botAction(s: Soccer, i: number): SoccerAction {
  const p = s.players[i]!;
  const level = s.level;
  const goalX = p.team === 0 ? PX1 + 10 : PX0 - 10;
  const ownGoalX = p.team === 0 ? PX0 : PX1;
  const mates = s.players.map((q, k) => [q, k] as const).filter(([q]) => q.team === p.team);
  const closest = mates.reduce((a, b) =>
    Math.hypot(b[0].x - s.ball.x, b[0].y - s.ball.y) <
    Math.hypot(a[0].x - s.ball.x, a[0].y - s.ball.y)
      ? b
      : a,
  )[1];
  const rng = new Rng((s.t * 31 + i * 7919) >>> 0);
  const noise = LEVEL_NOISE[level];
  if (s.kickoff !== null && s.kickoff !== p.team) {
    // Waiting for the kick-off: hold a spot in our half.
    const [x, y] = formation(s.players.length / 2, p.team)[mates.findIndex(([, k]) => k === i)]!;
    return (toward(p.x, p.y, x, y) || 'idle') as SoccerAction;
  }
  if (i === closest) {
    const aimY = CY + (rng.float() - 0.5) * noise * 2;
    const bx = s.ball.x + s.ball.vx * 6;
    const by = s.ball.y + s.ball.vy * 6;
    const ax = bx - goalX;
    const ay = by - aimY;
    const n = Math.hypot(ax, ay) || 1;
    const spotX = bx + (ax / n) * (PLAYER_R + BALL_R + 2);
    const spotY = by + (ay / n) * (PLAYER_R + BALL_R + 2);
    const dist = Math.hypot(s.ball.x - p.x, s.ball.y - p.y);
    const toSpot = Math.hypot(spotX - p.x, spotY - p.y);
    // Lined up: the ball lies between us and the goal.
    const dot =
      ((s.ball.x - p.x) * (goalX - s.ball.x) + (s.ball.y - p.y) * (aimY - s.ball.y)) /
      (dist * Math.hypot(goalX - s.ball.x, aimY - s.ball.y) || 1);
    const kick = dist < PLAYER_R + BALL_R + 6 && dot > (level === 'easy' ? 0.2 : 0.6);
    const d =
      toSpot > 10 ? toward(p.x, p.y, spotX, spotY, 3) : toward(p.x, p.y, s.ball.x, s.ball.y, 3);
    if (level === 'easy' && rng.chance(0.3)) return 'idle';
    return (((d || '') + (kick ? 'k' : '')) as SoccerAction) || 'idle';
  }
  // Defender: between the ball and our goal, two thirds of the way back.
  const tx = ownGoalX + (s.ball.x - ownGoalX) * 0.35;
  const ty = CY + (s.ball.y - CY) * 0.6;
  const d = toward(p.x, p.y, tx, ty, 8);
  const near = Math.hypot(s.ball.x - p.x, s.ball.y - p.y) < PLAYER_R + BALL_R + 5;
  return (((d || '') + (near ? 'k' : '')) as SoccerAction) || 'idle';
}

/** One step with the player on seat 0 and bots on every other seat. */
export function stepWithBots(s: Soccer, action: SoccerAction): Soccer {
  return stepSoccer(
    s,
    s.players.map((_, i) => (i === 0 ? action : botAction(s, i))),
  );
}

export function isSoccer(v: unknown): v is Soccer {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Soccer;
  return (
    Array.isArray(s.players) &&
    typeof s.ball === 'object' &&
    Array.isArray(s.score) &&
    typeof s.t === 'number' &&
    Array.isArray(s.rng)
  );
}
