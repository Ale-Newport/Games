import { describe, expect, it } from 'vitest';
import { COLS, generateMaze, idx, ROWS } from '../layout';
import {
  ADVANCED_RULES,
  CLASSIC_RULES,
  SUB,
  distances,
  grazerPolicy,
  newMazeGame,
  runnerPolicy,
  step,
  stepMaze,
  tileOf,
  type MazeGame,
  type MazeRules,
} from '../sim';

const at = (tile: number) => ({
  x: (tile % COLS) * SUB + SUB / 2,
  y: Math.floor(tile / COLS) * SUB + SUB / 2,
});
const walkable = (t: string | undefined) => t === 'path' || t === 'tunnel';

function play(
  rules: MazeRules,
  seed: number,
  policy: (g: MazeGame) => ReturnType<typeof runnerPolicy>,
  cap: number,
) {
  let g = newMazeGame(rules, seed);
  while (!g.over && g.steps < cap) g = stepMaze(rules, g, policy(g));
  return g;
}

describe('Maze layouts', () => {
  it.each([7, 11, 23, 37, 53])('maze %i is symmetric, connected, without dead ends', (seed) => {
    const m = generateMaze(seed);
    const open = (t: number) => walkable(m.tiles[t]);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) expect(m.tiles[idx(x, y)]).toBe(m.tiles[idx(COLS - 1 - x, y)]);
    const reach = distances(m.playerStart, open);
    const paths = m.tiles.map((_, i) => i).filter(open);
    expect(paths.length).toBeGreaterThan(150);
    for (const t of paths) {
      expect(reach[t]).toBeGreaterThanOrEqual(0);
      const exits = (['up', 'down', 'left', 'right'] as const).filter((d) => {
        const n = step(t, d);
        return n !== null && open(n);
      });
      expect(exits.length).toBeGreaterThanOrEqual(2);
    }
    expect(m.tiles[m.houseCentre]).toBe('house');
    expect(m.pellets).toHaveLength(4);
    // The tunnel wraps round.
    expect(step(idx(0, m.tunnelRow), 'left')).toBe(idx(COLS - 1, m.tunnelRow));
  });
});

