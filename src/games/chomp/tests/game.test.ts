import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { chompCodec, chompEnv } from '../ai-adapter';
import {
  SIZES,
  applyChompAction,
  bite,
  createChompState,
  isValidChompState,
  legalChompActions,
} from '../engine';
import { CHOMP } from '../Game';
import { chompWins, winningBites } from '../solver';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const rect = (r: number, c: number) => new Array<number>(r).fill(c);

describeAdapterContract(chompEnv, {
  configs: [undefined],
  playouts: 25,
  maxSteps: 60,
  illegalActions: (s) =>
    ['0,0', '9,9', '-1,2', '1', ''].filter((a) => !legalChompActions(s).includes(a)),
});

describe('Chomp rules', () => {
  it('a bite removes the square and everything below and to its right', () => {
    expect(bite(rect(4, 5), 2, 3)).toEqual([5, 5, 3, 3]);
    expect(bite([5, 4, 2], 0, 1)).toEqual([1, 1, 1]);
    const s = createChompState([4, 5]);
    expect(legalChompActions(s)).toHaveLength(19); // every square but the poison
    expect(legalChompActions(s)).not.toContain('0,0');
  });

  it('leaving only the poison wins', () => {
    let s = createChompState([4, 5], 1);
    s = applyChompAction(s, '1,0'); // seat 1: only the top row is left
    expect(s.rows).toEqual([5, 0, 0, 0]);
    s = applyChompAction(s, '0,1'); // seat 0 leaves the poison alone
    expect(s.result).toEqual({ winner: 0 });
  });

  it('validates by replay and only accepts the offered sizes', () => {
    const s = applyChompAction(createChompState([5, 6]), '3,2');
    expect(isValidChompState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidChompState({ ...s, rows: [6, 6, 6, 6, 6] })).toBe(false);
    expect(isValidChompState({ ...createChompState([3, 3]) })).toBe(false);
  });

  it('encodes every square to a unique index', () => {
    for (const a of ['0,1', '5,7', '3,0']) expect(chompCodec.decode(chompCodec.encode(a))).toBe(a);
  });
});

describe('Chomp solver (checked against the known theory)', () => {
  it('the first player wins every rectangle larger than 1 × 1 (strategy stealing)', () => {
    for (let r = 1; r <= 6; r++)
      for (let c = 1; c <= 8; c++) if (r * c > 1) expect(chompWins(rect(r, c))).toBe(true);
    for (const [r, c] of SIZES) expect(chompWins(rect(r, c))).toBe(true);
  });

  it('square bars: biting at (1, 1) to leave an L wins', () => {
    for (let n = 2; n <= 6; n++) expect(winningBites(rect(n, n))).toContain('1,1');
  });

  it('two rows: leaving a top row one longer than the bottom row wins', () => {
    for (let n = 2; n <= 8; n++) expect(winningBites(rect(2, n))).toEqual([`1,${n - 1}`]);
    // A symmetric L is lost for the player to move.
    expect(chompWins([4, 1, 1, 1])).toBe(false);
  });
});

describe('Chomp integration', () => {
  it('Hard never loses when it moves first', () => {
    const hard = preset('hard');
    const random = preset('random');
    for (let seed = 0; seed < 12; seed++) {
      let s = chompEnv.reset(seed);
      const rng = new Rng(seed);
      while (!s.result) {
        const agent = s.toMove === 0 ? hard : random;
        s = chompEnv.applyAction(s, agent.selectAction(chompEnv, s, s.toMove, { rng }));
      }
      expect(s.result.winner).toBe(0);
    }
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(chompEnv, preset('easy'), preset('random'), {
      games: 40,
      seed: 21,
      maxSteps: 60,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(chompEnv, preset('medium'), preset('easy'), {
      games: 40,
      seed: 21,
      maxSteps: 60,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  });

  it('round-trips saves and rejects tampered games', () => {
    const cfg = CHOMP.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyChompAction(m.round, '1,1') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const rows = played.round.rows.map(() => 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, rows } })).ok).toBe(
      false,
    );
  });
});
