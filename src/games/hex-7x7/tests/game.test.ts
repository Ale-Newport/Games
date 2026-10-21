import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { SWAP, applyHexAction, legalHexActions } from '../../shared/hex/engine';
import { HexMctsAgent } from '../../shared/hex/mcts';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { hex7Env } from '../ai-adapter';
import { HEX_7 } from '../Game';
import { SIZE, feats } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const env = hex7Env;
const at = (r: number, c: number) => r * SIZE + c;

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 49 + 2,
  illegalActions: (s) =>
    [-5, 49 + 1, 0.5, ...s.board.flatMap((v, i) => (v ? [i] : [])).slice(0, 3)].filter(
      (a) => !legalHexActions(s).includes(a),
    ),
});

describe('Hex 7×7 integration', () => {
  it('encodes cells and the swap', () => {
    expect(env.info.actionSpaceSize).toBe(49 + 1);
    expect(env.encodeAction!(SWAP)).toBe(49);
    expect(env.decodeAction!(49, env.reset(0))).toBe(SWAP);
  });

  it('completes a winning connection when one move away', () => {
    // Red holds the whole middle column but one cell: the engine plays it.
    let s = env.reset(0);
    const col = Math.floor(SIZE / 2);
    for (let r = 0; r < SIZE - 1; r++) {
      s = applyHexAction(s, at(r, col));
      s = applyHexAction(s, at(r, r === 0 ? 0 : col === 0 ? 1 : 0));
    }
    const agent = new HexMctsAgent({ id: 't', label: 't', playouts: 2000 });
    // Either bottom neighbor of the column's last stone completes the chain.
    const move = agent.selectAction(env, s, 0, { rng: new Rng(1) });
    expect([at(SIZE - 1, col - 1), at(SIZE - 1, col)]).toContain(move);
    expect(applyHexAction(s, move).result?.winner).toBe(0);
  });

  it('swaps a strong central first stone', () => {
    const s = applyHexAction(env.reset(0), at(Math.floor(SIZE / 2), Math.floor(SIZE / 2)));
    const agent = new HexMctsAgent({ id: 't', label: 't', playouts: 6000 });
    expect(agent.selectAction(env, s, 1, { rng: new Rng(2) })).toBe(SWAP);
    expect(feats(applyHexAction(s, SWAP), 1).swapped).toBe(true);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(env, preset('easy'), preset('random'), {
      games: 4,
      seed: 3,
      maxSteps: 49 + 2,
    }).agents[0];
    expect(easy.wins).toBe(4);
    const medium = evaluateAgents(env, preset('medium'), preset('easy'), {
      games: 4,
      seed: 3,
      maxSteps: 49 + 2,
    }).agents[0];
    expect(medium.wins).toBeGreaterThanOrEqual(3);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = HEX_7.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyHexAction(m.round, at(1, 1)) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, toMove: 0 as const } })).ok,
    ).toBe(false);
  });
});
