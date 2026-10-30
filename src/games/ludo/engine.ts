/** Ludo's rules on the cross-board race engine (`../shared/cross`). */
import { raceGame, type RaceRules } from '../shared/cross/race';

export const LUDO: RaceRules = {
  L: 6,
  tokens: 4,
  exitRolls: [6],
  extraOnSix: true,
  threeSixes: 'forfeit',
  onCapture: 'roll',
  onHome: 'roll',
  pairs: 'safe',
  // Every start square and the star square eight steps after it.
  safe: (g) => [0, 1, 2, 3].flatMap((p) => [p * g.perArm, p * g.perArm + 8]),
  sixAsSeven: false,
};

export const LUDO_GAME = raceGame(LUDO);
