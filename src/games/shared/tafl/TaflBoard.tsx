import { useState, type ComponentType } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { cornersOf, legalTaflActions, throneOf, type TaflState, type TaflVariant } from './engine';
import styles from './TaflBoard.module.css';

export const squareName = (v: TaflVariant, p: number) =>
  `${'abcdefghijk'[p % v.size]}${v.size - Math.floor(p / v.size)}`;

/** Original king piece: a light disc with a crown. */
export function KingPiece() {
  return (
    <svg viewBox="0 0 40 40" className={styles.svgPiece} aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="#f7edd6" stroke="#8a6d3b" strokeWidth="2" />
      <path
        d="M10 26 L12 14 L17 20 L20 11 L23 20 L28 14 L30 26 Z"
        fill="#d9a32b"
        stroke="#7a5418"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect
        x="10"
        y="26"
        width="20"
        height="3.5"
        rx="1"
        fill="#d9a32b"
        stroke="#7a5418"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function createTaflBoard(v: TaflVariant): ComponentType<BoardProps<TaflState, string>> {
  const n = v.size;
  const throne = throneOf(v);
  const corners = v.escape === 'corner' ? cornersOf(v) : [];
  return function TaflBoard({ state, interactive, hint, animate, t, onAction }) {
    const [selected, setSelected] = useState<number | null>(null);
    const [cursor, setCursor] = useState(throne);
    const [turn, setTurn] = useState(state.history.length);
    if (turn !== state.history.length) {
      setTurn(state.history.length);
      setSelected(null);
    }
    const legal = interactive ? legalTaflActions(v, state) : [];
    const movable = new Set(legal.map((a) => Number(a.split('-')[0])));
    const targets = new Set(
      selected === null
        ? []
        : legal.filter((a) => a.startsWith(`${selected}-`)).map((a) => Number(a.split('-')[1])),
    );
    const last = state.history[state.history.length - 1]?.split('-').map(Number) ?? [];
    const hinted = hint ? hint.split('-').map(Number) : [];
    const click = (p: number) => {
      if (!interactive) return;
      if (selected !== null && targets.has(p)) {
        setSelected(null);
        return onAction(`${selected}-${p}`);
      }
      setSelected(movable.has(p) && p !== selected ? p : null);
    };
    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir) {
        setCursor((c) => moveCursor(c, dir, { rows: n, cols: n }));
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        click(cursor);
        return true;
      }
      if (e.key === 'Escape' && selected !== null) {
        setSelected(null);
        return true;
      }
      return false;
    });
    const counts = [1, 2].map((c) => state.board.filter((x) => x === c).length);
    return (
      <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="tafl-board">
        <div
          className={styles.board}
          role="grid"
          aria-label={t('board.label')}
          style={{
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gridTemplateRows: `repeat(${n}, 1fr)`,
          }}
        >
          {state.board.map((piece, p) => {
            const special = p === throne || corners.includes(p);
            const classes = [
              styles.cell,
              special && styles.special,
              v.escape === 'edge' &&
                (p < n || p >= n * (n - 1) || p % n === 0 || p % n === n - 1) &&
                styles.edge,
              selected === p && styles.selected,
              interactive && movable.has(p) && selected === null && styles.can,
              last.includes(p) && styles.last,
              hinted.includes(p) && styles.hint,
              cursor === p && styles.cursor,
            ];
            const what = t(
              piece === 0
                ? 'square.empty'
                : piece === 1
                  ? 'square.attacker'
                  : piece === 2
                    ? 'square.defender'
                    : 'square.king',
            );
            return (
              <button
                key={p}
                type="button"
                role="gridcell"
                className={classes.filter(Boolean).join(' ')}
                data-square={p}
                aria-label={`${squareName(v, p)}, ${what}${targets.has(p) ? `, ${t('square.target')}` : ''}`}
                onClick={() => {
                  setCursor(p);
                  click(p);
                }}
              >
                {piece === 3 ? (
                  <span
                    key={`k${p}`}
                    className={`${styles.piece} ${styles.king} ${last[1] === p ? styles.moved : ''}`}
                  >
                    <KingPiece />
                  </span>
                ) : piece ? (
                  <span
                    key={`${piece}${p}`}
                    className={`${styles.piece} ${styles.disc} ${piece === 1 ? styles.attacker : styles.defender} ${last[1] === p ? styles.moved : ''}`}
                  />
                ) : null}
                {targets.has(p) && <span className={styles.dot} />}
              </button>
            );
          })}
        </div>
        <div className={styles.bar} data-testid="counts">
          {t('info.counts', { a: counts[0]!, b: counts[1]! })}
        </div>
      </div>
    );
  };
}
