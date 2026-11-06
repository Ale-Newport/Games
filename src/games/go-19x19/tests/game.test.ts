import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { PASS, applyGoAction, legalGoActions } from '../../shared/go/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { go19Env } from '../ai-adapter';
import { GO_19 } from '../Game';
import { RULES, feats } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const env = go19Env;

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: RULES.maxPlies + 2,
  illegalActions: (s) =>
    [-2, 361, 1.5, ...s.board.flatMap((v, i) => (v ? [i] : [])).slice(0, 3)].filter(
      (a) => !legalGoActions(s).includes(a),
    ),
});

describe('Go 19×19 integration', () => {
  it('uses the 19×19 board with komi 7.5 and a pass action', () => {
    expect(env.info.actionSpaceSize).toBe(361 + 1);
    expect(env.encodeAction!(PASS)).toBe(361);
    expect(env.decodeAction!(361, env.reset(0))).toBe(PASS);
    const s = env.reset(0);
    expect(legalGoActions(s)).toHaveLength(361 + 1);
    const ended = applyGoAction(RULES, applyGoAction(RULES, s, PASS), PASS);
    expect(ended.result).toEqual({ kind: 'win', winner: 1, reason: 'score', score: [0, 7.5] });
    expect(feats(ended, 1)).toEqual({ captured: 0, margin: 7.5 });
  });

  it('Easy beats Random (seeded)', () => {
    const easy = evaluateAgents(env, preset('easy'), preset('random'), {
      games: 2,
      seed: 4,
      maxSteps: RULES.maxPlies + 2,
    }).agents[0];
    expect(easy.wins).toBe(2);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = GO_19.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyGoAction(RULES, m.round, 180) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const forged = { ...played, round: { ...played.round, captures: [3, 0] as [number, number] } };
    expect(unwrap(spec, wrap(spec, forged)).ok).toBe(false);
  });
});
