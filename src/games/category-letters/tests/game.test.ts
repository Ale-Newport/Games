import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { applyCl, clActions, clEnv, pickAnswer } from '../ai-adapter';
import {
  BANK,
  DEFAULT_SETTINGS,
  DIE,
  alliterationBonus,
  candidates,
  confirmRound,
  currentRound,
  isValidState,
  keyLetter,
  looksLikeWord,
  newGame,
  roundPoints,
  scoreRound,
  setVote,
  submitList,
  type CLState,
} from '../engine';
import { categoryAchievements } from '../Game';

describe('Category Letters rules', () => {
  it('has a large bilingual bank with answers for every die letter', () => {
    expect(BANK.length).toBeGreaterThanOrEqual(56);
    for (const lang of ['en', 'es'] as const)
      for (const letter of DIE[lang]) {
        const covered = BANK.filter((c) => candidates(c, lang, letter).length > 0).length;
        expect(covered, `${lang} ${letter}`).toBeGreaterThanOrEqual(12);
      }
  });

  it('reads the key letter past articles and accents, keeping Ñ', () => {
    expect(keyLetter('The Beatles')).toBe('B');
    expect(keyLetter('el Águila')).toBe('A');
    expect(keyLetter('ñandú')).toBe('Ñ');
    expect(keyLetter('a')).toBe('A');
    expect(alliterationBonus('Purple Penguin', 'P')).toBe(1);
    expect(alliterationBonus('Pretty Purple Penguin', 'P')).toBe(2);
    expect(alliterationBonus('Blue Penguin', 'P')).toBe(0);
    expect(looksLikeWord('Bramble')).toBe(true);
    expect(looksLikeWord('bbbx')).toBe(false);
    expect(looksLikeWord('zz')).toBe(false);
  });

  it('scores unique answers, cancels duplicates and handles votes', () => {
    let s = newGame({ ...DEFAULT_SETTINGS, bots: 0, humans: 2, size: 6, rounds: 1 }, 5, ['A', 'B']);
    const round = currentRound(s);
    const L = round.letter;
    const known = round.categories.map((id) =>
      candidates(
        BANK.find((c) => c.id === id)!,
        'en',
        L,
      ),
    );
    const first = known.findIndex((k) => k.length > 0);
    const name = known[first]![0]!.name;
    const listA = round.categories.map(() => '');
    const listB = round.categories.map(() => '');
    listA[first] = name;
    listB[first] = name.toUpperCase(); // duplicate
    listA[(first + 1) % 6] = `${L}orblesnap`; // unknown, looks like a word
    listB[(first + 2) % 6] = 'zzz'; // wrong letter (unless L is Z) or rejected
    s = submitList(submitList(s, listA), listB);
    expect(s.phase).toBe('review');
    const sc = scoreRound(s);
    expect(sc[0]![first]!.verdict).toBe('duplicate');
    expect(sc[1]![first]!.verdict).toBe('duplicate');
    expect(sc[0]![(first + 1) % 6]!.verdict).toBe('accepted');
    s = setVote(s, 0, (first + 1) % 6, false);
    expect(scoreRound(s)[0]![(first + 1) % 6]!.verdict).toBe('rejected');
    expect(roundPoints(s)).toEqual([0, 0]);
    s = confirmRound(s);
    expect(s.phase).toBe('done');
    expect(isValidState(s)).toBe(true);
  });

  it('runs several rounds with fresh letters and bot answers that use the letter', () => {
    let s = newGame({ ...DEFAULT_SETTINGS, bots: 5, skill: 'hard', rounds: 5 }, 77, ['Me']);
    const letters = new Set<string>();
    while (s.phase !== 'done') {
      const r = currentRound(s);
      letters.add(r.letter);
      for (let p = 1; p < s.players.length; p++)
        for (const a of r.answers[p]!) if (a) expect(keyLetter(a)).toBe(r.letter);
      s = confirmRound(
        submitList(
          s,
          r.categories.map(() => ''),
        ),
      );
    }
    expect(letters.size).toBe(5);
    expect(s.totals.slice(1).some((t) => t > 0)).toBe(true);
  });

  it('lets an original thinker outscore an obvious one against bots', () => {
    const play = (rare: boolean) => {
      let total = 0;
      for (let seed = 1; seed <= 25; seed++) {
        let s: CLState = clEnv.createInitialState({ bots: 4, skill: 'easy' }, seed);
        const rng = new Rng(seed);
        while (s.phase !== 'done') s = applyCl(s, pickAnswer(s, rng, rare));
        total += roundPoints(s, 0)[0]!;
      }
      return total;
    };
    expect(play(true)).toBeGreaterThan(play(false));
  });

  it('unlocks achievements for a winning human', () => {
    let s = newGame({ ...DEFAULT_SETTINGS, bots: 1, skill: 'hard', rounds: 1, size: 12 }, 9, [
      'Me',
    ]);
    const r = currentRound(s);
    s = submitList(
      s,
      r.categories.map((id) => {
        const c = candidates(
          BANK.find((x) => x.id === id)!,
          'en',
          r.letter,
        );
        return c.at(-1)?.name ?? '';
      }),
    );
    s = confirmRound(s);
    const got: string[] = [];
    categoryAchievements(s, (id) => got.push(id));
    if (s.totals[0]! > s.totals[1]!) expect(got).toContain('beat-sharp');
    expect(clActions(s)).toEqual([]);
  });
});

describeAdapterContract(clEnv, {
  configs: [undefined, { lang: 'es', bots: 2, skill: 'hard', size: 6 }],
  playouts: 3,
  maxSteps: 20,
  illegalActions: () => ['a:', 'a:not an answer at all', 'pass' as never],
});
