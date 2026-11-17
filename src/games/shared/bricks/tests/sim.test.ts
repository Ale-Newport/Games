import { describe, expect, it } from 'vitest';
import { BREAKOUT, ENHANCED, maxScore } from '../rules';
import {
  BALL,
  buildWall,
  COLS,
  followerPolicy,
  landingX,
  newBricks,
  PADDLE_Y,
  plannerPolicy,
  stepBricks,
  W,
  type BrickRules,
  type Bricks,
  type Wall,
} from '../sim';

/**
 * Whether the ball can reach every breakable brick of a wall: a flood from the open field below
 * through empty cells and breakable bricks (open once broken), never through gold. Cells join only
 * edge to edge — the 3 px gaps between bricks and the margins beside the outer columns are narrower
 * than the 7 px ball — and the space above the wall is one open row across every column.
 */
function reachable(wall: Wall): boolean {
  const rows = wall.length;
  const open = (r: number, c: number) => r < 0 || r >= rows || wall[r]![c] !== 'G';
  const seen = new Set<string>();
  const queue: [number, number][] = [];
  for (let c = 0; c < COLS; c++) queue.push([rows, c]);
  while (queue.length) {
    const [r, c] = queue.pop()!;
    const key = `${r},${c}`;
    if (seen.has(key) || c < 0 || c >= COLS || r < -1 || r > rows || !open(r, c)) continue;
    seen.add(key);
    queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  return wall.every((row, r) =>
    [...row].every((ch, c) => ch === '.' || ch === 'G' || seen.has(`${r},${c}`)),
  );
}

/** Plays one wall from its start with the planner (lives topped up) until it is cleared. */
function clearsWall(rules: BrickRules, w: number, seed: number, cap: number): boolean {
  let s: Bricks = { ...newBricks(rules, seed), wall: w, bricks: buildWall(rules.walls[w]!) };
  while (s.wall === w && !s.over && s.steps < cap)
    s = stepBricks(rules, { ...s, lives: 9 }, plannerPolicy(s));
  return s.wall > w || (s.over && s.cleared);
}

describe('Brick walls', () => {
  it('Breakout has six distinct walls, the classic full wall first; the enhanced game fifteen', () => {
    expect(BREAKOUT.walls).toHaveLength(6);
    expect(ENHANCED.walls).toHaveLength(15);
    expect(BREAKOUT.walls[0]).toEqual(new Array(8).fill('1111111111'));
    for (const rules of [BREAKOUT, ENHANCED])
      expect(new Set(rules.walls.map((w) => w.join('/'))).size).toBe(rules.walls.length);
  });

  it.each([BREAKOUT, ENHANCED].flatMap((r) => r.walls.map((w, i) => [r.id, i + 1, w] as const)))(
    '%s wall %i: ten columns a row, valid bricks, something to break, and all of it reachable',
    (id, _n, wall) => {
      expect(wall.length).toBeGreaterThanOrEqual(5);
      expect(wall.length).toBeLessThanOrEqual(8);
      for (const row of wall) {
        expect(row).toHaveLength(COLS);
        // The classic game has plain bricks only.
        expect(row).toMatch(id === 'breakout' ? /^[.1]+$/ : /^[.123G]+$/);
      }
      expect(buildWall(wall).some((b) => !b.gold)).toBe(true);
      expect(reachable(wall)).toBe(true);
    },
  );

  it('the reachability check catches a brick sealed in gold', () => {
    expect(reachable(['GGG.......', 'G1G.......', 'GGG.......'])).toBe(false);
    expect(reachable(['GGG.......', 'G1G.......', 'G.G.......'])).toBe(true);
  });

  it('the enhanced walls rise in toughness: later walls need more hits', () => {
    const hits = (w: Wall) => buildWall(w).reduce((a, b) => a + (b.gold ? 0 : b.hits), 0);
    const firstFive = ENHANCED.walls.slice(0, 5).reduce((a, w) => a + hits(w), 0) / 5;
    const lastFive = ENHANCED.walls.slice(10).reduce((a, w) => a + hits(w), 0) / 5;
    expect(lastFive).toBeGreaterThan(firstFive);
    expect(ENHANCED.walls.slice(10).every((w) => w.some((row) => row.includes('G')))).toBe(true);
  });

  it('clearing a wall brings the next one in order, and the last ends the game', () => {
    for (const rules of [BREAKOUT, ENHANCED]) {
      for (let w = 0; w < rules.walls.length; w++) {
        const s0 = newBricks(rules, 7);
        const all = buildWall(rules.walls[w]!);
        const gold = all.filter((b) => b.gold);
        // A brick with no gold beneath it, struck by a ball rising straight up from the field.
        const target = all.find((b) => !b.gold && !gold.some((g) => g.x === b.x && g.y > b.y))!;
        expect(target).toBeDefined();
        const s: Bricks = {
          ...s0,
          wall: w,
          held: null,
          // Only the gold and that one brick (down to its last hit) left.
          bricks: [...gold, { ...target, hits: 1 }],
          balls: [{ x: target.x + 10, y: 300, vx: 0, vy: -5 }],
        };
        let t = s;
        for (let i = 0; i < 80 && t.wall === w && !t.over; i++) t = stepBricks(rules, t, 'idle');
        expect(t.events).toContain('wall-cleared');
        if (w + 1 < rules.walls.length) {
          expect(t.wall).toBe(w + 1);
          expect(t.over).toBe(false);
          expect(t.bricks).toEqual(buildWall(rules.walls[w + 1]!));
          expect(t.held).not.toBeNull();
        } else {
          expect(t.over).toBe(true);
          expect(t.cleared).toBe(true);
          expect(t.wall).toBe(w);
        }
      }
    }
  });

  it('the planner clears every wall of both games', () => {
    for (const rules of [BREAKOUT, ENHANCED])
      rules.walls.forEach((_, w) => expect(clearsWall(rules, w, 1, 60 * 60 * 15)).toBe(true));
  }, 120_000);
});

describe('Brick breaking', () => {
  it('builds walls: the classic eight rows of ten; gold and multi-hit bricks', () => {
    expect(buildWall(BREAKOUT.walls[0]!)).toHaveLength(80);
    const w = buildWall(ENHANCED.walls[1]!);
    expect(w.some((b) => b.gold)).toBe(true);
    expect(w.some((b) => b.hits === 3)).toBe(true);
  });

  it('the waiting ball launches on fire, or by itself', () => {
    let s = newBricks(BREAKOUT, 1);
    expect(s.held).not.toBeNull();
    s = stepBricks(BREAKOUT, s, 'fire');
    expect(s.balls).toHaveLength(1);
    expect(s.balls[0]!.vy).toBeLessThan(0);
    let t = newBricks(BREAKOUT, 1);
    for (let i = 0; i < 130; i++) t = stepBricks(BREAKOUT, t, 'idle');
    expect(t.balls.length + (t.held === null ? 0 : 1)).toBeGreaterThan(0);
  });

  it('breaks a brick, scores by row, and bounces back', () => {
    const s0 = newBricks(BREAKOUT, 2);
    const target = s0.bricks.find((b) => b.row === 7)!;
    const s: Bricks = {
      ...s0,
      held: null,
      balls: [{ x: target.x + 10, y: target.y + 20, vx: 0, vy: -5 }],
    };
    let t = s;
    for (let i = 0; i < 6; i++) t = stepBricks(BREAKOUT, t, 'idle');
    expect(t.bricks).toHaveLength(79);
    expect(t.score).toBe(1);
    expect(t.balls[0]!.vy).toBeGreaterThan(0);
  });

  it('the paddle returns a ball at an angle; a missed ball costs a life', () => {
    const s0 = newBricks(BREAKOUT, 3);
    const s: Bricks = {
      ...s0,
      held: null,
      paddle: W / 2,
      balls: [{ x: W / 2 + 20, y: PADDLE_Y - BALL / 2 - 2, vx: 0, vy: 4 }],
    };
    const t = stepBricks(BREAKOUT, s, 'idle');
    expect(t.balls[0]!.vy).toBeLessThan(0);
    expect(t.balls[0]!.vx).toBeGreaterThan(0);
    let lost: Bricks = {
      ...s0,
      held: null,
      paddle: 20,
      balls: [{ x: W - 30, y: PADDLE_Y + 20, vx: 0, vy: 5 }],
    };
    for (let i = 0; i < 10; i++) lost = stepBricks(BREAKOUT, lost, 'idle');
    expect(lost.lives).toBe(2);
    expect(lost.held).not.toBeNull();
  });

  it('the classic paddle shrinks once a ball reaches the top', () => {
    const s0 = newBricks(BREAKOUT, 4);
    const s: Bricks = { ...s0, bricks: [], held: null, balls: [{ x: W / 2, y: 5, vx: 0, vy: -5 }] };
    const t = stepBricks(
      BREAKOUT,
      { ...s, bricks: buildWall(['..........', '1.........']) },
      'idle',
    );
    expect(t.small).toBe(true);
    expect(t.paddleW).toBe(64);
    expect(stepBricks(BREAKOUT, t, 'idle').paddleW).toBe(40);
  });

  it('capsules: three balls from Multi, a life from +', () => {
    const s0 = newBricks(ENHANCED, 5);
    const s: Bricks = {
      ...s0,
      held: null,
      balls: [{ x: 100, y: 200, vx: 1, vy: -4 }],
      capsules: [
        { x: s0.paddle, y: PADDLE_Y - 5, kind: 'multi' },
        { x: s0.paddle, y: PADDLE_Y - 5, kind: 'life' },
      ],
    };
    const t = stepBricks(ENHANCED, s, 'idle');
    expect(t.balls).toHaveLength(3);
    expect(t.lives).toBe(s0.lives + 1);
    expect(t.caught).toBe(2);
  });

  it('predicts where a falling ball meets the paddle line', () => {
    expect(landingX({ x: 100, y: 300, vx: 0, vy: 4 })).toBeCloseTo(100);
    expect(landingX({ x: 100, y: 300, vx: 0, vy: -4 })).toBeNull();
    const x = landingX({ x: 30, y: 100, vx: -6, vy: 3 })!;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(W);
  });

  it('the planner clears the classic game: all six walls, every point', () => {
    let s = newBricks(BREAKOUT, 1);
    while (!s.over && s.steps < 60 * 60 * 30) s = stepBricks(BREAKOUT, s, plannerPolicy(s));
    expect(s.over && s.lives > 0).toBe(true);
    expect(s.score).toBe(maxScore(BREAKOUT));
    // The classic wall alone is worth 320; the six walls 1340.
    expect(maxScore({ ...BREAKOUT, walls: [BREAKOUT.walls[0]!] })).toBe(320);
    expect(maxScore(BREAKOUT)).toBe(1340);
    // The follower survives a while too.
    let f = newBricks(ENHANCED, 2);
    for (let i = 0; i < 3600; i++) f = stepBricks(ENHANCED, f, followerPolicy(f));
    expect(f.score).toBeGreaterThan(0);
  });
});
