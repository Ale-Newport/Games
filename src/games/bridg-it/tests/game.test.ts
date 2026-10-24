import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS, evaluateGale, resistance } from '../ai';
import { galeEnv } from '../ai-adapter';
import {
  S,
  SLOTS,
  applyGaleAction,
  bridgeEnds,
  connected,
  createGaleState,
  isValidGaleState,
  legalGaleActions,
  replayGale,
} from '../engine';
import { GALE_GAME } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const at = (r: number, c: number) => r * S + c;

describe('Gale engine', () => {
  it('has 41 slots, each taking one bridge of either color', () => {
    expect(SLOTS).toHaveLength(41);
    expect(legalGaleActions(createGaleState())).toHaveLength(41);
    // Through an odd-odd point Orange runs down and Teal across; through even-even the reverse.
    expect(bridgeEnds(0, at(1, 1))).toEqual([at(0, 1), at(2, 1)]);
    expect(bridgeEnds(1, at(1, 1))).toEqual([at(1, 0), at(1, 2)]);
    expect(bridgeEnds(0, at(2, 2))).toEqual([at(2, 1), at(2, 3)]);
    expect(bridgeEnds(1, at(2, 2))).toEqual([at(1, 2), at(3, 2)]);
  });

  it('wins on connecting top to bottom, and a taken slot blocks the other color', () => {
    const moves = [
      at(1, 1),
      at(1, 9),
      at(3, 1),
      at(3, 9),
      at(5, 1),
      at(5, 9),
      at(7, 1),
      at(7, 9),
      at(9, 1),
    ].map(String);
    const s = replayGale(moves);
    expect(s.result).toEqual({ winner: 0, reason: 'connected' });
    expect(connected(s.bridges, 1)).toBe(false);
    const early = replayGale(moves.slice(0, 2));
    expect(legalGaleActions(early)).not.toContain(String(at(1, 1)));
    expect(() => applyGaleAction(early, String(at(1, 9)))).toThrow();
    expect(() => applyGaleAction(early, String(at(0, 0)))).toThrow();
  });

  it('lets Teal win left to right when opening', () => {
    const moves: string[] = [];
    for (let c = 1; c <= 9; c += 2) moves.push(String(at(1, c)), String(at(9, c)));
    const s = replayGale(moves.slice(0, 9), 1);
    expect(s.result).toEqual({ winner: 1, reason: 'connected' });
  });

  it('validates by replay from the opener', () => {
    const s = replayGale([String(at(5, 5)), String(at(4, 4))], 1);
    expect(isValidGaleState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidGaleState({ ...s, first: 0 })).toBe(false);
  });
});

describe('Gale evaluation', () => {
  it('measures equal resistance at the start and rewards a bridge', () => {
    const s = createGaleState();
    expect(resistance(s.bridges, 0)).toBeCloseTo(resistance(s.bridges, 1));
    expect(evaluateGale(s, 0)).toBeCloseTo(0);
    const after = applyGaleAction(s, String(at(5, 5)));
    expect(resistance(after.bridges, 0)).toBeLessThan(resistance(s.bridges, 0));
    expect(evaluateGale(after, 0)).toBeGreaterThan(0);
  });
});

describeAdapterContract(galeEnv, {
  configs: [undefined],
  playouts: 8,
  maxSteps: 60,
  illegalActions: (s) => ['0', '999', 'x', ''].filter((a) => !legalGaleActions(s).includes(a)),
});

describe('Gale integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(galeEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 60,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(galeEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 60,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('alternates the opener and saves round-trip', () => {
    const cfg = GALE_GAME.match;
    expect(cfg.fixedFirstSeat).toBeUndefined();
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyGaleAction(m.round, legalGaleActions(m.round)[3]!) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tampered = { ...played.round, bridges: played.round.bridges.map(() => 0) };
    expect(unwrap(spec, wrap(spec, { ...played, round: tampered })).ok).toBe(false);
  });
});
