import { Crown } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import type { Seat } from '../two-player/match';
import {
  capturedBy,
  isKing,
  isPlayable,
  legalMoves,
  seatOf,
  squareNumber,
  type DraughtsState,
  type DraughtsVariant,
  type Move,
} from './engine';
import styles from './DraughtsBoard.module.css';

/** Which piece color each seat uses: seat 0 dark (English) or seat 0 light (International, Spanish). */
export type SeatColors = readonly ['dark' | 'light', 'dark' | 'light'];

export function makePieceIcon(colors: SeatColors) {
  return function PieceIcon({ seat, size }: { seat: Seat; size: number }) {
    const dark = colors[seat] === 'dark';
    return (
      <svg width={size + 4} height={size + 4} viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="44"
          fill={dark ? '#2a1a14' : '#f1e3c6'}
          stroke={dark ? '#6b4a3a' : '#b99b6a'}
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke={dark ? '#6b4a3a' : '#c9ad7c'}
          strokeWidth="5"
        />
      </svg>
    );
  };
}

export function createDraughtsBoard(v: DraughtsVariant, colors: SeatColors) {
  const n = v.size;
  return function DraughtsBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
  }: BoardProps<DraughtsState, Move>) {
    const [cursor, setCursor] = useState(() => (n - 3) * n + 1);
    const [focusToken, setFocusToken] = useState(0);
    const [prefix, setPrefix] = useState<number[]>([]);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const moves = interactive ? legalMoves(v, state) : [];
    const turn = state.history.length;
    const [lastTurn, setLastTurn] = useState(turn);
    if (lastTurn !== turn) {
      // A new position: drop any half-entered move.
      setLastTurn(turn);
      setPrefix([]);
    }

    const startsWith = (m: Move, p: number[]) => p.every((sqr, k) => m[k] === sqr);
    const candidates = prefix.length ? moves.filter((m) => startsWith(m, prefix)) : moves;
    const movable = new Set(moves.map((m) => m[0]!));
    const nextSteps = new Set(
      prefix.length
        ? candidates.filter((m) => m.length > prefix.length).map((m) => m[prefix.length]!)
        : [],
    );
    const previewCaptured = new Set(
      prefix.length > 1
        ? candidates.flatMap((m) => capturedBy(v, state, m).filter((c) => isOnPath(m, prefix, c)))
        : [],
    );
    const lastMove = state.history[state.history.length - 1];
    const lastSquares = new Set(lastMove ?? []);

    function isOnPath(m: Move, p: number[], c: number): boolean {
      // A captured square lies between consecutive path squares of the entered prefix.
      for (let k = 1; k < p.length; k++) {
        const a = m[k - 1]!;
        const b = m[k]!;
        const ar = Math.floor(a / n),
          ac = a % n,
          br = Math.floor(b / n),
          bc = b % n;
        const cr = Math.floor(c / n),
          cc = c % n;
        if (
          (cr - ar) * (bc - ac) === (cc - ac) * (br - ar) &&
          Math.min(ar, br) < cr &&
          cr < Math.max(ar, br)
        )
          return true;
      }
      return false;
    }

    const click = (i: number) => {
      setCursor(i);
      if (!interactive) return;
      if (prefix.length === 0 || (movable.has(i) && !nextSteps.has(i))) {
        if (movable.has(i)) setPrefix([i]);
        else onAction([i]); // illegal: lets the shell give feedback
        return;
      }
      if (!nextSteps.has(i)) {
        setPrefix([]);
        return;
      }
      const next = [...prefix, i];
      const complete = candidates.find((m) => m.length === next.length && startsWith(m, next));
      const longer = candidates.some((m) => m.length > next.length && startsWith(m, next));
      if (complete && !longer) {
        setPrefix([]);
        onAction(complete);
      } else setPrefix(next);
    };

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
      if (e.key === 'Escape' && prefix.length) {
        setPrefix([]);
        return true;
      }
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        click(cursor);
        return true;
      }
      return false;
    });

    const hintSet = new Set(hint ?? []);
    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        style={{ '--n': n } as CSSProperties}
        data-testid="draughts-board"
      >
        <div className={styles.board} role="grid" aria-label={t('board.label')}>
          {Array.from({ length: n }, (_, r) => (
            <div key={r} role="row" className={styles.row}>
              {Array.from({ length: n }, (_, c) => {
                const i = r * n + c;
                const playable = isPlayable(v, i);
                const piece = state.board[i]!;
                const seat = seatOf(piece);
                const selectable =
                  interactive &&
                  (prefix.length === 0 ? movable.has(i) : nextSteps.has(i) || movable.has(i));
                const label = !playable
                  ? ''
                  : t(
                      seat === null
                        ? 'sq.empty'
                        : isKing(piece)
                          ? `sq.king${seat}`
                          : `sq.man${seat}`,
                      { n: squareNumber(v, i), seat0: t('piece.0'), seat1: t('piece.1') },
                    ) +
                    (nextSteps.has(i)
                      ? `, ${t('sq.target')}`
                      : movable.has(i) && interactive
                        ? `, ${t('sq.movable')}`
                        : '');
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    type="button"
                    role="gridcell"
                    className={`${styles.square} ${playable ? styles.dark : styles.light} ${prefix[0] === i ? styles.selected : ''} ${lastSquares.has(i) ? styles.last : ''} ${hintSet.has(i) ? styles.hint : ''}`}
                    data-square={i}
                    tabIndex={i === cursor ? 0 : -1}
                    aria-label={label || undefined}
                    aria-hidden={playable ? undefined : true}
                    aria-disabled={!selectable}
                    disabled={!playable}
                    onClick={() => click(i)}
                    onFocus={() => setCursor(i)}
                  >
                    {seat !== null && (
                      <span
                        className={`${styles.piece} ${colors[seat] === 'dark' ? styles.darkPiece : styles.lightPiece} ${previewCaptured.has(i) ? styles.doomed : ''} ${movable.has(i) && interactive && prefix.length === 0 ? styles.canMove : ''}`}
                      >
                        {isKing(piece) && <Crown className={styles.crown} aria-hidden="true" />}
                      </span>
                    )}
                    {nextSteps.has(i) && <span className={styles.target} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
}
