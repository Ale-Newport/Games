import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import {
  PASS,
  applyJanggiAction,
  createJanggiState,
  janggiLegalActions,
  janggiPlacement,
} from '../../shared/xiangqi/janggi';
import { janggiCodec } from '../../shared/xiangqi/janggi-environment';
import { JanggiSearchAgent } from '../../shared/xiangqi/janggi-search';
import { defaultSetup, matchSaveSpec, newMatch, restartRound } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { janggiEnv } from '../ai-adapter';
import { JANGGI } from '../Game';
import { setupsOf } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(janggiEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 400,
  illegalActions: (s) =>
    ['e1e3', 'b2b5', 'a0a5', 'j0j1', ''].filter((a) => !janggiLegalActions(s).includes(a)),
});

describe('Janggi integration', () => {
  it('encodes moves and the pass to unique indices', () => {
    const rng = new Rng(3);
    let s = createJanggiState();
    const seen = new Map<number, string>();
    for (let i = 0; i < 80 && !s.result; i++) {
      for (const a of janggiLegalActions(s)) {
        const code = janggiCodec.encode(a);
        expect(seen.get(code) ?? a).toBe(a);
        seen.set(code, a);
        expect(janggiCodec.decode(code)).toBe(a);
      }
      s = applyJanggiAction(s, rng.pick(janggiLegalActions(s).filter((a) => a !== PASS)));
    }
    expect(janggiEnv.info.actionSpaceSize).toBe(8101);
  });

  it('reads both setups (Han mirrored) and keeps them on restart', () => {
    expect(setupsOf(createJanggiState(janggiPlacement('HEEH', 'EHHE')))).toEqual(['HEEH', 'EHHE']);
    expect(setupsOf(createJanggiState(janggiPlacement('EHEH', 'HEHE')))).toEqual(['EHEH', 'HEHE']);
    const cfg = JANGGI.match;
    const m = newMatch(cfg, defaultSetup(cfg));
    const moved = { ...m, round: applyJanggiAction(m.round, PASS) };
    expect(restartRound(cfg, moved).round.startPlacement).toBe(m.round.startPlacement);
  });

  it('finds the double-chariot mate and takes a free chariot', () => {
    const agent = new JanggiSearchAgent({ id: 't', label: 't', maxDepth: 2 });
    const mate = createJanggiState('4k4/R8/9/9/9/9/9/9/3K5/1R7');
    expect(agent.selectAction(janggiEnv, mate, 0, { rng: new Rng(1) })).toBe('b0b9');
    const free = createJanggiState('4k4/9/9/9/4r4/9/9/9/3K5/4R4');
    expect(
      new JanggiSearchAgent({ id: 't', label: 't', maxDepth: 3 }).selectAction(janggiEnv, free, 0, {
        rng: new Rng(1),
      }),
    ).toBe('e0e5');
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(janggiEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(janggiEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects unknown setups', () => {
    const cfg = JANGGI.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyJanggiAction(m.round, janggiLegalActions(m.round)[0]!) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const odd = createJanggiState('4k4/R8/9/9/9/9/9/9/3K5/1R7');
    expect(unwrap(spec, wrap(spec, { ...m, round: odd })).ok).toBe(false);
  });
});
