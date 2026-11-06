import { useState, type ComponentType } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { cellsOf, legalDominoActions, type DominoState, type DominoVariant } from './engine';
import styles from './DominoBoard.module.css';

export const cellName = (v: DominoVariant, p: number) =>
  `${'abcdefgh'[p % v.cols]}${v.rows - Math.floor(p / v.cols)}`;

/** Placement joining two cells, if they are neighbors (smaller cell first). */
function joining(v: DominoVariant, p: number, q: number): string | null {
  const [a, b] = p < q ? [p, q] : [q, p];
  const r = Math.floor(a / v.cols);
  const c = a % v.cols;
  if (b === a + v.cols) return `${r},${c},v`;
  if (b === a + 1 && c + 1 < v.cols) return `${r},${c},h`;
  return null;
}

/** Grid board: tap a cell, then a highlighted neighbor, to place a domino. */
export function createDominoBoard(
  v: DominoVariant,
): ComponentType<BoardProps<DominoState, string>> {
  return function DominoBoard({ state, interactive, hint, animate, t, onAction }) {
    const [anchor, setAnchor] = useState<number | null>(null);
    const [cursor, setCursor] = useState(0);
    const [turn, setTurn] = useState(state.history.length);
    if (turn !== state.history.length) {
      setTurn(state.history.length);
      setAnchor(null);
    }
    const legal = new Set(interactive ? legalDominoActions(v, state) : []);
    const partners = new Map<number, string>();
    if (anchor !== null)
      for (const q of [anchor - v.cols, anchor + v.cols, anchor - 1, anchor + 1]) {
        if (q < 0 || q >= v.rows * v.cols) continue;
        const a = joining(v, anchor, q);
        if (a && legal.has(a)) partners.set(q, a);
      }
    const starts = new Set<number>();
    for (const a of legal) for (const p of cellsOf(v, a)!) starts.add(p);
    const hintCells: number[] = hint ? [...(cellsOf(v, hint) ?? [])] : [];

    const click = (p: number) => {
      if (!interactive) return;
      const viaPartner = partners.get(p);
      if (viaPartner) {
        setAnchor(null);
        return onAction(viaPartner);
      }
      if (p === anchor) {
        // A second tap places the only possible domino, if there is just one.
        if (partners.size === 1) {
          setAnchor(null);
          return onAction([...partners.values()][0]!);
        }
        return setAnchor(null);
      }
      setAnchor(starts.has(p) ? p : null);
    };
    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir) {
        setCursor((c) => moveCursor(c, dir, { rows: v.rows, cols: v.cols }));
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        click(cursor);
        return true;
      }
      if (e.key === 'Escape' && anchor !== null) {
        setAnchor(null);
        return true;
      }
      return false;
    });

    const pieces = state.history.map((a, i) => {
      const [r, c, o] = a.split(',');
      const seat = ((state.first + i) % 2) as 0 | 1;
      return { r: Number(r), c: Number(c), o, seat, i };
    });
    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        data-testid="domino-board"
      >
        <div
          className={styles.grid}
          role="grid"
          aria-label={t('board.label')}
          style={{
            gridTemplateColumns: `repeat(${v.cols}, 1fr)`,
            gridTemplateRows: `repeat(${v.rows}, 1fr)`,
            aspectRatio: `${v.cols} / ${v.rows}`,
          }}
        >
          {state.cells.map((occupant, p) => {
            const classes = [
              styles.cell,
              interactive && starts.has(p) && styles.can,
              anchor === p && styles.anchor,
              partners.has(p) && styles.partner,
              hintCells.includes(p) && styles.hint,
              cursor === p && styles.cursor,
            ];
            return (
              <button
                key={p}
                type="button"
                role="gridcell"
                className={classes.filter(Boolean).join(' ')}
                style={{ gridRow: Math.floor(p / v.cols) + 1, gridColumn: (p % v.cols) + 1 }}
                data-cell={p}
                aria-label={`${cellName(v, p)}, ${t(occupant === -1 ? (partners.has(p) ? 'cell.partner' : 'cell.empty') : 'cell.covered')}`}
                aria-disabled={!interactive || occupant !== -1}
                onClick={() => {
                  setCursor(p);
                  click(p);
                }}
              />
            );
          })}
          {pieces.map(({ r, c, o, seat, i }) => (
            <div
              key={i}
              className={`${styles.domino} ${o === 'v' ? styles.vertical : ''} ${seat === 0 ? styles.seat0 : styles.seat1} ${i === pieces.length - 1 ? styles.last : ''}`}
              style={{
                gridRow: o === 'v' ? `${r + 1} / span 2` : r + 1,
                gridColumn: o === 'h' ? `${c + 1} / span 2` : c + 1,
              }}
              aria-hidden="true"
            >
              <span className={styles.pip} />
              <span className={styles.pip} />
            </div>
          ))}
        </div>
      </div>
    );
  };
}
