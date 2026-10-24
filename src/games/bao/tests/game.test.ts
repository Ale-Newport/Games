import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { baoCodec, baoEnv } from '../ai-adapter';
import { BAO_GAME } from '../Game';
import {
  applyBaoAction,
  createBaoState,
  isValidBaoState,
  legalBaoActions,
  mustCapture,
  playTurn,
  replayBao,
  type BaoState,
} from '../engine';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const empty = () => new Array<number>(32).fill(0);
const at = (pits: number[], toMove: 0 | 1 = 0): BaoState => ({
  pits,
  toMove,
  history: [],
  result: null,
});
const south = (s: BaoState) => s.pits.slice(0, 16).join(',');
const north = (s: BaoState) => s.pits.slice(16).join(',');

describe('Bao engine', () => {
  it('starts with two seeds everywhere and only capturing moves legal', () => {
    const s = createBaoState();
    expect(s.pits.every((x) => x === 2)).toBe(true);
    expect(mustCapture(s)).toBe(true);
    const legal = legalBaoActions(s);
    expect(legal).toHaveLength(16);
    expect(
      legal.every(
        (a) => playTurn(s.pits, 0, Number(a.slice(0, -1)), a.endsWith('+') ? 1 : -1).firstCaptures,
      ),
    ).toBe(true);
  });

  it('captures across, sows the catch from the left end, then relays', () => {
    const p = empty();
    p[1] = 2;
    p[3] = 1;
    p[20] = 3; // facing South's front pit 3
    p[22] = 1;
    p[26] = 2;
    const s = at(p);
    expect(legalBaoActions(s)).toEqual(['1+']); // the capture is compulsory
    const after = applyBaoAction(s, '1+');
    expect(south(after)).toBe('1,1,0,3,1,0,0,0,0,0,0,0,0,0,0,0');
    expect(north(after)).toBe('0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0');
    expect(after.result).toBeNull();
    expect(after.toMove).toBe(1);
  });

  it('sows a right-half catch from the right end toward the center', () => {
    const p = empty();
    p[4] = 2;
    p[6] = 1;
    p[17] = 2; // facing South's front pit 6
    p[23] = 1;
    p[26] = 2;
    const after = applyBaoAction(at(p), '4+');
    expect(south(after)).toBe('0,0,0,1,1,2,0,1,0,0,0,0,0,0,0,0');
    expect(north(after)).toBe('0,0,0,0,0,0,0,1,0,0,2,0,0,0,0,0');
  });

  it('relays from occupied pits until a sowing ends in an empty one', () => {
    const p = empty();
    p[10] = 2;
    p[12] = 3;
    p[16] = 1;
    p[26] = 2;
    expect(playTurn(p, 0, 10, 1).pits.slice(0, 16).join(',')).toBe(
      '1,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1',
    );
  });

  it('ends when the front row is emptied or no pit holds two seeds', () => {
    const p = empty();
    p[1] = 2;
    p[3] = 1;
    p[20] = 3;
    p[26] = 2;
    expect(applyBaoAction(at(p), '1+').result).toEqual({ winner: 0, reason: 'front' });
    const q = empty();
    q[12] = 2;
    q[16] = 1;
    q[18] = 1;
    expect(applyBaoAction(at(q), '12+').result).toEqual({ winner: 0, reason: 'stuck' });
    expect(() => applyBaoAction(at(q), '3+')).toThrow();
  });

  it('keeps 64 seeds in play and validates by replay', () => {
    let s = createBaoState();
    for (let i = 0; i < 30 && !s.result; i++)
      s = applyBaoAction(s, legalBaoActions(s)[i % legalBaoActions(s).length]!);
    expect(s.pits.reduce((a, b) => a + b, 0)).toBe(64);
    expect(replayBao(s.history)).toEqual(s);
    expect(isValidBaoState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidBaoState({ ...s, pits: s.pits.map((x, i) => (i === 0 ? x + 1 : x)) })).toBe(
      false,
    );
  });

  it('encodes every action to a unique index', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 16; i++)
      for (const d of ['+', '-']) {
        const n = baoCodec.encode(`${i}${d}`);
        expect(baoCodec.decode(n)).toBe(`${i}${d}`);
        seen.add(n);
      }
    expect(seen.size).toBe(baoCodec.size);
  });
});

describeAdapterContract(baoEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 400,
  illegalActions: (s) => ['16+', '-1-', 'x', ''].filter((a) => !legalBaoActions(s).includes(a)),
});

describe('Bao integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(baoEnv, preset('easy'), preset('random'), {
      games: 10,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(baoEnv, preset('medium'), preset('easy'), {
      games: 10,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('South moves first and saves round-trip', () => {
    const cfg = BAO_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyBaoAction(m.round, '1+') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tampered = { ...played.round, pits: played.round.pits.map(() => 2) };
    expect(unwrap(spec, wrap(spec, { ...played, round: tampered })).ok).toBe(false);
  });
});
