/**
 * Cross-shaped race boards (Ludo, Parchís, Pachisi): four arms of three columns around a 3×3
 * centre on a square grid of side 2L + 3, where L is the arm length (6 for Ludo, 8 for Parchís and
 * Pachisi). The loop runs clockwise round the outside of the cross: per arm, its outer two columns
 * and the tip square between them, 4(2L + 1) squares in all. Each arm's middle column, from the
 * tip inward, is the home column of the player whose arm it is.
 *
 * Players sit on the arms clockwise from the left arm (0 left, 1 top, 2 right, 3 bottom). Cells
 * are [row, col].
 */
export type Cell = [number, number];

export interface CrossGeometry {
  L: number;
  /** Grid side. */
  N: number;
  /** The loop, clockwise, starting at the left player's start square. */
  loop: Cell[];
  /** Squares per arm on the loop (2L + 1). */
  perArm: number;
  /** For each player, the home column from the tip inward (L − 1 squares). */
  homeColumn: Cell[][];
}

export function crossGeometry(L: number): CrossGeometry {
  const N = 2 * L + 3;
  const a = L;
  const b = L + 1;
  const c = L + 2;
  const loop: Cell[] = [];
  for (let col = 1; col <= L - 1; col++) loop.push([a, col]);
  for (let row = L - 1; row >= 0; row--) loop.push([row, a]);
  loop.push([0, b]);
  for (let row = 0; row <= L - 1; row++) loop.push([row, c]);
  for (let col = c + 1; col <= N - 1; col++) loop.push([a, col]);
  loop.push([b, N - 1]);
  for (let col = N - 1; col >= c + 1; col--) loop.push([c, col]);
  for (let row = c + 1; row <= N - 1; row++) loop.push([row, c]);
  loop.push([N - 1, b]);
  for (let row = N - 1; row >= c + 1; row--) loop.push([row, a]);
  for (let col = L - 1; col >= 0; col--) loop.push([c, col]);
  loop.push([b, 0]);
  loop.push([a, 0]);
  const home = (p: number): Cell[] => {
    const out: Cell[] = [];
    for (let k = 1; k <= L - 1; k++) {
      if (p === 0) out.push([b, k]);
      else if (p === 1) out.push([k, b]);
      else if (p === 2) out.push([b, N - 1 - k]);
      else out.push([N - 1 - k, b]);
    }
    return out;
  };
  return { L, N, loop, perArm: 2 * L + 1, homeColumn: [0, 1, 2, 3].map(home) };
}

/** The loop index of a player's start square. */
export const startIndex = (g: CrossGeometry, player: number) => player * g.perArm;

/**
 * A player's route, as cells: the loop from its start square round to its own arm's tip
 * (4(2L + 1) − 1 squares), then its home column; the next step after the column is home.
 */
export function route(g: CrossGeometry, player: number): Cell[] {
  const total = g.loop.length;
  const out: Cell[] = [];
  for (let k = 0; k < total - 1; k++) out.push(g.loop[(startIndex(g, player) + k) % total]!);
  return [...out, ...g.homeColumn[player]!];
}
