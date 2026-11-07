/** Cage outlines and labels drawn over the shared sudoku board (killer sums, calcudoku targets). */
import type { Geometry } from './grid';
import styles from './CageOverlay.module.css';

const IN = 0.09;

/** Dashed cage outlines inset in each cell, with each cage's label in its first cell. */
export function CageOverlay({
  geo,
  cages,
  labels,
  bad,
}: {
  geo: Geometry;
  cages: readonly { cells: readonly number[] }[];
  labels: readonly string[];
  bad: ReadonlySet<number>;
}) {
  const n = geo.size;
  const owner = Array<number>(geo.cells).fill(-1);
  cages.forEach((cage, i) => cage.cells.forEach((c) => (owner[c] = i)));
  const lines: { key: string; d: string; bad: boolean }[] = [];
  for (let c = 0; c < geo.cells; c++) {
    const r = Math.floor(c / n);
    const col = c % n;
    const k = owner[c]!;
    const same = (dr: number, dc: number) => {
      const rr = r + dr;
      const cc = col + dc;
      return rr >= 0 && rr < n && cc >= 0 && cc < n && owner[rr * n + cc] === k;
    };
    const edge = (dr: number, dc: number, x1: number, y1: number, x2: number, y2: number) => {
      if (!same(dr, dc))
        lines.push({ key: `${c}:${dr}:${dc}`, d: `M${x1} ${y1}L${x2} ${y2}`, bad: bad.has(k) });
    };
    // Ends of each side: flush with a same-cage neighbour, reaching into a concave corner.
    const startX = same(0, -1) ? (same(-1, -1) ? col - IN : col) : col + IN;
    const endX = same(0, 1) ? (same(-1, 1) ? col + 1 + IN : col + 1) : col + 1 - IN;
    const startXb = same(0, -1) ? (same(1, -1) ? col - IN : col) : col + IN;
    const endXb = same(0, 1) ? (same(1, 1) ? col + 1 + IN : col + 1) : col + 1 - IN;
    const startY = same(-1, 0) ? (same(-1, -1) ? r - IN : r) : r + IN;
    const endY = same(1, 0) ? (same(1, -1) ? r + 1 + IN : r + 1) : r + 1 - IN;
    const startYr = same(-1, 0) ? (same(-1, 1) ? r - IN : r) : r + IN;
    const endYr = same(1, 0) ? (same(1, 1) ? r + 1 + IN : r + 1) : r + 1 - IN;
    edge(-1, 0, startX, r + IN, endX, r + IN);
    edge(1, 0, startXb, r + 1 - IN, endXb, r + 1 - IN);
    edge(0, -1, col + IN, startY, col + IN, endY);
    edge(0, 1, col + 1 - IN, startYr, col + 1 - IN, endYr);
  }
  return (
    <svg className={styles.cages} viewBox={`0 0 ${n} ${n}`} aria-hidden>
      {lines.map((l) => (
        <path key={l.key} d={l.d} className={l.bad ? styles.bad : ''} />
      ))}
      {cages.map((cage, i) => {
        const first = cage.cells[0]!;
        const x = (first % n) + 0.06;
        const y = Math.floor(first / n) + 0.05;
        return (
          <g key={i} className={bad.has(i) ? styles.badSum : ''}>
            <rect
              x={x - 0.02}
              y={y}
              width={0.08 + 0.12 * labels[i]!.length}
              height={0.26}
              rx={0.04}
            />
            <text x={x} y={y + 0.21}>
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
