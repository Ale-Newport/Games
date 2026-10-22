import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { legalChompActions, type ChompState } from './engine';
import styles from './ChompBoard.module.css';

export const squareName = (r: number, c: number) => `${'ABCDEFGH'[c]}${r + 1}`;

/** Original poison mark: a green drop with a cross. */
function Poison() {
  return (
    <svg viewBox="0 0 20 20" className={styles.poisonMark} aria-hidden="true">
      <path
        d="M10 2 C13 7 16 10 16 13 A6 6 0 0 1 4 13 C4 10 7 7 10 2 Z"
        fill="#7ee08a"
        stroke="#1f5c2a"
        strokeWidth="1.2"
      />
      <path
        d="M7.5 11 L12.5 16 M12.5 11 L7.5 16"
        stroke="#1f5c2a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChompBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<ChompState, string>) {
  const [rowsN, colsN] = state.size;
  const [pick, setPick] = useState<[number, number] | null>(null);
  const [cursor, setCursor] = useState<[number, number]>([rowsN - 1, colsN - 1]);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setPick(null);
  }
  const legal = new Set(interactive ? legalChompActions(state) : []);
  const present = (r: number, c: number) => c < state.rows[r]!;
  const inBite = (b: [number, number] | null, r: number, c: number) =>
    b !== null && r >= b[0] && c >= b[1] && present(r, c);
  const hintAt = hint ? (hint.split(',').map(Number) as [number, number]) : null;
  const eatenCount = pick
    ? state.rows.reduce((n, len, i) => n + (i >= pick[0] ? Math.max(0, len - pick[1]) : 0), 0)
    : 0;

  const choose = (r: number, c: number) => {
    if (!legal.has(`${r},${c}`)) return;
    if (pick && pick[0] === r && pick[1] === c) {
      setPick(null);
      return onAction(`${r},${c}`);
    }
    setPick([r, c]);
  };
  useKeyboard((e) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const d = moves[e.key];
    if (d) {
      setCursor(([r, c]) => [(r + d[0] + rowsN) % rowsN, (c + d[1] + colsN) % colsN]);
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      choose(cursor[0], cursor[1]);
      return true;
    }
    if (e.key === 'Escape' && pick) {
      setPick(null);
      return true;
    }
    return false;
  });
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="chomp-board">
      <div
        className={styles.bar}
        role="grid"
        aria-label={t('board.label')}
        style={{
          gridTemplateColumns: `repeat(${colsN}, 1fr)`,
          gridTemplateRows: `repeat(${rowsN}, 1fr)`,
          aspectRatio: `${colsN} / ${rowsN}`,
        }}
      >
        {Array.from({ length: rowsN * colsN }, (_, i) => {
          const r = Math.floor(i / colsN);
          const c = i % colsN;
          const here = present(r, c);
          const poison = r === 0 && c === 0;
          const can = legal.has(`${r},${c}`);
          const classes = [
            styles.square,
            here ? styles.piece : styles.crumb,
            poison && styles.poison,
            inBite(pick, r, c) && styles.bitten,
            inBite(hintAt, r, c) && styles.hint,
            can && styles.can,
            cursor[0] === r && cursor[1] === c && styles.cursor,
          ];
          const what = !here ? t('square.eaten') : poison ? t('square.poison') : t('square.piece');
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              className={classes.filter(Boolean).join(' ')}
              data-square={`${r},${c}`}
              aria-label={`${squareName(r, c)}, ${what}`}
              aria-disabled={!can}
              onClick={() => {
                setCursor([r, c]);
                choose(r, c);
              }}
            >
              {here && poison && <Poison />}
            </button>
          );
        })}
      </div>
      <div className={styles.actions}>
        {pick && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setPick(null);
              onAction(`${pick[0]},${pick[1]}`);
            }}
            data-testid="eat"
          >
            {t('action.eat', { n: eatenCount })}
          </button>
        )}
      </div>
    </div>
  );
}
