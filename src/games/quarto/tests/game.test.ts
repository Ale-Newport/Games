import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { quartoCodec, quartoEnv } from '../ai-adapter';
import {
  applyQuartoAction,
  createQuartoState,
  legalQuartoActions,
  winningLine,
  type QuartoState,
} from '../engine';
import { QUARTO } from '../Game';
import { QuartoSearchAgent } from '../search';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) =>
  moves.reduce((s, a) => applyQuartoAction(s, a), createQuartoState());

describeAdapterContract(quartoEnv, {
  configs: [undefined],
  playouts: 30,
  maxSteps: 40,
  illegalActions: (s) =>
    ['give:16', '16:give:0', '3:give:3x', ''].filter((a) => !legalQuartoActions(s).includes(a)),
});

describe('Quarto rules', () => {
  it('wins with four pieces sharing any trait, not without', () => {
    const board = new Array<number>(16).fill(-1);
    // Pieces 1, 3, 5, 7 are all tall (bit 0 set).
    [1, 3, 5, 7].forEach((p, i) => (board[i] = p));
    expect(winningLine(board)).toEqual([0, 1, 2, 3]);
    // Pieces 0, 7, 9, 14 share nothing set and nothing unset (0000, 1110, 1001, 0111).
    [0, 14, 9, 7].forEach((p, i) => (board[i] = p));
    expect(winningLine(board)).toBe(null);
    // All short (bit 0 clear): 0, 2, 4, 6 → a line of "none" also wins.
    [0, 2, 4, 6].forEach((p, i) => (board[i + 4] = p));
    expect(winningLine(board)).toEqual([4, 5, 6, 7]);
  });

  it('alternates giving and placing, and a winning placement ends the game at once', () => {
    let s = play(['give:1']);
    expect(s.inHand).toBe(1);
    expect(s.toMove).toBe(1);
    expect(legalQuartoActions(s)).toHaveLength(16 * 15);
    s = play(['give:1', '0:give:3', '1:give:5', '2:give:7']);
    // Player 1 now holds piece 7 (tall): placing it on cell 3 completes the tall row.
    expect(legalQuartoActions(s)).toContain('3');
    expect(legalQuartoActions(s)).not.toContain('3:give:0');
    const won = applyQuartoAction(s, '3');
    expect(won.result).toEqual({ kind: 'win', winner: 0, line: [0, 1, 2, 3] });
  });

  it('the engine never hands over a winning piece when a safe one exists', () => {
    const s = play(['give:1', '0:give:3', '1:give:5']);
    // Player 2 places 5 and must not give a tall piece (bit 0) while cells 2/3 stay open.
    const agent = new QuartoSearchAgent({ id: 't', label: 't', maxDepth: 1 });
    for (let seed = 0; seed < 5; seed++) {
      const a = agent.selectAction(quartoEnv, s, 1, { rng: new Rng(seed) });
      const next = applyQuartoAction(s, a);
      const opponentWins = legalQuartoActions(next).some(
        (x) => applyQuartoAction(next, x).result?.kind === 'win',
      );
      expect(opponentWins).toBe(false);
    }
  });

  it('encodes every action to a unique index', () => {
    const seen = new Map<number, string>();
    let s: QuartoState = createQuartoState();
    const rng = new Rng(2);
    while (!s.result) {
      for (const a of legalQuartoActions(s)) {
        const code = quartoCodec.encode(a);
        expect(seen.get(code) ?? a).toBe(a);
        seen.set(code, a);
        expect(quartoCodec.decode(code)).toBe(a);
      }
      s = applyQuartoAction(s, rng.pick(legalQuartoActions(s)));
    }
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(quartoEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 4,
      maxSteps: 40,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(quartoEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 4,
      maxSteps: 40,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = QUARTO.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyQuartoAction(m.round, 'give:4') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, inHand: 5 } })).ok).toBe(
      false,
    );
  });
});
