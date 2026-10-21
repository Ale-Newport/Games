import { RotateCcw, RotateCw } from 'lucide-react';
import { useState } from 'react';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { legalPentagoActions, type PentagoState } from './engine';
import styles from './PentagoBoard.module.css';

export const cellName = (p: number) => `${'abcdef'[p % 6]}${6 - Math.floor(p / 6)}`;

export function PentagoBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<PentagoState, string>) {
  const [pending, setPending] = useState<number | null>(null);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setPending(null);
  }
  const legal = interactive ? legalPentagoActions(state) : [];
  const last = state.history[state.history.length - 1];
  const lastTwist = last?.split(':')[1];
  const lastCell = last ? Number(last.split(':')[0]) : -1;
  const [hintCell, hintTwist] = hint ? hint.split(':') : [];
  const winLine = new Set(state.result?.kind === 'win' ? state.result.line : []);
  const color = state.toMove + 1;
  const board = state.board.slice();
  if (pending !== null) board[pending] = color;

  const clickCell = (p: number) => {
    if (!interactive) return;
    if (state.board[p] !== 0) return onAction('');
    if (legal.includes(String(p))) return onAction(String(p)); // five already: no twist
    setPending(pending === p ? null : p);
  };
  const doTwist = (q: number, dir: 'R' | 'L') => {
    if (pending === null) return;
    onAction(`${pending}:${q}${dir}`);
  };

  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="pentago-board">
      <p className={styles.prompt} role="status">
        {interactive ? t(pending === null ? 'prompt.place' : 'prompt.twist') : ''}
      </p>
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {[0, 1, 2, 3].map((q) => {
          const r0 = q < 2 ? 0 : 3;
          const c0 = q % 2 === 0 ? 0 : 3;
          const spun =
            animate && lastTwist?.[0] === String(q)
              ? lastTwist[1] === 'R'
                ? styles.spunR
                : styles.spunL
              : '';
          return (
            <div key={q} className={styles.quadrantWrap} data-quadrant={q}>
              <div
                key={`${q}-${state.history.length}`}
                className={`${styles.quadrant} ${spun} ${hintTwist?.[0] === String(q) ? styles.hint : ''}`}
              >
                {Array.from({ length: 9 }, (_, k) => {
                  const p = (r0 + Math.floor(k / 3)) * 6 + c0 + (k % 3);
                  const v = board[p]!;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="gridcell"
                      className={`${styles.cell} ${winLine.has(p) ? styles.win : ''} ${Number(hintCell) === p && hint ? styles.hintCell : ''}`}
                      data-cell={p}
                      aria-label={`${cellName(p)}, ${t(v === 0 ? 'cell.empty' : v === 1 ? 'cell.white' : 'cell.black')}`}
                      aria-disabled={!interactive || state.board[p] !== 0}
                      onClick={() => clickCell(p)}
                    >
                      {v !== 0 && (
                        <span
                          className={`${styles.marble} ${v === 1 ? styles.white : styles.black} ${pending === p ? styles.pending : ''} ${lastCell === p ? styles.last : ''}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {pending !== null && interactive && (
                <div className={styles.twists}>
                  <button
                    type="button"
                    className={styles.twist}
                    onClick={() => doTwist(q, 'L')}
                    aria-label={t('twist.left', { q: q + 1 })}
                    data-testid={`twist-${q}L`}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.twist}
                    onClick={() => doTwist(q, 'R')}
                    aria-label={t('twist.right', { q: q + 1 })}
                    data-testid={`twist-${q}R`}
                  >
                    <RotateCw size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
