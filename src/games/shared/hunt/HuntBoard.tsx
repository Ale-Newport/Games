import { useState, type ComponentType } from 'react';
import { useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { legalHuntActions, stepFrom, type HuntState, type HuntVariant } from './engine';
import styles from './HuntBoard.module.css';

export const pointName = (v: HuntVariant, p: number) =>
  `${'abcdefg'[p % v.size]}${v.size - Math.floor(p / v.size)}`;

/** Original piece art: prey as round white birds/goats, hunters as orange beasts. */
export function HuntPiece({ kind, tiger }: { kind: 'prey' | 'hunter'; tiger: boolean }) {
  if (kind === 'prey')
    return (
      <g>
        <circle r="3.3" className={styles.prey} />
        <path
          d="M-1.1 -0.7 a0.45 0.45 0 1 0 0.01 0 M1.1 -0.7 a0.45 0.45 0 1 0 0.01 0"
          className={styles.eyes}
        />
        <path
          d={tiger ? 'M-0.9 1.2 Q0 1.9 0.9 1.2' : 'M-0.6 0.7 L0 1.6 L0.6 0.7 Z'}
          className={tiger ? styles.mouth : styles.beak}
        />
      </g>
    );
  return (
    <g>
      <path
        d="M-3 -1.4 L-2.6 -3.6 L-1 -2.6 Z M3 -1.4 L2.6 -3.6 L1 -2.6 Z"
        className={styles.ears}
      />
      <circle r="3.4" className={styles.hunter} />
      {tiger && (
        <path
          d="M-3 0 L-1.8 0.2 M3 0 L1.8 0.2 M-0.4 -3.2 L-0.2 -2.1 M0.4 -3.2 L0.2 -2.1"
          className={styles.stripes}
        />
      )}
      <path
        d="M-1.2 -0.6 a0.45 0.45 0 1 0 0.01 0 M1.2 -0.6 a0.45 0.45 0 1 0 0.01 0"
        className={styles.eyes}
      />
      <path d="M-0.5 0.8 L0 1.3 L0.5 0.8 Z" className={styles.nose} />
    </g>
  );
}

const GAP = 10;
const PAD = 6;

export function createHuntBoard(
  v: HuntVariant,
  tiger: boolean,
): ComponentType<BoardProps<HuntState, string>> {
  const W = PAD * 2 + GAP * (v.size - 1);
  const xy = (p: number) => ({
    x: PAD + (p % v.size) * GAP,
    y: PAD + Math.floor(p / v.size) * GAP,
  });
  const segments = (board: readonly number[]) => {
    const out: [number, number][] = [];
    for (const p of v.points)
      for (const d of [1, 3, 6, 7]) {
        const q = stepFrom(v, board, p, d);
        if (q >= 0) out.push([p, q]);
      }
    return out;
  };
  return function HuntBoard({ state, interactive, hint, animate, t, onAction }) {
    const [selected, setSelected] = useState<number | null>(null);
    const [cursor, setCursor] = useState(v.points[Math.floor(v.points.length / 2)]!);
    const [turn, setTurn] = useState(state.history.length);
    if (turn !== state.history.length) {
      setTurn(state.history.length);
      setSelected(state.chain);
    }
    const legal = interactive ? legalHuntActions(v, state) : [];
    const placements = new Set(
      legal.filter((a) => a.startsWith('+')).map((a) => Number(a.slice(1))),
    );
    const moves = legal
      .filter((a) => a.includes('-'))
      .map((a) => a.split('-').map(Number) as [number, number]);
    const movable = new Set(moves.map(([f]) => f));
    const from = state.chain ?? selected;
    const targets = new Set(moves.filter(([f]) => f === from).map(([, to]) => to));
    const last = state.history[state.history.length - 1];
    const lastPts = last && last !== 'stop' ? last.replace('+', '').split('-').map(Number) : [];
    const hintPts = hint && hint !== 'stop' ? hint.replace('+', '').split('-').map(Number) : [];
    const click = (p: number) => {
      if (!interactive) return;
      if (placements.has(p)) return onAction(`+${p}`);
      if (from !== null && targets.has(p)) {
        setSelected(null);
        return onAction(`${from}-${p}`);
      }
      if (state.chain === null) setSelected(movable.has(p) && p !== selected ? p : null);
    };
    useKeyboard((e) => {
      const delta: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -v.size,
        ArrowDown: v.size,
      };
      const dd = delta[e.key];
      if (dd !== undefined) {
        setCursor((c) => {
          let n = c;
          // Skip holes in the board (the cross-shaped Fox and Geese board).
          for (let i = 0; i < v.size; i++) {
            n += dd;
            if (
              n < 0 ||
              n >= v.size * v.size ||
              (Math.abs(dd) === 1 && Math.floor(n / v.size) !== Math.floor(c / v.size))
            )
              return c;
            if (v.points.includes(n)) return n;
          }
          return c;
        });
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        click(cursor);
        return true;
      }
      if (e.key === 'Escape' && state.chain === null) {
        setSelected(null);
        return true;
      }
      return false;
    });
    return (
      <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="hunt-board">
        <svg
          viewBox={`0 0 ${W} ${W}`}
          className={styles.svg}
          role="grid"
          aria-label={t('board.label')}
        >
          <rect x="1" y="1" width={W - 2} height={W - 2} rx="3" className={styles.ground} />
          {segments(state.board).map(([p, q]) => (
            <line
              key={`${p}-${q}`}
              x1={xy(p).x}
              y1={xy(p).y}
              x2={xy(q).x}
              y2={xy(q).y}
              className={styles.line}
            />
          ))}
          {v.points.map((p) => {
            const { x, y } = xy(p);
            const x0 = state.board[p];
            const isTarget = targets.has(p) || placements.has(p);
            return (
              <g key={p}>
                <circle cx={x} cy={y} r={0.9} className={styles.dot} />
                {isTarget && <circle cx={x} cy={y} r={1.8} className={styles.target} />}
                {(lastPts.includes(p) || hintPts.includes(p)) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={4.3}
                    className={hintPts.includes(p) ? styles.hint : styles.last}
                  />
                )}
                {x0 === 1 || x0 === 2 ? (
                  <g
                    transform={`translate(${x} ${y})`}
                    key={`${p}-${x0}`}
                    className={`${styles.piece} ${from === p ? styles.selected : ''} ${lastPts[lastPts.length - 1] === p ? styles.moved : ''}`}
                  >
                    <HuntPiece kind={x0 === 1 ? 'prey' : 'hunter'} tiger={tiger} />
                  </g>
                ) : null}
                {cursor === p && <circle cx={x} cy={y} r={4.5} className={styles.cursor} />}
                <circle
                  cx={x}
                  cy={y}
                  r={4.6}
                  className={styles.hit}
                  data-point={p}
                  role="gridcell"
                  aria-label={`${pointName(v, p)}, ${t(x0 === 1 ? 'point.prey' : x0 === 2 ? 'point.hunter' : 'point.empty')}${isTarget ? `, ${t(placements.has(p) ? 'point.place' : 'point.target')}` : ''}`}
                  onClick={() => {
                    setCursor(p);
                    click(p);
                  }}
                />
              </g>
            );
          })}
        </svg>
        <div className={styles.bar}>
          {interactive && state.chain !== null && (
            <button
              type="button"
              className="btn"
              data-testid="stop"
              onClick={() => onAction('stop')}
            >
              {t('action.stop')}
            </button>
          )}
          <span className={styles.count} data-testid="counts">
            {t('info.counts', {
              captured: state.captured,
              goal: v.huntersWinAt,
              hand: state.inHand,
            })}
          </span>
        </div>
      </div>
    );
  };
}
