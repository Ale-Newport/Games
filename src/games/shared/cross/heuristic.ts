/**
 * Race-game move choice: a hand-weighted score per move (captures, getting a token out, reaching
 * home or the home column, safe squares, and the danger of standing within a throw of an opposing
 * token behind) and a simple "most advanced token" rule for the easy level.
 */
import { loopIndex, type RaceGame, type RaceMove, type RaceState } from './race';

/** How many opposing tokens stand 1–6 squares behind a loop square (a capture threat next throw). */
export function threat(
  game: RaceGame,
  s: RaceState,
  seat: number,
  loop: number,
  ignore?: [number, number],
): number {
  if (loop < 0 || game.safeSet.has(loop)) return 0;
  const total = game.geo.loop.length;
  let n = 0;
  s.seats.forEach((colour, other) => {
    if (other === seat) return;
    s.tokens[other]!.forEach((step, t) => {
      if (ignore && ignore[0] === other && ignore[1] === t) return;
      const li = loopIndex(game, colour, step);
      if (li < 0) {
        // A token in the yard threatens the start square of its colour on a six.
        if (step < 0 && loop === colour * game.geo.perArm) n += 0.5;
        return;
      }
      const behind = (loop - li + total) % total;
      if (behind >= 1 && behind <= 6) n++;
    });
  });
  return n;
}

export function scoreMove(game: RaceGame, s: RaceState, m: RaceMove): number {
  const seat = s.turn;
  const colour = s.seats[seat]!;
  const loopSteps = game.geo.loop.length - 1;
  let v = 0;
  for (const [other, t] of m.captured) v += 40 + s.tokens[other]![t]! * 0.6;
  if (m.from < 0) v += 30;
  if (m.to === game.last) v += 35;
  else if (m.to >= loopSteps && m.from < loopSteps) v += 22;
  const toLoop = loopIndex(game, colour, m.to);
  const fromLoop = loopIndex(game, colour, m.from);
  if (toLoop >= 0 && game.safeSet.has(toLoop)) v += 12;
  v -= threat(game, s, seat, toLoop) * (8 + m.to * 0.3);
  if (m.from >= 0) v += threat(game, s, seat, fromLoop) * (8 + m.from * 0.3);
  v += (m.to - Math.max(0, m.from)) * 0.4;
  return v;
}

export function heuristicMove(game: RaceGame, s: RaceState, moves: RaceMove[]): RaceMove | null {
  let best: RaceMove | null = null;
  let score = -Infinity;
  for (const m of moves) {
    const v = scoreMove(game, s, m);
    if (v > score) {
      score = v;
      best = m;
    }
  }
  return best;
}

/** The easy rule: bring a token out on a six, otherwise move the most advanced token that can. */
export function simpleMove(moves: RaceMove[]): RaceMove | null {
  const out = moves.find((m) => m.from < 0);
  if (out) return out;
  return moves.reduce<RaceMove | null>((a, b) => (!a || b.from > a.from ? b : a), null);
}
