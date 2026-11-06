import { useEffect, useRef, useState } from 'react';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import { Mark } from '../shared/mnk/MnkBoard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { gridToIndex, indexToGrid, playableBoards, type UtttState } from './engine';
import styles from './UtttBoard.module.css';

/** Numeric-keypad layout for the 9 cells of the forced local board. */
const NUMPAD: Record<string, number> = {
  '7': 0,
  '8': 1,
  '9': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '1': 6,
  '2': 7,
  '3': 8,
};

/** Board centers in a 300×300 coordinate space (for the global win line). */
const center = (b: number) => [(b % 3) * 100 + 50, Math.floor(b / 3) * 100 + 50] as const;

export function UtttBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<UtttState, number>) {
  const [cursor, setCursor] = useState(40);
  const [focusToken, setFocusToken] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const playable = new Set(playableBoards(state));
  const lastMove = state.history.length ? state.history[state.history.length - 1]! : null;

  useEffect(() => {
    if (focusToken > 0) refs.current[cursor]?.focus();
  }, [focusToken, cursor]);

  useKeyboard((e) => {
    const dir = arrowDirection(e.key);
    if (dir) {
      const [r, c] = indexToGrid(cursor);
      const nr = Math.min(8, Math.max(0, r + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0)));
      const nc = Math.min(8, Math.max(0, c + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0)));
      setCursor(gridToIndex(nr, nc));
      setFocusToken((n) => n + 1);
      return true;
    }
    if (e.key in NUMPAD) {
      if (state.forced < 0) return false;
      const index = state.forced * 9 + NUMPAD[e.key]!;
      setCursor(index);
      onAction(index);
      return true;
    }
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
      onAction(cursor);
      return true;
    }
    return false;
  });

  const result = state.result;
  const statusLabel = (b: number) => {
    const status = state.boards[b];
    if (status === 1) return t('board.wonX');
    if (status === 2) return t('board.wonO');
    if (status === 3) return t('board.drawn');
    return playable.has(b) ? t('board.playable') : t('board.open');
  };

  return (
    <div
      className={`${styles.board} ${animate ? styles.animated : ''}`}
      data-testid="uttt-board"
      data-forced={state.forced}
      role="group"
      aria-label={t('board.label')}
    >
      {Array.from({ length: 9 }, (_, b) => {
        const status = state.boards[b]!;
        const isPlayable = playable.has(b) && !result;
        return (
          <div
            key={b}
            role="group"
            aria-label={t('local.label', { n: b + 1, status: statusLabel(b) })}
            className={`${styles.local} ${isPlayable ? styles.playable : ''} ${status !== 0 ? styles.closed : ''} ${isPlayable && interactive ? styles.yourTurn : ''}`}
            data-board={b}
            data-status={status}
            data-playable={isPlayable}
          >
            {Array.from({ length: 9 }, (_, c) => {
              const index = b * 9 + c;
              const mark = state.cells[index]!;
              const legal = isPlayable && mark === 0;
              return (
                <button
                  key={c}
                  ref={(el) => {
                    refs.current[index] = el;
                  }}
                  type="button"
                  className={`${styles.cell} ${lastMove === index ? styles.last : ''} ${hint === index ? styles.hint : ''}`}
                  data-cell={index}
                  tabIndex={index === cursor ? 0 : -1}
                  aria-disabled={!legal || !interactive}
                  aria-label={t('cell.label', {
                    n: b + 1,
                    row: Math.floor(c / 3) + 1,
                    col: (c % 3) + 1,
                    state: t(mark === 1 ? 'cell.x' : mark === 2 ? 'cell.o' : 'cell.empty'),
                  })}
                  onClick={() => onAction(index)}
                  onFocus={() => setCursor(index)}
                >
                  {mark !== 0 && <Mark cell={mark} drawIn={animate && lastMove === index} />}
                  {mark === 0 && legal && interactive && (
                    <Mark cell={state.toMove === 0 ? 1 : 2} className={styles.ghost} />
                  )}
                </button>
              );
            })}
            {(status === 1 || status === 2) && (
              <div className={styles.captured} aria-hidden="true">
                <Mark
                  cell={status}
                  drawIn={animate && lastMove !== null && Math.floor(lastMove / 9) === b}
                />
              </div>
            )}
            {status === 3 && <div className={styles.drawn} aria-hidden="true" />}
          </div>
        );
      })}
      {result?.kind === 'win' && (
        <svg className={styles.winOverlay} viewBox="0 0 300 300" aria-hidden="true">
          {(() => {
            const [ax, ay] = center(result.line[0]!);
            const [bx, by] = center(result.line[2]!);
            const len = Math.hypot(bx - ax, by - ay);
            const ux = (bx - ax) / len;
            const uy = (by - ay) / len;
            return (
              <line
                x1={ax - ux * 36}
                y1={ay - uy * 36}
                x2={bx + ux * 36}
                y2={by + uy * 36}
                pathLength={1}
                className={`${styles.winLine} ${result.winner === 0 ? styles.lineX : styles.lineO}`}
              />
            );
          })()}
        </svg>
      )}
    </div>
  );
}
