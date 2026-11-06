import { useState } from 'react';
import { moveCursor } from '../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { N, RING1, RING2, countsOf, legalAtaxxActions, type AtaxxState } from './engine';
import styles from './AtaxxBoard.module.css';

export const cellName = (p: number) => `${'abcdefg'[p % N]}${N - Math.floor(p / N)}`;

export function AtaxxBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<AtaxxState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(24);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(null);
  }
  const legal = interactive ? legalAtaxxActions(state) : [];
  const me = state.toMove + 1;
  const clones = new Set<number>();
  const jumps = new Set<number>();
  if (selected !== null) {
    for (const q of RING1[selected]!) if (legal.includes(`+${q}`)) clones.add(q);
    for (const q of RING2[selected]!) if (legal.includes(`${selected}-${q}`)) jumps.add(q);
  }
  const last = state.history[state.history.length - 1];
  const lastTo = last && last !== 'pass' ? Number(last.replace('+', '').split('-').pop()) : -1;
  const [hintFrom, hintTo] =
    hint && hint !== 'pass'
      ? hint.startsWith('+')
        ? [-1, Number(hint.slice(1))]
        : hint.split('-').map(Number)
      : [-2, -2];

  const click = (p: number) => {
    setCursor(p);
    if (!interactive) return;
    if (selected !== null && clones.has(p)) {
      setSelected(null);
      return onAction(`+${p}`);
    }
    if (selected !== null && jumps.has(p)) {
      setSelected(null);
      return onAction(`${selected}-${p}`);
    }
    if (state.board[p] === me) return setSelected(selected === p ? null : p);
    setSelected(null);
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
  const [red, blue] = countsOf(state.board);
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="ataxx-board">
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {state.board.map((v, p) => (
          <button
            key={p}
            type="button"
            role="gridcell"
            className={`${styles.cell} ${selected === p ? styles.selected : ''} ${p === hintTo || p === hintFrom ? styles.hint : ''} ${cursor === p ? styles.cursor : ''}`}
            data-cell={p}
            aria-label={`${cellName(p)}, ${t(v === 0 ? 'cell.empty' : v === 1 ? 'cell.red' : 'cell.blue')}${clones.has(p) ? `, ${t('cell.clone')}` : jumps.has(p) ? `, ${t('cell.jump')}` : ''}`}
            onClick={() => click(p)}
          >
            {v !== 0 && (
              <span
                // Remounts (and animates) only when the piece appears or changes color.
                key={`${p}-${v}`}
                className={`${styles.piece} ${v === 1 ? styles.red : styles.blue} ${lastTo === p ? styles.placed : ''}`}
              />
            )}
            {clones.has(p) && <span className={styles.clone} />}
            {jumps.has(p) && <span className={styles.jump} />}
          </button>
        ))}
      </div>
      <div className={styles.bar}>
        <span className={styles.count} data-testid="counts">
          {t('info.counts', { a: red, b: blue })}
        </span>
        {interactive && legal.length === 1 && legal[0] === 'pass' && (
          <button type="button" className="btn" onClick={() => onAction('pass')} data-testid="pass">
            {t('action.pass')}
          </button>
        )}
      </div>
    </div>
  );
}
