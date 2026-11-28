/**
 * Tile Realm drawing: each tile is drawn in SVG from its features — meadow ground, towns as walled
 * shapes chosen by which sides they hold (cap, corner, tube, three sides, whole), banners, roads
 * from side to side (straight or curved) or into a village square, shrines — and turned by its
 * rotation. The board shows the placed tiles, wardens in the players' colours, the cells where the
 * tile in hand fits (buttons), the tile being placed and its warden spots.
 */
import type { KeyboardEvent } from 'react';
import type { Translator } from '../../core/i18n';
import { key, type Realm } from './engine';
import { TILE_TYPES } from './tiles';
import styles from './TileRealm.module.css';

const MID: [number, number][] = [
  [50, 0],
  [100, 50],
  [50, 100],
  [0, 50],
];

/** A town shape for a set of sides, drawn for the canonical orientation then rotated. */
function townPath(sidesHeld: number[]): { d: string; turn: number } {
  const n = sidesHeld.length;
  const has = (s: number) => sidesHeld.includes(s);
  if (n === 4) return { d: 'M0 0H100V100H0Z', turn: 0 };
  if (n === 1) return { d: 'M0 0H100Q50 46 0 0Z', turn: sidesHeld[0]! };
  if (n === 3) {
    const missing = [0, 1, 2, 3].find((s) => !has(s))!;
    return { d: 'M0 0H100V100Q50 52 0 100Z', turn: (missing + 2) % 4 };
  }
  // Two sides: opposite (a tube) or adjacent (a corner).
  if (has(0) && has(2)) return { d: 'M0 0H100Q62 50 100 100H0Q38 50 0 0Z', turn: 0 };
  if (has(1) && has(3)) return { d: 'M0 0H100Q62 50 100 100H0Q38 50 0 0Z', turn: 1 };
  const first = [0, 1, 2, 3].find((s) => has(s) && has((s + 1) % 4))!;
  return { d: 'M0 0H100V100Q58 42 0 0Z', turn: first };
}

export function TileArt({ type, rot }: { type: number; rot: number }) {
  const t = TILE_TYPES[type]!;
  const roads = t.features.filter((f) => f.kind === 'road');
  const ends = roads.filter((f) => f.ports.length === 1).length;
  return (
    <g transform={`rotate(${rot * 90} 50 50)`}>
      <rect className={styles.meadow} width={100} height={100} />
      {t.features.map((f, i) => {
        if (f.kind === 'town') {
          const held = [0, 1, 2, 3].filter((s) => f.ports.includes(3 * s + 1));
          const { d, turn } = townPath(held);
          return (
            <g key={i} transform={`rotate(${turn * 90} 50 50)`}>
              <path className={styles.town} d={d} />
            </g>
          );
        }
        if (f.kind === 'road') {
          const mids = f.ports.map((p) => (p - 1) / 3);
          if (mids.length === 2) {
            const [a, b] = mids as [number, number];
            const [ax, ay] = MID[a]!;
            const [bx, by] = MID[b]!;
            const d =
              (a + 2) % 4 === b ? `M${ax} ${ay}L${bx} ${by}` : `M${ax} ${ay}Q50 50 ${bx} ${by}`;
            return <path key={i} className={styles.road} d={d} />;
          }
          const [ax, ay] = MID[mids[0]!]!;
          const hasShrine = t.features.some((x) => x.kind === 'shrine');
          // Into the shrine, into a village square, or up to a town gate.
          const end = hasShrine
            ? [50, 56]
            : ends >= 3
              ? [50, 50]
              : [ax + (50 - ax) * 0.6, ay + (50 - ay) * 0.6];
          return <path key={i} className={styles.road} d={`M${ax} ${ay}L${end[0]} ${end[1]}`} />;
        }
        if (f.kind === 'shrine')
          return (
            <g key={i} transform={`translate(${f.at[0]} ${f.at[1]})`}>
              <path className={styles.shrine} d="M-13 13V-3L0 -15L13 -3V13Z" />
              <rect className={styles.door} x={-3.5} y={3} width={7} height={10} />
            </g>
          );
        return null;
      })}
      {ends >= 3 && <rect className={styles.square} x={42} y={42} width={16} height={16} rx={3} />}
      {t.features.map((f, i) =>
        f.banner ? (
          <g key={`b${i}`} transform={`translate(${f.at[0] + 12} ${f.at[1] - 8})`}>
            <path className={styles.banner} d="M-6 -7H6V2L0 8L-6 2Z" />
          </g>
        ) : null,
      )}
    </g>
  );
}

/** Where a warden on feature f of a tile rotated r stands (tile units). */
export function anchor(type: number, r: number, f: number): [number, number] {
  const [x, y] = TILE_TYPES[type]!.features[f]!.at;
  let px = x - 50;
  let py = y - 50;
  for (let k = 0; k < r; k++) [px, py] = [-py, px];
  return [px + 50, py + 50];
}

