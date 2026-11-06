import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { ComponentType } from 'react';
import type { Translator } from '../../../core/i18n';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { COLS, ROWS, parseSquare, squareName, type Side } from './position';
import styles from './XiangqiBoard.module.css';

/** What the point board needs from a xiangqi-family position. */
export interface PointPosition<M extends { from: number; to: number; captured: number }> {
  board: Int8Array;
  side: Side;
  generals: [number, number];
  legalMoves(): M[];
  inCheck(): boolean;
}

export interface PointBoardConfig<S, M extends { from: number; to: number; captured: number }> {
  positionOf: (s: S) => PointPosition<M>;
  moveAction: (m: M) => string;
  Piece: ComponentType<{ type: number; side: Side }>;
  pieceName: (type: number, side: Side, t: Translator) => string;
  /** Xiangqi draws the river (gap in the files and its inscription); janggi does not. */
  river: boolean;
  /** Action for passing, when the game allows it (janggi). */
  passAction?: string;
}

function Lines({ river }: { river: boolean }) {
  const x = (c: number) => 50 + c * 100;
  const y = (r: number) => 50 + r * 100;
  const lines: string[] = [];
  for (let r = 0; r < ROWS; r++) lines.push(`M${x(0)} ${y(r)} H${x(8)}`);
  for (let c = 0; c < COLS; c++) {
    if (c === 0 || c === 8 || !river) lines.push(`M${x(c)} ${y(0)} V${y(9)}`);
    else lines.push(`M${x(c)} ${y(0)} V${y(4)} M${x(c)} ${y(5)} V${y(9)}`);
  }
  // Palace diagonals.
  lines.push(`M${x(3)} ${y(0)} L${x(5)} ${y(2)} M${x(5)} ${y(0)} L${x(3)} ${y(2)}`);
  lines.push(`M${x(3)} ${y(7)} L${x(5)} ${y(9)} M${x(5)} ${y(7)} L${x(3)} ${y(9)}`);
  return (
    <svg
      className={styles.lines}
      viewBox="0 0 900 1000"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d={lines.join(' ')} stroke="#5b3a1a" strokeWidth="3" fill="none" />
      {river && (
        <>
          <text x="250" y="518" textAnchor="middle" fontSize="44" fill="#5b3a1a" opacity="0.55">
            楚 河
          </text>
          <text x="650" y="518" textAnchor="middle" fontSize="44" fill="#5b3a1a" opacity="0.55">
            漢 界
          </text>
        </>
      )}
    </svg>
  );
}

function actionSquares(action: string | null | undefined): number[] {
  const m = action && /^([a-i]\d)([a-i]\d)$/.exec(action);
  return m ? [parseSquare(m[1]!), parseSquare(m[2]!)] : [];
}

export function createPointBoard<
  S extends { history: string[]; notation: string[] },
  M extends { from: number; to: number; captured: number },
