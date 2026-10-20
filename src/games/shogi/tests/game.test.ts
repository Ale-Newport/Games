import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { shogiActionCodec } from '../../shared/shogi/environment';
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
import { shogiEnv } from '../ai-adapter';
import { SHOGI_GAME } from '../Game';
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
const best = (s: ShogiState, depth: number) =>
  new ShogiSearchAgent(VARIANT, { id: 't', label: 't', maxDepth: depth }).selectAction(
    shogiEnv,
    s,
    s.toMove,
    { rng: new Rng(1) },
  );

describeAdapterContract(shogiEnv, {
  configs: [undefined],
  playouts: 4,
  maxSteps: 600,
  illegalActions: (s) =>
    ['7g7e', 'P*5e', 'K*5e', '5i5a', '0a0b', ''].filter(
      (a) => !legalActions(VARIANT, s).includes(a),
    ),
});

describe('Shogi integration', () => {
  it('encodes board moves, promotions and drops to unique indices', () => {
    const codec = shogiActionCodec(VARIANT);
    const rng = new Rng(4);
    let s = createShogiState(VARIANT);
    const seen = new Map<number, string>();
    for (let i = 0; i < 120 && !s.result; i++) {
      for (const a of legalActions(VARIANT, s)) {
        const code = codec.encode(a);
        expect(seen.get(code) ?? a).toBe(a);
        seen.set(code, a);
        expect(codec.decode(code)).toBe(a);
      }
      s = applyShogiAction(VARIANT, s, rng.pick(legalActions(VARIANT, s)));
    }
    expect([...seen.values()].some((a) => a.includes('*'))).toBe(true);
    expect(shogiEnv.info.actionSpaceSize).toBe(81 * 81 * 2 + 15 * 81);
  });

  it('finds an immediate win by a drop and wins free material', () => {
    // Gote king 1a; a gold drop on 1b (guarded by the gold on 1c) mates.
    const mate = at('8k/9/8G/9/9/9/9/9/K8', 0, 'G');
    // G*1b mates; G*3a also wins at once (the king has no legal move, which loses in shogi).
    expect(applyShogiAction(VARIANT, mate, best(mate, 2)).result).toMatchObject({
      kind: 'win',
      winner: 0,
    });
    // An undefended gote rook in front of the sente rook.
    expect(best(at('4k4/9/9/9/4r4/9/9/4R4/4K4'), 3)).toBe('5h5e');
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(shogiEnv, preset('easy'), preset('random'), {
      games: 2,
      seed: 3,
      maxSteps: 600,
    }).agents[0];
    expect(easy.wins).toBe(2);
    const medium = evaluateAgents(shogiEnv, preset('medium'), preset('easy'), {
      games: 2,
      seed: 3,
      maxSteps: 600,
    }).agents[0];
    expect(medium.wins).toBe(2);
  }, 120_000);

  it('detects a mating drop and a dragon promotion for achievements', () => {
    const mate = applyShogiAction(VARIANT, at('8k/9/8G/9/9/9/9/9/K8', 0, 'G'), 'G*1b');
    expect(feats(mate, 0)).toEqual({ moves: 1, dragon: false, dropMate: true });
    const dragon = applyShogiAction(VARIANT, at('4k4/9/9/9/9/9/9/1R7/4K4'), '8h8c+');
    expect(feats(dragon, 0).dragon).toBe(true);
  });

  it('round-trips saves and rejects tampered games', () => {
    const cfg = SHOGI_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyShogiAction(VARIANT, m.round, '7g7f') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const forged = {
      ...played.round,
      hands: [[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], played.round.hands[1]],
    };
    expect(unwrap(spec, wrap(spec, { ...played, round: forged })).ok).toBe(false);
  });
});
