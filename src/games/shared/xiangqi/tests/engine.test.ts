import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import { applyXiangqiAction, createXiangqiState, isValidXiangqiState, legalActions } from '../game';
import { START_PLACEMENT, formatPlacement, parsePlacement } from '../position';

const play = (placement: string, moves: string[]) =>
  moves.reduce((s, a) => applyXiangqiAction(s, a), createXiangqiState(placement));
const movesFrom = (placement: string, from: string) =>
  legalActions(createXiangqiState(placement))
    .filter((a) => a.startsWith(from))
    .map((a) => a.slice(from.length))
    .sort();

describe('xiangqi move generation', () => {
  it('matches the published perft counts from the start position', () => {
    const pos = parsePlacement(START_PLACEMENT);
    expect([1, 2, 3, 4].map((d) => pos.perft(d))).toEqual([44, 1920, 79666, 3290240]);
    expect(formatPlacement(pos)).toBe(START_PLACEMENT);
  });

  it('blocks horse legs and elephant eyes and keeps elephants home', () => {
    // Red horse e5 with its upward leg (e6) blocked: no moves to d7/f7.
    expect(movesFrom('4k4/9/9/9/4p4/4N4/9/9/9/3K5', 'e4')).toEqual(
      ['c3', 'c5', 'd2', 'f2', 'g3', 'g5'].sort(),
    );
    // Elephant c4 on the river bank: crossing to a6/e6 is forbidden, and the d3 eye is blocked.
    expect(movesFrom('4k4/9/9/9/9/2B6/3P5/9/9/3K5', 'c4')).toEqual(['a2']);
  });

  it('captures with cannons over exactly one screen and moves soldiers sideways after the river', () => {
    const cannon = movesFrom('4k4/9/4r4/9/9/9/4P4/9/4C4/3K5', 'e1');
    expect(cannon).toContain('e7'); // jumps the e3 soldier, takes the chariot
    expect(cannon).not.toContain('e3');
    expect(movesFrom('4k4/9/9/9/9/9/4P4/9/9/3K5', 'e3')).toEqual(['e4']);
    expect(movesFrom('4k4/9/9/4P4/9/9/9/9/9/3K5', 'e6')).toEqual(['d6', 'e7', 'f6']);
  });

  it('forbids exposing the generals to each other', () => {
    // The red chariot on e5 is the only piece between the generals.
    const moves = movesFrom('4k4/9/9/9/4R4/9/9/9/9/4K4', 'e5');
    expect(moves.every((to) => to.startsWith('e'))).toBe(true);
    expect(moves).toContain('e9'); // capturing the general along the file is a normal move
  });
});

describe('xiangqi results', () => {
  it('detects checkmate with two chariots and a stalemate loss', () => {
    const mate = play('4k4/R8/9/9/9/9/9/9/9/1R1K5', ['b0b9']);
    expect(mate.result).toEqual({ kind: 'win', winner: 0, reason: 'checkmate' });
    expect(mate.notation).toEqual(['Rb0-b9']);
    const stale = play('3k5/9/9/9/4R4/9/9/R8/9/5K3', ['a2a8']);
    expect(stale.result).toEqual({ kind: 'win', winner: 0, reason: 'stalemate' });
  });

  it('draws a threefold repetition and makes a perpetual checker lose', () => {
    const quiet = play('3k5/9/9/9/9/9/9/9/9/5K3', [
      'f0f1',
      'd9d8',
      'f1f0',
      'd8d9',
      'f0f1',
      'd9d8',
      'f1f0',
      'd8d9',
    ]);
    expect(quiet.result).toEqual({ kind: 'draw', reason: 'repetition' });
    // The red chariot checks from the side every move; the black general shuffles.
    const perpetual = play('3k5/9/9/9/9/9/9/9/9/R4K3', [
      'a0a9',
      'd9d8',
      'a9a8',
      'd8d9',
      'a8a9',
      'd9d8',
      'a9a8',
      'd8d9',
      'a8a9',
    ]);
    expect(perpetual.result).toEqual({ kind: 'win', winner: 1, reason: 'perpetual-check' });
  });

  it('plays random games that end and validate by replay', () => {
    const rng = new Rng(8);
    for (let g = 0; g < 4; g++) {
      let s = createXiangqiState();
      while (!s.result) s = applyXiangqiAction(s, rng.pick(legalActions(s)));
      expect(isValidXiangqiState(JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(isValidXiangqiState({ ...s, quiet: s.quiet + 1 })).toBe(false);
    }
  }, 60_000);
});
