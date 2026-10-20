import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import {
  applyShogiAction,
  createShogiState,
  legalActions,
  type ShogiState,
} from '../../shared/shogi/game';
import { parsePlacement } from '../../shared/shogi/position';
import { ShogiSearchAgent } from '../../shared/shogi/search';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { animalEnv } from '../ai-adapter';
import { ANIMAL_SHOGI } from '../Game';
import { VARIANT, feats } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
function at(placement: string, side: 0 | 1 = 0, hands = '-'): ShogiState {
  const pos = parsePlacement(VARIANT, placement, side, hands);
  return {
    board: Array.from(pos.board),
    hands: [Array.from(pos.hands[0]), Array.from(pos.hands[1])],
    toMove: side,
    history: [],
    notation: [],
    keys: [pos.key()],
    checks: [],
    result: null,
  };
}

describeAdapterContract(animalEnv, {
  configs: [undefined],
  playouts: 40,
  maxSteps: 400,
  illegalActions: (s) =>
    ['2d2a', 'L*2b', 'G*1a', '4a4b', ''].filter((a) => !legalActions(VARIANT, s).includes(a)),
});

describe('Animal shogi integration', () => {
  it('uses a 3×4 board, so the action space and tensor are small', () => {
    expect(animalEnv.info.actionSpaceSize).toBe(12 * 12 * 2 + 6 * 12);
    expect(animalEnv.info.observationShape).toEqual([20, 4, 3]);
    expect(createShogiState(VARIANT).notation).toEqual([]);
  });

  it('the engine captures a hanging lion and avoids leaving its own lion en prise', () => {
    const agent = () => new ShogiSearchAgent(VARIANT, { id: 't', label: 't', maxDepth: 3 });
    const capture = at('1l1/1G1/3/2L');
    expect(agent().selectAction(animalEnv, capture, 0, { rng: new Rng(1) })).toBe('2b2a');
    // Sente lion on 1c is attacked by the gote giraffe on 1b: the lion must step away or the
    // giraffe must be taken (lion takes 1b is safe here).
    const danger = at('l2/2g/2L/3');
    const move = agent().selectAction(animalEnv, danger, 0, { rng: new Rng(1) });
    const after = applyShogiAction(VARIANT, danger, move);
    expect(
      legalActions(VARIANT, after).some(
        (a) => applyShogiAction(VARIANT, after, a).result?.kind === 'win',
      ),
    ).toBe(false);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(animalEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 7,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(animalEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 7,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('detects a hen promotion for achievements', () => {
    const s = applyShogiAction(VARIANT, at('2l/C2/3/2L'), '3b3a+');
    expect(s.notation).toEqual(['C-3a+']);
    expect(feats(s, 0)).toEqual({ moves: 1, hen: true });
  });

  it('round-trips saves', () => {
    const cfg = ANIMAL_SHOGI.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyShogiAction(VARIANT, m.round, '2c2b') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, toMove: 0 } })).ok).toBe(
      false,
    );
  });
});
