import { useState } from 'react';
import { moveCursor } from '../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { N, type Letter, type SosState } from './engine';
import styles from './SosBoard.module.css';

export const cellName = (p: number) => `${'abcdef'[p % N]}${N - Math.floor(p / N)}`;

const center = (p: number) => ({ x: (p % N) + 0.5, y: Math.floor(p / N) + 0.5 });

export function SosBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<SosState, string>) {
  const [letter, setLetter] = useState<Letter>('S');
  const [cursor, setCursor] = useState(14);
  const last = state.history[state.history.length - 1];
  const lastCell = last ? Number(last.slice(1)) : -1;
  const hintCell = hint ? Number(hint.slice(1)) : -1;
  const place = (p: number) => {
    if (interactive && !state.cells[p]) onAction(`${letter}${p}`);
  };
  useKeyboard((e) => {
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => moveCursor(c, dir, { rows: N, cols: N }));
      return true;
    }
    if (e.key === 's' || e.key === 'S' || e.key === 'o' || e.key === 'O' || e.key === '0') {
      setLetter(e.key.toUpperCase() === 'S' ? 'S' : 'O');
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      place(cursor);
      return true;
    }
    return false;
  });
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="sos-board">
      <div className={styles.picker} role="radiogroup" aria-label={t('letter.label')}>
        {(['S', 'O'] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={letter === l}
            className={`${styles.letterBtn} ${letter === l ? styles.active : ''}`}
            onClick={() => setLetter(l)}
            data-testid={`letter-${l}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className={styles.boardBox}>
        <div className={styles.grid} role="grid" aria-label={t('board.label')}>
          {state.cells.map((v, p) => (
            <button
              key={p}
              type="button"
              role="gridcell"
              className={[
                styles.cell,
                !v && interactive && styles.can,
                p === lastCell && styles.last,
                p === hintCell && styles.hint,
                cursor === p && styles.cursor,
              ]
                .filter(Boolean)
                .join(' ')}
              data-cell={p}
              aria-label={`${cellName(p)}, ${v || t('cell.empty')}`}
              aria-disabled={Boolean(v) || !interactive}
              onClick={() => {
                setCursor(p);
                place(p);
              }}
            >
              {v ? (
                <span key={v} className={styles.letter}>
                  {v}
                </span>
              ) : (
                interactive && <span className={styles.ghost}>{letter}</span>
              )}
            </button>
          ))}
        </div>
        <svg className={styles.overlay} viewBox={`0 0 ${N} ${N}`} aria-hidden="true">
          {state.lines.map(({ cells: [a, , c], seat }, i) => {
            const p = center(a);
            const q = center(c);
            return (
              <line
                key={i}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                className={`${styles.sos} ${seat === 0 ? styles.seat0 : styles.seat1}`}
              />
            );
          })}
        </svg>
      </div>
      <div className={styles.bar} data-testid="scores">
        {t('info.scores', { a: state.scores[0], b: state.scores[1] })}
      </div>
    </div>
  );
}
