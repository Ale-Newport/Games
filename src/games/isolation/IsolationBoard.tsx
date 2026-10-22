import { useState } from 'react';
import { moveCursor } from '../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { N, legalIsolationActions, stepsOf, type IsolationState } from './engine';
import styles from './IsolationBoard.module.css';

export const cellName = (p: number) => `${'abcdefg'[p % N]}${N - Math.floor(p / N)}`;

/** An original pawn token: a faceted gem on a round base. */
export function IsolationPawn({ seat, size }: { seat: 0 | 1; size?: number }) {
  const [hi, lo] = seat === 0 ? ['#ffe08a', '#d18b12'] : ['#8ff0c8', '#118a63'];
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      className={styles.pawnSvg}
    >
      <circle cx="20" cy="20" r="17" fill={lo} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <path d="M20 7 L31 17 L20 33 L9 17 Z" fill={hi} />
      <path d="M9 17 H31 M20 7 L15 17 L20 33 L25 17 Z" fill="none" stroke={lo} strokeWidth="1.2" />
    </svg>
  );
}

export function IsolationBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<IsolationState, string>) {
  const [cursor, setCursor] = useState(24);
  const legal = new Set(interactive ? legalIsolationActions(state) : []);
  const prefix = state.phase === 'move' ? 'm' : 'x';
  const hintCell = hint ? Number(hint.slice(1)) : -1;
  const lastRemoved = [...state.history].reverse().find((a) => a.startsWith('x'));
  const removedCell = lastRemoved ? Number(lastRemoved.slice(1)) : -1;
  const mobility = [stepsOf(state, 0).length, stepsOf(state, 1).length];

  const click = (p: number) => {
    setCursor(p);
    if (legal.has(`${prefix}${p}`)) onAction(`${prefix}${p}`);
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
    return false;
  });
  const label = (p: number) => {
    const who = state.pawns[0] === p ? 0 : state.pawns[1] === p ? 1 : null;
    const what =
      who !== null ? t(`cell.pawn${who}`) : state.tiles[p] ? t('cell.tile') : t('cell.hole');
    const can = legal.has(`${prefix}${p}`)
      ? `, ${t(prefix === 'm' ? 'cell.move' : 'cell.remove')}`
      : '';
    return `${cellName(p)}, ${what}${can}`;
  };
  return (
    <div
      className={`${styles.wrap} ${animate ? styles.animated : ''}`}
      data-testid="isolation-board"
    >
      <div
        className={`${styles.board} ${state.phase === 'remove' && interactive ? styles.removing : ''}`}
        role="grid"
        aria-label={t('board.label')}
      >
        {state.tiles.map((tile, p) => {
          const who = state.pawns[0] === p ? 0 : state.pawns[1] === p ? 1 : null;
          const can = legal.has(`${prefix}${p}`);
          const classes = [
            styles.cell,
            tile ? styles.tile : styles.hole,
            can && (prefix === 'm' ? styles.step : styles.removable),
            p === hintCell && styles.hint,
            p === removedCell && styles.justRemoved,
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
              onClick={() => click(p)}
            >
              {who !== null && (
                <span key={`${who}-${p}`} className={styles.pawn}>
                  <IsolationPawn seat={who} />
                </span>
              )}
              {can && prefix === 'm' && <span className={styles.dot} />}
            </button>
          );
        })}
      </div>
      <div className={styles.bar} data-testid="mobility">
        {t('info.mobility', { a: mobility[0]!, b: mobility[1]! })}
      </div>
    </div>
  );
}
