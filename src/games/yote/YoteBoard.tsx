import { useState } from 'react';
import { moveCursor } from '../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { COLS, ROWS, legalYoteActions, type YoteState } from './engine';
import styles from './YoteBoard.module.css';

export const squareName = (p: number) => `${'abcdef'[p % COLS]}${ROWS - Math.floor(p / COLS)}`;

function Tray({ seat, count, label }: { seat: 0 | 1; count: number; label: string }) {
  return (
    <div className={styles.tray} aria-label={label} data-testid={`hand-${seat}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`${styles.mini} ${seat === 0 ? styles.light : styles.dark}`} />
      ))}
    </div>
  );
}

export function YoteBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
  perspective,
}: BoardProps<YoteState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(14);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(null);
  }
  const legal = interactive ? legalYoteActions(state) : [];
  const places = new Set(legal.filter((a) => a.startsWith('+')).map((a) => Number(a.slice(1))));
  const removals = new Set(legal.filter((a) => /^x\d/.test(a)).map((a) => Number(a.slice(1))));
  const moves = legal
    .filter((a) => a.includes('-'))
    .map((a) => a.split('-').map(Number) as [number, number]);
  const movable = new Set(moves.map(([f]) => f));
  const targets = new Set(moves.filter(([f]) => f === selected).map(([, to]) => to));
  const last = state.history[state.history.length - 1];
  const lastCells = last && last !== 'xh' ? last.replace(/[+x]/, '').split('-').map(Number) : [];
  const hintCells = hint && hint !== 'xh' ? hint.replace(/[+x]/, '').split('-').map(Number) : [];

  const click = (p: number) => {
    if (!interactive) return;
    if (removals.has(p)) return onAction(`x${p}`);
    if (selected !== null && targets.has(p)) {
      setSelected(null);
      return onAction(`${selected}-${p}`);
    }
    if (movable.has(p) && p !== selected) return setSelected(p);
    if (places.has(p)) {
      setSelected(null);
      return onAction(`+${p}`);
    }
    setSelected(null);
  };
  useKeyboard((e) => {
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => moveCursor(c, dir, { rows: ROWS, cols: COLS }));
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
  const top = (1 - perspective) as 0 | 1;
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="yote-board">
      <Tray
        seat={top}
        count={state.hands[top]}
        label={t('hand.label', { seat: t(`seat.${top}`), n: state.hands[top] })}
      />
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {state.board.map((x, p) => {
          const classes = [
            styles.cell,
            (Math.floor(p / COLS) + p) % 2 === 0 ? styles.a : styles.b,
            selected === p && styles.selected,
            removals.has(p) && styles.removable,
            lastCells.includes(p) && styles.last,
            hintCells.includes(p) && styles.hint,
            cursor === p && styles.cursor,
          ];
          const extra = removals.has(p)
            ? 'cell.remove'
            : targets.has(p)
              ? 'cell.target'
              : places.has(p) && selected === null
                ? 'cell.place'
                : null;
          return (
            <button
              key={p}
              type="button"
              role="gridcell"
              className={classes.filter(Boolean).join(' ')}
              data-cell={p}
              aria-label={`${squareName(p)}, ${t(x === 0 ? 'cell.empty' : x === 1 ? 'cell.light' : 'cell.dark')}${extra ? `, ${t(extra)}` : ''}`}
              onClick={() => {
                setCursor(p);
                click(p);
              }}
            >
              {x !== 0 && (
                <span
                  key={`${p}-${x}`}
                  className={`${styles.piece} ${x === 1 ? styles.light : styles.dark}`}
                />
              )}
              {targets.has(p) && <span className={styles.dot} />}
            </button>
          );
        })}
      </div>
      <Tray
        seat={perspective}
        count={state.hands[perspective]}
        label={t('hand.label', { seat: t(`seat.${perspective}`), n: state.hands[perspective] })}
      />
      {legal.includes('xh') && (
        <button
          type="button"
          className="btn btn-primary"
          data-testid="from-hand"
          onClick={() => onAction('xh')}
        >
          {t('action.fromHand')}
        </button>
      )}
    </div>
  );
}