describe('Maze chase simulation', () => {
  it('moves the player through corridors, stopping at walls, and eats seeds', () => {
    let g = newMazeGame(CLASSIC_RULES, 1);
    const start = tileOf(g.player);
    for (let i = 0; i < 120; i++) g = stepMaze(CLASSIC_RULES, g, 'idle');
    expect(tileOf(g.player)).not.toBe(start);
    expect(g.score).toBeGreaterThan(0);
    expect(g.score % 10).toBe(0);
    // Pressed against a wall it stays put.
    const m = g.maze;
    for (let i = 0; i < 200; i++) g = stepMaze(CLASSIC_RULES, g, g.player.dir);
    const t = tileOf(g.player);
    expect(walkable(m.tiles[step(t, g.player.dir)!])).toBe(false);
    const still = stepMaze(CLASSIC_RULES, g, g.player.dir);
    expect([still.player.x, still.player.y]).toEqual([g.player.x, g.player.y]);
  });

  it('a power cell turns the chasers blue; eating them scores 200, then 400', () => {
    let g = newMazeGame(CLASSIC_RULES, 1);
    const pellet = g.maze.pellets[0]!;
    g = {
      ...g,
      player: { ...g.player, ...at(pellet) },
      chasers: g.chasers.map((c) => ({ ...c, ...at(g.maze.exit) })),
    };
    g.chasers[1]!.mode = 'active';
    g = stepMaze(CLASSIC_RULES, g, 'idle');
    expect(g.score).toBe(50);
    expect(g.events).toContain('pellet');
    expect(g.chasers[0]!.mode).toBe('frightened');
    expect(g.chasers[1]!.mode).toBe('frightened');
    const p = { x: g.player.x, y: g.player.y };
    g = { ...g, chasers: g.chasers.map((c, i) => (i < 2 ? { ...c, ...p } : c)) };
    g = stepMaze(CLASSIC_RULES, g, 'idle');
    expect(g.score).toBe(50 + 200 + 400);
    expect(g.chasers[0]!.mode).toBe('eyes');
  });

  it('eyes go home and the chaser comes back out', () => {
    let g = newMazeGame(CLASSIC_RULES, 3);
    // The others stay at home, so only the eyes are about.
    g = {
      ...g,
      chasers: g.chasers.map((c, i) =>
        i === 0
          ? { ...c, mode: 'eyes' as const, ...at(g.maze.playerStart) }
          : { ...c, release: 999 },
      ),
    };
    let back = false;
    let home = false;
    for (let i = 0; i < 1200 && !back; i++) {
      g = stepMaze(CLASSIC_RULES, { ...g, idle: 0 }, 'idle');
      home ||= tileOf(g.chasers[0]!) === g.maze.houseCentre;
      back = g.chasers[0]!.mode === 'active';
    }
    expect(home).toBe(true);
    expect(back).toBe(true);
  });

  it('being caught costs a life, and the third ends the game', () => {
    let g = newMazeGame(CLASSIC_RULES, 1);
    const p = { x: g.player.x, y: g.player.y };
    g = { ...g, chasers: g.chasers.map((c, i) => (i === 0 ? { ...c, ...p } : c)) };
    g = stepMaze(CLASSIC_RULES, g, 'idle');
    expect(g.lives).toBe(2);
    expect(g.events).toContain('caught');
    for (let i = 0; i < 100; i++) g = stepMaze(CLASSIC_RULES, g, 'idle');
    expect(tileOf(g.player)).toBe(g.maze.playerStart);
    expect(g.over).toBe(false);
    g = {
      ...g,
      lives: 1,
      chasers: g.chasers.map((c, i) => (i === 0 ? { ...c, x: g.player.x, y: g.player.y } : c)),
    };
    for (let i = 0; i < 102 && !g.over; i++) g = stepMaze(CLASSIC_RULES, g, 'idle');
    expect(g.over).toBe(true);
  });

  it('clearing the maze starts the next level; the advanced game changes maze', () => {
    for (const rules of [CLASSIC_RULES, ADVANCED_RULES]) {
      let g = newMazeGame(rules, 2);
      const here = tileOf(g.player);
      const next = step(here, 'left')!;
      g = { ...g, dots: g.dots.map((_, i) => i === next), left: 1 };
      for (let i = 0; i < 30 && g.clearing === 0; i++) g = stepMaze(rules, g, 'left');
      expect(g.clearing).toBeGreaterThan(0);
      const tiles = g.maze.tiles.join();
      for (let i = 0; i < 200 && g.level === 1; i++) g = stepMaze(rules, g, 'idle');
      expect(g.level).toBe(2);
      expect(g.left).toBeGreaterThan(100);
      // The advanced game changes maze every two levels; level 3 is the second maze.
      if (rules === ADVANCED_RULES) {
        g = { ...g, dots: g.dots.map(() => false), left: 0 };
        for (let i = 0; i < 200 && g.level === 2; i++) g = stepMaze(rules, g, 'idle');
        expect(g.level).toBe(3);
        expect(g.maze.tiles.join()).not.toBe(tiles);
      }
    }
  });

  it('chasers catch a player who stands still within a minute', () => {
    let g = newMazeGame(CLASSIC_RULES, 4);
    let caught = false;
    for (let i = 0; i < 3600 && !caught; i++) {
      g = stepMaze(CLASSIC_RULES, g, 'idle');
      caught = g.events.includes('caught');
    }
    expect(caught).toBe(true);
  });

  it('the runner outscores the grazer', () => {
    let runner = 0;
    let grazer = 0;
    for (const seed of [1, 2]) {
      runner += play(CLASSIC_RULES, seed, runnerPolicy, 15000).score;
      grazer += play(CLASSIC_RULES, seed, grazerPolicy, 15000).score;
    }
    expect(runner).toBeGreaterThan(grazer);
  }, 60_000);

  it('replays exactly from a seed', () => {
    const a = play(ADVANCED_RULES, 9, runnerPolicy, 2000);
    const b = play(ADVANCED_RULES, 9, runnerPolicy, 2000);
    expect(a).toEqual(b);
  });
});
