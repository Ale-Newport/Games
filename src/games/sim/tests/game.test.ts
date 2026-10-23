import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { simCodec, simEnv } from '../ai-adapter';
import {
  LINES,
  TRIANGLES,
  applySimAction,
  createSimState,
  isValidSimState,
  legalSimActions,
  triangleIn,
} from '../engine';
import { SIM } from '../Game';
import { simWins } from '../solver';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[], first: 0 | 1 = 0) =>
  moves.reduce((s, a) => applySimAction(s, a), createSimState(first));

describeAdapterContract(simEnv, {
  configs: [undefined],
  playouts: 30,
  maxSteps: 15,
  illegalActions: (s) =>
    ['0-0', '3-1', '0-6', 'x', ''].filter((a) => !legalSimActions(s).includes(a)),
});

describe('Sim rules', () => {
  it('has 15 lines and 20 triangles', () => {
    expect(LINES).toHaveLength(15);
    expect(TRIANGLES).toHaveLength(20);
  });

  it('closing a triangle of your own color loses', () => {
    // Red: 0-1, 1-2, then 0-2 closes ABC; Blue plays elsewhere.
    const s = play(['0-1', '3-4', '1-2', '3-5', '0-2']);
    expect(s.result).toEqual({ winner: 1, triangle: [0, 1, 2] });
    // Mixed colors do not count.
    expect(play(['0-1', '1-2', '0-2']).result).toBeNull();
  });

  it('every complete coloring has a one-colored triangle (Ramsey R(3,3) = 6)', () => {
    const rng = new Rng(2);
    for (let i = 0; i < 200; i++) {
      let red = 0;
      let blue = 0;
      for (let e = 0; e < 15; e++) {
        if (rng.chance(0.5)) red |= 1 << e;
        else blue |= 1 << e;
      }
      expect(triangleIn(red) !== null || triangleIn(blue) !== null).toBe(true);
    }
  });

  it('validates by replay and encodes lines uniquely', () => {
    const s = play(['0-3', '2-5'], 1);
    expect(isValidSimState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidSimState({ ...s, lines: s.lines.map(() => 0) })).toBe(false);
    for (const a of ['0-1', '4-5', '2-3']) expect(simCodec.decode(simCodec.encode(a))).toBe(a);
  });
});

describe('Sim solver', () => {
  it('the second player wins with perfect play (known result)', () => {
    expect(simWins(0, 0)).toBe(false);
  });

  it('Hard never loses when it moves second', () => {
    const hard = preset('hard');
    const random = preset('random');
    for (let seed = 0; seed < 10; seed++) {
      let s = createSimState(0);
      const rng = new Rng(seed);
      while (!s.result) {
        const agent = s.toMove === 1 ? hard : random;
        s = simEnv.applyAction(s, agent.selectAction(simEnv, s, s.toMove, { rng }));
      }
      expect(s.result.winner).toBe(1);
    }
  });
});

describe('Sim integration', () => {
  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(simEnv, preset('easy'), preset('random'), {
      games: 40,
      seed: 21,
      maxSteps: 15,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(simEnv, preset('medium'), preset('easy'), {
      games: 40,
      seed: 21,
      maxSteps: 15,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  });

  it('round-trips saves and rejects tampered games', () => {
    const cfg = SIM.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applySimAction(m.round, '0-3') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const lines = played.round.lines.map(() => 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, lines } })).ok).toBe(
      false,
    );
  });
});