export function Pawn({
  x,
  y,
  p,
  lying = false,
}: {
  x: number;
  y: number;
  p: number;
  lying?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${lying ? 90 : 0}) scale(1.45)`}
      style={{ ['--pc' as string]: `var(--player-${p + 1})` }}
    >
      <path className={styles.pawn} d="M-8 10H8L5 1A6 6 0 1 0 -5 1Z" />
    </g>
  );
}

export interface Ghost {
  x: number;
  y: number;
  r: number;
  /** Warden spots (features) and the chosen one. */
  spots: number[];
  warden: number | null;
}

export function TileBoard({
  g,
  t,
  cell,
  fitting,
  ghost,
  last,
  onCell,
  onSpot,
  onConfirm,
}: {
  g: Realm;
  t: Translator;
  cell: number;
  /** Cells where the tile in hand fits (in some rotation). */
  fitting: [number, number][];
  ghost: Ghost | null;
  last: number | null;
  onCell: (x: number, y: number) => void;
  onSpot: (f: number) => void;
  onConfirm: () => void;
}) {
  const xs = [...g.board.map((b) => b.x), ...fitting.map((f) => f[0])];
  const ys = [...g.board.map((b) => b.y), ...fitting.map((f) => f[1])];
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - 1;
  const maxY = Math.max(...ys) + 1;
  const W = (maxX - minX + 1) * 100;
  const H = (maxY - minY + 1) * 100;
  const keyPick = (x: number, y: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCell(x, y);
    }
  };
  const ghostKey = ghost ? key(ghost.x, ghost.y) : '';
  return (
    <svg
      className={styles.board}
      viewBox={`${minX * 100} ${minY * 100} ${W} ${H}`}
      width={(W / 100) * cell}
      height={(H / 100) * cell}
      role="group"
      aria-label={t('aria.board')}
      data-testid="tr-board"
    >
      {g.board.map((b, i) => (
        <g
          key={i}
          transform={`translate(${b.x * 100} ${b.y * 100})`}
          data-testid={`tr-tile-${b.x}-${b.y}`}
          data-last={last === i}
        >
          <TileArt type={b.type} rot={b.rot} />
          {last === i && <rect className={styles.lastMark} width={100} height={100} />}
        </g>
      ))}
      {g.wardens.map((w, i) => {
        const b = g.board[w.tile]!;
        const [ax, ay] = anchor(b.type, b.rot, w.feature);
        const lying = TILE_TYPES[b.type]!.features[w.feature]!.kind === 'meadow';
        return <Pawn key={i} x={b.x * 100 + ax} y={b.y * 100 + ay} p={w.p} lying={lying} />;
      })}
      {fitting.map(([x, y]) =>
        key(x, y) === ghostKey ? null : (
          <rect
            key={key(x, y)}
            className={styles.spot}
            x={x * 100 + 4}
            y={y * 100 + 4}
            width={92}
            height={92}
            rx={8}
            role="button"
            tabIndex={0}
            aria-label={t('aria.cell', { x, y: -y })}
            onClick={() => onCell(x, y)}
            onKeyDown={keyPick(x, y)}
            data-testid={`tr-cell-${x}-${y}`}
          />
        ),
      )}
      {ghost && g.current !== null && (
        <g transform={`translate(${ghost.x * 100} ${ghost.y * 100})`} data-testid="tr-ghost">
          <g className={styles.ghost}>
            <TileArt type={g.current} rot={ghost.r} />
          </g>
          <rect className={styles.ghostMark} width={100} height={100} />
          {ghost.spots.map((f) => {
            const [ax, ay] = anchor(g.current!, ghost.r, f);
            return (
              <circle
                key={f}
                className={styles.wspot}
                cx={ax}
                cy={ay}
                r={9}
                data-chosen={ghost.warden === f}
                role="button"
                tabIndex={0}
                aria-label={t('aria.spot', {
                  what: t(`kind.${TILE_TYPES[g.current!]!.features[f]!.kind}`),
                })}
                aria-pressed={ghost.warden === f}
                onClick={() => onSpot(f)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Enter on the chosen spot confirms; otherwise it chooses this spot.
                    if (ghost.warden === f) onConfirm();
                    else onSpot(f);
                  }
                }}
                data-testid={`tr-spot-${f}`}
              />
            );
          })}
          {ghost.warden !== null && (
            <Pawn
              x={anchor(g.current, ghost.r, ghost.warden)[0]}
              y={anchor(g.current, ghost.r, ghost.warden)[1]}
              p={g.turn}
              lying={TILE_TYPES[g.current]!.features[ghost.warden]!.kind === 'meadow'}
            />
          )}
        </g>
      )}
    </svg>
  );
}
