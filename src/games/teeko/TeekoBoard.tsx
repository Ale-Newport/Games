import { useState } from 'react';
import { moveCursor } from '../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { MARKERS, dropping, legalTeekoActions, type TeekoState } from './engine';
import styles from './TeekoBoard.module.css';

export const cellName = (p: number) => `${'abcde'[p % 5]}${5 - Math.floor(p / 5)}`;

export function TeekoBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<TeekoState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(12);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(null);
  }
  const legal = interactive ? legalTeekoActions(state) : [];
  const drop = dropping(state);
  const targets = new Set(
    selected === null
      ? []
      : legal.filter((a) => a.startsWith(`${selected}-`)).map((a) => Number(a.split('-')[1])),
  );
  const shape = new Set(state.result?.kind === 'win' ? state.result.shape : []);
  const last = state.history[state.history.length - 1];
  const lastTo = last ? Number(last.split('-').pop()) : -1;
  const hinted = hint ? hint.split('-').map(Number) : [];

  const click = (p: number) => {
    setCursor(p);
    if (!interactive) return;
    if (drop) return onAction(String(p));
    if (selected !== null && targets.has(p)) {
      setSelected(null);
      return onAction(`${selected}-${p}`);
    }
    if (legal.some((a) => a.startsWith(`${p}-`))) return setSelected(selected === p ? null : p);
    setSelected(null);
    if (state.board[p] === state.toMove + 1) onAction('');
  };
  useKeyboard((e) => {
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => moveCursor(c, dir, { rows: 5, cols: 5 }));
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
  const left = (seat: 0 | 1) => MARKERS - state.board.filter((v) => v === seat + 1).length;
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="teeko-board">
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {state.board.map((v, p) => (
          <button
            key={p}
            type="button"
            role="gridcell"
            className={`${styles.cell} ${targets.has(p) ? styles.target : ''} ${shape.has(p) ? styles.win : ''} ${selected === p ? styles.selected : ''} ${hinted.includes(p) ? styles.hint : ''} ${cursor === p ? styles.cursor : ''}`}
            data-cell={p}
            aria-label={`${cellName(p)}, ${t(v === 0 ? 'cell.empty' : v === 1 ? 'cell.black' : 'cell.red')}${targets.has(p) ? `, ${t('cell.target')}` : ''}`}
            onClick={() => click(p)}
          >
            {v !== 0 && (
              <span
                key={lastTo === p ? `placed-${turn}` : 'still'}
                className={`${styles.marker} ${v === 1 ? styles.black : styles.red} ${lastTo === p ? styles.placed : ''}`}
              />
            )}
          </button>
        ))}
      </div>
      <p className={styles.counts}>
        {drop ? t('info.drop', { a: left(0), b: left(1) }) : t('info.move')}
      </p>
    </div>
  );
}
