import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch, undo } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { isolationCodec, isolationEnv } from '../ai-adapter';
import {
  NEIGHBORS,
  applyIsolationAction,
  createIsolationState,
  legalIsolationActions,
  moverOfPly,
  type IsolationState,
} from '../engine';
import { ISOLATION } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) =>
  moves.reduce((s, a) => applyIsolationAction(s, a), createIsolationState());

describeAdapterContract(isolationEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 200,
  illegalActions: (s) =>
    ['m45', 'm3', 'x45', 'x3', 'm0', 'x49', ''].filter(
      (a) => !legalIsolationActions(s).includes(a),
    ),
});

describe('Isolation rules', () => {
  it('alternates a king step and a removal, two actions per turn', () => {
    const start = createIsolationState();
    expect(legalIsolationActions(start)).toEqual(['m37', 'm38', 'm39', 'm44', 'm46']);
    const moved = applyIsolationAction(start, 'm38');
    expect(moved.phase).toBe('remove');
    expect(moved.toMove).toBe(0);
    // Every free tile can go, the one just left included, but not the pawns' tiles.
    const removals = legalIsolationActions(moved);
    expect(removals).toHaveLength(47);
    expect(removals).toContain('x45');
    expect(removals).not.toContain('x38');
    expect(removals).not.toContain('x3');
    const removed = applyIsolationAction(moved, 'x10');
    expect(removed.tiles[10]).toBe(0);
    expect(removed.toMove).toBe(1);
    expect(legalIsolationActions(removed)).not.toContain('m10');
    expect([0, 1, 2, 3, 4].map(moverOfPly)).toEqual([0, 0, 1, 1, 0]);
  });

  it('a player who cannot step at the start of the turn loses', () => {
    // Jade on d7 (3): neighbors c7, e7, c6, d6, e6. Gold removes all but one, then the last.
    const tiles = new Array<number>(49).fill(1);
    for (const p of [2, 4, 9, 10]) tiles[p] = 0;
    const s: IsolationState = {
      tiles,
      pawns: [45, 3],
      toMove: 0,
      phase: 'move',
      history: [],
      result: null,
    };
    expect(NEIGHBORS[3]).toEqual([2, 4, 9, 10, 11]);
    const after = applyIsolationAction(applyIsolationAction(s, 'm38'), 'x11');
    expect(after.result).toEqual({ winner: 0 });
    expect(legalIsolationActions(after)).toEqual([]);
  });

  it('encodes moves and removals to unique indices', () => {
    for (const a of ['m0', 'm48', 'x0', 'x48'])
      expect(isolationCodec.decode(isolationCodec.encode(a))).toBe(a);
    expect(isolationCodec.encode('m10')).not.toBe(isolationCodec.encode('x10'));
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(isolationEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 3,
      maxSteps: 200,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(isolationEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 3,
      maxSteps: 200,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('undo against the computer steps back one of the human actions at a time', () => {
    const cfg = ISOLATION.match;
    const m = newMatch(cfg, { ...defaultSetup(cfg, 'Ana'), mode: 'ai', humanSeat: 0 });
    const round = play(['m38', 'x10', 'm11', 'x40']);
    const back = undo(cfg, { ...m, round });
    expect(back.round.history).toEqual(['m38']);
    expect(undo(cfg, back).round.history).toEqual([]);
  });

  it('round-trips saves and rejects tampered games', () => {
    const cfg = ISOLATION.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: play(['m38', 'x10']) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tiles = played.round.tiles.slice();
    tiles[20] = 0;
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, tiles } })).ok).toBe(
      false,
    );
  });
});
