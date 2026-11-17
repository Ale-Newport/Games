import { describe, expect, it } from 'vitest';
import { loadVectors } from '../../shared/semantic/semantic';
import { SKILLS, operativeGuess, spymasterClue } from '../bots';
import {
  WORD_POOL,
  clueProblem,
  giveClue,
  guess,
  isValidState,
  newGame,
  pass,
  remaining,
  type CodeState,
} from '../engine';

describe('Code Words rules', () => {
  it('deals 9 / 8 / 7 / 1 with the starting team holding nine', () => {
    const s = newGame(5);
    expect(WORD_POOL.length).toBeGreaterThan(300);
    expect(new Set(s.words).size).toBe(25);
    expect(remaining(s, s.starter)).toBe(9);
    expect(remaining(s, s.starter === 'red' ? 'blue' : 'red')).toBe(8);
    expect(s.roles.filter((r) => r === 'bystander')).toHaveLength(7);
    expect(s.roles.filter((r) => r === 'assassin')).toHaveLength(1);
  });

  it('validates clues, limits guesses to number + 1 and ends turns on misses', () => {
    let s = newGame(7);
    const yes = () => true;
    expect(clueProblem(s, 'two words', 1, yes)).toBe('not-a-word');
    expect(clueProblem(s, s.words[0]!, 1, yes)).toBe('on-board');
    expect(clueProblem(s, 'zzz', 0, yes)).toBe('number');
    const team = s.turn;
    s = giveClue(s, 'zebra', 1);
    expect(s.guessesLeft).toBe(2);
    const own = s.roles
      .map((r, i) => [r, i] as const)
      .filter(([r]) => r === team)
      .map(([, i]) => i);
    s = guess(s, own[0]!);
    expect(s.turn).toBe(team);
    s = guess(s, own[1]!);
    expect(s.turn).not.toBe(team);
    s = giveClue(s, 'yak', 2);
    const bystander = s.roles.indexOf('bystander');
    s = guess(s, bystander);
    expect(s.turn).toBe(team);
    expect(pass(s)).toBe(s);
    const assassin = s.roles.indexOf('assassin');
    s = guess(giveClue(s, 'xylem', 1), assassin);
    expect(s.status).toBe('over');
    expect(s.reason).toBe('assassin');
    expect(s.winner).not.toBe(team);
    expect(isValidState(s)).toBe(true);
  });
});

describe('Code Words bots', () => {
  it('give legal, mostly safe clues and finish games', async () => {
    const v = await loadVectors();
    let hits = 0;
    let touches = 0;
    let assassins = 0;
    for (let seed = 1; seed <= 6; seed++) {
      let s: CodeState = newGame(seed);
      for (let turn = 0; turn < 40 && s.status === 'playing'; turn++) {
        const team = s.turn;
        const c = spymasterClue(v, s, team, SKILLS.normal);
        expect(
          clueProblem(s, c.word, c.number, (w) => v.index.has(w)),
          c.word,
        ).toBeNull();
        s = giveClue(s, c.word, c.number);
        while (s.status === 'playing' && s.turn === team && s.phase === 'guess') {
          const g = operativeGuess(v, s, 0.2);
          if (g === null) {
            s = pass(s);
            break;
          }
          touches++;
          if (s.roles[g] === team) hits++;
          s = guess(s, g);
        }
      }
      expect(s.status).toBe('over');
      if (s.reason === 'assassin') assassins++;
    }
    expect(hits / touches).toBeGreaterThan(0.55);
    expect(assassins).toBeLessThanOrEqual(2);
  }, 60_000);
});
