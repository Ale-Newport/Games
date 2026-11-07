/**
 * Parchís's rules on the cross-board race engine (`../shared/cross`): the large cross (68 squares
 * round), a 5 to come out (obligatory when a pawn can), sixes that throw again and count seven once
 * every pawn is out, three sixes sending the last pawn moved home, barriers of two pawns that no one
 * can pass, twelve safe squares, and bonus moves of 20 for a capture and 10 for a pawn home.
 */
import { raceGame, type RaceRules } from '../shared/cross/race';

export const PARCHIS: RaceRules = {
  L: 8,
  tokens: 4,
  exitRolls: [5],
  exitMandatory: true,
  extraOn: [6],
  threeSixes: 'yard',
  onCapture: 20,
  onHome: 10,
  pairs: 'barrier',
  // Each arm's start square and the squares 7 and 12 after it.
  safe: (g) =>
    [0, 1, 2, 3].flatMap((p) => [0, 7, 12].map((k) => (p * g.perArm + k) % g.loop.length)),
  sixAsSeven: true,
};

export const PARCHIS_GAME = raceGame(PARCHIS);
