import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { N, legalAlquerqueActions, stepFrom, type AlquerqueState } from './engine';
import styles from './AlquerqueBoard.module.css';

const GAP = 10;
const PAD = 6;
const W = PAD * 2 + GAP * (N - 1);
const xy = (p: number) => ({ x: PAD + (p % N) * GAP, y: PAD + Math.floor(p / N) * GAP });
export const pointName = (p: number) => `${'abcde'[p % N]}${N - Math.floor(p / N)}`;

const SEGMENTS: [number, number][] = [];
for (let p = 0; p < N * N; p++)
  for (const d of [1, 3, 6, 7]) {
    const q = stepFrom(p, d);
    if (q >= 0) SEGMENTS.push([p, q]);
  }

export function AlquerqueBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<AlquerqueState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(12);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(state.chain);
  }
  const legal = interactive
    ? legalAlquerqueActions(state).map((a) => a.split('-').map(Number) as [number, number])
    : [];
  const movable = new Set(legal.map(([f]) => f));
  const from = state.chain ?? selected;
  const targets = new Set(legal.filter(([f]) => f === from).map(([, to]) => to));
  const last = state.history[state.history.length - 1]?.split('-').map(Number) ?? [];
  const hinted = hint ? hint.split('-').map(Number) : [];
  const click = (p: number) => {
    if (!interactive) return;
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
      ArrowUp: -N,
      ArrowDown: N,
    };
    const d = delta[e.key];
    if (d !== undefined) {
      setCursor((c) => {
        const n = c + d;
        if (n < 0 || n >= N * N || (Math.abs(d) === 1 && Math.floor(n / N) !== Math.floor(c / N)))
          return c;
        return n;
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
  const counts = [1, 2].map((c) => state.board.filter((x) => x === c).length);
  return (
    <div
      className={`${styles.wrap} ${animate ? styles.animated : ''}`}
      data-testid="alquerque-board"
    >
      <svg
        viewBox={`0 0 ${W} ${W}`}
        className={styles.svg}
        role="grid"
        aria-label={t('board.label')}
      >
        <rect x="1" y="1" width={W - 2} height={W - 2} rx="3" className={styles.wood} />
        {SEGMENTS.map(([p, q]) => (
          <line
            key={`${p}-${q}`}
            x1={xy(p).x}
            y1={xy(p).y}
            x2={xy(q).x}
            y2={xy(q).y}
            className={styles.line}
          />
        ))}
        {state.board.map((x, p) => {
          const { x: cx, y: cy } = xy(p);
          const isTarget = targets.has(p);
          return (
            <g key={p}>
              {isTarget && <circle cx={cx} cy={cy} r={2} className={styles.target} />}
              {x !== 0 && (
                <circle
                  key={`${p}-${x}`}
                  cx={cx}
                  cy={cy}
                  r={3.4}
                  className={[
                    styles.piece,
                    x === 1 ? styles.white : styles.black,
                    from === p && styles.selected,
                    last[1] === p && styles.moved,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              )}
              {(last.includes(p) || hinted.includes(p)) && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4.3}
                  className={hinted.includes(p) ? styles.hint : styles.last}
                />
              )}
              {cursor === p && <circle cx={cx} cy={cy} r={4.5} className={styles.cursor} />}
              <circle
                cx={cx}
                cy={cy}
                r={4.6}
                className={styles.hit}
                data-point={p}
                role="gridcell"
                aria-label={`${pointName(p)}, ${t(x === 0 ? 'point.empty' : x === 1 ? 'point.white' : 'point.black')}${isTarget ? `, ${t('point.target')}` : ''}`}
                onClick={() => {
                  setCursor(p);
                  click(p);
                }}
              />
            </g>
          );
        })}
      </svg>
      <div className={styles.bar} data-testid="counts">
        {t('info.counts', { a: counts[0]!, b: counts[1]! })}
      </div>
    </div>
  );
}
