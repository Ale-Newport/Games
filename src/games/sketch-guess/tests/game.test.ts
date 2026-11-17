import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { DOODLES, applyGuess, env, recognizerMove } from '../ai-adapter';
import {
  WORDS,
  chooseWord,
  endTurn,
  guesserPoints,
  hintLine,
  judge,
  newGame,
  nextTurn,
  ranking,
  revealedCount,
  submitGuess,
  tick,
} from '../engine';

describe('Sketch & Guess rules', () => {
  it('judges guesses in either language, with near misses', () => {
    expect(judge('butterfly', 'Butterfly', 'en')).toBe('correct');
    expect(judge('butterfly', 'mariposa', 'en')).toBe('correct');
    expect(judge('butterfly', 'butterfy', 'en')).toBe('close');
    expect(judge('butterfly', 'bee', 'en')).toBe('wrong');
    expect(judge('snowman', 'muñeco de nieve', 'es')).toBe('correct');
  });

  it('reveals letters over time', () => {
    expect(revealedCount('elephant', 'en', 0.2)).toBe(0);
    expect(revealedCount('elephant', 'en', 0.5)).toBe(1);
    expect(revealedCount('elephant', 'en', 0.95)).toBe(3);
    expect(hintLine('elephant', 'en', 0, 1)).toBe('_ _ _ _ _ _ _ _');
    expect(hintLine('ice cream', 'en', 0, 1)).toContain('   ');
  });

  it('scores guessers by time and order, and the drawer per guesser', () => {
    expect(guesserPoints(0, 80, 0)).toBe(400);
    expect(guesserPoints(80, 80, 0)).toBe(50);
    expect(guesserPoints(40, 80, 2)).toBeLessThan(guesserPoints(40, 80, 0));
    let s = newGame({ lang: 'en', seconds: 80, rounds: 2, bots: 3, humanName: 'Me', seed: 3 });
    s = chooseWord(s, s.turn.options[0]!);
    s = tick(s, 10);
    const w = s.turn.word!;
    s = submitGuess(s, 1, w).state;
    s = submitGuess(s, 2, 'nothing').state;
    expect(s.turn.guessed.map((g) => g.player)).toEqual([1]);
    s = endTurn(s);
    expect(s.players[0]!.score).toBeGreaterThan(100);
    expect(s.players[1]!.score).toBeGreaterThan(300);
    let n = s;
    let turns = 1;
    while (n.status === 'playing') {
      n = nextTurn(n);
      if (n.status === 'playing') n = endTurn(chooseWord(n, n.turn.options[0]!));
      turns++;
    }
    expect(turns).toBe(9);
    expect(ranking(n)).toHaveLength(4);
  });

  it('has real doodles for every word', () => {
    for (const w of WORDS) expect((DOODLES[w] ?? []).length, w).toBeGreaterThan(0);
  });

  it('recognises most bot doodles before the end', () => {
    let right = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let s = env.createInitialState(undefined, seed);
      while (s.status === 'playing') s = applyGuess(s, recognizerMove(s, 0.5));
      if (s.status === 'right') right++;
    }
    expect(right).toBeGreaterThanOrEqual(28);
    void Rng;
  });
});

describeAdapterContract(env, {
  configs: [undefined, { word: 'cat' }],
  playouts: 3,
  maxSteps: 40,
  illegalActions: () => ['g:not-a-word', 'pass' as never],
});