>(config: PointBoardConfig<S, M>) {
  const { positionOf, moveAction, Piece, pieceName, river, passAction } = config;
  return function XiangqiBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
    perspective,
  }: BoardProps<S, string>) {
    const pos = useMemo(() => positionOf(state), [state]);
    const moves = useMemo(() => (interactive ? pos.legalMoves() : []), [pos, interactive]);
    const turn = state.history.length;
    const [selected, setSelected] = useState<number | null>(null);
    const [cursor, setCursor] = useState(() => 85);
    const [focusToken, setFocusToken] = useState(0);
    const [lastTurn, setLastTurn] = useState(turn);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const listRef = useRef<HTMLOListElement>(null);
    if (lastTurn !== turn) {
      setLastTurn(turn);
      setSelected(null);
    }
    const sqAt = (u: number) => (perspective === 0 ? u : 89 - u);
    const uiOf = (sq: number) => (perspective === 0 ? sq : 89 - sq);
    const targets = new Map<number, M>();
    for (const m of moves) if (m.from === selected) targets.set(m.to, m);
    const movable = new Set(moves.map((m) => m.from));

    const click = (sq: number) => {
      setCursor(uiOf(sq));
      if (!interactive) return;
      const m = targets.get(sq);
      if (m) {
        setSelected(null);
        return onAction(moveAction(m));
      }
      if (movable.has(sq)) return setSelected(sq === selected ? null : sq);
      if (selected !== null) return setSelected(null);
      const code = pos.board[sq]!;
      if (code !== 0 && (code > 0 ? 0 : 1) === pos.side) onAction('');
    };

    useEffect(() => {
      if (focusToken > 0) refs.current[cursor]?.focus();
    }, [focusToken, cursor]);
    useEffect(() => {
      const list = listRef.current;
      if (list) list.scrollLeft = list.scrollWidth;
    }, [turn]);

    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir) {
        setCursor((c) => moveCursor(c, dir, { rows: ROWS, cols: COLS }));
        setFocusToken((k) => k + 1);
        return true;
      }
      if (e.key === 'Escape' && selected !== null) {
        setSelected(null);
        return true;
      }
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        click(sqAt(cursor));
        return true;
      }
      return false;
    });

    const last = actionSquares(state.history[state.history.length - 1]);
    const hinted = actionSquares(hint);
    const checked = pos.inCheck() ? pos.generals[pos.side] : -1;

    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        style={{ '--cols': COLS, '--rows': ROWS } as CSSProperties}
        data-testid="xiangqi-board"
      >
        <div className={styles.frame}>
          <div
            className={styles.board}
            role="grid"
            aria-label={t('board.label')}
            data-flipped={perspective === 1}
          >
            <Lines river={river} />
            {Array.from({ length: ROWS }, (_, r) => (
              <div key={r} role="row" className={styles.row}>
                {Array.from({ length: COLS }, (_, c) => {
                  const u = r * COLS + c;
                  const sq = sqAt(u);
                  const code = pos.board[sq]!;
                  const side: Side = code > 0 ? 0 : 1;
                  const target = targets.get(sq);
                  const label = [
                    squareName(sq),
                    code ? pieceName(Math.abs(code), side, t) : t('sq.empty'),
                    selected === sq ? t('sq.selected') : '',
                    target ? t(code ? 'sq.capture' : 'sq.target') : '',
                    checked === sq ? t('sq.check') : '',
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <button
                      key={u}
                      ref={(el) => {
                        refs.current[u] = el;
                      }}
                      type="button"
                      role="gridcell"
                      className={[
                        styles.point,
                        selected === sq ? styles.selected : '',
                        last.includes(sq) ? styles.last : '',
                        hinted.includes(sq) ? styles.hint : '',
                        checked === sq ? styles.check : '',
                      ].join(' ')}
                      data-square={squareName(sq)}
                      tabIndex={u === cursor ? 0 : -1}
                      aria-label={label}
                      aria-disabled={!interactive || (!movable.has(sq) && !target)}
                      onClick={() => click(sq)}
                      onFocus={() => setCursor(u)}
                    >
                      {code !== 0 && (
                        <span
                          key={last[1] === sq ? `placed-${turn}` : 'still'}
                          className={`${styles.piece} ${last[1] === sq ? styles.placed : ''}`}
                        >
                          <Piece type={Math.abs(code)} side={side} />
                        </span>
                      )}
                      {target && <span className={code ? styles.ring : styles.dot} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {passAction && interactive && !pos.inCheck() && (
          <button
            type="button"
            className={`btn ${styles.pass}`}
            onClick={() => onAction(passAction)}
            data-testid="pass"
          >
            {t('action.pass')}
          </button>
        )}
        <ol
          ref={listRef}
          className={styles.moves}
          aria-label={t('moves.label')}
          data-testid="move-list"
        >
          {state.notation.length === 0 && <li className={styles.empty}>{t('moves.none')}</li>}
          {state.notation.map((n, i) => (
            <li key={i} data-current={i === state.notation.length - 1}>
              {i % 2 === 0 && <span className={styles.moveNo}>{i / 2 + 1}.</span>}
              {n}
            </li>
          ))}
        </ol>
      </div>
    );
  };
}
