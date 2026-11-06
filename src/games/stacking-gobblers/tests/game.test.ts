import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { gobbleCodec, gobbleEnv } from '../ai-adapter';
import { applyGobbleAction, createGobbleState, legalGobbleActions } from '../engine';
import { NESTING } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) =>
  moves.reduce((s, a) => applyGobbleAction(s, a), createGobbleState());

describeAdapterContract(gobbleEnv, {
  configs: [undefined],
  playouts: 30,
  maxSteps: 200,
  illegalActions: (s) =>
    ['R4>0', '9>1', 'R1>9', ''].filter((a) => !legalGobbleActions(s).includes(a)),
});

describe('Nesting tic-tac-toe rules', () => {
  it('starts with 27 placements and covers only smaller cups', () => {
    expect(legalGobbleActions(createGobbleState())).toHaveLength(27);
    const s = play(['R2>4']);
    const blue = legalGobbleActions(s);
    expect(blue).toContain('R3>4');
    expect(blue).not.toContain('R2>4');
    expect(blue).not.toContain('R1>4');
  });

  it('wins with three visible cups and lets the opponent win when a lift uncovers their line', () => {
    const won = play(['R1>0', 'R1>3', 'R1>1', 'R1>4', 'R2>2']);
    expect(won.result).toEqual({ kind: 'win', winner: 0, line: [0, 1, 2] });
    // Blue's small cup on 5 is covered by Orange's large cup; Blue then shows 3 and 4.
    const hidden = play(['R1>0', 'R1>5', 'R3>5', 'R1>3', 'R2>8', 'R2>4']);
    expect(hidden.result).toBe(null);
    // Lifting the large cup uncovers Blue's line 3-4-5: Blue wins.
    const lifted = applyGobbleAction(hidden, '5>7');
    expect(lifted.result).toEqual({ kind: 'win', winner: 1, line: [3, 4, 5] });
  });

  it('encodes every action to a unique index', () => {
    const seen = new Map<number, string>();
    let s = createGobbleState();
    for (let i = 0; i < 10 && !s.result; i++) {
      for (const a of legalGobbleActions(s)) {
        const code = gobbleCodec.encode(a);
        expect(seen.get(code) ?? a).toBe(a);
        seen.set(code, a);
        expect(gobbleCodec.decode(code)).toBe(a);
      }
      s = applyGobbleAction(s, legalGobbleActions(s)[i]!);
    }
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(gobbleEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 200,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(gobbleEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 200,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = NESTING.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyGobbleAction(m.round, 'R3>4') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const forged = {
      ...played.round,
      reserve: [
        [0, 2, 2, 2],
        [0, 2, 2, 2],
      ] as [number[], number[]],
    };
    expect(unwrap(spec, wrap(spec, { ...played, round: forged })).ok).toBe(false);
  });
});
