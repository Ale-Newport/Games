/** Inequality signs drawn on the borders between neighbouring cells; broken ones in red. */
import type { Geometry } from '../shared/sudoku/grid';
import type { SudokuState } from '../shared/sudoku/play';
import { brokenSigns } from './engine';
import styles from './Futoshiki.module.css';

const W = 0.11;

export function Signs({ geo, state }: { geo: Geometry; state: SudokuState }) {
  const n = geo.size;
  const broken = brokenSigns(state);
  return (
    <svg className={styles.signs} viewBox={`0 0 ${n} ${n}`} aria-hidden>
      {(state.signs ?? []).map(({ less, more }, i) => {
        const [a, b] = less < more ? [less, more] : [more, less];
        const r = Math.floor(a / n);
        const c = a % n;
        // The point opens towards the larger digit.
        const towardsB = less === a;
        let d: string;
        if (b === a + 1) {
          const x = c + 1;
          const y = r + 0.5;
          d = towardsB
            ? `M${x + W} ${y - W * 1.3}L${x - W} ${y}L${x + W} ${y + W * 1.3}`
            : `M${x - W} ${y - W * 1.3}L${x + W} ${y}L${x - W} ${y + W * 1.3}`;
        } else {
          const x = c + 0.5;
          const y = r + 1;
          d = towardsB
            ? `M${x - W * 1.3} ${y + W}L${x} ${y - W}L${x + W * 1.3} ${y + W}`
            : `M${x - W * 1.3} ${y - W}L${x} ${y + W}L${x + W * 1.3} ${y - W}`;
        }
        return <path key={i} d={d} className={broken.has(i) ? styles.broken : ''} />;
      })}
    </svg>
  );
}
