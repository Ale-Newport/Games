import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { kaylesCodec, kaylesEnv } from '../ai-adapter';
import {
  applyKaylesAction,
  createKaylesState,
  groups,
  isValidKaylesState,
  legalKaylesActions,
  type KaylesState,
} from '../engine';
import { KAYLES } from '../Game';
import { GRUNDY, kaylesValue } from '../solver';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(kaylesEnv, {
  configs: [undefined],
  playouts: 25,
  maxSteps: 40,
  illegalActions: (s) =>
    ['20', '-1', '0-2', '3-2', ''].filter((a) => !legalKaylesActions(s).includes(a)),
});

describe('Kayles rules', () => {
  it('knocks one pin or two neighbors, and gaps split the row', () => {
    const s = createKaylesState(10);
    expect(legalKaylesActions(s)).toHaveLength(19); // 10 singles + 9 pairs
    const split = applyKaylesAction(applyKaylesAction(s, '3-4'), '8');
    expect(groups(split.pins)).toEqual([3, 3, 1]);
    expect(legalKaylesActions(split)).not.toContain('2-3');
    expect(legalKaylesActions(split)).not.toContain('7-8');
  });

  it('whoever knocks down the last pin wins', () => {
    let s: KaylesState = { ...createKaylesState(10, 1), pins: new Array(10).fill(false) };
    s = { ...s, pins: s.pins.map((_, i) => i === 4 || i === 5) };
    expect(applyKaylesAction(s, '4-5').result).toEqual({ winner: 1 });
  });

  it('validates by replay and encodes moves uniquely', () => {
    const s = applyKaylesAction(createKaylesState(12, 1), '5-6');
    expect(isValidKaylesState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidKaylesState({ ...s, pins: s.pins.map(() => true) })).toBe(false);
    expect(isValidKaylesState(createKaylesState(4))).toBe(false);
    for (const a of ['0', '19', '0-1', '18-19'])
      expect(kaylesCodec.decode(kaylesCodec.encode(a))).toBe(a);
  });
});

describe('Kayles solver (checked against the known theory)', () => {
  it('matches the published Grundy values of Kayles', () => {
    expect(GRUNDY.slice(0, 21)).toEqual([
      0, 1, 2, 3, 1, 4, 3, 2, 1, 4, 2, 6, 4, 1, 2, 7, 1, 4, 3, 2, 1,
    ]);
  });

  it('agrees with a brute-force search on every position of up to 10 pins', () => {
    const memo = new Map<string, boolean>();
    const wins = (pins: boolean[]): boolean => {
      const key = pins.map(Number).join('');
      const known = memo.get(key);
      if (known !== undefined) return known;
      let result = false;
      for (let i = 0; i < pins.length && !result; i++) {
        if (!pins[i]) continue;
        const one = pins.slice();
        one[i] = false;
        if (!wins(one)) result = true;
        if (!result && pins[i + 1]) {
          const two = one.slice();
          two[i + 1] = false;
          if (!wins(two)) result = true;
        }
      }
      memo.set(key, result);
      return result;
    };
    for (let mask = 0; mask < 1 << 10; mask++) {
      const pins = Array.from({ length: 10 }, (_, i) => Boolean(mask & (1 << i)));
      expect(wins(pins)).toBe(kaylesValue(pins) !== 0);
    }
  });
});

describe('Kayles integration', () => {
  it('Hard never loses when it moves first (every full row is a first-player win)', () => {
    const hard = preset('hard');
    const random = preset('random');
    for (let seed = 0; seed < 12; seed++) {
      let s = kaylesEnv.reset(seed);
      const rng = new Rng(seed);
      while (!s.result) {
        const agent = s.toMove === 0 ? hard : random;
        s = kaylesEnv.applyAction(s, agent.selectAction(kaylesEnv, s, s.toMove, { rng }));
      }
      expect(s.result.winner).toBe(0);
    }
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(kaylesEnv, preset('easy'), preset('random'), {
      games: 40,
      seed: 21,
      maxSteps: 40,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(kaylesEnv, preset('medium'), preset('easy'), {
      games: 40,
      seed: 21,
      maxSteps: 40,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  });

  it('round-trips saves and rejects tampered games', () => {
    const cfg = KAYLES.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyKaylesAction(m.round, '0-1') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const pins = played.round.pins.map(() => true);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, pins } })).ok).toBe(
      false,
    );
  });
});
