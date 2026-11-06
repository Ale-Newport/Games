import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import type { Seat } from '../two-player/match';
import { legalActions, passAction, type ReversiRules, type ReversiState } from './engine';
import styles from './ReversiBoard.module.css';

export const squareName = (i: number, n: number) =>
  `${'abcdefghijklmnop'[i % n]}${Math.floor(i / n) + 1}`;

/** Disc used on the board and as the shell's seat icon. */
export function DiscIcon({ seat, size }: { seat: Seat; size: number }) {
  return (
    <svg width={size + 4} height={size + 4} viewBox="0 0 100 100" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="44"
        fill={seat === 0 ? '#16181f' : '#f2f3f7'}
        stroke={seat === 0 ? '#555b6b' : '#a4aab8'}
        strokeWidth="6"
      />
    </svg>
  );
}

export function createReversiBoard(rules: ReversiRules) {
  const n = rules.size;
  const pass = passAction(rules);
  return function ReversiBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
  }: BoardProps<ReversiState, number>) {
    const [cursor, setCursor] = useState(Math.floor(n / 2) * n + Math.floor(n / 2) - 1);
    const [focusToken, setFocusToken] = useState(0);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const legal = new Set(state.result ? [] : legalActions(rules, state));
    const mustPass = legal.has(pass);
    const last = state.history.length ? state.history[state.history.length - 1]! : -1;
    const flipped = new Set(state.lastFlipped);

    useEffect(() => {
      if (focusToken > 0) refs.current[cursor]?.focus();
    }, [focusToken, cursor]);

    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir) {
        setCursor((c) => moveCursor(c, dir, { rows: n, cols: n }));
        setFocusToken((k) => k + 1);
        return true;
      }
      if (e.key.toLowerCase() === 'p' && interactive && mustPass) {
        onAction(pass);
        return true;
      }
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        onAction(cursor);
        return true;
      }
      return false;
    });

    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        style={{ '--n': n } as CSSProperties}
        data-testid="reversi-board"
      >
        <div className={styles.colLabels} aria-hidden="true">
          {Array.from({ length: n }, (_, c) => (
            <span key={c}>{'abcdefghijklmnop'[c]}</span>
          ))}
        </div>
        <div className={styles.body}>
          <div className={styles.rowLabels} aria-hidden="true">
            {Array.from({ length: n }, (_, r) => (
              <span key={r}>{r + 1}</span>
            ))}
          </div>
          <div className={styles.board} role="grid" aria-label={t('board.label')}>
            {Array.from({ length: n }, (_, r) => (
              <div key={r} role="row" className={styles.row}>
                {Array.from({ length: n }, (_, c) => {
                  const i = r * n + c;
                  const disc = state.board[i]!;
                  const isLegal = interactive && legal.has(i);
                  return (
                    <button
                      key={i}
                      ref={(el) => {
                        refs.current[i] = el;
                      }}
                      type="button"
                      role="gridcell"
                      className={`${styles.square} ${i === hint ? styles.hint : ''}`}
                      data-square={i}
                      tabIndex={i === cursor ? 0 : -1}
                      aria-label={t(
                        disc === 1
                          ? 'square.black'
                          : disc === 2
                            ? 'square.white'
                            : isLegal
                              ? 'square.legal'
                              : 'square.empty',
                        { square: squareName(i, n) },
                      )}
                      aria-disabled={!isLegal}
                      onClick={() => onAction(i)}
                      onFocus={() => setCursor(i)}
                    >
                      {disc !== 0 && (
                        <span
                          key={`${i}-${disc}-${state.history.length}`}
                          className={`${styles.disc} ${disc === 1 ? styles.black : styles.white} ${flipped.has(i) ? styles.flip : ''} ${i === last ? styles.placed : ''}`}
                        />
                      )}
                      {isLegal && (
                        <span
                          className={`${styles.dot} ${state.toMove === 0 ? styles.dotBlack : styles.dotWhite}`}
                        />
                      )}
                      {i === last && <span className={styles.lastMark} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {interactive && mustPass && (
          <div className={styles.passBar}>
            <span>{t('pass.none')}</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onAction(pass)}
              data-testid="pass-button"
            >
              {t('pass.button')}
            </button>
          </div>
        )}
      </div>
    );
  };
}
