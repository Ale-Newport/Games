/**
 * Pachisi's rules on the cross-board race engine (`../shared/cross`): the large cross (arm length
 * 8), cowrie-shell throws, pieces that start in the centre, run down their own arm's middle column,
 * round the outside of the board and back up the middle column home, castles, and partnerships.
 */
import { nextUint32, type RngState } from '../../core/game-engine/random';
import type { CrossGeometry } from '../shared/cross/geometry';
import { raceGame, type RaceRules } from '../shared/cross/race';

/** Mouths up among six cowries → the value of the throw (none up counts 25, one counts 10). */
export const COWRIE_VALUES = [25, 10, 2, 3, 4, 5, 6];
/** The grace throws: they bring a piece in and give another throw. */
export const GRACE = [6, 10, 25];

export function throwCowries(rng: RngState): [number, RngState, boolean[]] {
  const [x, next] = nextUint32(rng);
  const faces = [0, 1, 2, 3, 4, 5].map((i) => ((x >>> i) & 1) === 1);
  return [COWRIE_VALUES[faces.filter(Boolean).length]!, next, faces];
}

/** The tip square of an arm on the loop. */
const tipOf = (g: CrossGeometry, arm: number) =>
  (arm * g.perArm + g.loop.length - 2) % g.loop.length;

/**
 * Down the arm's middle column from the centre, the tip, round the loop to the square before the
 * tip, the tip again and up the middle column.
 */
export function pachisiRoute(g: CrossGeometry, colour: number) {
  const column = g.homeColumn[colour]!;
  const tip = tipOf(g, colour);
  const cells = [...column].reverse();
  const loop: number[] = cells.map(() => -1);
  const total = g.loop.length;
  for (let k = 0; k < total; k++) {
    const li = (tip + k) % total;
    cells.push(g.loop[li]!);
    loop.push(li);
  }
  cells.push(g.loop[tip]!);
  loop.push(tip);
  for (const cell of column) {
    cells.push(cell);
    loop.push(-1);
  }
  return { cells, loop };
}

export const PACHISI: RaceRules = {
  L: 8,
  tokens: 4,
  exitRolls: GRACE,
  extraOn: GRACE,
  threeSixes: 'none',
  onCapture: 'roll',
  onHome: 0,
  pairs: 'safe',
  // The castles: each arm's tip and the fourth square from the end of each outer column.
  safe: (g) =>
    [0, 1, 2, 3].flatMap((arm) => [
      tipOf(g, arm),
      (arm * g.perArm + 2) % g.loop.length,
      (arm * g.perArm + g.loop.length - 6) % g.loop.length,
    ]),
  sixAsSeven: false,
  throwValue: throwCowries,
  route: pachisiRoute,
  teams: true,
  // Throws never show 1, so the last square is reached by any throw long enough.
  exactHome: false,
};

export const PACHISI_GAME = raceGame(PACHISI);
