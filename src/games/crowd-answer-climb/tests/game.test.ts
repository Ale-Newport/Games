import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { applyAction, newRun, playerScore, sheetById } from '../../shared/survey/engine';
import { firstThoughtMove, knowledgeMove } from '../../shared/survey/environment';
import { env } from '../ai-adapter';
import { climbAchievements } from '../Game';

describe('Crowd Answer Climb', () => {
  it('reaches orbit with seven crowd favourites and unlocks every altitude achievement', () => {
    let s = newRun({ polarity: 'common', lang: 'es', kind: 'party', seed: 4, players: 2 });
    while (s.status === 'playing') {
      const entries = sheetById(s.prompts[s.prompt]!).entries;
      s = applyAction(s, `e:${entries.findIndex((e) => e.band === 'a')}`);
    }
    expect(playerScore(s, 1)).toBe(700);
    const got: string[] = [];
    climbAchievements(s, (id) => got.push(id), 0);
    expect(got).toEqual(
      expect.arrayContaining(['first-climb', 'party', 'karman', 'station', 'orbit', 'hive-mind']),
    );
  });

  it('pays a first-thought player best when the crowd is rewarded', () => {
    let first = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let s = newRun({ polarity: 'common', lang: 'en', kind: 'unlimited', seed });
      const rng = new Rng(seed);
      while (s.status === 'playing') s = applyAction(s, firstThoughtMove(s, rng));
      first += playerScore(s, 0);
    }
    expect(first / 20).toBeGreaterThan(550);
    const s = newRun({ polarity: 'common', lang: 'en', kind: 'unlimited', seed: 3 });
    expect(knowledgeMove(s, new Rng(1), 'buff')).toMatch(/^e:\d+$/);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { lang: 'es' }, { lang: 'es', day: 20261118 }],
  playouts: 4,
  maxSteps: 10,
  illegalActions: () => ['e:-1', 'e:9999', 'pass' as never],
});
