import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { xiangqiCodec } from '../../shared/xiangqi/environment';
import {
  applyXiangqiAction,
  createXiangqiState,
  legalActions,
  type XiangqiState,
} from '../../shared/xiangqi/game';
import { XiangqiSearchAgent } from '../../shared/xiangqi/search';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { xiangqiEnv } from '../ai-adapter';
import { XIANGQI } from '../Game';
import { feats } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const best = (s: XiangqiState, depth: number) =>
  new XiangqiSearchAgent({ id: 't', label: 't', maxDepth: depth }).selectAction(
    xiangqiEnv,
    s,
    s.toMove,
    { rng: new Rng(1) },
  );

describeAdapterContract(xiangqiEnv, {
  configs: [undefined],
  playouts: 8,
  maxSteps: 2000,
  illegalActions: (s) =>
    ['e0e2', 'a0a5', 'b0d1', 'j0j1', ''].filter((a) => !legalActions(s).includes(a)),
});

describe('Xiangqi integration', () => {
  it('encodes every move to a unique index and back', () => {
    const rng = new Rng(2);
    let s = createXiangqiState();
    const seen = new Map<number, string>();
    for (let i = 0; i < 120 && !s.result; i++) {
      for (const a of legalActions(s)) {
        const code = xiangqiCodec.encode(a);
        expect(seen.get(code) ?? a).toBe(a);
        seen.set(code, a);
        expect(xiangqiCodec.decode(code)).toBe(a);
      }
      s = applyXiangqiAction(s, rng.pick(legalActions(s)));
    }
    expect(xiangqiEnv.info.actionSpaceSize).toBe(8100);
  });

  it('finds the double-chariot mate and takes a free chariot', () => {
    const mate = createXiangqiState('4k4/R8/9/9/9/9/9/9/9/1R1K5');
    expect(best(mate, 2)).toBe('b0b9');
    const free = createXiangqiState('4k4/9/9/9/4r4/9/9/9/4R4/3K5');
    expect(best(free, 3)).toBe('e1e5');
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(xiangqiEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 5,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(xiangqiEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 5,
      maxSteps: 400,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('credits cannon and horse mates for achievements', () => {
    // Double-cannon mate: the a7 cannon becomes the screen for the e5 cannon; the black
    // chariots on d9/f9 block the general's escapes and cannot interpose on e8.
    const s = applyXiangqiAction(createXiangqiState('3rkr3/9/C8/9/4C4/9/9/9/9/4K4'), 'a7e7');
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'checkmate' });
    expect(feats(s, 0)).toEqual({ cannonMate: true, horseMate: false });
    expect(feats(s, 1)).toEqual({ cannonMate: false, horseMate: false });
  });

  it('round-trips saves and rejects tampered games', () => {
    const cfg = XIANGQI.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyXiangqiAction(m.round, 'h2e2') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, toMove: 0 } })).ok).toBe(
      false,
    );
  });
});
