import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { ALL, applyBomb, bombActions, env, quickMove } from '../ai-adapter';
import {
  BONUS_LETTERS,
  MAX_LIVES,
  START_LIVES,
  alive,
  burn,
  newGame,
  playWord,
  wordProblem,
} from '../engine';
import { PROMPTS } from '../prompts';

const people = () => [
  { name: 'A', bot: false },
  { name: 'B', bot: false },
  { name: 'C', bot: false },
];

describe('Syllable Bomb rules', () => {
  it('has a big dictionary and prompts in three tiers', () => {
    expect(ALL.length).toBeGreaterThan(200_000);
    expect(PROMPTS.easy.length).toBeGreaterThan(100);
    expect(PROMPTS.hard.length).toBeGreaterThan(PROMPTS.medium.length);
  });

  it('checks words, passes the bomb and keeps the fuse burning', () => {
    let s = newGame(people(), 'easy', 3);
    s = { ...s, prompt: 'ar', holder: 0, fuse: 20 };
    const dict = new Set(ALL);
    const yes = (w: string) => dict.has(w);
    expect(wordProblem(s, 'ar', yes)).toBe('too-short');
    expect(wordProblem(s, 'dog', yes)).toBe('missing-prompt');
    expect(wordProblem(s, 'zzarq', yes)).toBe('unknown');
    expect(wordProblem(s, 'Car', yes)).toBeNull();
    s = playWord(burn(s, 5), 'car');
    expect(s.holder).toBe(1);
    expect(s.fuse).toBeCloseTo(15);
    expect(s.used).toEqual(['car']);
    expect(wordProblem({ ...s, prompt: 'ar' }, 'car', yes)).toBe('used');
  });

  it('takes a life when the fuse runs out and ends with one player left', () => {
    let s = newGame(people(), 'easy', 4);
    s = { ...s, holder: 1 };
    s = burn(s, 99);
    expect(s.players[1]!.lives).toBe(START_LIVES - 1);
    expect(s.holder).toBe(2);
    expect(s.fuse).toBeGreaterThan(9);
    while (s.status === 'playing')
      s = burn({ ...s, holder: alive(s).find((i) => i !== 0) ?? 0 }, 99);
    expect(s.winner).toBe(0);
  });

  it('gives a life back for using every bonus letter', () => {
    let s = newGame(people(), 'easy', 5);
    s = {
      ...s,
      holder: 0,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, letters: BONUS_LETTERS.replace('q', '') } : p,
      ),
      prompt: 'qu',
    };
    s = playWord(s, 'quick');
    expect(s.players[0]!.lives).toBe(START_LIVES + 1);
    expect(s.players[0]!.letters).toBe('');
    expect(START_LIVES + 1).toBeLessThanOrEqual(MAX_LIVES);
  });

  it('lets the quick typist outlast bots more often than random', () => {
    const run = (smart: boolean) => {
      let wins = 0;
      for (let seed = 1; seed <= 8; seed++) {
        let s = env.createInitialState({ difficulty: 'medium' }, seed);
        const rng = new Rng(seed);
        for (let i = 0; i < 300 && !env.isTerminal(s); i++)
          s = applyBomb(s, smart ? quickMove(s) : rng.pick(bombActions(s)));
        wins += env.getReward(s, 0);
      }
      return wins;
    };
    expect(run(true)).toBeGreaterThanOrEqual(run(false));
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy' }],
  playouts: 2,
  maxSteps: 300,
  illegalActions: () => ['w:zzzzqqq' as never, 'pass' as never],
});
