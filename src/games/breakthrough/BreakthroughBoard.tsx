import { useState } from 'react';
import { moveCursor } from '../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { N, legalBreakthroughActions, type BreakthroughState } from './engine';
import styles from './BreakthroughBoard.module.css';

export const cellName = (p: number) => `${'abcdefgh'[p % N]}${N - Math.floor(p / N)}`;

/** An original pawn: a rounded dome on a wide base. */
export function Pawn({ color, size }: { color: 1 | 2; size?: number }) {
  const [hi, lo, edge] =
    color === 1 ? ['#ffffff', '#cfc6b4', '#6b5f4b'] : ['#6d6f7a', '#1c1d24', '#000'];
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className={styles.pawn}>
      <defs>
        <radialGradient id={`bt-${color}`} cx="0.38" cy="0.3" r="0.75">
          <stop offset="0" stopColor={hi} />
          <stop offset="1" stopColor={lo} />
        </radialGradient>
      </defs>
      <ellipse
        cx="20"
        cy="33"
        rx="14"
        ry="4.5"
        fill={`url(#bt-${color})`}
        stroke={edge}
        strokeWidth="1.2"
      />
      <path
        d="M11 32 C11 24 14 21 16 19 C13 17 13 10 20 8 C27 10 27 17 24 19 C26 21 29 24 29 32 Z"
        fill={`url(#bt-${color})`}
        stroke={edge}
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function BreakthroughBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
  perspective,
}: BoardProps<BreakthroughState, string>) {
  const flip = perspective === 1;
  const cellAt = (i: number) => (flip ? N * N - 1 - i : i);
  const [selected, setSelected] = useState<number | null>(null);
  // Start the keyboard cursor on the viewer's own front row.
  const [cursor, setCursor] = useState(flip ? 11 : 52);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(null);
  }
  const legal = interactive ? legalBreakthroughActions(state) : [];
  const me = state.toMove + 1;
  const targets = new Set<number>();
  if (selected !== null)
    for (const a of legal) if (a.startsWith(`${selected}-`)) targets.add(Number(a.split('-')[1]));
  const last = state.history[state.history.length - 1]?.split('-').map(Number) ?? [];
  const hinted = hint ? hint.split('-').map(Number) : [];
  const counts = [1, 2].map((c) => state.board.filter((v) => v === c).length);

  const click = (p: number) => {
    if (!interactive) return;
    if (selected !== null && targets.has(p)) {
      setSelected(null);
      return onAction(`${selected}-${p}`);
    }
    if (state.board[p] === me) return setSelected(selected === p ? null : p);
    setSelected(null);
  };
  useKeyboard((e) => {
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => cellAt(moveCursor(cellAt(c), dir, { rows: N, cols: N })));
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
  const label = (p: number) => {
    const v = state.board[p];
    const piece = t(v === 0 ? 'cell.empty' : v === 1 ? 'cell.white' : 'cell.black');
    const target = targets.has(p) ? `, ${t(v === 0 ? 'cell.move' : 'cell.capture')}` : '';
    return `${cellName(p)}, ${piece}${target}`;
  };
  return (
    <div
      className={`${styles.wrap} ${animate ? styles.animated : ''}`}
      data-testid="breakthrough-board"
    >
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {Array.from({ length: N * N }, (_, i) => {
          const p = cellAt(i);
          const v = state.board[p]!;
          const dark = (Math.floor(p / N) + p) % 2 === 1;
          const classes = [
            styles.cell,
            dark ? styles.dark : styles.light,
            selected === p && styles.selected,
            last.includes(p) && styles.last,
            hinted.includes(p) && styles.hint,
            cursor === p && styles.cursor,
          ];
          return (
            <button
              key={p}
              type="button"
              role="gridcell"
              className={classes.filter(Boolean).join(' ')}
              data-cell={p}
              aria-label={label(p)}
              onClick={() => {
                setCursor(p);
                click(p);
              }}
            >
              {v !== 0 && (
                <span
                  key={`${p}-${v}`}
                  className={`${styles.piece} ${last[1] === p ? styles.moved : ''}`}
                >
                  <Pawn color={v as 1 | 2} />
                </span>
              )}
              {targets.has(p) && <span className={v === 0 ? styles.dot : styles.ring} />}
              {i % N === 0 && <span className={styles.rank}>{N - Math.floor(p / N)}</span>}
              {i >= N * (N - 1) && <span className={styles.file}>{'abcdefgh'[p % N]}</span>}
            </button>
          );
        })}
      </div>
      <div className={styles.bar} data-testid="counts">
        {t('info.counts', { a: counts[0]!, b: counts[1]! })}
      </div>
    </div>
  );
}
