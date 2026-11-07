/**
 * The cross-board table shared by Ludo, Parchís and Pachisi: the four coloured yards in the
 * corners, the loop with its safe squares (★) and coloured start squares, the home columns, the
 * centre, and the tokens (stacked tokens fan out a little). Tokens that can move are ringed and
 * tapping one moves it.
 */
import type { KeyboardEvent } from 'react';
import type { RaceGame, RaceState } from './race';
import styles from './CrossBoard.module.css';

export const COLOURS = ['#e5484d', '#30a46c', '#f1c40f', '#3e63dd'];
const U = 32;

export interface CrossBoardProps {
  game: RaceGame;
  state: RaceState;
  /** Tokens of the seat to play that can move now. */
  movable: number[];
  hint: number | null;
  onToken: (token: number) => void;
  tokenLabel: (seat: number, token: number) => string;
  ariaLabel: string;
}

/** Top-left cell of a colour's yard (the corner next to its start square). */
function yardCorner(colour: number, N: number, L: number): [number, number] {
  return [
    [0, 0],
    [0, N - L],
    [N - L, N - L],
    [N - L, 0],
  ][colour] as [number, number];
}

export function CrossBoard({
  game,
  state,
  movable,
  hint,
  onToken,
  tokenLabel,
  ariaLabel,
}: CrossBoardProps) {
  const { geo } = game;
  const { N, L } = geo;
  const size = N * U;
  const loopColour = new Map<string, number>();
  [0, 1, 2, 3].forEach((p) => loopColour.set(geo.loop[p * geo.perArm]!.join(), p));
  // Where each token stands: [x, y] centre, grouped per cell to fan out stacks.
  const spots = new Map<string, { seat: number; token: number }[]>();
  const place = (key: string, seat: number, token: number) => {
    if (!spots.has(key)) spots.set(key, []);
    spots.get(key)!.push({ seat, token });
  };
  state.seats.forEach((colour, seat) =>
    state.tokens[seat]!.forEach((step, token) => {
      if (step < 0) place(`yard:${colour}:${token}`, seat, token);
      else if (step >= game.last) place(`home:${colour}`, seat, token);
      else place(game.routes[colour]![step]!.join(), seat, token);
    }),
  );
  const centreOf = (key: string): [number, number] => {
    if (key.startsWith('yard:')) {
      const [, c, t] = key.split(':').map(Number) as [number, number, number];
      const [r0, c0] = yardCorner(c, N, L);
      const off = [
        [0.3, 0.3],
        [0.7, 0.3],
        [0.3, 0.7],
        [0.7, 0.7],
      ][t % 4]!;
      return [(c0 + off[0]! * L) * U, (r0 + off[1]! * L) * U];
    }
    if (key.startsWith('home:')) {
      const c = Number(key.split(':')[1]);
      const mid = (L + 1.5) * U;
      const d = 0.9 * U;
      return [
        [mid - d, mid],
        [mid, mid - d],
        [mid + d, mid],
        [mid, mid + d],
      ][c]! as [number, number];
    }
    const [r, c] = key.split(',').map(Number) as [number, number];
    return [(c + 0.5) * U, (r + 0.5) * U];
  };
  const key = (token: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToken(token);
    }
  };
  const turnSeat = state.turn;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={styles.board}
      role="group"
      aria-label={ariaLabel}
      data-testid="cx-board"
    >
      <rect width={size} height={size} rx={10} className={styles.frame} />
      {[0, 1, 2, 3].map((c) => {
        const [r0, c0] = yardCorner(c, N, L);
        return (
          <g key={`yard${c}`}>
            <rect
              x={c0 * U + 3}
              y={r0 * U + 3}
              width={L * U - 6}
              height={L * U - 6}
              rx={14}
              fill={COLOURS[c]}
              opacity={0.85}
            />
            <rect
              x={(c0 + 0.12 * L) * U}
              y={(r0 + 0.12 * L) * U}
              width={0.76 * L * U}
              height={0.76 * L * U}
              rx={12}
              className={styles.yardInner}
            />
          </g>
        );
      })}
      {geo.loop.map(([r, c], i) => {
        const start = loopColour.get(`${r},${c}`);
        return (
          <g key={`l${i}`}>
            <rect
              x={c * U + 1}
              y={r * U + 1}
              width={U - 2}
              height={U - 2}
              rx={4}
              className={styles.square}
              style={start !== undefined ? { fill: COLOURS[start] } : undefined}
            />
            {game.safeSet.has(i) && start === undefined && (
              <text
                x={(c + 0.5) * U}
                y={(r + 0.5) * U + 6}
                textAnchor="middle"
                className={styles.star}
              >
                ★
              </text>
            )}
          </g>
        );
      })}
      {geo.homeColumn.map((cells, p) =>
        cells.map(([r, c], k) => (
          <rect
            key={`h${p}-${k}`}
            x={c * U + 1}
            y={r * U + 1}
            width={U - 2}
            height={U - 2}
            rx={4}
            fill={COLOURS[p]}
            opacity={0.75}
          />
        )),
      )}
      {/* The centre: four triangles pointing home. */}
      {[0, 1, 2, 3].map((p) => {
        const x0 = L * U;
        const x1 = (L + 3) * U;
        const m = (L + 1.5) * U;
        const pts = [
          `${x0},${x0} ${m},${m} ${x0},${x1}`,
          `${x0},${x0} ${m},${m} ${x1},${x0}`,
          `${x1},${x0} ${m},${m} ${x1},${x1}`,
          `${x0},${x1} ${m},${m} ${x1},${x1}`,
        ][p]!;
        return <polygon key={`c${p}`} points={pts} fill={COLOURS[p]} opacity={0.9} />;
      })}
      {[...spots.entries()].flatMap(([k, list]) => {
        const [cx, cy] = centreOf(k);
        return list.map(({ seat, token }, i) => {
          const colour = state.seats[seat]!;
          const canMove = seat === turnSeat && movable.includes(token);
          const shift =
            list.length > 1 && !k.startsWith('yard:') ? (i - (list.length - 1) / 2) * 6 : 0;
          return (
            <g
              key={`t${seat}-${token}`}
              role={canMove ? 'button' : undefined}
              tabIndex={canMove ? 0 : undefined}
              aria-label={tokenLabel(seat, token)}
              data-token={`${seat}:${token}`}
              data-movable={canMove || undefined}
              className={[
                styles.token,
                canMove ? styles.movable : '',
                canMove && hint === token ? styles.pointed : '',
              ].join(' ')}
              onClick={() => canMove && onToken(token)}
              onKeyDown={key(token)}
            >
              <circle
                cx={cx + shift}
                cy={cy - shift / 2}
                r={U * 0.36}
                fill={COLOURS[colour]}
                className={styles.disc}
              />
              <circle cx={cx + shift} cy={cy - shift / 2} r={U * 0.16} className={styles.cap} />
            </g>
          );
        });
      })}
    </svg>
  );
}
