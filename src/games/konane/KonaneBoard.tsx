import { useState } from 'react';
import { moveCursor } from '../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { N, legalKonaneActions, type KonaneState } from './engine';
import styles from './KonaneBoard.module.css';

export const cellName = (p: number) => `${'abcdef'[p % N]}${N - Math.floor(p / N)}`;

export function KonaneBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<KonaneState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(14);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(null);
  }
  const legal = interactive ? legalKonaneActions(state) : [];
  const removals = new Set(legal.filter((a) => a.startsWith('x')).map((a) => Number(a.slice(1))));
  const movable = new Set(
    legal.filter((a) => !a.startsWith('x')).map((a) => Number(a.split('-')[0])),
  );
  const targets = new Set(
    selected === null
      ? []
      : legal.filter((a) => a.startsWith(`${selected}-`)).map((a) => Number(a.split('-')[1])),
  );
  const lastMove = state.history[state.history.length - 1];
  const last = lastMove ? lastMove.replace('x', '').split('-').map(Number) : [];
  const hinted = hint ? hint.replace('x', '').split('-').map(Number) : [];

  const click = (p: number) => {
    if (!interactive) return;
    if (removals.has(p)) return onAction(`x${p}`);
    if (selected !== null && targets.has(p)) {
      setSelected(null);
      return onAction(`${selected}-${p}`);
    }
    setSelected(movable.has(p) && selected !== p ? p : null);
  };
  useKeyboard((e) => {
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => moveCursor(c, dir, { rows: N, cols: N }));
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
  const counts = [1, 2].map((c) => state.board.filter((v) => v === c).length);
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="konane-board">
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {state.board.map((v, p) => {
          const dark = (Math.floor(p / N) + p) % 2 === 1;
          const classes = [
            styles.cell,
            dark ? styles.dark : styles.light,
            selected === p && styles.selected,
            interactive && (movable.has(p) || removals.has(p)) && selected === null && styles.can,
            removals.has(p) && styles.removable,
            last.includes(p) && styles.last,
            hinted.includes(p) && styles.hint,
            cursor === p && styles.cursor,
          ];
          const what = t(v === 0 ? 'cell.empty' : v === 1 ? 'cell.black' : 'cell.white');
          return (
            <button
              key={p}
              type="button"
              role="gridcell"
              className={classes.filter(Boolean).join(' ')}
              data-cell={p}
              aria-label={`${cellName(p)}, ${what}${targets.has(p) ? `, ${t('cell.land')}` : removals.has(p) ? `, ${t('cell.remove')}` : ''}`}
              onClick={() => {
                setCursor(p);
                click(p);
              }}
            >
              {v !== 0 && (
                <span
                  key={`${p}-${v}`}
                  className={`${styles.stone} ${v === 1 ? styles.black : styles.white} ${last[1] === p ? styles.moved : ''}`}
                />
              )}
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
}
