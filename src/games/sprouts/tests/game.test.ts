import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS, randomCurve } from '../ai';
import { sproutsEnv } from '../ai-adapter';
import {
  W,
  applySproutsAction,
  buildGrid,
  createSproutsState,
  curveProblem,
  isValidSproutsState,
  joinable,
  regions,
} from '../engine';
import { SPROUTS } from '../Game';
import { route } from '../route';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(sproutsEnv, {
  configs: [undefined],
  playouts: 8,
  maxSteps: 20,
  illegalActions: () => ['0.1.2', '', 'x', '5'],
});

describe('Sprouts rules', () => {
  it('starts with 3–5 spots of three lives each, every pair joinable', () => {
    const s = createSproutsState(4);
    expect(s.spots.map((x) => x.lives)).toEqual([3, 3, 3, 3]);
    const pairs = joinable(s);
    // 6 pairs and 4 loops, all through the one region.
    expect(pairs).toHaveLength(10);
  });

  it('a curve adds a spot with one life and uses a life at each end (two for a loop)', () => {
    const s = createSproutsState(3);
    const curve = route(s, 0, 1, joinable(s)[0]![2])!;
    const after = applySproutsAction(s, curve.join('.'));
    expect(after.spots).toHaveLength(4);
    expect(after.spots[0]!.lives).toBe(2);
    expect(after.spots[1]!.lives).toBe(2);
    expect(after.spots[3]!.lives).toBe(1);
    const loopPair = joinable(after).find(([a, b]) => a === 2 && b === 2)!;
    const loop = route(after, 2, 2, loopPair[2])!;
    expect(applySproutsAction(after, loop.join('.')).spots[2]!.lives).toBe(1);
  });

  it('rejects crossings, gaps, passing through spots and crowding other spots', () => {
    const s = createSproutsState(3);
    const g = buildGrid(s);
    const curve = route(s, 0, 1, joinable(s)[0]![2])!;
    const after = applySproutsAction(s, curve.join('.'));
    const g2 = buildGrid(after);
    // Any straight vertical line through the middle of the first curve crosses it.
    const middle = curve[Math.floor(curve.length / 2)]!;
    expect(
      curveProblem(after, g2, [after.spots[2]!.cell, middle, after.spots[0]!.cell]),
    ).not.toBeNull();
    expect(curveProblem(s, g, [s.spots[0]!.cell, s.spots[0]!.cell + 2])).toBe('short');
    expect(curveProblem(s, g, [s.spots[0]!.cell, s.spots[0]!.cell + 1, s.spots[1]!.cell])).toBe(
      'gap',
    );
    const spot1 = s.spots[1]!.cell;
    expect(curveProblem(s, g, [spot1 - 2 * W, spot1 - W, spot1])).toBe('ends');
  });

  it('every random game lasts between 2n and 3n − 1 moves, as in pencil Sprouts', () => {
    for (let seed = 0; seed < 120; seed++) {
      let s = sproutsEnv.reset(seed);
      const rng = new Rng(seed);
      while (!s.result) s = applySproutsAction(s, randomCurve(s, rng)!);
      expect(s.history.length).toBeGreaterThanOrEqual(2 * s.spotCount);
      expect(s.history.length).toBeLessThanOrEqual(3 * s.spotCount - 1);
    }
  });

  it('every joinable pair can actually be routed, and routes are legal', () => {
    const rng = new Rng(8);
    let s = createSproutsState(5);
    while (!s.result) {
      const g = buildGrid(s);
      const ids = regions(g);
      for (const [a, b, region] of joinable(s, g)) {
        const cells = route(s, a, b, region, rng, g, ids);
        expect(cells).not.toBeNull();
        expect(curveProblem(s, g, cells!)).toBeNull();
      }
      s = applySproutsAction(s, randomCurve(s, rng)!);
    }
  });

  it('validates saves by replay', () => {
    const s = createSproutsState(3, 1);
    const after = applySproutsAction(s, sproutsEnv.getLegalActions(s)[0]!);
    expect(isValidSproutsState(JSON.parse(JSON.stringify(after)))).toBe(true);
    expect(isValidSproutsState({ ...after, spotCount: 9 })).toBe(false);
    expect(isValidSproutsState({ ...after, spots: after.spots.slice(0, 3) })).toBe(false);
  });
});

describe('Sprouts integration', () => {
  it('Easy beats Random (seeded)', () => {
    const easy = evaluateAgents(sproutsEnv, preset('easy'), preset('random'), {
      games: 8,
      seed: 9,
      maxSteps: 20,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = SPROUTS.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = {
      ...m,
      round: applySproutsAction(m.round, sproutsEnv.getLegalActions(m.round)[0]!),
    };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const spots = played.round.spots.map((x) => ({ ...x, lives: 3 }));
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, spots } })).ok).toBe(
      false,
    );
  });
});
