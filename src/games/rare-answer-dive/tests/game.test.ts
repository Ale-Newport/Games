import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { applyAction, newRun, playerScore, sheetById } from '../../shared/survey/engine';
import { knowledgeMove } from '../../shared/survey/environment';
import { env } from '../ai-adapter';
import { diveAchievements } from '../Game';

describe('Rare Answer Dive', () => {
  it('unlocks depth, pearl and clean-dive achievements from a finished run', () => {
    let s = newRun({ polarity: 'rare', lang: 'en', kind: 'unlimited', seed: 11 });
    while (s.status === 'playing') {
      const entries = sheetById(s.prompts[s.prompt]!).entries;
      s = applyAction(s, `e:${entries.findIndex((e) => e.band === 'f')}`);
    }
    expect(playerScore(s, 0)).toBe(700);
    const got: string[] = [];
    diveAchievements(s, (id) => got.push(id), 0);
    expect(got).toEqual(
      expect.arrayContaining(['first-dive', 'pearl', 'titanic', 'hadal', 'no-bait']),
    );
    expect(got).not.toContain('party');
  });

  it('rewards a trivia buff more than a first-thought player on average', () => {
    const run = (move: (s: ReturnType<typeof newRun>, r: Rng) => string, seed: number) => {
      let s = newRun({ polarity: 'rare', lang: 'en', kind: 'unlimited', seed });
      const rng = new Rng(seed);
      while (s.status === 'playing') s = applyAction(s, move(s, rng) as never);
      return playerScore(s, 0);
    };
    let buff = 0;
    let casual = 0;
    for (let seed = 1; seed <= 30; seed++) {
      buff += run((s, r) => knowledgeMove(s, r, 'buff'), seed);
      casual += run((s, r) => knowledgeMove(s, r, 'casual'), seed);
    }
    expect(buff).toBeGreaterThan(casual);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { lang: 'es' }, { lang: 'en', day: 20261117 }],
  playouts: 4,
  maxSteps: 10,
  illegalActions: () => ['e:-1', 'e:9999', 'pass' as never],
});
